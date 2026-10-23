import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { stores } from '../lib/datastores.js';
import { blockName, resources, TF_SCANNER_NOTE } from '../lib/terraform.js';

const KEYED =
  /^aws_(?:db_instance|rds_cluster|ebs_volume|efs_file_system|redshift_cluster|docdb_cluster)$/;

export const managedKeys: Rule = {
  id: 'cc6.5/managed-keys',
  criterion: 'CC6.5',
  title: 'Data stores use customer-managed keys that can be destroyed',
  tags: ['CONFIG'],
  severity: 'low',
  redFlag: false,
  checks: ['Storage is encrypted so that key destruction renders data unrecoverable'],
  expected:
    'Data stores are encrypted with customer-managed KMS keys (with a deletion window), so destroying the key renders all copies, including snapshots, unrecoverable.',
  risk: 'With provider-owned keys, decommissioned data and stray snapshots stay readable; disposal relies on finding every copy.',
  remediation: {
    summary: 'Encrypt data stores with a dedicated customer-managed KMS key with rotation enabled.',
    example: `resource "aws_kms_key" "data" {
  enable_key_rotation     = true
  deletion_window_in_days = 30
}
resource "aws_db_instance" "main" {
  kms_key_id = aws_kms_key.data.arn
}`,
  },
  detect(ctx) {
    const keyed = stores(ctx.files, KEYED);
    if (keyed.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No AWS data stores that take a KMS key were found in Terraform.',
      };
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    for (const r of keyed) {
      if (r.attrs.kms_key_id)
        evidence.push({
          kind: 'file',
          path: r.path,
          line: r.line,
          description: `${blockName(r)} uses a customer-managed key (${TF_SCANNER_NOTE}).`,
        });
      else
        findings.push({
          path: r.path,
          line: r.line,
          title: `No customer-managed key for ${blockName(r)}`,
          observed: `${blockName(r)} does not set kms_key_id (${TF_SCANNER_NOTE}).`,
          key: blockName(r),
        });
    }
    const keys = resources(ctx.files, 'aws_kms_key');
    for (const k of keys) {
      if (k.attrs.enable_key_rotation !== 'true')
        findings.push({
          path: k.path,
          line: k.line,
          title: `KMS key without rotation: ${blockName(k)}`,
          observed: `${blockName(k)} does not enable key rotation (${TF_SCANNER_NOTE}).`,
          key: blockName(k),
        });
    }
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence };
  },
};
