import type { Evidence, Rule } from '../../engine/types.js';
import { findDoc } from '../lib/docs.js';

const TOPICS = [
  { name: 'onboarding', re: /^#+\s.*\bonboard/im },
  { name: 'offboarding', re: /^#+\s.*\boffboard/im },
  { name: 'deployment', re: /^#+\s.*\b(?:deploy|releas)/im },
  { name: 'rollback', re: /^#+\s.*\b(?:roll ?back|rolling back)/im },
  { name: 'incident response', re: /^#+\s.*\bincident/im },
  { name: 'key rotation', re: /^#+\s.*\brotat/im },
  { name: 'access reviews', re: /^#+\s.*\baccess reviews?/im },
];

export const runbooks: Rule = {
  id: 'cc5.3/runbooks',
  criterion: 'CC5.3',
  title: 'Procedures exist for the core operational processes',
  tags: ['DOCS'],
  severity: 'medium',
  redFlag: false,
  checks: ['Procedures/runbooks exist for onboarding'],
  expected:
    'Runbooks cover onboarding, offboarding, deployment, rollback, incident response, key rotation and access reviews.',
  risk: 'Undocumented procedures are performed inconsistently and cannot be shown to an auditor.',
  remediation: {
    summary: 'Add a section (heading) for each missing procedure to your runbooks.',
    example: `docs/runbooks/
  access.md     # onboarding, offboarding, access reviews
  release.md    # deployment and rollback
  incidents.md  # incident response
  secrets.md    # key rotation`,
  },
  detect(ctx) {
    const evidence: Evidence[] = [];
    const missing: string[] = [];
    for (const t of TOPICS) {
      const hit = findDoc(ctx.files, t.re);
      if (hit) evidence.push({ kind: 'file', ...hit, description: `Procedure for ${t.name}.` });
      else missing.push(t.name);
    }
    if (missing.length === 0) return { status: 'pass', evidence };
    return {
      status: 'fail',
      evidence,
      findings: [
        {
          title: `No documented procedure for ${missing.join(', ')}`,
          observed: `Procedures found for ${evidence.length} of ${TOPICS.length} core processes (by heading); missing: ${missing.join(', ')}.`,
          severity: evidence.length >= 4 ? 'low' : 'medium',
          key: missing.join(','),
        },
      ],
    };
  },
};
