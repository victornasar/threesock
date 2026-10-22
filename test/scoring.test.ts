import { describe, expect, it } from 'vitest';
import { CRITERIA } from '../src/engine/criteria.generated.js';
import type { CheckResult, CriterionResult, Finding } from '../src/engine/model.js';
import { bandFor, capBand, scoreCriterion, summarizeCategory } from '../src/engine/scoring.js';
import type { CriterionDef, Score } from '../src/engine/types.js';

const def = CRITERIA.find((c) => c.id === 'CC6.1') as CriterionDef;
const manualDef = CRITERIA.find((c) => c.id === 'CC1.2') as CriterionDef;

const check = (status: CheckResult['status'], ruleId = `r-${status}`): CheckResult => ({
  ruleId,
  title: ruleId,
  status,
  evidence: [],
  findingIds: [],
});

const finding = (over: Partial<Finding>): Finding => ({
  id: 'F-001',
  ruleId: 'r-fail',
  criterion: 'CC6.1',
  severity: 'medium',
  title: 't',
  location: { description: 'repository' },
  observed: 'o',
  expected: 'e',
  risk: 'r',
  recommendation: 'x',
  dueDate: '2026-01-01',
  status: 'open',
  redFlag: false,
  fingerprint: 'abc',
  ...over,
});

const score = (checks: CheckResult[], findings: Finding[] = [], extra = {}) =>
  scoreCriterion({ def, inScope: true, checks, findings, ...extra }).score;

describe('bands (rubric 1.1)', () => {
  it.each([
    [100, 'audit-ready'],
    [90, 'audit-ready'],
    [89.99, 'minor-gaps'],
    [75, 'minor-gaps'],
    [74.9, 'significant-gaps'],
    [50, 'significant-gaps'],
    [49.9, 'not-ready'],
    [0, 'not-ready'],
  ])('%s%% is %s', (pct, band) => expect(bandFor(pct)).toBe(band));

  it('caps at significant gaps but never improves a worse band', () => {
    expect(capBand('audit-ready')).toBe('significant-gaps');
    expect(capBand('minor-gaps')).toBe('significant-gaps');
    expect(capBand('not-ready')).toBe('not-ready');
  });
});

describe('scoreCriterion', () => {
  it('Met only when every applicable check passes', () => {
    expect(score([check('pass', 'a'), check('pass', 'b'), check('not_applicable')])).toBe(2);
  });
  it('Partial when some pass and some fail or are inconclusive', () => {
    expect(score([check('pass'), check('fail')], [finding({})])).toBe(1);
    expect(score([check('pass'), check('unknown')])).toBe(1);
  });
  it('Not Met when nothing passes', () => {
    expect(score([check('fail')], [finding({})])).toBe(0);
  });
  it('Not Met when a red flag finding is open, even if other checks pass', () => {
    expect(score([check('pass'), check('fail')], [finding({ redFlag: true })])).toBe(0);
  });
  it('an open Critical forces 0 and marks the criterion capped', () => {
    const r = scoreCriterion({
      def,
      inScope: true,
      checks: [check('pass'), check('fail')],
      findings: [finding({ severity: 'critical' })],
    });
    expect(r).toMatchObject({ score: 0, capped: true });
  });
  it('accepted Critical findings do not cap', () => {
    const r = scoreCriterion({
      def,
      inScope: true,
      checks: [check('pass'), check('accepted')],
      findings: [finding({ severity: 'critical', status: 'accepted' })],
    });
    expect(r).toMatchObject({ score: 1, capped: false });
  });
  it('MANUAL for rubric-manual criteria, for no rules, and when nothing is determinable', () => {
    expect(
      scoreCriterion({ def: manualDef, inScope: true, checks: [check('pass')], findings: [] })
        .score,
    ).toBe('MANUAL');
    expect(score([])).toBe('MANUAL');
    expect(score([check('not_applicable')])).toBe('MANUAL');
    expect(score([check('unknown')])).toBe('MANUAL');
  });
  it('N/A out of scope or when declared with a justification', () => {
    expect(scoreCriterion({ def, inScope: false, checks: [], findings: [] }).score).toBe('N/A');
    expect(score([check('fail')], [], { notApplicable: 'No users, no auth.' })).toBe('N/A');
  });
});

describe('summarizeCategory', () => {
  const crit = (id: string, s: Score, capped = false) =>
    ({ id, category: 'security', score: s, capped }) as CriterionResult;

  it('excludes N/A and MANUAL from both sides of the ratio', () => {
    const s = summarizeCategory('security', true, [
      crit('a', 2),
      crit('b', 1),
      crit('c', 'MANUAL'),
      crit('d', 'N/A'),
    ]);
    expect(s).toMatchObject({
      assessable: 2,
      earned: 3,
      possible: 4,
      percent: 75,
      band: 'minor-gaps',
      manualOpen: 1,
      notApplicable: 1,
    });
  });
  it('caps the band when a criterion is capped', () => {
    const s = summarizeCategory('security', true, [
      crit('a', 2),
      crit('b', 2),
      crit('c', 2),
      crit('d', 2),
      crit('e', 2),
      crit('f', 2),
      crit('g', 2),
      crit('h', 2),
      crit('i', 2),
      crit('j', 2),
      crit('k', 0, true),
    ]);
    expect(s.percent).toBeCloseTo(90.9);
    expect(s.band).toBe('significant-gaps');
    expect(s.capped).toBe(true);
  });
  it('has no percentage when nothing is assessable', () => {
    expect(summarizeCategory('security', true, [crit('a', 'MANUAL')])).toMatchObject({
      percent: null,
      band: null,
    });
  });
});
