import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { nested, stores } from '../lib/datastores.js';
import { blockName, resources, TF_SCANNER_NOTE } from '../lib/terraform.js';

export const backups: Rule = {
  id: 'a1.2/backups',
  criterion: 'A1.2',
  title: 'Persistent data stores have automated backups',
  tags: ['CONFIG'],
  severity: 'high',
  checks: ['Automated backups for all persistent data stores'],
  expected:
    'Every database has automated backups with a retention policy, and point-in-time recovery where supported.',
  risk: 'A bad migration, deletion or ransomware event with no backup is permanent data loss.',
  remediation: {
    summary:
      'Enable automated backups with explicit retention (and PITR), or cover the stores with an AWS Backup plan.',
    example: `resource "aws_db_instance" "main" {
  backup_retention_period = 14
}
resource "aws_dynamodb_table" "events" {
  point_in_time_recovery { enabled = true }
}`,
  },
  detect(ctx) {
    const dbs = stores(
      ctx.files,
      /^aws_(?:db_instance|rds_cluster|dynamodb_table|docdb_cluster)$|^google_sql_database_instance$/,
    );
    if (dbs.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No database resources found in Terraform.',
      };
    const plan = resources(ctx.files, 'aws_backup_plan')[0];
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = plan
      ? [
          {
            kind: 'file',
            path: plan.path,
            line: plan.line,
            description: `AWS Backup plan ${blockName(plan)} (${TF_SCANNER_NOTE}).`,
          },
        ]
      : [];
    for (const r of dbs) {
      const type = r.labels[0];
      const add = (observed: string, severity: 'high' | 'medium' | 'low') =>
        findings.push({
          path: r.path,
          line: r.line,
          severity,
          redFlag: severity === 'high',
          title: `No reliable backups for ${blockName(r)}`,
          observed: `${observed} (${TF_SCANNER_NOTE}).`,
          key: blockName(r),
        });
      if (type === 'aws_dynamodb_table') {
        if (/^true$/.test(nested(r, 'point_in_time_recovery')?.attrs.enabled ?? ''))
          evidence.push({
            kind: 'file',
            path: r.path,
            line: r.line,
            description: `${blockName(r)} has point-in-time recovery.`,
          });
        else if (!plan)
          add(`${blockName(r)} has no point-in-time recovery and no backup plan`, 'medium');
      } else if (type === 'google_sql_database_instance') {
        if (/^true$/.test(nested(r, 'settings', 'backup_configuration')?.attrs.enabled ?? ''))
          evidence.push({
            kind: 'file',
            path: r.path,
            line: r.line,
            description: `${blockName(r)} has automated backups.`,
          });
        else add(`${blockName(r)} does not enable backup_configuration`, 'high');
      } else {
        const days = r.attrs.backup_retention_period;
        if (days === '0') add(`${blockName(r)} sets backup_retention_period = 0`, 'high');
        else if (days === undefined && !plan)
          add(`${blockName(r)} relies on the provider default backup retention (1 day)`, 'low');
        else
          evidence.push({
            kind: 'file',
            path: r.path,
            line: r.line,
            description: `${blockName(r)} keeps backups${days ? ` for ${days} days` : ' under the backup plan'}.`,
          });
      }
    }
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence };
  },
};
