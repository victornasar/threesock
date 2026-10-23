import { docRule } from '../lib/doc-rule.js';

export const retentionSchedule = docRule({
  id: 'c1.2/retention-schedule',
  criterion: 'C1.2',
  title: 'Retention periods are defined per data class',
  severity: 'medium',
  redFlag: false,
  checks: ['Retention periods defined per data class'],
  noun: 'data retention schedule',
  find: /retention|data[- _]?(?:lifecycle|handling)|disposal/i,
  sections: [
    { name: 'retention periods', re: /\b\d+\s*(?:days?|months?|years?)\b/i },
    { name: 'deletion or disposal', re: /delet|purg|dispos|destroy|anonymi/i },
  ],
  expected:
    'Retention periods are defined per data class, and say how data is deleted at the end of them.',
  risk: 'Data kept forever is breach exposure without business value, and violates privacy commitments.',
  remediation: {
    summary:
      'Document a retention schedule per data class and implement it with TTLs, lifecycle rules or purge jobs.',
    example: `| Data | Retention | Deletion |
|---|---|---|
| Application logs | 90 days hot, 12 months archive | Bucket lifecycle rule |
| Closed accounts | 30 days | Nightly purge job |`,
  },
});
