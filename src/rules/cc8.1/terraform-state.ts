import type { Rule } from '../../engine/types.js';
import { terraformBlocks, TF_SCANNER_NOTE } from '../lib/terraform.js';

export const terraformState: Rule = {
  id: 'cc8.1/terraform-state',
  criterion: 'CC8.1',
  title: 'Terraform state is remote, locked and not committed',
  tags: ['CONFIG'],
  severity: 'high',
  checks: ['IaC changes go through plan/review/apply'],
  expected:
    'Terraform state lives in a remote, locked, access-controlled backend, and state files are never committed.',
  risk: 'State files contain secrets in plain text, and unlocked or local state lets concurrent applies corrupt infrastructure.',
  remediation: {
    summary:
      'Configure a remote backend with locking, remove committed state from git (and rotate any secrets it held), and gitignore *.tfstate.',
    example: `terraform {
  backend "s3" {
    bucket       = "acme-terraform-state"
    key          = "prod/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}`,
  },
  detect(ctx) {
    const tf = ctx.files.glob('**/*.tf');
    if (tf.length === 0)
      return { status: 'not_applicable', justification: 'No Terraform files found.' };
    const state = ctx.files.files.filter((f) => /\.tfstate(?:\.backup)?$/.test(f.path));
    if (state.length) {
      return {
        status: 'fail',
        findings: state.map((f) => ({
          path: f.path,
          severity: 'critical' as const,
          title: `Terraform state committed: ${f.path}`,
          observed: `${f.path} is ${f.tracked ? 'tracked by git' : 'present and not gitignored'}; state files hold resource attributes and secrets in plain text.`,
          key: f.path,
        })),
      };
    }
    const backends = terraformBlocks(ctx.files)
      .filter((b) => b.kind === 'terraform')
      .flatMap((t) => t.children.filter((c) => c.kind === 'backend' || c.kind === 'cloud'));
    const backend = backends[0];
    if (!backend) {
      return {
        status: 'fail',
        findings: [
          {
            title: 'Terraform uses local state',
            observed: `No backend or cloud block was found in ${tf.length} Terraform file(s) (${TF_SCANNER_NOTE}), so state is local to whoever runs apply.`,
            key: 'local',
          },
        ],
      };
    }
    const type = backend.kind === 'cloud' ? 'cloud' : (backend.labels[0] ?? '');
    if (type === 'local')
      return {
        status: 'fail',
        findings: [
          {
            path: backend.path,
            line: backend.line,
            title: 'Terraform backend is local',
            observed: `${backend.path} configures the local backend.`,
            key: 'local',
          },
        ],
      };
    if (
      type === 's3' &&
      !backend.attrs.dynamodb_table &&
      !/^true$/.test(backend.attrs.use_lockfile ?? '')
    ) {
      return {
        status: 'fail',
        findings: [
          {
            path: backend.path,
            line: backend.line,
            severity: 'medium',
            title: 'S3 backend without state locking',
            observed: `The s3 backend in ${backend.path} sets neither use_lockfile nor dynamodb_table.`,
            key: 'unlocked',
          },
        ],
      };
    }
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'file',
          path: backend.path,
          line: backend.line,
          description: `Remote ${type} backend with locking (${TF_SCANNER_NOTE}).`,
        },
      ],
    };
  },
};
