import type { Rule } from '../../engine/types.js';
import { matchLines, workflows } from '../lib/workflows.js';
import { absence } from '../util.js';

export const secretsInLogs: Rule = {
  id: 'cc5.2/secrets-in-logs',
  criterion: 'CC5.2',
  title: 'Secrets are never echoed in CI logs',
  tags: ['CONFIG'],
  severity: 'high',
  redFlag: false,
  checks: ['CI/CD hardened'],
  expected:
    'Workflows never print secrets; they pass them to tools through environment variables or files.',
  risk: 'Masking is best-effort: transformed or partial values slip through, and logs are readable by everyone with repository read access.',
  remediation: {
    summary:
      'Remove the echo. Pass the secret through env and let the tool read it, or write it to a file with restricted permissions.',
    example: `- run: ./deploy.sh
  env:
    DEPLOY_TOKEN: \${{ secrets.DEPLOY_TOKEN }}`,
  },
  detect(ctx) {
    const wfs = workflows(ctx.files);
    if (wfs.length === 0)
      return { status: 'not_applicable', justification: 'No GitHub Actions workflows found.' };
    const findings = wfs.flatMap((wf) =>
      matchLines(
        wf,
        /\b(?:echo|printf|cat\s*<<<|Write-(?:Host|Output))\b[^\n]*\$\{\{\s*secrets\./,
      ).map(({ line }) => ({
        path: wf.path,
        line,
        title: `Secret printed in ${wf.path}`,
        observed: `A run step prints a secret in ${wf.path} at line ${line}.`,
        key: String(line),
      })),
    );
    if (findings.length) return { status: 'fail', findings };
    return absence(`Checked ${wfs.length} workflow(s); no secrets printed by run steps.`);
  },
};
