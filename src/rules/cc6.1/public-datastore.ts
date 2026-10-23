import type { RawFinding, Rule } from '../../engine/types.js';
import { blockName, listValues, resources, TF_SCANNER_NOTE } from '../lib/terraform.js';
import { lineAt } from '../util.js';

const DATASTORES =
  /^aws_(?:db_instance|rds_cluster(?:_instance)?|redshift_cluster|docdb_cluster_instance|neptune_cluster_instance|elasticache_\w+|opensearch_domain|elasticsearch_domain)$|^google_sql_database_instance$|^azurerm_(?:postgresql|mysql|mssql)_\w*server$/;

export const publicDatastore: Rule = {
  id: 'cc6.1/public-datastore',
  criterion: 'CC6.1',
  title: 'Databases are not publicly accessible',
  tags: ['CONFIG'],
  severity: 'critical',
  redFlag: true,
  checks: ['**Data stores**'],
  expected:
    'Data stores sit in private networks, are not publicly reachable, and require authentication.',
  risk: 'A publicly reachable database is one leaked or weak password away from a full data breach, and is scanned for continuously.',
  remediation: {
    summary:
      'Turn off public accessibility, place the database in private subnets, and reach it through the application, a bastion or a private endpoint.',
    example: `resource "aws_db_instance" "main" {
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.private.name
  vpc_security_group_ids = [aws_security_group.db.id]
}`,
  },
  detect(ctx) {
    const stores = resources(ctx.files, DATASTORES);
    const cfn = ctx.files.files.filter(
      (f) =>
        /\.(?:ya?ml|json)$/.test(f.path) &&
        /AWS::RDS::DB(?:Instance|Cluster)/.test(ctx.files.read(f.path) ?? ''),
    );
    if (stores.length === 0 && cfn.length === 0) {
      return {
        status: 'not_applicable',
        justification: 'No database resources found in Terraform or CloudFormation.',
      };
    }
    const findings: RawFinding[] = [];
    for (const r of stores) {
      if (/^true$/i.test(r.attrs.publicly_accessible ?? '')) {
        findings.push({
          path: r.path,
          line: r.line,
          title: `Publicly accessible database: ${blockName(r)}`,
          observed: `${blockName(r)} sets publicly_accessible = true (${TF_SCANNER_NOTE}).`,
          key: blockName(r),
        });
      }
      const networks = r.children
        .flatMap((c) => (c.kind === 'settings' ? c.children : []))
        .filter((c) => c.kind === 'ip_configuration')
        .flatMap((c) => c.children.filter((n) => n.kind === 'authorized_networks'));
      for (const n of networks) {
        if (
          ['0.0.0.0/0', '::/0'].includes(n.attrs.value ?? '') ||
          listValues(n.attrs.value).includes('0.0.0.0/0')
        ) {
          findings.push({
            path: r.path,
            line: n.line,
            title: `Database open to the internet: ${blockName(r)}`,
            observed: `${blockName(r)} authorizes 0.0.0.0/0 (${TF_SCANNER_NOTE}).`,
            key: `${blockName(r)}:authorized_networks`,
          });
        }
      }
    }
    for (const f of cfn) {
      const text = ctx.files.read(f.path) ?? '';
      for (const m of text.matchAll(/"?PubliclyAccessible"?\s*:\s*["']?true\b/gi)) {
        const line = lineAt(text, m.index);
        findings.push({
          path: f.path,
          line,
          title: 'Publicly accessible database (CloudFormation)',
          observed: `PubliclyAccessible is true in ${f.path} at line ${line}.`,
          key: `cfn:${line}`,
        });
      }
    }
    if (findings.length) return { status: 'fail', findings };
    const first = stores[0];
    return {
      status: 'pass',
      evidence: first
        ? stores.map((r) => ({
            kind: 'file' as const,
            path: r.path,
            line: r.line,
            description: `${blockName(r)} is not publicly accessible (${TF_SCANNER_NOTE}).`,
          }))
        : cfn.map((f) => ({
            kind: 'file' as const,
            path: f.path,
            description: 'CloudFormation databases do not set PubliclyAccessible.',
          })),
    };
  },
};
