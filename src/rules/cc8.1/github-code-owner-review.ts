import type { Rule } from '../../engine/types.js';
import { CODEOWNERS_LOCATIONS } from '../cc1.3/codeowners.js';
import { protectionFor } from '../lib/github.js';
import { firstExisting } from '../util.js';

export const githubCodeOwnerReview: Rule = {
  id: 'cc8.1/github-code-owner-review',
  criterion: 'CC8.1',
  title: 'Code owner review is required on the default branch',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  requires: ['github'],
  checks: ['`CODEOWNERS` review enforced on sensitive paths'],
  expected:
    'Branch protection requires review from code owners, so CODEOWNERS entries for sensitive paths are enforced, not advisory.',
  risk: 'Without enforcement, CODEOWNERS only suggests reviewers; anyone can approve changes to auth, infrastructure or workflows.',
  remediation: {
    summary:
      'Turn on "Require review from Code Owners" in the branch ruleset (require_code_owner_review).',
    example: `{ "type": "pull_request", "parameters": { "require_code_owner_review": true, "required_approving_review_count": 1 } }`,
  },
  async detect(ctx) {
    if (!firstExisting(ctx.files, CODEOWNERS_LOCATIONS))
      return {
        status: 'not_applicable',
        justification: 'The repository has no CODEOWNERS file to enforce (see cc1.3/codeowners).',
      };
    const res = await protectionFor(ctx);
    if (!res) return { status: 'unknown', reason: 'GitHub checks are not enabled.' };
    if (!res.ok)
      return { status: 'unknown', reason: `Could not read branch protection: ${res.reason}` };
    if (res.data.codeOwnerReview)
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'api',
            description: `Code owner review is required on ${res.data.branch} (GitHub API).`,
          },
        ],
      };
    if (!res.data.protected && res.data.gaps.length)
      return { status: 'unknown', reason: res.data.gaps.join('; ') };
    return {
      status: 'fail',
      findings: [
        {
          title: 'Code owner review is not required',
          observed: `${res.data.branch} does not require review from code owners (GitHub API).`,
          key: 'off',
        },
      ],
    };
  },
};
