import type { Rule } from '../../engine/types.js';

export const githubDependabot: Rule = {
  id: 'cc7.1/github-dependabot',
  criterion: 'CC7.1',
  title: 'Dependabot alerts are enabled',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  requires: ['github'],
  checks: [
    'Vulnerability scanning of code, dependencies, images, and infrastructure is continuous or scheduled',
  ],
  expected:
    'Dependabot alerts are enabled so newly published advisories against your dependencies are raised automatically.',
  risk: 'New CVEs in existing dependencies go unnoticed until someone happens to run a scan.',
  remediation: {
    summary: 'Enable Dependabot alerts (and security updates) for the repository.',
    example: `gh api -X PUT repos/OWNER/REPO/vulnerability-alerts`,
  },
  async detect(ctx) {
    if (!ctx.github) return { status: 'unknown', reason: 'GitHub checks are not enabled.' };
    const res = await ctx.github.dependabotEnabled();
    if (!res.ok) return { status: 'unknown', reason: res.reason };
    if (res.data)
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'api',
            description: `Dependabot alerts are enabled for ${ctx.github.client.repo} (GitHub API).`,
          },
        ],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'Dependabot alerts are off',
          observed: `Dependabot alerts are disabled for ${ctx.github.client.repo} (GitHub API).`,
          key: 'off',
        },
      ],
    };
  },
};
