import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { blockName, resources, TF_SCANNER_NOTE } from '../lib/terraform.js';

export const lifecycleRules: Rule = {
  id: 'c1.2/lifecycle-rules',
  criterion: 'C1.2',
  title: 'Retention is enforced by lifecycle rules and TTLs',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Automated deletion (TTLs, lifecycle policies, purge jobs) enforces retention'],
  expected:
    'Buckets have lifecycle expiration, log groups have a retention period, and ephemeral tables use TTLs.',
  risk: 'Without automated deletion, data (and logs full of it) accumulates forever, enlarging every breach.',
  remediation: {
    summary:
      'Add lifecycle expiration to buckets and retention_in_days to log groups, matching your retention schedule.',
    example: `resource "aws_s3_bucket_lifecycle_configuration" "exports" {
  bucket = aws_s3_bucket.exports.id
  rule {
    id     = "expire-exports"
    status = "Enabled"
    expiration { days = 30 }
  }
}`,
  },
  detect(ctx) {
    const buckets = resources(ctx.files, 'aws_s3_bucket');
    const gcsBuckets = resources(ctx.files, 'google_storage_bucket');
    const logGroups = resources(ctx.files, 'aws_cloudwatch_log_group');
    if (buckets.length + gcsBuckets.length + logGroups.length === 0) {
      return {
        status: 'not_applicable',
        justification: 'No buckets or log groups found in Terraform.',
      };
    }
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    const lifecycles = resources(ctx.files, 'aws_s3_bucket_lifecycle_configuration');
    for (const b of buckets) {
      const configured =
        lifecycles.some((l) => (l.attrs.bucket ?? '').includes(b.labels[1] ?? '\u0000')) ||
        b.children.some((c) => c.kind === 'lifecycle_rule');
      if (configured)
        evidence.push({
          kind: 'file',
          path: b.path,
          line: b.line,
          description: `${blockName(b)} has lifecycle rules (${TF_SCANNER_NOTE}).`,
        });
      else
        findings.push({
          path: b.path,
          line: b.line,
          severity: 'low',
          title: `No lifecycle rule for ${blockName(b)}`,
          observed: `${blockName(b)} has no lifecycle configuration, so objects are kept forever (${TF_SCANNER_NOTE}).`,
          key: blockName(b),
        });
    }
    for (const b of gcsBuckets) {
      if (b.children.some((c) => c.kind === 'lifecycle_rule'))
        evidence.push({
          kind: 'file',
          path: b.path,
          line: b.line,
          description: `${blockName(b)} has lifecycle rules.`,
        });
      else
        findings.push({
          path: b.path,
          line: b.line,
          severity: 'low',
          title: `No lifecycle rule for ${blockName(b)}`,
          observed: `${blockName(b)} has no lifecycle_rule (${TF_SCANNER_NOTE}).`,
          key: blockName(b),
        });
    }
    for (const g of logGroups) {
      const days = g.attrs.retention_in_days;
      if (days && days !== '0')
        evidence.push({
          kind: 'file',
          path: g.path,
          line: g.line,
          description: `${blockName(g)} retains logs for ${days} days.`,
        });
      else
        findings.push({
          path: g.path,
          line: g.line,
          title: `Log group kept forever: ${blockName(g)}`,
          observed: `${blockName(g)} sets no retention_in_days, so logs never expire (${TF_SCANNER_NOTE}).`,
          key: blockName(g),
        });
    }
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence };
  },
};
