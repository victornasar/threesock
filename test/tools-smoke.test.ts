// Runs every external scanner for real against the insecure fixture. Skipped unless
// THREESOCK_TOOLS_SMOKE=1 (set by .github/workflows/tools.yml after installing pinned tools).
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { scan } from '../src/engine/scan.js';
import { CATEGORIES } from '../src/engine/types.js';
import { TOOL_NAMES } from '../src/integrations/tools/index.js';
import { RULES } from '../src/rules/index.js';
import { FIXED_NOW, materialize } from './helpers/fixtures.js';

describe.skipIf(!process.env.THREESOCK_TOOLS_SMOKE)('external scanners (real tools)', () => {
  it('every adapter runs and reports findings on the insecure fixture', async () => {
    const repo = materialize('insecure-app');
    const env = {
      ...process.env,
      GIT_AUTHOR_NAME: 'Fixture',
      GIT_AUTHOR_EMAIL: 'fixture@ci.invalid',
      GIT_COMMITTER_NAME: 'Fixture',
      GIT_COMMITTER_EMAIL: 'fixture@ci.invalid',
    };
    execFileSync('git', ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'fixture'], {
      cwd: repo.dir,
      env,
    });
    try {
      const { report } = await scan({
        root: repo.dir,
        rules: RULES,
        now: FIXED_NOW,
        scope: [...CATEGORIES],
        tools: { mode: 'auto', network: true, timeoutMs: 300_000 },
      });
      for (const name of TOOL_NAMES) {
        const status = report.coverage.externalTools.find((t) => t.name === name);
        expect(status, name).toMatchObject({ available: true, used: true });
        const checks = report.criteria
          .flatMap((c) => c.checks)
          .filter((c) => c.ruleId.endsWith(`/${name}`));
        for (const c of checks)
          expect(c.status, `${c.ruleId}: ${c.note ?? ''}`).not.toBe('unknown');
        const found = report.findings.filter(
          (f) => f.source?.tool === name || f.alsoFoundBy?.some((t) => t.startsWith(`${name} `)),
        );
        expect(found.length, `${name} reported nothing`).toBeGreaterThan(0);
      }
      for (const s of repo.secrets) expect(JSON.stringify(report)).not.toContain(s);
    } finally {
      rmSync(repo.dir, { recursive: true, force: true });
    }
  }, 900_000);
});
