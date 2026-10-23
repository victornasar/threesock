import { codePathRule } from '../lib/code-path.js';

export const retentionJobs = codePathRule({
  id: 'p4.2/retention-jobs',
  criterion: 'P4.2',
  title: 'Retention is enforced by purge jobs or TTLs',
  tags: ['CODE', 'CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['TTLs/purge jobs implemented and monitored'],
  expected:
    'Personal data past its retention period is removed automatically by scheduled purge jobs, TTL indexes or lifecycle rules.',
  risk: 'Without automated deletion, personal data accumulates past its purpose, breaching the privacy notice and enlarging every breach.',
  remediation: {
    summary:
      'Add a scheduled job (or TTL index) that deletes or anonymizes personal data once its retention period ends, and alert if it fails.',
    example: `// nightly
await db.query("DELETE FROM sessions WHERE created_at < now() - interval '90 days'");`,
  },
  present:
    /purge|retention|expireAfterSeconds|\bttl\b|time_to_live|DELETE FROM\b[^;\n]*\b(?:created_at|updated_at|last_seen|expires_at)\s*</i,
  found: 'A purge job, TTL or retention routine exists',
  missing: 'No retention purge job or TTL',
});
