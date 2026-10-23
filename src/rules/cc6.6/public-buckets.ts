import type { RawFinding, Rule } from '../../engine/types.js';
import { blockName, listValues, resources, TF_SCANNER_NOTE } from '../lib/terraform.js';
import { lineAt } from '../util.js';

const PUBLIC_ACL = /public-read(?:-write)?|authenticated-read/;
const PUBLIC_MEMBER = /allUsers|allAuthenticatedUsers/;
const BLOCK_FLAGS = [
  'block_public_acls',
  'block_public_policy',
  'ignore_public_acls',
  'restrict_public_buckets',
];

export const publicBuckets: Rule = {
  id: 'cc6.6/public-buckets',
  criterion: 'CC6.6',
  title: 'Storage buckets are not public',
  tags: ['CONFIG'],
  severity: 'critical',
  redFlag: true,
  checks: ['Databases and internal services sit in private subnets'],
  expected:
    'Object storage is private by default, with public access blocks enabled; public content is served through a CDN with origin access control.',
  risk: 'Public buckets are one of the most common causes of large data exposures and are discovered by automated scanners.',
  remediation: {
    summary:
      'Remove public ACLs and allUsers bindings, enable the public access block, and serve intentionally public assets through a CDN with origin access control.',
    example: `resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`,
  },
  detect(ctx) {
    const buckets = resources(
      ctx.files,
      /^(?:aws_s3_bucket(?:_acl|_public_access_block)?|google_storage_bucket(?:_iam_member|_iam_binding|_acl)?)$/,
    );
    const cfn = ctx.files.files.filter(
      (f) =>
        /\.(?:ya?ml|json)$/.test(f.path) && /AWS::S3::Bucket/.test(ctx.files.read(f.path) ?? ''),
    );
    if (buckets.length === 0 && cfn.length === 0) {
      return {
        status: 'not_applicable',
        justification: 'No storage bucket resources found in Terraform or CloudFormation.',
      };
    }
    const findings: RawFinding[] = [];
    const add = (
      path: string,
      line: number,
      title: string,
      observed: string,
      severity: 'critical' | 'high',
    ) => findings.push({ path, line, title, observed, severity, key: `${title}:${observed}` });
    for (const r of buckets) {
      const type = r.labels[0] ?? '';
      if (PUBLIC_ACL.test(r.attrs.acl ?? ''))
        add(
          r.path,
          r.line,
          `Public bucket ACL on ${blockName(r)}`,
          `${blockName(r)} sets acl = "${r.attrs.acl}" (${TF_SCANNER_NOTE}).`,
          'critical',
        );
      if (type === 'aws_s3_bucket_public_access_block') {
        const off = BLOCK_FLAGS.filter((k) => /^false$/i.test(r.attrs[k] ?? ''));
        if (off.length)
          add(
            r.path,
            r.line,
            `Public access block disabled on ${blockName(r)}`,
            `${blockName(r)} sets ${off.join(', ')} to false (${TF_SCANNER_NOTE}).`,
            'high',
          );
      }
      const members = [
        r.attrs.member ?? '',
        r.attrs.entity ?? '',
        ...listValues(r.attrs.members),
        ...listValues(r.attrs.role_entity),
      ];
      if (members.some((m) => PUBLIC_MEMBER.test(m)))
        add(
          r.path,
          r.line,
          `Bucket readable by anyone: ${blockName(r)}`,
          `${blockName(r)} grants access to allUsers or allAuthenticatedUsers (${TF_SCANNER_NOTE}).`,
          'critical',
        );
    }
    for (const f of cfn) {
      const text = ctx.files.read(f.path) ?? '';
      for (const m of text.matchAll(
        /"?AccessControl"?\s*:\s*["']?(PublicRead(?:Write)?|AuthenticatedRead)\b/g,
      )) {
        add(
          f.path,
          lineAt(text, m.index),
          'Public bucket ACL (CloudFormation)',
          `AccessControl is ${m[1]} in ${f.path}.`,
          'critical',
        );
      }
    }
    if (findings.length) return { status: 'fail', findings };
    return {
      status: 'pass',
      evidence: [
        ...buckets.slice(0, 5).map((r) => ({
          kind: 'file' as const,
          path: r.path,
          line: r.line,
          description: `${blockName(r)} has no public ACL or public member (${TF_SCANNER_NOTE}).`,
        })),
        ...cfn.map((f) => ({
          kind: 'file' as const,
          path: f.path,
          description: 'CloudFormation buckets set no public AccessControl.',
        })),
      ],
    };
  },
};
