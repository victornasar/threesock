import type { RawFinding, Rule, Severity } from '../../engine/types.js';
import { parse } from 'yaml';
import {
  blockName,
  listValues,
  resources,
  TF_SCANNER_NOTE,
  type TfBlock,
} from '../lib/terraform.js';

const ADMIN_PORTS: Record<number, string> = {
  22: 'SSH',
  23: 'Telnet',
  3389: 'RDP',
  5985: 'WinRM',
  5986: 'WinRM',
};
const DATA_PORTS: Record<number, string> = {
  5432: 'PostgreSQL',
  3306: 'MySQL',
  1433: 'SQL Server',
  1521: 'Oracle',
  6379: 'Redis',
  27017: 'MongoDB',
  9200: 'Elasticsearch',
  9300: 'Elasticsearch',
  5984: 'CouchDB',
  11211: 'Memcached',
  2379: 'etcd',
};
const WORLD = ['0.0.0.0/0', '::/0'];

/** Worst exposure for a port range open to the world, or undefined if only safe ports. */
export function exposure(
  from: number,
  to: number,
  allProtocols = false,
): { severity: Severity; what: string } | undefined {
  if (allProtocols || (from <= 0 && to >= 65535))
    return { severity: 'critical', what: 'all ports' };
  const hit = (map: Record<number, string>) =>
    Object.entries(map)
      .filter(([p]) => Number(p) >= from && Number(p) <= to)
      .map(([p, n]) => `${n} (${p})`);
  const data = hit(DATA_PORTS);
  if (data.length) return { severity: 'critical', what: data.join(', ') };
  const admin = hit(ADMIN_PORTS);
  if (admin.length) return { severity: 'high', what: admin.join(', ') };
  return undefined;
}

interface IngressRule {
  line: number;
  cidrs: string[];
  from: number;
  to: number;
  all: boolean;
}

function tfRules(r: TfBlock): IngressRule[] {
  const toRule = (b: TfBlock, cidrAttrs: string[]): IngressRule => ({
    line: b.line,
    cidrs: cidrAttrs.flatMap((a) => [
      ...listValues(b.attrs[a]),
      ...(b.attrs[a] && !b.attrs[a].startsWith('[') ? [b.attrs[a]] : []),
    ]),
    from: Number(b.attrs.from_port ?? b.attrs.port ?? 0),
    to: Number(b.attrs.to_port ?? b.attrs.port ?? 65535),
    all: ['-1', 'all'].includes((b.attrs.protocol ?? b.attrs.ip_protocol ?? '').replace(/"/g, '')),
  });
  if (r.labels[0] === 'aws_security_group')
    return r.children
      .filter((c) => c.kind === 'ingress')
      .map((c) => toRule(c, ['cidr_blocks', 'ipv6_cidr_blocks']));
  if (r.labels[0] === 'aws_security_group_rule')
    return r.attrs.type?.includes('ingress')
      ? [toRule(r, ['cidr_blocks', 'ipv6_cidr_blocks'])]
      : [];
  if (r.labels[0] === 'aws_vpc_security_group_ingress_rule')
    return [toRule(r, ['cidr_ipv4', 'cidr_ipv6'])];
  if (r.labels[0] === 'google_compute_firewall') {
    if ((r.attrs.direction ?? 'INGRESS').includes('EGRESS')) return [];
    const cidrs = listValues(r.attrs.source_ranges);
    return r.children
      .filter((c) => c.kind === 'allow')
      .flatMap((a): IngressRule[] => {
        const ports = listValues(a.attrs.ports);
        const all = (a.attrs.protocol ?? '') === 'all' || ports.length === 0;
        return all
          ? [{ line: a.line, cidrs, from: 0, to: 65535, all: true }]
          : ports.map((p) => {
              const [lo, hi] = p.split('-').map(Number);
              return { line: a.line, cidrs, from: lo ?? 0, to: hi ?? lo ?? 0, all: false };
            });
      });
  }
  return [];
}

/** Walks a parsed CloudFormation document for ingress entries. */
function cfnIngress(
  node: unknown,
  out: { cidr: string; from: number; to: number; all: boolean }[] = [],
) {
  if (Array.isArray(node)) node.forEach((n) => cfnIngress(n, out));
  else if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    const cidr = (o.CidrIp ?? o.CidrIpv6) as unknown;
    if (typeof cidr === 'string' && (o.FromPort !== undefined || o.IpProtocol !== undefined)) {
      out.push({
        cidr,
        from: Number(o.FromPort ?? 0),
        to: Number(o.ToPort ?? 65535),
        all: String(o.IpProtocol) === '-1',
      });
    }
    Object.values(o).forEach((v) => cfnIngress(v, out));
  }
  return out;
}

export const openAdminPorts: Rule = {
  id: 'cc6.6/open-admin-ports',
  criterion: 'CC6.6',
  title: 'Admin and database ports are not open to the internet',
  tags: ['CONFIG'],
  severity: 'high',
  redFlag: true,
  checks: ['Security groups/firewall rules avoid'],
  expected:
    'Firewall rules never allow 0.0.0.0/0 or ::/0 to admin ports (SSH, RDP) or data ports (PostgreSQL, MySQL, Redis, MongoDB, ...).',
  risk: 'Internet-exposed admin and database ports are scanned constantly and are a leading entry point for breaches and ransomware.',
  remediation: {
    summary:
      'Restrict ingress to known CIDRs or security groups, and reach admin interfaces through a VPN, bastion, SSM Session Manager or an identity-aware proxy.',
    example: `ingress {
  from_port       = 5432
  to_port         = 5432
  protocol        = "tcp"
  security_groups = [aws_security_group.app.id]  # not 0.0.0.0/0
}`,
  },
  detect(ctx) {
    const groups = resources(
      ctx.files,
      /^(?:aws_security_group(?:_rule)?|aws_vpc_security_group_ingress_rule|google_compute_firewall)$/,
    );
    const cfnFiles = ctx.files.files.filter(
      (f) =>
        /\.(?:ya?ml|json)$/.test(f.path) &&
        /AWS::EC2::SecurityGroup/.test(ctx.files.read(f.path) ?? ''),
    );
    if (groups.length === 0 && cfnFiles.length === 0) {
      return {
        status: 'not_applicable',
        justification:
          'No security group or firewall resources found in Terraform or CloudFormation.',
      };
    }
    const findings: RawFinding[] = [];
    for (const r of groups) {
      for (const rule of tfRules(r)) {
        if (!rule.cidrs.some((c) => WORLD.includes(c))) continue;
        const exp = exposure(rule.from, rule.to, rule.all);
        if (!exp) continue;
        findings.push({
          path: r.path,
          line: rule.line,
          severity: exp.severity,
          title: `${exp.what} open to the internet in ${blockName(r)}`,
          observed: `${blockName(r)} allows ingress from 0.0.0.0/0 to ${exp.what} (${TF_SCANNER_NOTE}).`,
          key: `${blockName(r)}:${rule.from}-${rule.to}`,
        });
      }
    }
    for (const f of cfnFiles) {
      let doc: unknown;
      try {
        // CloudFormation short-form tags (!Ref, !Sub) parse as plain values with warnings silenced.
        doc = parse(ctx.files.read(f.path) ?? '', { logLevel: 'silent' });
      } catch {
        continue;
      }
      for (const rule of cfnIngress(doc)) {
        if (!WORLD.includes(rule.cidr)) continue;
        const exp = exposure(rule.from, rule.to, rule.all);
        if (exp)
          findings.push({
            path: f.path,
            severity: exp.severity,
            title: `${exp.what} open to the internet (CloudFormation)`,
            observed: `${f.path} allows ingress from ${rule.cidr} to ${exp.what}.`,
            key: `cfn:${rule.from}-${rule.to}`,
          });
      }
    }
    if (findings.length) return { status: 'fail', findings };
    return {
      status: 'pass',
      evidence: [
        ...groups.slice(0, 5).map((r) => ({
          kind: 'file' as const,
          path: r.path,
          line: r.line,
          description: `${blockName(r)} exposes no admin or data ports to the internet (${TF_SCANNER_NOTE}).`,
        })),
        ...cfnFiles.map((f) => ({
          kind: 'file' as const,
          path: f.path,
          description:
            'CloudFormation security groups expose no admin or data ports to the internet.',
        })),
      ],
    };
  },
};
