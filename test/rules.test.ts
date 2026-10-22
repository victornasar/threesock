import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import type { ScanReport } from '../src/engine/model.js';
import { scan } from '../src/engine/scan.js';
import { RULES } from '../src/rules/index.js';
import { FIXED_NOW, materialize, type Materialized } from './helpers/fixtures.js';

let insecure: Materialized;
let compliant: Materialized;
let bad: ScanReport;
let good: ScanReport;

const statusOf = (report: ScanReport, ruleId: string) =>
  report.criteria.flatMap((c) => c.checks).find((c) => c.ruleId === ruleId)?.status;

beforeAll(async () => {
  insecure = materialize('insecure-app');
  compliant = materialize('compliant-app');
  bad = (await scan({ root: insecure.dir, rules: RULES, now: FIXED_NOW })).report;
  good = (await scan({ root: compliant.dir, rules: RULES, now: FIXED_NOW })).report;
});
afterAll(() => {
  rmSync(insecure.dir, { recursive: true, force: true });
  rmSync(compliant.dir, { recursive: true, force: true });
});

// Rules that can't prove a negative report "unknown" instead of failing.
const INSECURE_STATUS: Record<string, string> = {
  'cc6.6/rate-limiting': 'unknown', // limits may live in a gateway or WAF
};

describe('every rule passes on the compliant fixture and fails on the insecure one', () => {
  for (const rule of RULES) {
    it(rule.id, () => {
      expect(statusOf(good, rule.id)).toBe('pass');
      expect(statusOf(bad, rule.id)).toBe(INSECURE_STATUS[rule.id] ?? 'fail');
    });
  }
});

describe('no score without evidence', () => {
  it('every passing check cites at least one piece of evidence', () => {
    for (const report of [good, bad]) {
      for (const c of report.criteria.flatMap((x) => x.checks)) {
        if (c.status === 'pass') expect(c.evidence.length, c.ruleId).toBeGreaterThan(0);
      }
    }
  });
  it('every Met criterion has evidence', () => {
    for (const report of [good, bad]) {
      for (const c of report.criteria.filter((x) => x.score === 2)) {
        expect(c.evidence.length, c.id).toBeGreaterThan(0);
      }
    }
  });
  it('a rule that passes without evidence is downgraded to unknown', async () => {
    const { report } = await scan({
      root: compliant.dir,
      now: FIXED_NOW,
      rules: [
        {
          id: 'cc6.6/lazy',
          criterion: 'CC6.6',
          title: 'lazy',
          tags: ['CODE'],
          severity: 'low',
          expected: 'x'.repeat(21),
          risk: 'x'.repeat(21),
          remediation: { summary: 'x'.repeat(21) },
          detect: () => ({ status: 'pass', evidence: [] }),
        },
      ],
    });
    const c = report.criteria.find((x) => x.id === 'CC6.6');
    expect(c?.checks[0]?.status).toBe('unknown');
    expect(c?.score).toBe('MANUAL');
  });
});

describe('insecure fixture', () => {
  it('finds the planted secrets at the right locations', () => {
    const secrets = bad.findings.filter((f) => f.ruleId === 'cc6.1/hardcoded-secrets');
    expect(secrets.map((f) => [f.title, f.location.description, f.severity])).toEqual([
      ['Hard-coded Stripe live key', '.env:3', 'critical'],
      ['Hard-coded private key', 'config/deploy.pem:1', 'critical'],
      ['Hard-coded AWS access key ID', 'src/config.js:3', 'critical'],
      ['Hard-coded GitHub token', 'src/config.js:7', 'critical'],
      ['Hard-coded database URL with password', '.env:2', 'high'],
    ]);
  });
  it("titles every finding with the gap, not the rule's passing condition", () => {
    const titles = new Map(RULES.map((r) => [r.id, r.title]));
    for (const f of bad.findings) expect(f.title, f.ruleId).not.toBe(titles.get(f.ruleId));
  });
  it('flags the committed .env as Critical because it holds secret-looking variables', () => {
    const env = bad.findings.find(
      (f) => f.ruleId === 'cc6.1/env-files' && f.location.path === '.env',
    );
    expect(env?.severity).toBe('critical');
    expect(env?.observed).toContain('STRIPE_SECRET_KEY');
  });
  it('caps CC6.1 at 0 and the Security band at significant gaps or worse', () => {
    const cc61 = bad.criteria.find((c) => c.id === 'CC6.1');
    expect(cc61).toMatchObject({ score: 0, capped: true });
    const sec = bad.summary.categories.find((c) => c.category === 'security');
    expect(sec?.capped).toBe(true);
    expect(['significant-gaps', 'not-ready']).toContain(sec?.band);
  });
  it('reports all 61 criteria, each scored, N/A with justification, or MANUAL with guidance', () => {
    expect(bad.criteria).toHaveLength(61);
    for (const c of bad.criteria) {
      if (c.score === 'N/A') expect(c.rationale.length).toBeGreaterThan(10);
      if (c.score === 'MANUAL') {
        expect(c.owner, c.id).toBeTruthy();
        expect(c.rationale.length).toBeGreaterThan(10);
      }
    }
  });
});

describe('exceptions', () => {
  it('accepts unexpired exceptions and reopens expired ones', async () => {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(
      `${insecure.dir}/threesock.yaml`,
      `exceptions:
  - rule: cc2.3/security-policy
    approver: cto@example.com
    justification: Policy is being drafted in SEC-12.
    expires: 2026-06-30
  - rule: cc1.3/codeowners
    approver: cto@example.com
    justification: Old exception.
    expires: 2025-12-31
`,
    );
    const { report } = await scan({ root: insecure.dir, rules: RULES, now: FIXED_NOW });
    rmSync(`${insecure.dir}/threesock.yaml`);
    const policy = report.findings.find((f) => f.ruleId === 'cc2.3/security-policy');
    expect(policy?.status).toBe('accepted');
    expect(policy?.exception?.approver).toBe('cto@example.com');
    const owners = report.findings.find((f) => f.ruleId === 'cc1.3/codeowners');
    expect(owners?.status).toBe('open');
    expect(owners?.expiredException?.expires).toBe('2025-12-31');
    expect(report.summary.acceptedFindings).toBe(1);
  });
});

describe('compliant fixture', () => {
  it('has no open findings', () => {
    expect(good.findings).toEqual([]);
  });
  it('is deterministic across runs', async () => {
    const again = (await scan({ root: compliant.dir, rules: RULES, now: FIXED_NOW })).report;
    expect(again).toEqual(good);
  });
});
