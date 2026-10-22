import type { RawFinding, Rule } from '../../engine/types.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { lineAt, plural } from '../util.js';

const IAM_FILE = /\.(?:tf|json|ya?ml)$/;
const SKIP = /(?:^|\/)(?:package(?:-lock)?\.json|tsconfig[^/]*\.json|pnpm-lock\.yaml)$|^\.github\//;
const HAS_IAM =
  /aws_iam_|"Statement"|\bStatement:|AWS::IAM::|google_project_iam|roles\/owner|roleRef:/;

const PATTERNS: { re: RegExp; label: string; severity: 'high' | 'medium'; redFlag: boolean }[] = [
  {
    re: /(?:"Action"|\bactions|\bAction|\bnot_actions)\s*[:=]\s*\[?\s*["']\*["']/g,
    label: 'IAM policy allows every action ("*")',
    severity: 'high',
    redFlag: true,
  },
  {
    re: /\bAction:\s*\n\s*-\s*["']?\*["']?\s*$/gm,
    label: 'IAM policy allows every action ("*")',
    severity: 'high',
    redFlag: true,
  },
  {
    re: /\brole\s*=\s*"roles\/(?:owner|editor)"/g,
    label: 'Primitive GCP owner/editor role granted',
    severity: 'high',
    redFlag: true,
  },
  {
    re: /(?:"Action"|\bactions|\bAction)\s*[:=][^\n]*["'][a-z0-9-]+:\*["']/g,
    label: 'IAM policy allows every action of a service ("service:*")',
    severity: 'medium',
    redFlag: false,
  },
];

export const iamWildcard: Rule = {
  id: 'cc6.1/iam-wildcard',
  criterion: 'CC6.1',
  title: 'IAM policies avoid wildcard actions',
  tags: ['CONFIG'],
  severity: 'high',
  checks: ['**Least privilege:**'],
  expected:
    'IAM roles and policies grant specific actions on specific resources; no "*" actions and no primitive owner/editor roles.',
  risk: 'A wildcard policy turns any compromise of that identity into full control of the account.',
  remediation: {
    summary:
      'Replace wildcards with the specific actions the workload needs. IAM Access Analyzer or CloudTrail-based policy generation can produce a least-privilege policy from real usage.',
    example: `data "aws_iam_policy_document" "app" {
  statement {
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["\${aws_s3_bucket.uploads.arn}/*"]
  }
}`,
  },
  detect(ctx) {
    const files = ctx.files.files.filter(
      (f) =>
        IAM_FILE.test(f.path) && !SKIP.test(f.path) && !isTestPath(f.path) && !isVendored(f.path),
    );
    const iamFiles = files.filter((f) => HAS_IAM.test(ctx.files.read(f.path) ?? ''));
    if (iamFiles.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No IAM policies or role bindings found in infrastructure files.',
      };
    const findings: RawFinding[] = [];
    const seen = new Set<string>();
    for (const f of iamFiles) {
      const text = ctx.files.read(f.path) ?? '';
      for (const p of PATTERNS) {
        for (const m of text.matchAll(p.re)) {
          const line = lineAt(text, m.index);
          if (seen.has(`${f.path}:${line}`)) continue;
          seen.add(`${f.path}:${line}`);
          findings.push({
            path: f.path,
            line,
            title: p.label,
            observed: `${p.label} in ${f.path} at line ${line}.`,
            severity: p.severity,
            redFlag: p.redFlag,
            key: `${p.label}:${m[0]}`,
          });
        }
      }
    }
    if (findings.length) return { status: 'fail', findings };
    const total = iamFiles.length > 5 ? ` (${plural(iamFiles.length, 'file')} checked)` : '';
    return {
      status: 'pass',
      evidence: iamFiles.slice(0, 5).map((f) => ({
        kind: 'file' as const,
        path: f.path,
        description: `IAM definitions use no wildcard actions${total}.`,
      })),
    };
  },
};
