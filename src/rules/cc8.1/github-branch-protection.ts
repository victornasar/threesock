import type { RawFinding, Rule } from '../../engine/types.js';
import { protectionFor } from '../lib/github.js';

export const githubBranchProtection: Rule = {
  id: 'cc8.1/github-branch-protection',
  criterion: 'CC8.1',
  title: 'The default branch is protected on GitHub',
  tags: ['CONFIG'],
  severity: 'high',
  redFlag: false,
  requires: ['github'],
  checks: ['**Branch protection**', '**Admins are not exempt**'],
  expected:
    'The default branch requires pull requests with approvals from someone other than the author, dismisses stale approvals, requires status checks and conversation resolution, blocks force pushes and deletion, and does not let admins bypass silently.',
  risk: 'Without enforced protection, any account with write access can change production code without review or tests.',
  remediation: {
    summary:
      'Add a branch ruleset for the default branch with pull request, status check, force-push and deletion rules, and no bypass actors (or bypass for pull requests only).',
    example: `gh api -X POST repos/OWNER/REPO/rulesets --input - <<'JSON'
{ "name": "main", "target": "branch", "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "pull_request", "parameters": { "required_approving_review_count": 1,
      "dismiss_stale_reviews_on_push": true, "require_code_owner_review": true,
      "require_last_push_approval": true, "required_review_thread_resolution": true } },
    { "type": "required_status_checks", "parameters": { "strict_required_status_checks_policy": true,
      "required_status_checks": [{ "context": "test" }] } },
    { "type": "non_fast_forward" }, { "type": "deletion" } ] }
JSON`,
  },
  async detect(ctx) {
    const res = await protectionFor(ctx);
    if (!res) return { status: 'unknown', reason: 'GitHub checks are not enabled.' };
    if (!res.ok)
      return { status: 'unknown', reason: `Could not read branch protection: ${res.reason}` };
    const p = res.data;
    const where = `${ctx.github?.client.repo}@${p.branch}`;
    if (!p.protected) {
      if (p.gaps.length)
        return {
          status: 'unknown',
          reason: `No ruleset applies to ${p.branch}, and classic protection could not be read: ${p.gaps.join('; ')}`,
        };
      return {
        status: 'fail',
        findings: [
          {
            title: `${p.branch} has no branch protection`,
            observed: `${where}: no branch protection and no ruleset applies (GitHub API).`,
            redFlag: true,
            key: 'none',
          },
        ],
      };
    }
    const required = ctx.config.thresholds.requiredApprovals;
    const findings: RawFinding[] = [];
    const add = (title: string, severity: RawFinding['severity'], key: string) =>
      findings.push({
        title,
        observed: `${where}: ${title.charAt(0).toLowerCase()}${title.slice(1)} (GitHub API).`,
        severity,
        key,
      });
    if (!p.pullRequestRequired) add('Pull requests are not required', 'high', 'pr');
    else if (p.approvals < required)
      add(
        `Only ${p.approvals} approval(s) required; policy requires ${required}`,
        p.approvals === 0 ? 'high' : 'medium',
        'approvals',
      );
    if (p.pullRequestRequired && !p.dismissStale)
      add('Stale approvals are not dismissed on new pushes', 'medium', 'stale');
    if (!p.statusChecks) add('No status checks are required before merge', 'medium', 'checks');
    if (!p.forcePushBlocked) add('Force pushes are allowed', 'medium', 'force');
    if (!p.deletionBlocked) add('Branch deletion is allowed', 'medium', 'delete');
    if (!p.conversationResolution)
      add('Conversation resolution is not required', 'low', 'conversations');
    if (p.noBypass === false)
      add('Admins or other actors can bypass protection', 'medium', 'bypass');
    const summary = `${where} is protected by ${p.sources.join(' and ')}: ${p.approvals} approval(s), stale dismissal ${p.dismissStale ? 'on' : 'off'}, status checks ${p.statusChecks ? 'required' : 'not required'}, force pushes ${p.forcePushBlocked ? 'blocked' : 'allowed'}.`;
    if (findings.length)
      return { status: 'fail', findings, evidence: [{ kind: 'api', description: summary }] };
    if (p.noBypass === undefined)
      return {
        status: 'unknown',
        reason: `${summary} Whether admins can bypass could not be read: ${p.gaps.join('; ') || 'no access to bypass settings'}.`,
      };
    return { status: 'pass', evidence: [{ kind: 'api', description: `${summary} No bypass.` }] };
  },
};
