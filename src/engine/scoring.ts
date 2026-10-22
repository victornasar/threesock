// Scoring exactly as rubric section 1.1 specifies. Pure functions, no I/O.
import type { CategorySummary, CheckResult, CriterionResult, Finding } from './model.js';
import {
  CATEGORY_LABELS,
  type Band,
  type Category,
  type CriterionDef,
  type Score,
} from './types.js';

export function bandFor(percent: number): Band {
  if (percent >= 90) return 'audit-ready';
  if (percent >= 75) return 'minor-gaps';
  if (percent >= 50) return 'significant-gaps';
  return 'not-ready';
}

export const BAND_LABELS: Record<Band, string> = {
  'audit-ready': 'Audit-ready',
  'minor-gaps': 'Minor gaps',
  'significant-gaps': 'Significant gaps',
  'not-ready': 'Not ready',
};

const BAND_ORDER: Band[] = ['audit-ready', 'minor-gaps', 'significant-gaps', 'not-ready'];

/** Rubric 1.1 automatic cap: an open Critical caps the category at "Significant gaps". */
export function capBand(band: Band): Band {
  return BAND_ORDER.indexOf(band) < BAND_ORDER.indexOf('significant-gaps')
    ? 'significant-gaps'
    : band;
}

export function labelFor(score: Score): CriterionResult['label'] {
  switch (score) {
    case 2:
      return 'Met';
    case 1:
      return 'Partial';
    case 0:
      return 'Not Met';
    case 'N/A':
      return 'Not Applicable';
    case 'MANUAL':
      return 'Manual Evidence';
  }
}

export interface CriterionInput {
  def: CriterionDef;
  inScope: boolean;
  notApplicable?: string;
  checks: CheckResult[];
  /** Open and accepted findings for this criterion. */
  findings: Finding[];
}

export interface CriterionScore {
  score: Score;
  rationale: string;
  capped: boolean;
}

/**
 * Scores one criterion.
 * - 2 Met: every applicable automated check passed with evidence.
 * - 1 Partial: some checks passed, others failed, were inconclusive, or were accepted as exceptions.
 * - 0 Not Met: nothing passed, a red flag is present, or an open Critical finding exists.
 * - N/A: category out of scope, or declared N/A with a justification in threesock.yaml.
 * - MANUAL: org-only criterion, or nothing threesock can verify automatically.
 */
export function scoreCriterion(input: CriterionInput): CriterionScore {
  const { def, inScope, notApplicable, checks, findings } = input;
  if (!inScope) {
    return { score: 'N/A', rationale: 'Category not in scope for this scan.', capped: false };
  }
  if (notApplicable) {
    return { score: 'N/A', rationale: `Declared not applicable: ${notApplicable}`, capped: false };
  }
  if (def.defaultManual) {
    return {
      score: 'MANUAL',
      rationale:
        'The rubric marks this criterion as manual evidence. Repo signals below are supporting evidence only.',
      capped: false,
    };
  }

  const applicable = checks.filter((c) => c.status !== 'not_applicable');
  if (applicable.length === 0) {
    return {
      score: 'MANUAL',
      rationale:
        checks.length === 0
          ? 'threesock has no automated checks for this criterion yet. Gather evidence manually.'
          : 'None of the automated checks apply to this repository. Confirm manually, or declare N/A with a justification in threesock.yaml.',
      capped: false,
    };
  }

  const open = findings.filter((f) => f.status === 'open');
  if (open.some((f) => f.severity === 'critical')) {
    return {
      score: 0,
      rationale: 'An open Critical finding caps this criterion at 0 until it is resolved.',
      capped: true,
    };
  }
  const redFlag = open.find((f) => f.redFlag);
  if (redFlag) {
    return {
      score: 0,
      rationale: `Red flag present: ${redFlag.title} (${redFlag.id}).`,
      capped: false,
    };
  }

  const pass = applicable.filter((c) => c.status === 'pass').length;
  const fail = applicable.filter((c) => c.status === 'fail').length;
  const unknown = applicable.filter((c) => c.status === 'unknown').length;
  const accepted = applicable.filter((c) => c.status === 'accepted').length;

  if (pass === applicable.length) {
    return {
      score: 2,
      rationale: `All ${pass} automated check${pass === 1 ? '' : 's'} passed with evidence.`,
      capped: false,
    };
  }
  if (pass > 0) {
    const parts = [
      fail && `${fail} failed`,
      unknown && `${unknown} inconclusive`,
      accepted && `${accepted} accepted as exceptions`,
    ].filter(Boolean);
    return {
      score: 1,
      rationale: `${pass} of ${applicable.length} automated checks passed; ${parts.join(', ')}.`,
      capped: false,
    };
  }
  if (fail === 0 && accepted === 0) {
    return {
      score: 'MANUAL',
      rationale: 'threesock could not determine the result of any check. Gather evidence manually.',
      capped: false,
    };
  }
  if (fail === 0) {
    return {
      score: 1,
      rationale: 'Every failing check is covered by an accepted, unexpired exception.',
      capped: false,
    };
  }
  return { score: 0, rationale: 'No automated check passed.', capped: false };
}

export function summarizeCategory(
  category: Category,
  inScope: boolean,
  criteria: readonly CriterionResult[],
): CategorySummary {
  const own = criteria.filter((c) => c.category === category);
  const assessable = own.filter((c) => typeof c.score === 'number');
  const earned = assessable.reduce((n, c) => n + (c.score as number), 0);
  const possible = 2 * assessable.length;
  const raw = possible === 0 ? null : (earned / possible) * 100;
  const percent = raw === null ? null : Math.round(raw * 10) / 10;
  const capped = own.some((c) => c.capped);
  let band: Band | null = raw === null ? null : bandFor(raw);
  if (band && capped) band = capBand(band);
  return {
    category,
    label: CATEGORY_LABELS[category],
    inScope,
    assessable: assessable.length,
    earned,
    possible,
    percent,
    band,
    capped,
    manualOpen: own.filter((c) => c.score === 'MANUAL').length,
    notApplicable: own.filter((c) => c.score === 'N/A').length,
  };
}

/** Overall readiness: the same formula pooled across in-scope categories. */
export function summarizeOverall(categories: readonly CategorySummary[]) {
  const inScope = categories.filter((c) => c.inScope);
  const assessable = inScope.reduce((n, c) => n + c.assessable, 0);
  const earned = inScope.reduce((n, c) => n + c.earned, 0);
  const possible = inScope.reduce((n, c) => n + c.possible, 0);
  const raw = possible === 0 ? null : (earned / possible) * 100;
  const percent = raw === null ? null : Math.round(raw * 10) / 10;
  const capped = inScope.some((c) => c.capped);
  let band: Band | null = raw === null ? null : bandFor(raw);
  if (band && capped) band = capBand(band);
  return {
    assessable,
    earned,
    possible,
    percent,
    band,
    capped,
    manualOpen: inScope.reduce((n, c) => n + c.manualOpen, 0),
    notApplicable: inScope.reduce((n, c) => n + c.notApplicable, 0),
  };
}
