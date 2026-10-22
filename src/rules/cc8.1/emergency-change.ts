import type { Rule } from '../../engine/types.js';
import { findDoc } from '../lib/docs.js';

export const emergencyChange: Rule = {
  id: 'cc8.1/emergency-change',
  criterion: 'CC8.1',
  title: 'Emergency change process is documented',
  tags: ['DOCS'],
  severity: 'low',
  redFlag: false,
  checks: ['Emergency-change process defined'],
  expected:
    'An emergency (hotfix / break-glass) change process is documented, including who may use it and the retroactive review it requires.',
  risk: 'Without a defined path, urgent fixes bypass review informally and leave no audit trail, which auditors treat as a control failure.',
  remediation: {
    summary:
      'Document the emergency change path: who can invoke it, what is skipped, and the retroactive review required within a set time.',
    example: `## Emergency changes
Use only for active incidents. An on-call engineer may merge with one approval from the incident commander.
A retroactive review PR is opened within 2 business days and linked from the incident ticket.`,
  },
  detect(ctx) {
    const hit = findDoc(
      ctx.files,
      /\bemergency (?:change|fix|release|deploy)|\bhotfix (?:process|procedure|policy)|\bbreak[- ]glass\b/i,
    );
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'Emergency change process documented.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No documented emergency change process',
          observed: 'No document describes an emergency, hotfix or break-glass change process.',
          key: 'missing',
        },
      ],
    };
  },
};
