import { docRule } from '../lib/doc-rule.js';

export const controlMatrix = docRule({
  id: 'cc5.1/control-matrix',
  criterion: 'CC5.1',
  title: 'Controls are mapped to the risks they mitigate',
  severity: 'low',
  redFlag: false,
  checks: ['Controls are mapped to identified risks'],
  noun: 'risk-to-control mapping',
  find: /control[- _]?matrix|risk[- _]?register|security[- _]?controls/i,
  sections: [
    { name: 'a risks column', re: /^\|[^\n]*\brisks?\b[^\n]*\|/im },
    {
      name: 'a controls column',
      re: /^\|[^\n]*\b(?:controls?|mitigations?|treatment)\b[^\n]*\|/im,
    },
  ],
  expected:
    'A control matrix (or a risk register with a controls column) maps each identified risk to the controls that address it.',
  risk: 'Controls that are not tied to risks drift into box-ticking, and uncovered risks go unnoticed.',
  remediation: {
    summary: 'Add a controls column to the risk register, or keep a separate control matrix table.',
    example: `| Risk | Controls |
|---|---|
| Malicious dependency | Lockfiles, minimumReleaseAge, dependency review |`,
  },
});
