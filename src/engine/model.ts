// The scan result model. The JSON reporter serialises this as-is, so any change
// here is a schema change: bump SCHEMA_VERSION (minor for additions, major for
// removals or renames) and record it in CHANGELOG.md.
import type { Band, Category, Evidence, Score, Severity } from './types.js';

export const SCHEMA_VERSION = '1.1.0';

export const DISCLAIMER =
  'threesock is an engineering readiness aid, not an audit. SOC 2 is attested by a licensed CPA firm ' +
  "against your organization's system description and commitments. A codebase can only demonstrate " +
  'part of the criteria; the rest (board oversight, HR, vendor contracts, physical security) must be ' +
  'evidenced outside the repo. Use this report to find gaps early, not to claim compliance.';

export type CheckStatus = 'pass' | 'fail' | 'unknown' | 'not_applicable' | 'accepted';

export interface CheckResult {
  ruleId: string;
  title: string;
  status: CheckStatus;
  /** Reason for unknown, or justification for not_applicable. */
  note?: string;
  evidence: Evidence[];
  findingIds: string[];
}

export interface CriterionResult {
  id: string;
  category: Category;
  title: string;
  tags: string[];
  inScope: boolean;
  score: Score;
  label: 'Met' | 'Partial' | 'Not Met' | 'Not Applicable' | 'Manual Evidence';
  /** Why the criterion got this score, in one or two sentences. */
  rationale: string;
  /** True when an open Critical finding forced the score to 0. */
  capped: boolean;
  evidence: Evidence[];
  checks: CheckResult[];
  findingIds: string[];
  /** Automated rules run for this criterion vs. checks listed in the rubric. */
  coverage: { automatedRules: number; rubricChecks: number };
  /** Rubric checks threesock cannot verify; a human must gather this evidence. */
  manualFollowUps: string[];
  /** External evidence links from threesock.yaml (schema 1.1). Never counted as Met. */
  evidenceLinks?: string[];
  owner?: string;
}

export interface CategorySummary {
  category: Category;
  label: string;
  inScope: boolean;
  assessable: number;
  earned: number;
  possible: number;
  /** Readiness percentage, or null when nothing is assessable. */
  percent: number | null;
  band: Band | null;
  /** True when an open Critical finding capped the band at "significant-gaps". */
  capped: boolean;
  manualOpen: number;
  notApplicable: number;
}

export type FindingStatus = 'open' | 'accepted';

export interface Finding {
  id: string;
  ruleId: string;
  criterion: string;
  severity: Severity;
  title: string;
  location: { path?: string; line?: number; description: string };
  observed: string;
  expected: string;
  risk: string;
  recommendation: string;
  example?: string;
  owner?: string;
  dueDate: string;
  status: FindingStatus;
  /** A rubric red flag: while open, the criterion scores 0. */
  redFlag: boolean;
  /** Present when status is "accepted". */
  exception?: { approver: string; justification: string; expires: string };
  /** Present when an exception matched but has expired. */
  expiredException?: { approver: string; expires: string };
  /** Stable across runs; use it in baselines and exceptions. */
  fingerprint: string;
}

export interface TopFix {
  ruleId: string;
  criterion: string;
  severity: Severity;
  title: string;
  occurrences: number;
  recommendation: string;
}

export interface ScanReport {
  schemaVersion: string;
  tool: { name: 'threesock'; version: string };
  disclaimer: string;
  generatedAt: string;
  repository: { root: string; commit?: string; filesScanned: number; gitAware: boolean };
  config: { path?: string; scope: Category[] };
  summary: {
    overall: Omit<CategorySummary, 'category' | 'label' | 'inScope'>;
    categories: CategorySummary[];
    severityCounts: Record<Severity, number>;
    acceptedFindings: number;
    manualOpen: number;
    topFixes: TopFix[];
  };
  criteria: CriterionResult[];
  findings: Finding[];
  coverage: {
    rulesRun: number;
    rulesErrored: { ruleId: string; error: string }[];
    externalTools: { name: string; available: boolean; used: boolean }[];
  };
}
