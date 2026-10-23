import type { RawFinding, Rule } from '../../engine/types.js';

export const githubOrgSecurity: Rule = {
  id: 'cc5.2/github-org-security',
  criterion: 'CC5.2',
  title: 'The GitHub organization requires 2FA and least-privilege defaults',
  tags: ['CONFIG'],
  severity: 'high',
  redFlag: false,
  requires: ['github'],
  checks: ['SSO/MFA enforced on source control'],
  expected:
    'The organization requires two-factor authentication (or SSO) for all members, and members get no more than read access by default.',
  risk: "One phished password without 2FA gives an attacker the member's access to every repository; broad default permissions widen the blast radius.",
  remediation: {
    summary:
      'Require two-factor authentication for the organization and set the base permission to Read (or No permission).',
    example: `gh api -X PATCH orgs/ORG -F default_repository_permission=read`,
  },
  async detect(ctx) {
    if (!ctx.github) return { status: 'unknown', reason: 'GitHub checks are not enabled.' };
    const repo = await ctx.github.repo();
    if (!repo.ok) return { status: 'unknown', reason: repo.reason };
    if (repo.data.owner.type !== 'Organization')
      return {
        status: 'not_applicable',
        justification:
          'Personal repository: there are no organization settings. Two-factor authentication on the owner account must be confirmed manually.',
      };
    const org = await ctx.github.org(repo.data.owner.login);
    if (!org.ok) return { status: 'unknown', reason: org.reason };
    const findings: RawFinding[] = [];
    const tfa = org.data.two_factor_requirement_enabled;
    const perm = org.data.default_repository_permission;
    if (tfa === false)
      findings.push({
        title: 'Organization does not require two-factor authentication',
        observed: `${org.data.login} does not require 2FA for members (GitHub API).`,
        key: '2fa',
      });
    if (perm === 'write' || perm === 'admin')
      findings.push({
        title: `Members get ${perm} access to every repository by default`,
        observed: `${org.data.login} base permission is ${perm} (GitHub API).`,
        severity: 'medium',
        key: 'perm',
      });
    if (findings.length) return { status: 'fail', findings };
    if (tfa === null || tfa === undefined || !perm)
      return {
        status: 'unknown',
        reason: `${org.data.login}: the 2FA requirement and base permission are only visible to organization owners.`,
      };
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'api',
          description: `${org.data.login} requires 2FA; base permission is ${perm} (GitHub API).`,
        },
      ],
    };
  },
};
