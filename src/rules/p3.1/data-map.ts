import { docRule } from '../lib/doc-rule.js';

export const dataMap = docRule({
  id: 'p3.1/data-map',
  criterion: 'P3.1',
  title: 'A data map records personal data fields and their purpose',
  severity: 'medium',
  redFlag: false,
  checks: ['PII fields identified in schemas/APIs and tracked in a data map'],
  noun: 'personal data map',
  find: /data[- _]?(?:map|inventory|handling|catalog)|personal[- _]?data|\bpii\b|privacy/i,
  sections: [
    {
      name: 'personal data fields or categories',
      re: /\b(?:email|name|address|phone|date of birth|personal data categor)/i,
    },
    { name: 'purpose', re: /\bpurpose\b|used (?:for|to)\b|legal basis/i },
    { name: 'retention', re: /retention|retain|kept for|deleted after/i },
  ],
  expected:
    'A data map lists the personal data collected, where it is stored, why (purpose or legal basis) and for how long.',
  risk: 'Without a data map, collection drifts from the privacy notice and access or deletion requests miss data.',
  remediation: {
    summary:
      'Keep a data map: each personal data field or category, its purpose, where it is stored, who receives it and its retention.',
    example: `| Data | Purpose | Stored in | Retention |
|---|---|---|---|
| Email | Login, receipts | Postgres users | Account lifetime + 30 days |`,
  },
});
