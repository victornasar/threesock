import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { stores } from '../lib/datastores.js';
import { blockName, TF_SCANNER_NOTE } from '../lib/terraform.js';

// [attribute, value that means encrypted]. Stores encrypted by default (S3 since 2023, DynamoDB, GCP) are not listed.
const REQUIRED: Record<string, [string, string]> = {
  aws_db_instance: ['storage_encrypted', 'true'],
  aws_rds_cluster: ['storage_encrypted', 'true'],
  aws_docdb_cluster: ['storage_encrypted', 'true'],
  aws_neptune_cluster: ['storage_encrypted', 'true'],
  aws_ebs_volume: ['encrypted', 'true'],
  aws_efs_file_system: ['encrypted', 'true'],
  aws_redshift_cluster: ['encrypted', 'true'],
  aws_elasticache_replication_group: ['at_rest_encryption_enabled', 'true'],
};

export const encryptionAtRest: Rule = {
  id: 'c1.1/encryption-at-rest',
  criterion: 'C1.1',
  title: 'Data stores are encrypted at rest',
  tags: ['CONFIG'],
  severity: 'high',
  redFlag: true,
  checks: ['Encryption at rest with managed keys'],
  expected:
    'Every database, volume, file system and cache is encrypted at rest, preferably with managed KMS keys.',
  risk: 'Unencrypted storage exposes data through snapshots, decommissioned disks and backup copies.',
  remediation: {
    summary:
      'Enable encryption at rest on every data store (it usually requires a replacement for existing RDS instances: snapshot, copy encrypted, restore).',
    example: `resource "aws_db_instance" "main" {
  storage_encrypted = true
  kms_key_id        = aws_kms_key.data.arn
}`,
  },
  detect(ctx) {
    const all = stores(ctx.files);
    if (all.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No data store resources found in Terraform.',
      };
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    for (const r of all) {
      const req = REQUIRED[r.labels[0] ?? ''];
      if (!req) {
        evidence.push({
          kind: 'file',
          path: r.path,
          line: r.line,
          description: `${blockName(r)} is encrypted at rest by the provider by default.`,
        });
        continue;
      }
      const [attr, want] = req;
      if (r.attrs[attr] === want)
        evidence.push({
          kind: 'file',
          path: r.path,
          line: r.line,
          description: `${blockName(r)} sets ${attr} = ${want} (${TF_SCANNER_NOTE}).`,
        });
      else
        findings.push({
          path: r.path,
          line: r.line,
          title: `Unencrypted data store: ${blockName(r)}`,
          observed: `${blockName(r)} does not set ${attr} = ${want} (${TF_SCANNER_NOTE}).`,
          key: blockName(r),
        });
    }
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence: evidence.slice(0, 8) };
  },
};
