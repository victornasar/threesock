import type { Rule } from '../../engine/types.js';
import { terraformFiles } from '../lib/infra.js';
import { triggers, workflows } from '../lib/workflows.js';
import { findAny } from '../util.js';

export const driftDetection: Rule = {
  id: 'cc7.1/drift-detection',
  criterion: 'CC7.1',
  title: 'Infrastructure drift is detected on a schedule',
  tags: ['CONFIG'],
  severity: 'low',
  redFlag: false,
  checks: ['Infrastructure drift detection'],
  expected:
    'A scheduled `terraform plan` (or a drift detection service) reports changes made outside of code.',
  risk: 'Manual console changes silently reopen gaps that code review closed, and are invisible until something breaks.',
  remediation: {
    summary:
      'Run `terraform plan -detailed-exitcode` on a schedule and alert when it reports changes.',
    example: `on: { schedule: [{ cron: '0 6 * * *' }] }
...
      - run: terraform plan -detailed-exitcode -lock=false`,
  },
  detect(ctx) {
    if (terraformFiles(ctx.files).length === 0)
      return { status: 'not_applicable', justification: 'No Terraform files found.' };
    const wf = workflows(ctx.files).find(
      (w) =>
        triggers(w).includes('schedule') &&
        /\b(?:terraform|tofu)\b[^\n]*\bplan\b|driftctl/.test(w.text),
    );
    if (wf)
      return {
        status: 'pass',
        evidence: [
          { kind: 'file', path: wf.path, description: 'Scheduled terraform plan detects drift.' },
        ],
      };
    const service = findAny(
      ctx.files,
      ctx.files.files.filter((f) => /\.(?:tf|ya?ml|hcl)$/.test(f.path)),
      /drift_detection|spacelift|env0|terraform cloud|assessments_enabled/i,
    );
    if (service)
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'file',
            ...service,
            description: 'Drift detection is configured in the IaC platform.',
          },
        ],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No infrastructure drift detection',
          observed: 'Terraform is used, but no scheduled plan or drift detection was found.',
          key: 'missing',
        },
      ],
    };
  },
};
