import type { RawFinding, Rule } from '../../engine/types.js';
import { lineOf, matchLines, workflows } from '../lib/workflows.js';

const LONG_LIVED =
  /secrets\.(?:AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY)|aws-(?:access-key-id|secret-access-key)\s*:|credentials_json\s*:|secrets\.(?:GCP|GOOGLE)_\w*(?:CREDENTIALS|KEY|SA_KEY)\b|secrets\.AZURE_CREDENTIALS|\bcreds\s*:\s*\$\{\{\s*secrets\./;
const CLOUD =
  /aws-actions\/configure-aws-credentials|google-github-actions\/auth|azure\/login|AWS_ACCESS_KEY_ID|GOOGLE_APPLICATION_CREDENTIALS/;
const OIDC = /role-to-assume\s*:|workload_identity_provider\s*:|client-id\s*:/;

export const cloudCredentials: Rule = {
  id: 'cc5.2/cloud-credentials',
  criterion: 'CC5.2',
  title: 'CI authenticates to clouds with OIDC, not long-lived keys',
  tags: ['CONFIG'],
  severity: 'high',
  checks: ['CI/CD hardened'],
  expected:
    'Workflows assume cloud roles through OIDC federation (id-token: write), so no long-lived cloud keys are stored as CI secrets.',
  risk: 'Long-lived cloud keys in CI leak through logs, forks and compromised actions, and stay valid until someone remembers to rotate them.',
  remediation: {
    summary:
      'Configure an OIDC trust between GitHub and your cloud, assume a scoped role in the workflow, and delete the stored keys.',
    example: `permissions:
  id-token: write
  contents: read
steps:
  - uses: aws-actions/configure-aws-credentials@<sha>  # pin to a commit SHA
    with:
      role-to-assume: arn:aws:iam::123456789012:role/deploy
      aws-region: us-east-1`,
  },
  detect(ctx) {
    const wfs = workflows(ctx.files).filter(
      (wf) => CLOUD.test(wf.text) || LONG_LIVED.test(wf.text),
    );
    if (wfs.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No workflows authenticate to AWS, GCP or Azure.',
      };
    const findings: RawFinding[] = wfs.flatMap((wf) =>
      matchLines(wf, LONG_LIVED)
        .slice(0, 1)
        .map(({ line }) => ({
          path: wf.path,
          line,
          title: `Long-lived cloud credentials in ${wf.path}`,
          observed: `${wf.path} passes stored cloud keys to the workflow (line ${line}) instead of using OIDC.`,
          key: wf.path,
        })),
    );
    if (findings.length) return { status: 'fail', findings };
    const oidc = wfs.map((wf) => ({ wf, line: lineOf(wf, OIDC) })).filter((x) => x.line);
    if (oidc.length === 0)
      return {
        status: 'unknown',
        reason:
          'Workflows use cloud actions but neither OIDC role assumption nor stored keys were recognised.',
      };
    return {
      status: 'pass',
      evidence: oidc.map(({ wf, line }) => ({
        kind: 'file' as const,
        path: wf.path,
        line,
        description: 'Cloud access uses OIDC role assumption.',
      })),
    };
  },
};
