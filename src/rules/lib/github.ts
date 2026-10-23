// Helpers for --github rules: merging classic branch protection and rulesets
// into one view of what the default branch actually enforces.
import type { BranchRule, ClassicProtection, GitHubFacts } from '../../integrations/github.js';
import type { RuleContext } from '../../engine/types.js';

export interface EffectiveProtection {
  branch: string;
  /** Any classic protection or ruleset applies. */
  protected: boolean;
  sources: string[];
  pullRequestRequired: boolean;
  approvals: number;
  dismissStale: boolean;
  codeOwnerReview: boolean;
  statusChecks: boolean;
  conversationResolution: boolean;
  forcePushBlocked: boolean;
  deletionBlocked: boolean;
  signedCommits: boolean;
  /** false when admins or other actors can bypass; undefined when it could not be read. */
  noBypass: boolean | undefined;
  /** Parts that could not be read, with reasons. */
  gaps: string[];
}

function param<T>(r: BranchRule, key: string): T | undefined {
  return r.parameters?.[key] as T | undefined;
}

export async function effectiveProtection(
  gh: GitHubFacts,
): Promise<{ ok: true; data: EffectiveProtection } | { ok: false; reason: string }> {
  const branch = await gh.branch();
  if (!branch.ok) return { ok: false, reason: branch.reason };
  const [classicRes, rulesRes] = await Promise.all([gh.classicProtection(), gh.branchRules()]);
  if (!classicRes.ok && !rulesRes.ok)
    return { ok: false, reason: `${classicRes.reason}; ${rulesRes.reason}` };

  const c: ClassicProtection | null = classicRes.ok ? classicRes.data : null;
  const rules: BranchRule[] = rulesRes.ok ? rulesRes.data : [];
  const of = (type: string) => rules.filter((r) => r.type === type);
  const pr = of('pull_request');
  const gaps = [
    !classicRes.ok && `classic branch protection: ${classicRes.reason}`,
    !rulesRes.ok && `rulesets: ${rulesRes.reason}`,
  ].filter((g): g is string => Boolean(g));

  // Bypass: classic enforce_admins, and bypass actors on every ruleset that applies.
  let noBypass: boolean | undefined = c
    ? Boolean(c.enforce_admins?.enabled)
    : rules.length
      ? true
      : undefined;
  for (const id of [
    ...new Set(rules.map((r) => r.ruleset_id).filter((x): x is number => typeof x === 'number')),
  ]) {
    const rs = await gh.ruleset(id);
    if (!rs.ok) {
      gaps.push(`ruleset ${id} bypass list: ${rs.reason}`);
      if (noBypass) noBypass = undefined;
    } else if ((rs.data.bypass_actors ?? []).some((a) => a.bypass_mode !== 'pull_request')) {
      noBypass = false;
    }
  }

  const reviews = c?.required_pull_request_reviews;
  return {
    ok: true,
    data: {
      branch: branch.data,
      protected: Boolean(c) || rules.length > 0,
      sources: [
        c && 'branch protection',
        rules.length && `${new Set(rules.map((r) => r.ruleset_id)).size} ruleset(s)`,
      ].filter((s): s is string => Boolean(s)),
      pullRequestRequired: Boolean(reviews) || pr.length > 0,
      approvals: Math.max(
        reviews?.required_approving_review_count ?? 0,
        ...pr.map((r) => param<number>(r, 'required_approving_review_count') ?? 0),
      ),
      dismissStale:
        Boolean(reviews?.dismiss_stale_reviews) ||
        pr.some((r) => param<boolean>(r, 'dismiss_stale_reviews_on_push')),
      codeOwnerReview:
        Boolean(reviews?.require_code_owner_reviews) ||
        pr.some((r) => param<boolean>(r, 'require_code_owner_review')),
      statusChecks: Boolean(c?.required_status_checks) || of('required_status_checks').length > 0,
      conversationResolution:
        Boolean(c?.required_conversation_resolution?.enabled) ||
        pr.some((r) => param<boolean>(r, 'required_review_thread_resolution')),
      forcePushBlocked:
        (c ? !c.allow_force_pushes?.enabled : false) || of('non_fast_forward').length > 0,
      deletionBlocked: (c ? !c.allow_deletions?.enabled : false) || of('deletion').length > 0,
      signedCommits:
        Boolean(c?.required_signatures?.enabled) || of('required_signatures').length > 0,
      noBypass,
      gaps,
    },
  };
}

/** Memoized per scan, since several rules need it. */
const cache = new WeakMap<GitHubFacts, ReturnType<typeof effectiveProtection>>();
export function protectionFor(
  ctx: RuleContext,
): ReturnType<typeof effectiveProtection> | undefined {
  if (!ctx.github) return undefined;
  let p = cache.get(ctx.github);
  if (!p) {
    p = effectiveProtection(ctx.github);
    cache.set(ctx.github, p);
  }
  return p;
}

export function daysBetween(fromIso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(fromIso).getTime()) / 86_400_000);
}
