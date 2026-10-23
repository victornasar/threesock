import { docRule } from '../lib/doc-rule.js';

export const continuityPlan = docRule({
  id: 'cc9.1/continuity-plan',
  criterion: 'CC9.1',
  title: 'A business continuity and disaster recovery plan covers this system',
  severity: 'medium',
  redFlag: false,
  checks: ['Business continuity and disaster recovery plans exist'],
  noun: 'business continuity / disaster recovery plan',
  find: /continuity|disaster[- _]?recovery|\bBC ?\/ ?DR\b|\bDR\b plan/i,
  sections: [
    { name: 'critical dependencies and fallbacks', re: /dependenc|single point|fallback|degrad/i },
    { name: 'recovery steps', re: /recover|restor|failover|rebuild/i },
    { name: 'provider or regional outages', re: /outage|provider|region|unavailab/i },
  ],
  expected:
    'A BC/DR plan lists critical dependencies and their fallbacks, how the system is recovered, and what happens in a provider or regional outage.',
  risk: 'A provider outage or loss of a key component turns into an improvised, extended outage.',
  remediation: {
    summary:
      'Write a short continuity plan: critical dependencies, what degrades gracefully, recovery steps, and who decides.',
    example: `## Critical dependencies
| Dependency | If unavailable |
|---|---|
| Auth provider | Existing sessions continue; new logins fail with a status banner |
## Recovery
Rebuild from IaC in the secondary region; restore the latest snapshot.`,
  },
});
