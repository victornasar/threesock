import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../src/engine/config.js';
import { scan } from '../src/engine/scan.js';
import { incidentResponsePlan } from '../src/rules/cc7.4/incident-response-plan.js';
import { sensitiveLogging } from '../src/rules/cc7.2/sensitive-logging.js';
import { suppressions } from '../src/rules/cc4.2/suppressions.js';
import { tokenExpiry } from '../src/rules/cc6.3/token-expiry.js';
import { piiInFixtures } from '../src/rules/c1.1/pii-in-fixtures.js';
import { RULES } from '../src/rules/index.js';
import { run } from './helpers/memory.js';

describe('documentation checks need content, not just a file', () => {
  it('a placeholder incident response plan fails with the missing sections named', async () => {
    const out = await run(incidentResponsePlan, {
      'docs/incident-response.md': '# Incident response\n\nTODO\n',
    });
    expect(out.status === 'fail' && out.findings[0]?.title).toBe(
      'Incident response plan is missing roles, severity levels, escalation, communication',
    );
  });
  it('evidence says structure was checked, not quality', async () => {
    const out = await run(incidentResponsePlan, {
      'docs/ir.md':
        '# Incident response\n## Roles\nIncident commander\n## Severity\nSEV1\n## Escalation\nPage the CTO\n## Communication\nStatus page\n',
    });
    expect(out.status === 'pass' && out.evidence[0]?.description).toContain(
      'structure checked, quality not judged',
    );
  });
});

describe('evidenceLinks', () => {
  it('validates keys and URLs', () => {
    expect(() => resolveConfig({ evidenceLinks: { 'CC7.4': 'notion' } }, '/r')).toThrow(/http/);
    expect(() => resolveConfig({ evidenceLinks: { nope: 'https://x.example' } }, '/r')).toThrow(
      /criterion id/,
    );
  });
  it('marks DOCS checks not applicable, records the link, and never counts it as Met', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'threesock-links-'));
    writeFileSync(
      join(dir, 'threesock.yaml'),
      'evidenceLinks:\n  CC7.4: https://notion.example/ir\n',
    );
    const { report } = await scan({
      root: dir,
      rules: RULES,
      now: new Date('2026-01-15T00:00:00Z'),
    });
    const cc74 = report.criteria.find((c) => c.id === 'CC7.4');
    expect(cc74?.evidenceLinks).toEqual(['https://notion.example/ir']);
    expect(cc74?.checks.every((c) => c.status === 'not_applicable')).toBe(true);
    expect(cc74?.score).toBe('MANUAL');
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('false-positive guards', () => {
  it('sensitive logging ignores prose in messages but flags real values', async () => {
    const out = await run(sensitiveLogging, {
      'src/a.ts':
        "logger.info('Password reset email sent', { userId });\nlogger.info('login', { password });\n",
    });
    expect(out.status === 'fail' && out.findings.map((f) => f.line)).toEqual([2]);
  });
  it('suppressions with a reason are fine; bare security suppressions are red flags', async () => {
    const out = await run(suppressions, {
      'app/a.py':
        'run(cmd, shell=True)  # nosec B602: fixed literal command\nrun(cmd, shell=True)  # nosec\n',
    });
    expect(out.status === 'fail' && out.findings.map((f) => [f.line, f.redFlag])).toEqual([
      [2, true],
    ]);
  });
  it('token expiry looks at the options of the same call', async () => {
    expect(
      (await run(tokenExpiry, { 'src/t.ts': "jwt.sign(claims, key, { expiresIn: '15m' });\n" }))
        .status,
    ).toBe('pass');
    expect((await run(tokenExpiry, { 'src/t.ts': 'jwt.sign(claims, key);\n' })).status).toBe(
      'fail',
    );
  });
  it('seed data with provider test cards and example.com addresses passes', async () => {
    const out = await run(piiInFixtures, {
      'seeds/u.json': '[{"email":"a@example.com","card":"4242 4242 4242 4242"}]',
    });
    expect(out.status).toBe('pass');
  });
});

describe('control matrix candidates', () => {
  it('ignores UI docs that happen to have a Controls heading', async () => {
    const { controlMatrix } = await import('../src/rules/cc5.1/control-matrix.js');
    const out = await run(controlMatrix, {
      'docs/components.md': '# Player\n## Controls\n| Button | Action |\n',
    });
    expect(out.status === 'fail' && out.findings[0]?.title).toBe('No risk-to-control mapping');
  });
});
