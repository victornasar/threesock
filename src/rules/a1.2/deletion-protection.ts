import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { stores } from '../lib/datastores.js';
import { blockName, TF_SCANNER_NOTE } from '../lib/terraform.js';

export const deletionProtection: Rule = {
  id: 'a1.2/deletion-protection',
  criterion: 'A1.2',
  title: 'Databases have deletion protection',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['immutability or deletion protection enabled'],
  expected:
    'Production databases enable deletion protection so a mistaken apply or console click cannot drop them.',
  risk: 'One bad `terraform apply` or a compromised credential deletes the database outright.',
  remediation: {
    summary:
      'Enable deletion protection on databases (and turn it off deliberately when decommissioning).',
    example: `resource "aws_db_instance" "main" {
  deletion_protection = true
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
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    for (const r of dbs) {
      const attr =
        r.labels[0] === 'aws_dynamodb_table'
          ? 'deletion_protection_enabled'
          : 'deletion_protection';
      const value = r.attrs[attr];
      // google_sql_database_instance defaults to protected; AWS defaults to unprotected.
      const on =
        value === 'true' || (value === undefined && r.labels[0] === 'google_sql_database_instance');
      if (on)
        evidence.push({
          kind: 'file',
          path: r.path,
          line: r.line,
          description: `${blockName(r)} is deletion-protected (${TF_SCANNER_NOTE}).`,
        });
      else
        findings.push({
          path: r.path,
          line: r.line,
          title: `No deletion protection on ${blockName(r)}`,
          observed: `${blockName(r)} ${value === 'false' ? `sets ${attr} = false` : `does not set ${attr}`} (${TF_SCANNER_NOTE}).`,
          key: blockName(r),
        });
    }
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence };
  },
};
