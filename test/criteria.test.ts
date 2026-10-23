import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CRITERIA } from '../src/engine/criteria.generated.js';
import { RULES } from '../src/rules/index.js';

describe('criteria catalogue', () => {
  it('has all 61 rubric criteria with the right category counts', () => {
    expect(CRITERIA).toHaveLength(61);
    const counts = Object.fromEntries(
      ['security', 'availability', 'processing-integrity', 'confidentiality', 'privacy'].map(
        (c) => [c, CRITERIA.filter((x) => x.category === c).length],
      ),
    );
    expect(counts).toEqual({
      security: 33,
      availability: 3,
      'processing-integrity': 5,
      confidentiality: 2,
      privacy: 18,
    });
  });

  it('matches the rubric (generated file is up to date)', () => {
    expect(() =>
      execFileSync('node', ['scripts/gen-criteria.mjs', '--check'], { stdio: 'pipe' }),
    ).not.toThrow();
  });

  it('defaults ORG-only and rubric "Default: MANUAL" criteria to manual', () => {
    const manual = CRITERIA.filter((c) => c.defaultManual).map((c) => c.id);
    expect(manual).toEqual(['CC1.1', 'CC1.2', 'CC1.4', 'CC3.1', 'CC6.4']);
  });
});

describe('rule registry', () => {
  const ids = new Set(CRITERIA.map((c) => c.id));

  it('has unique, well-formed ids that match their criterion', () => {
    const seen = new Set<string>();
    for (const r of RULES) {
      expect(seen.has(r.id), `duplicate rule id ${r.id}`).toBe(false);
      seen.add(r.id);
      expect(r.id).toMatch(/^[a-z]+\d+\.\d+\/[a-z0-9-]+$/);
      expect(r.id.split('/')[0]).toBe(r.criterion.toLowerCase());
      expect(ids.has(r.criterion), `${r.id} targets unknown ${r.criterion}`).toBe(true);
    }
  });

  it('registers every rule file under src/rules/<criterion>/', () => {
    const dirs = readdirSync('src/rules').filter((d) => /^[a-z]+\d+\.\d+$/.test(d));
    const files = dirs.flatMap((d) =>
      readdirSync(`src/rules/${d}`)
        .filter((f) => f.endsWith('.ts'))
        .map((f) => `${d}/${f.slice(0, -3)}`),
    );
    expect(files.sort()).toEqual(RULES.map((r) => r.id).sort());
  });

  it('every rule says explicitly whether it is a rubric red flag', () => {
    for (const r of RULES) expect(typeof r.redFlag, r.id).toBe('boolean');
  });

  it('every rule has remediation, expected and risk text', () => {
    for (const r of RULES) {
      expect(r.remediation.summary.length, r.id).toBeGreaterThan(20);
      expect(r.expected.length, r.id).toBeGreaterThan(20);
      expect(r.risk.length, r.id).toBeGreaterThan(20);
    }
  });

  it('every `checks` fragment matches exactly one rubric check of its criterion', () => {
    for (const r of RULES) {
      const def = CRITERIA.find((c) => c.id === r.criterion);
      for (const fragment of r.checks ?? []) {
        const hits = def?.checks.filter((c) => c.text.includes(fragment)) ?? [];
        expect(hits.length, `${r.id}: "${fragment}"`).toBe(1);
      }
    }
  });
});
