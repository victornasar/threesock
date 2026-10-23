// Exercises the real process runner: stub "tools" on PATH, the actual CLI, no fakes.
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli/main.js';
import { execRunner } from '../src/integrations/tools/runner.js';
import { materialize, type Materialized } from './helpers/fixtures.js';

const isWindows = process.platform === 'win32';
let bin: string;
let repo: Materialized;
let stdout = '';
const savedPath = process.env.PATH;

beforeAll(() => {
  bin = mkdtempSync(join(tmpdir(), 'threesock-bin-'));
  repo = materialize('insecure-app');
  // A zizmor stand-in: prints a version, or one finding and exit code 13 (zizmor's "findings" code).
  const finding = JSON.stringify([
    {
      ident: 'unpinned-uses',
      desc: 'unpinned action reference',
      determinations: { severity: 'Medium' },
      locations: [
        {
          symbolic: { key: { Local: { given_path: '.github/workflows/ci.yml' } } },
          concrete: { location: { start_point: { row: 1 } } },
        },
      ],
    },
  ]);
  writeFileSync(
    join(bin, 'zizmor'),
    `#!/bin/sh\nif [ "$1" = "--version" ]; then echo "zizmor 1.31.1"; exit 0; fi\necho '${finding}'\nexit 13\n`,
  );
  writeFileSync(
    join(bin, 'checkov'),
    '#!/bin/sh\nif [ "$1" = "--version" ]; then echo "3.3.26"; exit 0; fi\nsleep 5\n',
  );
  chmodSync(join(bin, 'zizmor'), 0o755);
  chmodSync(join(bin, 'checkov'), 0o755);
  process.env.PATH = `${bin}${delimiter}${savedPath}`;
  process.env.THREESOCK_NOW = '2026-01-15T12:00:00Z';
  vi.spyOn(process.stdout, 'write').mockImplementation((c) => ((stdout += String(c)), true));
});
afterAll(() => {
  process.env.PATH = savedPath;
  vi.restoreAllMocks();
  rmSync(bin, { recursive: true, force: true });
  rmSync(repo.dir, { recursive: true, force: true });
});

describe.skipIf(isWindows)('real process runner', () => {
  it('reports a missing binary as missing', async () => {
    expect(
      (
        await execRunner('threesock-no-such-tool', ['--version'], {
          cwd: tmpdir(),
          timeoutMs: 5000,
        })
      ).missing,
    ).toBe(true);
  });

  it('kills tools that exceed the timeout', async () => {
    const res = await execRunner('checkov', ['-d', '.'], { cwd: tmpdir(), timeoutMs: 300 });
    expect(res.timedOut).toBe(true);
  });

  it('the CLI runs an installed tool and reports its findings with provenance', async () => {
    stdout = '';
    expect(await main(['scan', repo.dir, '--tools', 'zizmor', '--format', 'json'])).toBe(0);
    const report = JSON.parse(stdout);
    expect(report.coverage.externalTools).toEqual([
      { name: 'zizmor', available: true, used: true, version: '1.31.1' },
    ]);
    const f = report.findings.find(
      (x: { source?: { tool: string } }) => x.source?.tool === 'zizmor',
    );
    expect(f).toMatchObject({
      criterion: 'CC5.2',
      severity: 'medium',
      location: { path: '.github/workflows/ci.yml', line: 2 },
      source: { tool: 'zizmor', version: '1.31.1', checkId: 'unpinned-uses' },
    });
  });

  it('--no-tools and THREESOCK_TOOLS=none skip installed tools', async () => {
    stdout = '';
    await main(['scan', repo.dir, '--no-tools', '--format', 'json']);
    expect(JSON.parse(stdout).coverage.externalTools).toEqual([]);
    process.env.THREESOCK_TOOLS = 'none';
    stdout = '';
    await main(['scan', repo.dir, '--format', 'json']);
    expect(JSON.parse(stdout).coverage.externalTools).toEqual([]);
    delete process.env.THREESOCK_TOOLS;
  });

  it('rejects unknown tool names', async () => {
    expect(await main(['scan', repo.dir, '--tools', 'nmap'])).toBe(2);
  });
});
