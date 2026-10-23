import type { RawFinding, Rule } from '../../engine/types.js';

export const githubSecretScanning: Rule = {
  id: 'cc6.1/github-secret-scanning',
  criterion: 'CC6.1',
  title: 'GitHub secret scanning and push protection are on',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  requires: ['github'],
  checks: ['**Secrets:**'],
  expected:
    'Secret scanning is enabled, with push protection blocking pushes that contain known secret formats.',
  risk: 'Without push protection, a secret is exposed the moment it is pushed; detection afterwards only starts the incident.',
  remediation: {
    summary:
      'Enable secret scanning and push protection in the repository (or organization) Code security settings.',
    example: `gh api -X PATCH repos/OWNER/REPO -f 'security_and_analysis[secret_scanning][status]=enabled' \\
  -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'`,
  },
  async detect(ctx) {
    if (!ctx.github) return { status: 'unknown', reason: 'GitHub checks are not enabled.' };
    const repo = await ctx.github.repo();
    if (!repo.ok) return { status: 'unknown', reason: repo.reason };
    const sa = repo.data.security_and_analysis;
    if (!sa)
      return {
        status: 'unknown',
        reason:
          'Security settings are only visible to repository admins; the token cannot read them.',
      };
    const scanning = sa.secret_scanning?.status === 'enabled';
    const push = sa.secret_scanning_push_protection?.status === 'enabled';
    const findings: RawFinding[] = [];
    if (!scanning)
      findings.push({
        title: 'Secret scanning is off',
        observed: `${repo.data.full_name}: secret scanning is not enabled (GitHub API).`,
        key: 'scanning',
      });
    if (!push)
      findings.push({
        title: 'Secret push protection is off',
        observed: `${repo.data.full_name}: push protection is not enabled, so secrets are detected only after they are pushed (GitHub API).`,
        key: 'push',
      });
    if (findings.length) return { status: 'fail', findings };
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'api',
          description: `${repo.data.full_name}: secret scanning and push protection are enabled (GitHub API).`,
        },
      ],
    };
  },
};
