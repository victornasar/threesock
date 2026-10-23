import { codePathRule } from '../lib/code-path.js';

export const dataExport = codePathRule({
  id: 'p5.1/data-export',
  criterion: 'P5.1',
  title: 'Data subjects can get a copy of their data',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['Self-service or request-based access/export endpoint exists'],
  expected:
    "An authenticated export (self-service or support-driven) returns a subject's personal data in a machine-readable format.",
  risk: 'Access requests cannot be answered within the legal deadline (often 30 days) without tooling to gather the data.',
  remediation: {
    summary:
      "Add an authenticated export that gathers the subject's data from every store into JSON, and track requests with a response deadline.",
    example: `app.get('/me/export', requireAuth, async (req, res) => res.json(await dsar.export(req.user.id)));`,
  },
  present:
    /export_?(?:user|my|account|personal)_?data|exportUserData|exportData|exportAccount|data[-_]?export|\bdsar\b|subject[-_ ]access|takeout|download[-_ ]?my[-_ ]?data|['"`]\/(?:api\/)?(?:v\d\/)?me\/export/i,
  found: 'A personal data export path exists',
  missing: 'No personal data export path',
});
