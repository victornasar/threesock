import { docRule } from '../lib/doc-rule.js';

export const rtoRpo = docRule({
  id: 'a1.3/rto-rpo',
  criterion: 'A1.3',
  title: 'RTO and RPO are defined',
  severity: 'medium',
  redFlag: false,
  checks: ['RTO and RPO defined per system'],
  noun: 'recovery objectives (RTO/RPO)',
  find: /continuity|disaster[- _]?recovery|recovery|\bRTO\b|backup/i,
  sections: [
    { name: 'RTO', re: /\bRTO\b|recovery time objective/i },
    { name: 'RPO', re: /\bRPO\b|recovery point objective/i },
  ],
  expected: 'Recovery time and recovery point objectives are defined for each system.',
  risk: 'Without objectives, nobody can tell whether backups and failover are adequate until it is too late.',
  remediation: {
    summary:
      'Set RTO and RPO per system in the DR plan and design backups and failover to meet them.',
    example: `| System | RTO | RPO |
|---|---|---|
| API | 1 hour | 15 minutes |`,
  },
});
