import { docRule } from '../lib/doc-rule.js';

export const breachNotification = docRule({
  id: 'p6.6/breach-notification',
  criterion: 'P6.6',
  title: 'A breach notification procedure sets deadlines and audiences',
  severity: 'medium',
  redFlag: false,
  checks: ['Breach notification runbook and templates exist'],
  noun: 'breach notification procedure',
  find: /breach|incident[- _]?response/i,
  sections: [
    {
      name: 'notification deadlines',
      re: /\b72\s*hours?\b|\b\d+\s*(?:hours?|days?)\b[^\n]{0,80}notif|without undue delay/i,
    },
    {
      name: 'regulators and affected people',
      re: /regulator|supervisory authority|data protection authority|data subjects?|affected (?:users|customers|individuals)/i,
    },
    { name: 'templates', re: /template/i },
  ],
  expected:
    'A breach procedure sets notification deadlines (e.g. 72 hours to regulators), who is notified (regulators, customers, data subjects), and keeps message templates.',
  risk: 'Missing a statutory notification deadline turns an incident into a regulatory violation.',
  remediation: {
    summary:
      'Document breach notification deadlines per jurisdiction and contract, who decides, and ready-to-use templates.',
    example: `## Breach notification
Regulators: within 72 hours of awareness (GDPR Art. 33). Customers: per contract, within 48 hours.
Templates: docs/security/templates/breach-customer.md`,
  },
});
