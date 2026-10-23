import type { Rule } from '../../engine/types.js';
import { findDoc } from '../lib/docs.js';

export const restoreTests: Rule = {
  id: 'a1.3/restore-tests',
  criterion: 'A1.3',
  title: 'Backup restores and DR exercises are tested and recorded',
  tags: ['DOCS'],
  severity: 'medium',
  redFlag: false,
  checks: ['Backup restoration tested at the defined cadence'],
  expected:
    'Backup restores are tested on a schedule (quarterly for critical systems), with dated results kept.',
  risk: 'Untested backups routinely fail when needed: wrong scope, missing keys, or restores slower than the RTO.',
  remediation: {
    summary:
      'Run and record a restore test each quarter: date, what was restored, time taken, and issues found.',
    example: `## Restore test log
| Date | System | Result | Time | Follow-up |
|---|---|---|---|---|
| 2026-09-30 | Postgres | Pass | 42 min | none |`,
  },
  detect(ctx) {
    const hit = findDoc(
      ctx.files,
      /restore (?:tests?|drills?|exercises?)|backup (?:restore|recovery) tests?|(?:DR|failover|disaster recovery) (?:tests?|exercises?|drills?)/i,
    );
    if (!hit)
      return {
        status: 'fail',
        findings: [
          {
            title: 'No record of restore or DR tests',
            observed: 'No documentation of backup restore tests or DR exercises was found.',
            key: 'missing',
          },
        ],
      };
    const text = ctx.files.read(hit.path) ?? '';
    if (!/\b20\d{2}-\d{2}-\d{2}\b/.test(text)) {
      return {
        status: 'fail',
        findings: [
          {
            path: hit.path,
            severity: 'low',
            title: 'Restore tests are described but not dated',
            observed: `${hit.path} describes restore or DR testing but records no dated results.`,
            key: 'undated',
          },
        ],
      };
    }
    return {
      status: 'pass',
      evidence: [
        { kind: 'file', ...hit, description: 'Dated restore or DR test results are recorded.' },
      ],
    };
  },
};
