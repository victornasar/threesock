import { docRule } from '../lib/doc-rule.js';

export const dataClassification = docRule({
  id: 'c1.1/data-classification',
  criterion: 'C1.1',
  title: 'A data classification scheme is defined',
  severity: 'medium',
  redFlag: false,
  checks: ['Data classification scheme exists'],
  noun: 'data classification scheme',
  find: /classif|data[- _]?handling/i,
  sections: [
    {
      name: 'classification levels',
      re: /\b(?:public|internal|confidential|restricted)\b[\s\S]{0,400}\b(?:public|internal|confidential|restricted)\b[\s\S]{0,400}\b(?:public|internal|confidential|restricted)\b/i,
    },
    { name: 'handling rules', re: /handl|encrypt|access|storage|must/i },
  ],
  expected:
    'A classification scheme (e.g. public / internal / confidential / restricted) is defined with handling rules, and applied to data stores and fields.',
  risk: 'Without classification, confidential data is handled like everything else: logged, copied to lower environments and shared with vendors.',
  remediation: {
    summary:
      'Define classification levels and their handling rules, then tag data stores and sensitive fields.',
    example: `| Level | Examples | Handling |
|---|---|---|
| Restricted | Card data, credentials | Encrypted fields, no logs, no lower environments |
| Confidential | Customer PII | Encrypted at rest, access logged |`,
  },
});
