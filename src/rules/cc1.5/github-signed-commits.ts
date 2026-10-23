import type { Rule } from '../../engine/types.js';
import { protectionFor } from '../lib/github.js';

export const githubSignedCommits: Rule = {
  id: 'cc1.5/github-signed-commits',
  criterion: 'CC1.5',
  title: 'Signed commits are required on the default branch',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  requires: ['github'],
  checks: ['Every change is attributable to an individual'],
  expected:
    'The default branch requires signed commits, or every contributor authenticates through SSO-linked identities.',
  risk: 'Unsigned commits can carry any name and email, so authorship cannot be proven.',
  remediation: {
    summary:
      'Add the "Require signed commits" rule to the default branch ruleset and help contributors set up SSH or GPG signing.',
    example: `{ "type": "required_signatures" }`,
  },
  async detect(ctx) {
    const res = await protectionFor(ctx);
    if (!res || !ctx.github) return { status: 'unknown', reason: 'GitHub checks are not enabled.' };
    if (!res.ok)
      return { status: 'unknown', reason: `Could not read branch protection: ${res.reason}` };
    if (res.data.signedCommits)
      return {
        status: 'pass',
        evidence: [
          { kind: 'api', description: `${res.data.branch} requires signed commits (GitHub API).` },
        ],
      };
    const repo = await ctx.github.repo();
    if (repo.ok && repo.data.owner.type === 'Organization') {
      return {
        status: 'unknown',
        reason: `${res.data.branch} does not require signed commits. The organization may enforce SSO-linked identities instead; confirm manually.`,
      };
    }
    return {
      status: 'fail',
      findings: [
        {
          title: 'Signed commits are not required',
          observed: `${res.data.branch} does not require signed commits, and a personal repository has no SSO to attribute changes (GitHub API).`,
          key: 'unsigned',
        },
      ],
    };
  },
};
