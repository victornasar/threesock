import { docRule } from '../lib/doc-rule.js';

export const remediationSla = docRule({
  id: 'cc4.2/remediation-sla',
  criterion: 'CC4.2',
  title: 'Remediation SLAs are defined by severity',
  severity: 'medium',
  redFlag: false,
  checks: ['Remediation SLAs are defined and measured'],
  noun: 'vulnerability remediation policy',
  find: /vulnerabilit|remediat|security[- _]?policy|SECURITY\.md/i,
  sections: [
    {
      name: 'per-severity deadlines',
      re: /\bcritical\b[^\n]{0,80}\b\d+\s*(?:h|hours?|days?|business days?)\b/i,
    },
    { name: 'escalation of overdue findings', re: /overdue|escalat|exception/i },
  ],
  expected:
    'Remediation deadlines are defined per severity (e.g. Critical 7 days, High 30) and overdue findings are escalated.',
  risk: 'Without deadlines, known vulnerabilities age indefinitely, and auditors flag aged Critical/High findings as a control failure.',
  remediation: {
    summary:
      'Publish remediation SLAs per severity and an escalation path for overdue findings, and configure the same values in threesock.yaml.',
    example: `| Severity | Fix within |
|---|---|
| Critical | 7 days |
| High | 30 days |
Overdue findings are escalated to the engineering lead; exceptions need an approver and expiry.`,
  },
});
