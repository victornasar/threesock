import { docRule } from '../lib/doc-rule.js';

export const riskRegister = docRule({
  id: 'cc3.2/risk-register',
  criterion: 'CC3.2',
  title: 'A risk register records likelihood, impact, owner and treatment',
  severity: 'medium',
  redFlag: false,
  checks: ['Risk register exists'],
  noun: 'risk register',
  find: /risk[- _]?(?:register|assessment)/i,
  sections: [
    { name: 'likelihood', re: /likelihood|probability/i },
    { name: 'impact', re: /\bimpact\b/i },
    { name: 'owner', re: /\bowner\b/i },
    { name: 'treatment', re: /treatment|mitigat|accept|transfer|avoid/i },
  ],
  expected:
    'Risks are recorded with likelihood, impact, an owner and a treatment decision, and link to tracking issues.',
  risk: 'Unrecorded risks have no owner, so they are neither fixed nor consciously accepted.',
  remediation: {
    summary: 'Keep a risk register (a Markdown table is fine) and review it at least quarterly.',
    example: `| Risk | Likelihood | Impact | Owner | Treatment |
|---|---|---|---|---|
| Leaked deploy key | Low | High | @platform | Mitigate: OIDC, no stored keys |`,
  },
});
