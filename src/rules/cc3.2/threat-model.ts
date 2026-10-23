import { docRule } from '../lib/doc-rule.js';

export const threatModel = docRule({
  id: 'cc3.2/threat-model',
  criterion: 'CC3.2',
  title: 'A threat model exists for the system',
  severity: 'medium',
  redFlag: false,
  checks: ['Threat models exist'],
  noun: 'threat model',
  find: /threat[- _]?model/i,
  sections: [
    {
      name: 'assets or data',
      re: /\bassets?\b|data flows?|what (?:we|it) protects?|sensitive data/i,
    },
    { name: 'trust boundaries or entry points', re: /trust boundar|entry points?|attack surface/i },
    { name: 'threats', re: /\bthreats?\b|STRIDE|abuse cases?|attacker/i },
    { name: 'mitigations', re: /mitigat|countermeasure|\bcontrols?\b/i },
  ],
  expected:
    'A threat model names the assets, trust boundaries, threats and mitigations for the system, and is updated with major changes.',
  risk: 'Without one, security work follows whatever is noticed rather than what matters most, and design flaws ship unexamined.',
  remediation: {
    summary:
      'Write a short threat model (docs/security/threat-model.md): what you protect, where untrusted input enters, what could go wrong (STRIDE works), and what stops it.',
    example: `# Threat model
## Assets
Customer PII in Postgres; API keys for payment providers.
## Trust boundaries
Public API, admin console, webhook endpoint.
## Threats and mitigations
| Threat | Mitigation |
|---|---|
| Forged webhook | Signature verification |`,
  },
});
