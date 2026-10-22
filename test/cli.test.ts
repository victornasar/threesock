import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli/main.js';
import { materialize, type Materialized } from './helpers/fixtures.js';

let insecure: Materialized;
let compliant: Materialized;
let stdout = '';
let stderr = '';

beforeAll(() => {
  process.env.THREESOCK_NOW = '2026-01-15T12:00:00Z';
  process.env.NO_COLOR = '1';
  insecure = materialize('insecure-app');
  compliant = materialize('compliant-app');
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    stdout += String(chunk);
    return true;
  });
  vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
    stderr += String(chunk);
    return true;
  });
});
afterEach(() => {
  stdout = '';
  stderr = '';
});
afterAll(() => {
  vi.restoreAllMocks();
  rmSync(insecure.dir, { recursive: true, force: true });
  rmSync(compliant.dir, { recursive: true, force: true });
});

describe('cli', () => {
  it('scan prints the disclaimer and a summary', async () => {
    expect(await main(['scan', compliant.dir])).toBe(0);
    expect(stdout).toContain('Readiness aid, not an audit');
    expect(stdout).not.toMatch(/\bis SOC 2 compliant\b/i);
  });
  it('--fail-on high exits 1 on the insecure fixture and 0 on the compliant one', async () => {
    expect(await main(['scan', insecure.dir, '--fail-on', 'high'])).toBe(1);
    expect(await main(['scan', compliant.dir, '--fail-on', 'low'])).toBe(0);
  });
  it('--format json emits parseable JSON with a schema version', async () => {
    await main(['scan', insecure.dir, '--format', 'json']);
    expect(JSON.parse(stdout).schemaVersion).toBe('1.0.0');
  });
  it('never prints secret values to stdout', async () => {
    for (const fmt of ['text', 'json']) {
      await main(['scan', insecure.dir, '--format', fmt, '--verbose']);
      for (const s of insecure.secrets) expect(stdout).not.toContain(s);
    }
  });
  it('--out writes the report to a file', async () => {
    const out = join(compliant.dir, 'report.json');
    await main(['scan', compliant.dir, '--format', 'json', '--out', out]);
    expect(JSON.parse(readFileSync(out, 'utf8')).tool.name).toBe('threesock');
    rmSync(out);
  });
  it('rejects bad flags with exit code 2', async () => {
    expect(await main(['scan', '--format', 'pdf'])).toBe(2);
    expect(stderr).toContain('unknown format "pdf"');
    expect(await main(['scan', '--fail-on', 'sometimes'])).toBe(2);
    expect(await main(['scan', '--scope', 'speed'])).toBe(2);
    expect(await main(['scan', '--nope'])).toBe(2);
  });
  it('explain prints the criterion and the rules that automate it', async () => {
    expect(await main(['explain', 'cc6.1'])).toBe(0);
    expect(stdout).toContain('CC6.1 — Logical access security');
    expect(stdout).toContain('cc6.1/hardcoded-secrets');
    expect(await main(['explain', 'CC99.1'])).toBe(2);
  });
  it('report writes a Markdown scorecard to threesock-report.md by default', async () => {
    const cwd = process.cwd();
    process.chdir(compliant.dir);
    try {
      expect(await main(['report', '.'])).toBe(0);
      expect(readFileSync(join(compliant.dir, 'threesock-report.md'), 'utf8')).toContain(
        '## Scorecard (Appendix A)',
      );
    } finally {
      rmSync(join(compliant.dir, 'threesock-report.md'), { force: true });
      process.chdir(cwd);
    }
  });
  it('init creates threesock.yaml and refuses to overwrite', async () => {
    expect(await main(['init', compliant.dir])).toBe(0);
    expect(existsSync(join(compliant.dir, 'threesock.yaml'))).toBe(true);
    expect(await main(['init', compliant.dir])).toBe(2);
    expect(await main(['scan', compliant.dir])).toBe(0); // the template is valid config
    rmSync(join(compliant.dir, 'threesock.yaml'));
  });
});
