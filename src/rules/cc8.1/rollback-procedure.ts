import type { Rule } from '../../engine/types.js';
import { findDoc } from '../lib/docs.js';

export const rollbackProcedure: Rule = {
  id: 'cc8.1/rollback-procedure',
  criterion: 'CC8.1',
  title: 'Rollback procedure is documented',
  tags: ['DOCS'],
  severity: 'low',
  redFlag: false,
  checks: ['Rollback procedure documented and exercised'],
  expected:
    'A runbook explains how to roll back a bad release, who can do it, and how to verify it worked.',
  risk: 'Under incident pressure, an undocumented rollback is slow, inconsistent and easy to get wrong.',
  remediation: {
    summary:
      'Add a rollback section to your deployment runbook (docs/runbooks/rollback.md) and rehearse it.',
    example: `## Rolling back a release
1. Find the last good deployment in the Deployments tab.
2. Promote it: \`vercel promote <deployment-url>\` (or re-run the deploy workflow for the previous tag).
3. Confirm health checks and error rates recover; post in #incidents.`,
  },
  detect(ctx) {
    const hit = findDoc(
      ctx.files,
      /^#+\s.*\b(?:roll ?back|rolling back|revert(?:ing)? a (?:deploy|release))\b|\b(?:roll ?back|revert) (?:a |the )?(?:deploy(?:ment)?|release)\b/im,
    );
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'Rollback procedure documented.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No documented rollback procedure',
          observed: 'No runbook or document describing how to roll back a deployment was found.',
          key: 'missing',
        },
      ],
    };
  },
};
