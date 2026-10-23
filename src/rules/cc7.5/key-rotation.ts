import { docRule } from '../lib/doc-rule.js';

export const keyRotation = docRule({
  id: 'cc7.5/key-rotation',
  criterion: 'CC7.5',
  title: 'A secret and key rotation procedure is documented',
  severity: 'medium',
  redFlag: false,
  checks: ['Secret and credential rotation procedure exists'],
  noun: 'key rotation procedure',
  find: /rotat|secrets?[- _]?management|credential|access[- _]?management/i,
  sections: [
    {
      name: 'what is rotated',
      re: /(?:keys?|secrets?|credentials?|tokens?)[^\n]{0,80}rotat|rotat[^\n]{0,80}(?:keys?|secrets?|credentials?|tokens?)/i,
    },
    {
      name: 'when (schedule or trigger)',
      re: /every \d+|\b\d+\s*days?\b|quarterly|annually|on (?:exposure|departure|compromise)|personnel change|leav(?:es|ing)/i,
    },
  ],
  expected:
    'A procedure says which secrets and keys are rotated, how, on what schedule, and on exposure or personnel change.',
  risk: 'Unrotated credentials stay valid long after they leak or their holder leaves.',
  remediation: {
    summary:
      'Document each secret, where it lives, how to rotate it, and when (≤ 90 days, or on exposure or departure).',
    example: `## Rotating secrets
| Secret | Where | How | When |
|---|---|---|---|
| Database password | AWS Secrets Manager | Automatic rotation Lambda | Every 30 days |`,
  },
});
