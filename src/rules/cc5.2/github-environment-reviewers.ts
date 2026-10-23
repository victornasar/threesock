import type { Rule } from '../../engine/types.js';

const PRODUCTION = /prod|live|release/i;

export const githubEnvironmentReviewers: Rule = {
  id: 'cc5.2/github-environment-reviewers',
  criterion: 'CC5.2',
  title: 'Production environments require reviewers',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  requires: ['github'],
  checks: ['CI/CD hardened'],
  expected:
    'GitHub environments used for production deploys require approval from designated reviewers.',
  risk: 'Without required reviewers, any workflow run that targets the environment can deploy to production unreviewed.',
  remediation: {
    summary: 'Add required reviewers (and deployment branch rules) to each production environment.',
    example: `gh api -X PUT repos/OWNER/REPO/environments/production --input - <<'JSON'
{ "reviewers": [{ "type": "Team", "id": 123456 }], "deployment_branch_policy": { "protected_branches": true, "custom_branch_policies": false } }
JSON`,
  },
  async detect(ctx) {
    if (!ctx.github) return { status: 'unknown', reason: 'GitHub checks are not enabled.' };
    const res = await ctx.github.environments();
    if (!res.ok)
      return res.status === 404
        ? { status: 'not_applicable', justification: 'The repository has no environments.' }
        : { status: 'unknown', reason: res.reason };
    const prod = res.data.filter((e) => PRODUCTION.test(e.name));
    if (prod.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No production environment is configured on GitHub.',
      };
    const unguarded = prod.filter(
      (e) => !(e.protection_rules ?? []).some((r) => r.type === 'required_reviewers'),
    );
    if (unguarded.length) {
      return {
        status: 'fail',
        findings: unguarded.map((e) => ({
          title: `Environment "${e.name}" has no required reviewers`,
          observed: `Deployments to ${e.name} need no approval (GitHub API).`,
          key: e.name,
        })),
      };
    }
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'api',
          description: `${prod.map((e) => e.name).join(', ')} require reviewer approval (GitHub API).`,
        },
      ],
    };
  },
};
