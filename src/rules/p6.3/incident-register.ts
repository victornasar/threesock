import { docRule } from '../lib/doc-rule.js';

export const incidentRegister = docRule({
  id: 'p6.3/incident-register',
  criterion: 'P6.3',
  title: 'Unauthorized disclosures are recorded in a register',
  severity: 'medium',
  redFlag: false,
  checks: ['Incident register captures unauthorized disclosures'],
  noun: 'incident and disclosure register',
  find: /(?:incident|breach|disclosure)[- _]?(?:register|log)|incident[- _]?response/i,
  sections: [
    { name: 'scope', re: /\bscope\b|what (?:was|happened)|data (?:involved|affected)/i },
    {
      name: 'affected subjects',
      re: /affected (?:subjects|users|people|individuals|records)|number of (?:people|records)/i,
    },
    { name: 'root cause', re: /root cause/i },
    { name: 'remediation', re: /remediat|corrective action/i },
  ],
  expected:
    'Every detected or reported unauthorized disclosure is recorded with scope, affected subjects, root cause and remediation, and linked to incident response.',
  risk: 'Without a register you cannot show regulators or auditors what happened, to whom, and what was fixed.',
  remediation: {
    summary:
      'Keep an incident register (a table is enough) and fill it in for every suspected disclosure, even ones that turn out minor.',
    example: `| Date | Scope | Affected subjects | Root cause | Remediation |
|---|---|---|---|---|`,
  },
});
