import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BaselineError, runBaseline } from '../src/cli/baseline.js';
import { scan } from '../src/engine/scan.js';
import { renderHtml } from '../src/reports/html.js';
import { anchorFor, renderSarif } from '../src/reports/sarif.js';
import { RULES } from '../src/rules/index.js';
import { FIXED_NOW, materialize, type Materialized } from './helpers/fixtures.js';

let repo: Materialized;
beforeEach(() => {
  repo = materialize('insecure-app');
});
afterEach(() => rmSync(repo.dir, { recursive: true, force: true }));

const scanIt = async () => (await scan({ root: repo.dir, rules: RULES, now: FIXED_NOW })).report;
const base = {
  rules: RULES,
  now: FIXED_NOW,
  all: false,
  fingerprints: [] as string[],
  prune: false,
};

describe('SARIF 2.1.0', () => {
  it('maps severities to levels and security-severity, with criterion tags', async () => {
    const sarif = JSON.parse(renderSarif(await scanIt(), RULES));
    expect(sarif.version).toBe('2.1.0');
    const run = sarif.runs[0];
    const rule = run.tool.driver.rules.find(
      (r: { id: string }) => r.id === 'cc6.1/hardcoded-secrets',
    );
    expect(rule.properties).toMatchObject({ 'security-severity': '9.5', criterion: 'CC6.1' });
    expect(rule.properties.tags).toContain('CC6.1');
    const levels = new Set(
      run.results.map(
        (r: { level: string; properties: { severity: string } }) =>
          `${r.properties.severity}:${r.level}`,
      ),
    );
    expect([...levels].sort()).toEqual([
      'critical:error',
      'high:error',
      'low:note',
      'medium:warning',
    ]);
    for (const r of run.results) {
      expect(r.ruleIndex).toBe(
        run.tool.driver.rules.findIndex((x: { id: string }) => x.id === r.ruleId),
      );
      expect(r.partialFingerprints['threesock/v1']).toMatch(/^[0-9a-f]{16}$/);
    }
  });

  it('anchors repository-level findings to an existing file at line 1', async () => {
    const sarif = JSON.parse(renderSarif(await scanIt(), RULES));
    const repoLevel = sarif.runs[0].results.filter(
      (r: { properties: { repositoryLevel: boolean } }) => r.properties.repositoryLevel,
    );
    expect(repoLevel.length).toBeGreaterThan(0);
    for (const r of repoLevel) {
      expect(r.locations[0].physicalLocation.artifactLocation.uri).toBe('README.md');
      expect(r.locations[0].physicalLocation.region.startLine).toBe(1);
      expect(r.message.text).toContain('Repository-level finding');
    }
    expect(anchorFor('/x', (p) => p === 'package.json')).toBe('package.json');
    expect(anchorFor('/x', (p) => p === 'threesock.yaml' || p === 'README.md')).toBe(
      'threesock.yaml',
    );
  });

  it('records accepted findings as suppressions with approver and reason', async () => {
    writeFileSync(
      join(repo.dir, 'threesock.yaml'),
      'exceptions:\n  - rule: cc2.3/security-policy\n    approver: cto@example.com\n    justification: Drafting in SEC-12.\n    expires: 2026-03-01\n',
    );
    const sarif = JSON.parse(renderSarif(await scanIt(), RULES));
    const r = sarif.runs[0].results.find(
      (x: { ruleId: string }) => x.ruleId === 'cc2.3/security-policy',
    );
    expect(r.suppressions).toEqual([
      {
        kind: 'external',
        status: 'accepted',
        justification: 'Drafting in SEC-12. (approved by cto@example.com, expires 2026-03-01)',
      },
    ]);
  });
});

describe('HTML report', () => {
  it('is a single offline file: no scripts, no external URLs, all 61 criteria', async () => {
    const html = renderHtml(await scanIt());
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain("default-src 'none'");
    const external = [...html.matchAll(/(?:src|href|srcset)="(?!data:|#)([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(external).toEqual([]);
    expect(html.match(/<tr><td><strong>(?:CC|A|PI|C|P)\d+\.\d+<\/strong>/g)).toHaveLength(61);
    expect(html).toContain('Readiness aid, not an audit.');
  });
  it('escapes content', async () => {
    const report = await scanIt();
    const [first] = report.findings;
    if (first) first.title = '<img src=x onerror=alert(1)>';
    expect(renderHtml(report)).not.toContain('<img src=x');
  });
});

describe('threesock baseline', () => {
  it('requires an approver, a reason and a future expiry', async () => {
    await expect(runBaseline({ ...base, root: repo.dir, all: true })).rejects.toThrow(/--approver/);
    await expect(
      runBaseline({
        ...base,
        root: repo.dir,
        all: true,
        approver: 'a',
        reason: 'r',
        expires: '2025-01-01',
      }),
    ).rejects.toThrow(/past/);
  });

  it('--all accepts only Medium and Low findings', async () => {
    const res = await runBaseline({
      ...base,
      root: repo.dir,
      all: true,
      approver: 'cto@example.com',
      reason: 'Backlog accepted for Q1',
      expires: '2026-04-01',
    });
    expect(new Set(res.added.map((f) => f.severity))).toEqual(new Set(['medium', 'low']));
    const after = await scanIt();
    expect(
      after.findings
        .filter((f) => f.status === 'accepted')
        .every((f) => f.severity === 'medium' || f.severity === 'low'),
    ).toBe(true);
    expect(
      after.findings
        .filter((f) => f.severity === 'medium' || f.severity === 'low')
        .every((f) => f.status === 'accepted'),
    ).toBe(true);
    const file = parse(readFileSync(res.path, 'utf8'));
    expect(file.version).toBe(1);
    expect(file.exceptions[0]).toMatchObject({
      approver: 'cto@example.com',
      justification: 'Backlog accepted for Q1',
      expires: '2026-04-01',
    });
  });

  it('accepts a Critical by fingerprint only within its 7-day cap', async () => {
    const critical = (await scanIt()).findings.find((f) => f.severity === 'critical');
    if (!critical) throw new Error('fixture has no Critical finding');
    const opts = {
      ...base,
      root: repo.dir,
      fingerprints: [critical.fingerprint],
      approver: 'cto@example.com',
      reason: 'Rotation in progress',
    };
    await expect(runBaseline({ ...opts, expires: '2026-02-15' })).rejects.toThrow(
      /may be accepted until 2026-01-22/,
    );
    await runBaseline({ ...opts, expires: '2026-01-20' });
    expect(
      (await scanIt()).findings.find((f) => f.fingerprint === critical.fingerprint)?.status,
    ).toBe('accepted');
  });

  it('refuses unknown fingerprints', async () => {
    await expect(
      runBaseline({
        ...base,
        root: repo.dir,
        fingerprints: ['0000000000000000'],
        approver: 'a',
        reason: 'r',
        expires: '2026-02-01',
      }),
    ).rejects.toBeInstanceOf(BaselineError);
  });

  it('reports stale entries and --prune removes them', async () => {
    writeFileSync(
      join(repo.dir, 'threesock-baseline.yaml'),
      'version: 1\nexceptions:\n  - fingerprint: deadbeefdeadbeef\n    rule: cc6.1/gone\n    approver: a@example.com\n    justification: Old.\n    expires: 2026-06-01\n',
    );
    expect((await scanIt()).summary.staleExceptions).toEqual([
      {
        source: 'baseline',
        fingerprint: 'deadbeefdeadbeef',
        approver: 'a@example.com',
        expires: '2026-06-01',
      },
    ]);
    const res = await runBaseline({ ...base, root: repo.dir, prune: true });
    expect(res.pruned).toBe(1);
    expect((await scanIt()).summary.staleExceptions).toEqual([]);
    expect(existsSync(res.path)).toBe(true);
  });
});

describe('exception caps in threesock.yaml', () => {
  it('rejects a hand-written Critical exception that runs too long', async () => {
    writeFileSync(
      join(repo.dir, 'threesock.yaml'),
      'exceptions:\n  - rule: cc6.1/hardcoded-secrets\n    approver: cto@example.com\n    justification: Later.\n    expires: 2026-12-31\n',
    );
    const f = (await scanIt()).findings.find((x) => x.ruleId === 'cc6.1/hardcoded-secrets');
    expect(f?.status).toBe('open');
    expect(f?.rejectedException?.reason).toBe(
      'Exceptions for critical findings may run at most 7 days (until 2026-01-22).',
    );
  });
  it('caps are configurable, and null removes a cap', async () => {
    writeFileSync(
      join(repo.dir, 'threesock.yaml'),
      'thresholds:\n  maxExceptionDays: { critical: null }\nexceptions:\n  - rule: cc6.1/hardcoded-secrets\n    approver: cto@example.com\n    justification: Later.\n    expires: 2026-12-31\n',
    );
    expect(
      (await scanIt()).findings.find((x) => x.ruleId === 'cc6.1/hardcoded-secrets')?.status,
    ).toBe('accepted');
  });
});
