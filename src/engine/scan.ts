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
import { GitHubClient, GitHubFacts, repoFromRemote } from '../integrations/github.js';
import { prepareTools, type ToolOptions } from '../integrations/tools/index.js';
import { lazyGitHistory } from './git.js';
import { DEFAULT_MAPPING_PATH, loadMapping } from './mappings.js';
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
  /** External scanners (decision 39). Defaults to none for library callers; the CLI defaults to auto. */
  tools?: ToolOptions;
  /** Enables GitHub API checks (decision 34). */
  github?: { token: string; repo?: string; apiUrl?: string; fetch?: typeof fetch };
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

  const mapping = loadMapping(config.mappingsPath ?? DEFAULT_MAPPING_PATH);
  const mapped = (id: string) => mapping.criteria[id] ?? { controls: [], policies: [] };
  const files = buildFileIndex(root, { ignore: config.ignore });
  const vault = new SecretVault();
  const ctx: RuleContext = { files, config, secrets: vault, git: lazyGitHistory(root), now };
  let github: GitHubClient | undefined;
  let githubRepo: string | null = null;
  if (opts.github) {
    vault.register(opts.github.token); // never let the token reach output
    githubRepo = opts.github.repo ?? repoFromRemote(root) ?? null;
    if (githubRepo) {
      github = new GitHubClient({
        token: opts.github.token,
        repo: githubRepo,
        apiUrl: opts.github.apiUrl,
        fetch: opts.github.fetch,
      });
      ctx.github = new GitHubFacts(github);
    }
  }

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

  const tools = await prepareTools(opts.tools ?? { mode: 'none', network: false }, {
    root,
    files,
    secrets: vault,
    inScope: (criterion) => inScope.has((defs.get(criterion) as CriterionDef).category),
  });
  const sortedRules = [...opts.rules, ...tools.rules].sort(
    (a, b) =>
      (CRITERION_ORDER.get(a.criterion) ?? 0) - (CRITERION_ORDER.get(b.criterion) ?? 0) ||
      a.id.localeCompare(b.id),
  );
  for (const rule of sortedRules) {
    if (!inScope.has((defs.get(rule.criterion) as CriterionDef).category)) continue;
    if (rule.requires?.includes('github') && !opts.github) continue;
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
      : rule.requires?.includes('github') && !ctx.github
        ? {
            outcome: {
              status: 'unknown' as const,
              reason:
                'The GitHub repository could not be determined from the origin remote; pass --github-repo owner/name.',
            },
            error: undefined,
          }
        : await runRule(rule, ctx);
    if (error) rulesErrored.push({ ruleId: rule.id, error });
    outcomes.set(rule.id, outcome);
    if (outcome.status === 'fail') for (const raw of outcome.findings) draft.push({ rule, raw });
  }

  tools.cleanup();

  // De-duplicate external tool findings against built-in ones at the same location
  // (decision 40): the built-in finding wins and notes the tool that also found it.
  const builtinAt = new Map<string, RawFinding>();
  for (const d of draft)
    if (!d.rule.source && d.raw.path && d.raw.line)
      builtinAt.set(`${d.raw.path}:${d.raw.line}`, d.raw);
  const alsoFound = new Map<RawFinding, Set<string>>();
  for (let i = draft.length - 1; i >= 0; i--) {
    const d = draft[i] as (typeof draft)[number];
    const twin =
      d.rule.source && d.raw.path && d.raw.line
        ? builtinAt.get(`${d.raw.path}:${d.raw.line}`)
        : undefined;
    if (twin && d.rule.source) {
      alsoFound.set(
        twin,
        (alsoFound.get(twin) ?? new Set()).add(`${d.rule.source.tool} ${d.rule.source.version}`),
      );
      draft.splice(i, 1);
    }
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
  const usedExceptions = new Set<ExceptionEntry>();
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
      ...(rule.source
        ? { source: { ...rule.source, ...(raw.checkId ? { checkId: raw.checkId } : {}) } }
        : {}),
      ...(alsoFound.has(raw)
        ? { alsoFoundBy: [...(alsoFound.get(raw) as Set<string>)].sort() }
        : {}),
      controls: [...mapped(rule.criterion).controls],
      policies: [...mapped(rule.criterion).policies],
    };
    if (raw.path) finding.location.path = raw.path;
    if (raw.line) finding.location.line = raw.line;
    if (rule.remediation.example) finding.example = rule.remediation.example;
    const owner = raw.path
      ? ownerFor(config, (p) => matchesGlob(raw.path as string, p))
      : undefined;
    if (owner) finding.owner = owner;

    const exc = findException(config.exceptions, rule.id, fingerprint, raw.path);
    if (exc) usedExceptions.add(exc);
    const cap = config.thresholds.maxExceptionDays[severity];
    const latest = cap === undefined ? undefined : isoDate(addDays(now, cap));
    if (exc && exc.expires >= today && latest !== undefined && exc.expires > latest) {
      finding.rejectedException = {
        approver: exc.approver,
        expires: exc.expires,
        reason: `Exceptions for ${severity} findings may run at most ${cap} days (until ${latest}).`,
      };
    } else if (exc && exc.expires >= today) {
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
      controls: [...mapped(def.id).controls],
      policies: [...mapped(def.id).policies],
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
      // Exceptions that matched nothing: the finding was fixed, or the entry is wrong.
      staleExceptions: config.exceptions
        .filter((e) => !usedExceptions.has(e))
        .map((e) => ({
          source: e.source ?? 'config',
          ...(e.rule ? { rule: e.rule } : {}),
          ...(e.fingerprint ? { fingerprint: e.fingerprint } : {}),
          ...(e.title ? { title: e.title } : {}),
          approver: e.approver,
          expires: e.expires,
        })),
      manualOpen: criteria.filter((c) => c.inScope && c.score === 'MANUAL').length,
      topFixes: topFixes(open, sortedRules),
    },
    criteria,
    findings,
    mapping: {
      name: mapping.name,
      source: mapping.source === DEFAULT_MAPPING_PATH ? 'default' : mapping.source,
    },
    coverage: { rulesRun, rulesErrored, externalTools: tools.statuses },
  };
  if (opts.github)
    report.coverage.github = {
      repository: githubRepo,
      problems: [...(github?.problems ?? [])].sort(),
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
