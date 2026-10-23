import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { nested, stores } from '../lib/datastores.js';
import { blockName, TF_SCANNER_NOTE } from '../lib/terraform.js';

export const multiAz: Rule = {
  id: 'a1.2/multi-az',
  criterion: 'A1.2',
  title: 'Critical data stores are deployed across availability zones',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Multi-AZ'],
  expected: 'Databases and caches run in more than one availability zone with automatic failover.',
  risk: 'A single-zone failure takes the database down until the zone recovers.',
  remediation: {
    summary:
      'Enable Multi-AZ (RDS), automatic failover (ElastiCache) or regional availability (Cloud SQL).',
    example: `resource "aws_db_instance" "main" {
  multi_az = true
}`,
  },
  detect(ctx) {
    const dbs = stores(
      ctx.files,
      /^aws_db_instance$|^aws_elasticache_replication_group$|^google_sql_database_instance$/,
    );
    if (dbs.length === 0)
      return {
        status: 'not_applicable',
        justification:
          'No single-instance database or cache resources found in Terraform (Aurora and DynamoDB are multi-AZ by design).',
      };
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    for (const r of dbs) {
      const type = r.labels[0];
      const ok =
        type === 'aws_db_instance'
          ? r.attrs.multi_az === 'true'
          : type === 'aws_elasticache_replication_group'
            ? r.attrs.automatic_failover_enabled === 'true'
            : (nested(r, 'settings')?.attrs.availability_type ?? '') === 'REGIONAL';
      if (ok)
        evidence.push({
          kind: 'file',
          path: r.path,
          line: r.line,
          description: `${blockName(r)} spans availability zones (${TF_SCANNER_NOTE}).`,
        });
      else
        findings.push({
          path: r.path,
          line: r.line,
          title: `Single-zone data store: ${blockName(r)}`,
          observed: `${blockName(r)} is not configured for multi-AZ failover (${TF_SCANNER_NOTE}).`,
          key: blockName(r),
        });
    }
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence };
  },
};
