import type { Rule } from '../../engine/types.js';
import { plural } from '../util.js';

// Evidence that a commit came through a pull/merge request.
const PR_TRAIL =
  /\(#\d+\)|^Merge pull request #\d+|^Merged in |See merge request|![\d]+\b|^Merge branch '[^']+' into/;

export const directPushes: Rule = {
  id: 'cc8.1/direct-pushes',
  criterion: 'CC8.1',
  title: 'Changes reach the default branch through pull requests',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['**Branch protection**'],
  expected:
    'Every commit on the default branch arrives through a reviewed pull request (merge commit or squash with a PR reference).',
  risk: 'Direct pushes skip review and CI, the change-management control auditors test first.',
  remediation: {
    summary:
      'Protect the default branch: require pull requests, approvals and status checks, and block force pushes. Rebase-merged PRs leave no trail, so prefer squash or merge commits.',
    example: `gh api -X PUT repos/OWNER/REPO/branches/main/protection \\
  -F required_pull_request_reviews.required_approving_review_count=1 \\
  -F enforce_admins=true -F required_status_checks=null -F restrictions=null`,
  },
  detect(ctx) {
    const history = ctx.git();
    if (!history.available)
      return { status: 'not_applicable', justification: 'No git history to examine.' };
    if (history.shallow)
      return {
        status: 'unknown',
        reason:
          'The clone is shallow, so default-branch history is incomplete. Fetch full history to check.',
      };
    const branch = history.defaultBranch;
    if (!branch)
      return {
        status: 'unknown',
        reason: 'The default branch could not be identified (no origin/HEAD, main or master).',
      };
    const direct = branch.commits.filter((c) => c.parents <= 1 && !PR_TRAIL.test(c.subject));
    if (direct.length === 0) {
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'config',
            description: `All ${plural(branch.commits.length, 'recent commit')} on ${branch.name} came through pull requests.`,
          },
        ],
      };
    }
    return {
      status: 'fail',
      findings: [
        {
          title: `Direct pushes to ${branch.name}`,
          observed: `${direct.length} of the last ${plural(branch.commits.length, 'commit')} on ${branch.name} have no pull request trail (e.g. ${direct
            .slice(0, 5)
            .map((c) => c.sha.slice(0, 7))
            .join(', ')}). Rebase-merged PRs also look like this.`,
          key: branch.name,
        },
      ],
    };
  },
};
