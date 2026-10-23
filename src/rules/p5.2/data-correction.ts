import { codePathRule } from '../lib/code-path.js';

export const dataCorrection = codePathRule({
  id: 'p5.2/data-correction',
  criterion: 'P5.2',
  title: 'Data subjects can correct their data',
  tags: ['CODE'],
  severity: 'low',
  redFlag: false,
  checks: ['Users can update or request correction of their data'],
  expected:
    'Users can update their own personal data (profile or account settings), or request correction through support tooling.',
  risk: 'Inaccurate personal data cannot be corrected on request, and errors propagate to downstream systems.',
  remediation: {
    summary:
      'Provide an authenticated profile update (with validation and an audit trail) and propagate changes to downstream systems.',
    example: `app.patch('/me', requireAuth, async (req, res) => res.json(await users.update(req.user.id, ProfileSchema.parse(req.body))));`,
  },
  present:
    /update_?(?:profile|account|me|user)|updateProfile|updateAccount|updateMe|updateUser|\.(?:patch|put)\(\s*['"`]\/(?:api\/)?(?:v\d\/)?(?:me|account|profile|users\/:\w+)['"`]|@(?:app|router)\.(?:patch|put)\(\s*['"]\/(?:me|account|profile)/i,
  found: 'A profile or account update path exists',
  missing: 'No profile or account update path',
});
