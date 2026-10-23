import type { Rule } from '../../engine/types.js';
import { findDoc } from '../lib/docs.js';

const SCENARIOS = [
  {
    name: 'credential leak',
    re: /(?:credential|secret|key|token)s?[^\n]{0,40}(?:leak|expos|compromis)|(?:leak|expos|compromis)[^\n]{0,40}(?:credential|secret|key|token)/i,
  },
  { name: 'data exposure', re: /data (?:exposure|breach|leak)|exposed data|personal data breach/i },
  {
    name: 'compromised dependency',
    re: /compromised (?:dependency|package|action)|supply[- ]chain (?:attack|compromise|incident)|malicious (?:package|dependency)/i,
  },
  { name: 'outage or DDoS', re: /\bddos\b|denial[- ]of[- ]service|\boutage\b/i },
];

export const incidentRunbooks: Rule = {
  id: 'cc7.4/incident-runbooks',
  criterion: 'CC7.4',
  title: 'Runbooks exist for common incident scenarios',
  tags: ['DOCS'],
  severity: 'medium',
  redFlag: false,
  checks: ['Runbooks exist for common scenarios'],
  expected:
    'Runbooks cover credential leaks, data exposure, compromised dependencies and outages/DDoS.',
  risk: 'Improvising the first steps of a credential leak or supply-chain incident costs the hours that matter most.',
  remediation: {
    summary:
      'Add a short runbook per scenario: how to detect it, contain it, eradicate it and who to tell.',
    example: `## Credential leak
1. Revoke the credential at the provider.
2. Search logs for use since the leak.
3. Rotate dependent secrets and record the incident.`,
  },
  detect(ctx) {
    const found = SCENARIOS.map((s) => ({ s, hit: findDoc(ctx.files, s.re) }));
    const missing = found.filter((f) => !f.hit).map((f) => f.s.name);
    const evidence = found.flatMap((f) =>
      f.hit ? [{ kind: 'file' as const, ...f.hit, description: `Runbook for ${f.s.name}.` }] : [],
    );
    if (missing.length === 0) return { status: 'pass', evidence };
    return {
      status: 'fail',
      evidence,
      findings: [
        {
          title: `No runbook for ${missing.join(', ')}`,
          observed: `Runbooks found for ${evidence.length} of ${SCENARIOS.length} common scenarios; missing: ${missing.join(', ')}.`,
          severity: evidence.length >= 2 ? 'low' : 'medium',
          key: missing.join(','),
        },
      ],
    };
  },
};
