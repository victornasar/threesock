// Core types shared by the engine, rules and reporters.
import type { GitHubFacts } from '../integrations/github.js';
import type { GitHistory } from './git.js';

export type Tag = 'CODE' | 'CONFIG' | 'DOCS' | 'ORG';

export type Category =
  'security' | 'availability' | 'processing-integrity' | 'confidentiality' | 'privacy';

export const CATEGORIES: readonly Category[] = [
  'security',
  'availability',
  'processing-integrity',
  'confidentiality',
  'privacy',
];

export const CATEGORY_LABELS: Record<Category, string> = {
  security: 'Security',
  availability: 'Availability',
  'processing-integrity': 'Processing Integrity',
  confidentiality: 'Confidentiality',
  privacy: 'Privacy',
};

/** A criterion as parsed from the rubric (see scripts/gen-criteria.mjs). */
export interface CriterionDef {
  id: string;
  title: string;
  category: Category;
  group: string;
  tags: readonly string[];
  requirement: string;
  checks: readonly { text: string; org: boolean }[];
  /** True when the rubric lists "Repo signals" (supporting evidence only) instead of "Checks". */
  checksAreSignals: boolean;
  redFlags: string;
  evidence: string;
  /** Rubric says "Default: MANUAL", or the criterion is tagged only ORG. */
  defaultManual: boolean;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export const SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low'];

/** Rubric 1.1: 2 Met, 1 Partial, 0 Not Met, N/A, MANUAL. */
export type Score = 2 | 1 | 0 | 'N/A' | 'MANUAL';

export type Band = 'audit-ready' | 'minor-gaps' | 'significant-gaps' | 'not-ready';

/** Where a piece of evidence came from. Never carries a secret value. */
export interface Evidence {
  kind: 'file' | 'config' | 'api' | 'absence';
  /** Repo-relative path, POSIX separators. */
  path?: string;
  line?: number;
  /** Human-readable description of what was seen. Must be redacted by the rule. */
  description: string;
}

/** What a rule reports for one failure. The engine adds id, criterion, severity and due date. */
export interface RawFinding {
  title?: string;
  path?: string;
  line?: number;
  observed: string;
  /** Overrides the rule's default severity for this finding. */
  severity?: Severity;
  /** Stable content key used for the fingerprint (e.g. matched rule kind), never the secret itself. */
  key?: string;
  /** Overrides the rule's redFlag for this finding (e.g. a hygiene sub-finding of a red-flag rule). */
  redFlag?: boolean;
}

export type RuleOutcome =
  | { status: 'pass'; evidence: Evidence[] }
  | { status: 'fail'; findings: RawFinding[]; evidence?: Evidence[] }
  | { status: 'unknown'; reason: string }
  | { status: 'not_applicable'; justification: string };

export interface Remediation {
  /** One or two sentences: what to do. */
  summary: string;
  /** A concrete example fix (code, config or file content). */
  example?: string;
}

export interface Rule {
  /** Stable id, "<criterion lowercased>/<slug>", e.g. "cc6.1/private-key-committed". */
  id: string;
  criterion: string;
  title: string;
  tags: Tag[];
  severity: Severity;
  /** Findings are rubric red flags by default: an open one scores the criterion 0 (Not Met). */
  redFlag?: boolean;
  /**
   * Text fragments identifying which rubric checks (under this criterion) the rule
   * covers. Each must match exactly one check; a test enforces this. Uncovered
   * checks are listed in reports as manual follow-ups.
   */
  checks?: string[];
  /** Integrations the rule needs. Rules requiring 'github' run only with --github. */
  requires?: 'github'[];
  /** What the control requires, used as the finding's "Expected". */
  expected: string;
  /** Impact and likelihood, used as the finding's "Risk". */
  risk: string;
  remediation: Remediation;
  detect(ctx: RuleContext): RuleOutcome | Promise<RuleOutcome>;
}

export interface RepoFile {
  /** Repo-relative POSIX path. */
  path: string;
  size: number;
  /** True when the file is tracked by git (or when git is unavailable). */
  tracked: boolean;
}

export interface FileIndex {
  root: string;
  files: readonly RepoFile[];
  isGitRepo: boolean;
  has(path: string): boolean;
  /** Files whose path matches any of the glob patterns. */
  glob(patterns: string | readonly string[]): RepoFile[];
  /** Reads a text file. Returns undefined for binary, oversized or unreadable files. */
  read(path: string): string | undefined;
}

export interface RuleContext {
  files: FileIndex;
  config: ResolvedConfig;
  /** Every detected secret value must go through this: it returns the redacted form. */
  secrets: { register(value: string): string };
  /** Local git history (last 200 commits), read on first use. Rules never run git themselves. */
  git: () => GitHistory;
  /** The scan's clock (THREESOCK_NOW / SOURCE_DATE_EPOCH in tests). */
  now: Date;
  /** GitHub API facts; present only when the user enabled --github. */
  github?: GitHubFacts;
}

export interface Threshold {
  requiredApprovals: number;
  sensitivePathApprovals: number;
  minTlsVersion: string;
  /** Remediation SLA in days per severity (rubric 1.3). */
  slaDays: Record<Severity, number>;
  /** Vulnerability remediation SLA (rubric 1.4), used to age GitHub alerts (decision 36). */
  vulnerabilitySlaDays: Record<Severity, number>;
  /** Longest an exception may run, by severity (decision 32). Unset means no limit. */
  maxExceptionDays: Partial<Record<Severity, number>>;
  logRetentionDays: number;
  secretRotationDays: number;
  dsarResponseDays: number;
}

export interface NotApplicableEntry {
  criterion: string;
  justification: string;
}

export interface ExceptionEntry {
  /** Where the entry came from: threesock.yaml or threesock-baseline.yaml. */
  source?: 'config' | 'baseline';
  /** Finding title at the time it was baselined (informational). */
  title?: string;
  /** Rule id or finding fingerprint this exception covers. */
  rule?: string;
  fingerprint?: string;
  path?: string;
  approver: string;
  justification: string;
  /** ISO date (YYYY-MM-DD). Expired exceptions turn back into findings. */
  expires: string;
}

export interface OwnerEntry {
  /** Glob for paths, or a criterion id such as "CC1.2" for MANUAL evidence. */
  match: string;
  owner: string;
}

export interface ResolvedConfig {
  /** Directory of the config file, or the scan root when none exists. */
  configDir: string;
  configPath?: string;
  /** threesock-baseline.yaml, when present. */
  baselinePath?: string;
  scope: Category[];
  thresholds: Threshold;
  owners: OwnerEntry[];
  ignore: string[];
  notApplicable: NotApplicableEntry[];
  exceptions: ExceptionEntry[];
  /** External evidence links by criterion id or rule id (decision 23). */
  evidenceLinks: Record<string, string>;
  /** Globs for security-sensitive paths. A value in threesock.yaml replaces the default list. */
  sensitivePaths: string[];
  mappingsPath?: string;
}
