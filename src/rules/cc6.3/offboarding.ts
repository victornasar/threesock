import { docRule } from '../lib/doc-rule.js';

export const offboarding = docRule({
  id: 'cc6.3/offboarding',
  criterion: 'CC6.3',
  title: 'An offboarding procedure revokes access within a deadline',
  severity: 'medium',
  redFlag: false,
  checks: ['Offboarding procedure revokes'],
  noun: 'offboarding procedure',
  find: /offboard|access[- _]?management|leavers?|joiners?/i,
  sections: [
    {
      name: 'access revocation',
      re: /revok|remov(?:e|ing) (?:access|from)|deprovision|disable (?:accounts?|access)/i,
    },
    {
      name: 'systems covered (SSO, source control, cloud, CI)',
      re: /(?:SSO|identity provider|GitHub|GitLab|source control|VCS)[\s\S]{0,400}(?:cloud|AWS|GCP|Azure|CI|npm|registry)/i,
    },
    { name: 'deadline', re: /within \d+|\b\d+\s*(?:h|hours?|business days?|days?)\b|same day/i },
  ],
  expected:
    'Offboarding revokes SSO, source control, cloud, CI/CD and vendor access within a set deadline (≤ 24h).',
  risk: 'Departed staff and contractors keep working credentials, a common source of incidents and an audit finding.',
  remediation: {
    summary:
      'Document an offboarding checklist covering every system with access, and the deadline for completing it.',
    example: `## Offboarding (within 24 hours)
- [ ] Disable SSO account (cascades to apps via SCIM)
- [ ] Remove from GitHub org and npm org
- [ ] Revoke personal cloud credentials and tokens`,
  },
});
