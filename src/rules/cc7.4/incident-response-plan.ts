import { docRule } from '../lib/doc-rule.js';

export const incidentResponsePlan = docRule({
  id: 'cc7.4/incident-response-plan',
  criterion: 'CC7.4',
  title: 'An incident response plan defines roles, severity, escalation and communication',
  severity: 'high',
  redFlag: false,
  partialSeverity: 'medium',
  checks: ['Incident response plan exists'],
  noun: 'incident response plan',
  find: /incident[- _]?(?:response|management|handling)/i,
  sections: [
    { name: 'roles', re: /incident (?:commander|lead|owner)|\broles?\b|responsibilit/i },
    { name: 'severity levels', re: /severity|\bSEV ?\d|\bP[0-4]\b/i },
    { name: 'escalation', re: /escalat/i },
    { name: 'communication', re: /communicat|notif(?:y|ication)|status page|customers?/i },
  ],
  expected:
    'An incident response plan defines roles, severity levels, escalation paths and how internal and external communication happens.',
  risk: 'During an incident, an undocumented process means slow, inconsistent response and missed notification deadlines.',
  remediation: {
    summary:
      'Write docs/security/incident-response.md covering who leads, how severity is set, when to escalate, and who tells customers and regulators.',
    example: `## Roles
Incident lead: on-call engineer. Comms: head of support.
## Severity
SEV1: data exposure or full outage. SEV2: partial outage. SEV3: minor.
## Escalation
SEV1 pages the CTO within 15 minutes.
## Communication
Status page within 30 minutes; customers notified within 72 hours of a confirmed breach.`,
  },
});
