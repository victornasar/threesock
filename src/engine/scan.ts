import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { VERSION } from '../version.js';
import { loadConfig } from './config.js';
import { CRITERIA } from './criteria.generated.js';
import { buildFileIndex, gitHead } from './files.js';
import { matchesGlob } from './glob.js';
import {
  DISCLAIMER,
  SCHEMA_VERSION,
  type CheckResult,
  type CriterionResult,
  type Finding,
  type ScanReport,
  type TopFix,
} from './model.js';
import { lazyGitHistory } from './git.js';
import { SecretVault } from './redact.js';
import { labelFor, scoreCriterion, summarizeCategory, summarizeOverall } from './scoring.js';
import {
  CATEGORIES,
  SEVERITIES,
  type Category,
  type CriterionDef,
  type ExceptionEntry,
  type RawFinding,
  type ResolvedConfig,
  type Rule,
  type RuleContext,
  type RuleOutcome,
  type Severity,
} from './types.js';

export interface ScanOptions {
  root: string;
  configPath?: string;
  /** Overrides the scope from threesock.yaml. Security is always included. */
  scope?: Category[];
  /** Injectable clock for deterministic due dates and timestamps. */
  now?: Date;
  rules: readonly Rule[];
}

export interface ScanOutput {
  report: ScanReport;
  /** Scrubs any detected secret value from a string. Reporters must pass output through it. */
  scrub(text: string): string;
}

/** Suggested owners for MANUAL evidence, by criterion prefix (most specific first). */
const SUGGESTED_OWNERS: [string, string][] = [
  ['CC1.2', 'Board / executive leadership'],
  ['CC1', 'Leadership and People Ops'],
  ['CC2', 'Security lead'],
  ['CC3', 'Security and risk owner'],
  ['CC4', 'Security lead'],
  ['CC5', 'Security / GRC'],
  ['CC6.4', 'IT and facilities (inherit from cloud provider SOC 2 report)'],
  ['CC6', 'Security and platform engineering'],
  ['CC7', 'SRE / security operations'],
  ['CC8', 'Engineering lead'],
  ['CC9.1', 'SRE / business continuity owner'],
  ['CC9.2', 'Vendor management / procurement'],
  ['A1', 'SRE'],
  ['PI1', 'Engineering lead'],
  ['C1', 'Security and data owners'],
  ['P', 'Privacy / legal'],
];

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const CRITERION_ORDER = new Map(CRITERIA.map((c, i) => [c.id, i]));

export function nowFromEnv(): Date {
  const fixed = process.env.THREESOCK_NOW;
  if (fixed) {
    const d = new Date(fixed);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && /^\d+$/.test(epoch)) return new Date(Number(epoch) * 1000);
  return new Date();
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

export function fingerprintOf(ruleId: string, raw: RawFinding): string {
  return createHash('sha256')
    .update(`${ruleId}|${raw.path ?? ''}|${raw.key ?? raw.observed}`)
    .digest('hex')
    .slice(0, 16);
}

function ownerFor(config: ResolvedConfig, match: (pattern: string) => boolean): string | undefined {
  let owner: string | undefined;
  for (const o of config.owners) if (match(o.match)) owner = o.owner; // last match wins, like CODEOWNERS
  return owner;
}

function suggestedOwner(criterionId: string): string {
  return (
    SUGGESTED_OWNERS.find(([prefix]) => criterionId.startsWith(prefix))?.[1] ?? 'Security lead'
  );
}

function findException(
  exceptions: readonly ExceptionEntry[],
  ruleId: string,
  fingerprint: string,
  path: string | undefined,
): ExceptionEntry | undefined {
  return exceptions.find((e) => {
    if (e.fingerprint) return e.fingerprint === fingerprint;
    if (e.rule !== ruleId) return false;
    return !e.path || (path !== undefined && matchesGlob(path, e.path));
  });
}

/** Rubric checks a rule claims to cover, resolved to indexes. */
export function coveredCheckIndexes(def: CriterionDef, rule: Rule): number[] {
  return (rule.checks ?? []).flatMap((fragment) => {
    const idx = def.checks.findIndex((c) => c.text.includes(fragment));
    return idx === -1 ? [] : [idx];
  });
}

async function runRule(
  rule: Rule,
  ctx: RuleContext,
): Promise<{ outcome: RuleOutcome; error?: string }> {
  try {
    const outcome = await rule.detect(ctx);
    // No score without evidence: a pass that cites nothing is not a pass.
    if (outcome.status === 'pass' && outcome.evidence.length === 0) {
      return { outcome: { status: 'unknown', reason: 'Rule passed without citing evidence.' } };
    }
    if (outcome.status === 'fail' && outcome.findings.length === 0) {
      return { outcome: { status: 'unknown', reason: 'Rule failed without reporting a finding.' } };
    }
    return { outcome };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { outcome: { status: 'unknown', reason: `Rule errored: ${error}` }, error };
  }
}

export async function scan(opts: ScanOptions): Promise<ScanOutput> {
  const root = resolve(opts.root);
  const now = opts.now ?? nowFromEnv();
  const today = isoDate(now);
  const config = loadConfig(root, opts.configPath);
  if (opts.scope)
    config.scope = CATEGORIES.filter((c) => c === 'security' || opts.scope?.includes(c));
  const inScope = new Set(config.scope);

  const files = buildFileIndex(root, { ignore: config.ignore });
  const vault = new SecretVault();
  const ctx: RuleContext = { files, config, secrets: vault, git: lazyGitHistory(root), now };

  const defs = new Map(CRITERIA.map((c) => [c.id, c]));
  const unknownCriterion = opts.rules.find((r) => !defs.has(r.criterion));
  if (unknownCriterion) {
    throw new Error(
      `Rule ${unknownCriterion.id} targets unknown criterion ${unknownCriterion.criterion}.`,
    );
  }

  const rulesErrored: { ruleId: string; error: string }[] = [];
  const draft: { rule: Rule; raw: RawFinding }[] = [];
  const outcomes = new Map<string, RuleOutcome>();
  let rulesRun = 0;

  const sortedRules = [...opts.rules].sort(
    (a, b) =>
      (CRITERION_ORDER.get(a.criterion) ?? 0) - (CRITERION_ORDER.get(b.criterion) ?? 0) ||
      a.id.localeCompare(b.id),
  );
  for (const rule of sortedRules) {
    if (!inScope.has((defs.get(rule.criterion) as CriterionDef).category)) continue;
    rulesRun++;
    const link = rule.tags.includes('DOCS')
      ? (config.evidenceLinks[rule.id] ?? config.evidenceLinks[rule.criterion])
      : undefined;
    const { outcome, error } = link
      ? {
          outcome: {
            status: 'not_applicable' as const,
            justification: `Documented externally at ${link}. threesock cannot read external evidence, so this check is not scored.`,
          },
          error: undefined,
        }
      : await runRule(rule, ctx);
    if (error) rulesErrored.push({ ruleId: rule.id, error });
    outcomes.set(rule.id, outcome);
    if (outcome.status === 'fail') for (const raw of outcome.findings) draft.push({ rule, raw });
  }

  // Finalize findings: order deterministically, then assign IDs.
  draft.sort(
    (a, b) =>
      SEVERITY_RANK[a.raw.severity ?? a.rule.severity] -
        SEVERITY_RANK[b.raw.severity ?? b.rule.severity] ||
      (CRITERION_ORDER.get(a.rule.criterion) ?? 0) - (CRITERION_ORDER.get(b.rule.criterion) ?? 0) ||
      a.rule.id.localeCompare(b.rule.id) ||
      (a.raw.path ?? '').localeCompare(b.raw.path ?? '') ||
      (a.raw.line ?? 0) - (b.raw.line ?? 0) ||
      a.raw.observed.localeCompare(b.raw.observed),
  );
  const findings: Finding[] = draft.map(({ rule, raw }, i) => {
    const severity = raw.severity ?? rule.severity;
    const fingerprint = fingerprintOf(rule.id, raw);
    const where = raw.path ? `${raw.path}${raw.line ? `:${raw.line}` : ''}` : 'repository';
    const finding: Finding = {
      id: `F-${String(i + 1).padStart(3, '0')}`,
      ruleId: rule.id,
      criterion: rule.criterion,
      severity,
      title: raw.title ?? rule.title,
      location: { description: where },
      observed: raw.observed,
      expected: rule.expected,
      risk: rule.risk,
      recommendation: rule.remediation.summary,
      dueDate: isoDate(addDays(now, config.thresholds.slaDays[severity])),
      status: 'open',
      redFlag: raw.redFlag ?? rule.redFlag ?? false,
      fingerprint,
    };
    if (raw.path) finding.location.path = raw.path;
    if (raw.line) finding.location.line = raw.line;
    if (rule.remediation.example) finding.example = rule.remediation.example;
    const owner = raw.path
      ? ownerFor(config, (p) => matchesGlob(raw.path as string, p))
      : undefined;
    if (owner) finding.owner = owner;

    const exc = findException(config.exceptions, rule.id, fingerprint, raw.path);
    if (exc && exc.expires >= today) {
      finding.status = 'accepted';
      finding.exception = {
        approver: exc.approver,
        justification: exc.justification,
        expires: exc.expires,
      };
    } else if (exc) {
      finding.expiredException = { approver: exc.approver, expires: exc.expires };
    }
    return finding;
  });

  const notApplicable = new Map(config.notApplicable.map((n) => [n.criterion, n.justification]));

  const criteria: CriterionResult[] = CRITERIA.map((def) => {
    const rules = sortedRules.filter((r) => r.criterion === def.id);
    const criterionFindings = findings.filter((f) => f.criterion === def.id);
    const checks: CheckResult[] = rules
      .filter((r) => outcomes.has(r.id))
      .map((rule) => {
        const outcome = outcomes.get(rule.id) as RuleOutcome;
        const ruleFindings = criterionFindings.filter((f) => f.ruleId === rule.id);
        const check: CheckResult = {
          ruleId: rule.id,
          title: rule.title,
          status: outcome.status,
          evidence:
            outcome.status === 'pass'
              ? outcome.evidence
              : outcome.status === 'fail'
                ? (outcome.evidence ?? [])
                : [],
          findingIds: ruleFindings.map((f) => f.id),
        };
        if (outcome.status === 'unknown') check.note = outcome.reason;
        if (outcome.status === 'not_applicable') check.note = outcome.justification;
        if (outcome.status === 'fail' && ruleFindings.every((f) => f.status === 'accepted')) {
          check.status = 'accepted';
        }
        return check;
      });

    const { score, rationale, capped } = scoreCriterion({
      def,
      inScope: inScope.has(def.category),
      notApplicable: notApplicable.get(def.id),
      checks,
      findings: criterionFindings,
    });

    const covered = new Set(rules.flatMap((r) => coveredCheckIndexes(def, r)));
    const manualFollowUps =
      score === 'N/A'
        ? []
        : def.checks
            .filter((c, i) => c.org || !covered.has(i) || score === 'MANUAL')
            .map((c) => c.text);

    const result: CriterionResult = {
      id: def.id,
      category: def.category,
      title: def.title,
      tags: [...def.tags],
      inScope: inScope.has(def.category),
      score,
      label: labelFor(score),
      rationale,
      capped,
      evidence: checks.flatMap((c) => (c.status === 'pass' ? c.evidence : [])),
      checks,
      findingIds: criterionFindings.map((f) => f.id),
      coverage: { automatedRules: checks.length, rubricChecks: def.checks.length },
      manualFollowUps,
    };
    const links = [
      config.evidenceLinks[def.id],
      ...rules.map((r) => config.evidenceLinks[r.id]),
    ].filter((l): l is string => Boolean(l));
    if (links.length) result.evidenceLinks = [...new Set(links)];
    if (score === 'MANUAL') {
      result.owner = ownerFor(config, (p) => p === def.id) ?? suggestedOwner(def.id);
    }
    return result;
  });

  const categories = CATEGORIES.map((c) => summarizeCategory(c, inScope.has(c), criteria));
  const open = findings.filter((f) => f.status === 'open');
  const severityCounts = Object.fromEntries(
    SEVERITIES.map((s) => [s, open.filter((f) => f.severity === s).length]),
  ) as Record<Severity, number>;

  const report: ScanReport = {
    schemaVersion: SCHEMA_VERSION,
    tool: { name: 'threesock', version: VERSION },
    disclaimer: DISCLAIMER,
    generatedAt: now.toISOString(),
    repository: { root, filesScanned: files.files.length, gitAware: files.isGitRepo },
    config: { scope: config.scope },
    summary: {
      overall: summarizeOverall(categories),
      categories,
      severityCounts,
      acceptedFindings: findings.length - open.length,
      manualOpen: criteria.filter((c) => c.inScope && c.score === 'MANUAL').length,
      topFixes: topFixes(open, sortedRules),
    },
    criteria,
    findings,
    coverage: { rulesRun, rulesErrored, externalTools: [] },
  };
  const commit = gitHead(root);
  if (commit) report.repository.commit = commit;
  if (config.configPath) report.config.path = config.configPath;

  return { report, scrub: (text) => vault.scrub(text) };
}

/** Ranks failing rules by impact: worst severity first, then how often they occur. */
export function topFixes(open: readonly Finding[], rules: readonly Rule[], limit = 5): TopFix[] {
  const byRule = new Map<string, Finding[]>();
  for (const f of open) byRule.set(f.ruleId, [...(byRule.get(f.ruleId) ?? []), f]);
  const ruleById = new Map(rules.map((r) => [r.id, r]));
  return [...byRule.entries()]
    .map(([ruleId, fs]) => {
      const severity = fs.reduce<Severity>(
        (worst, f) => (SEVERITY_RANK[f.severity] < SEVERITY_RANK[worst] ? f.severity : worst),
        'low',
      );
      const rule = ruleById.get(ruleId);
      const worst = fs.find((f) => f.severity === severity) ?? fs[0];
      return {
        ruleId,
        criterion: fs[0]?.criterion ?? '',
        severity,
        title: worst?.title ?? rule?.title ?? ruleId,
        occurrences: fs.length,
        recommendation: rule?.remediation.summary ?? fs[0]?.recommendation ?? '',
      };
    })
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
        b.occurrences - a.occurrences ||
        a.ruleId.localeCompare(b.ruleId),
    )
    .slice(0, limit);
}
