import { docRule } from '../lib/doc-rule.js';

export const triageCriteria = docRule({
  id: 'cc7.3/triage-criteria',
  criterion: 'CC7.3',
  title: 'Security event severity and triage criteria are documented',
  severity: 'medium',
  redFlag: false,
  checks: ['Severity classification/triage criteria documented'],
  noun: 'severity and triage criteria',
  find: /triage|severity|incident[- _]?response|vulnerability[- _]?management/i,
  sections: [
    {
      name: 'severity levels',
      re: /\b(?:SEV ?[0-4]|P[0-4])\b|critical[\s\S]{0,300}\bhigh\b[\s\S]{0,300}\bmedium\b|severity levels?/i,
    },
    { name: 'classification criteria', re: /criteria|defined as|means\b|examples?\b/i },
    {
      name: 'outcome recording',
      re: /false positive|true positive|record(?:ed)? (?:the )?(?:outcome|decision)|is (?:it )?an incident/i,
    },
  ],
  expected:
    'Documented criteria say how a security event is classified, at what severity it becomes an incident, and how the triage outcome is recorded.',
  risk: 'Without shared criteria, the same alert is ignored by one person and escalated by another, and real incidents are missed.',
  remediation: {
    summary:
      'Document severity levels with examples, the threshold for declaring an incident, and where triage outcomes (true/false positive) are recorded.',
    example: `| Severity | Criteria | Example |
|---|---|---|
| Critical | Confirmed data exposure or active exploitation | Leaked production key used by a third party |
Triage outcome (true/false positive, incident yes/no) is recorded on the ticket.`,
  },
});
