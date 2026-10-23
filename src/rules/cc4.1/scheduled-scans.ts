import type { Rule } from '../../engine/types.js';
import { lineOf, triggers, workflows } from '../lib/workflows.js';

const SCANNERS =
  /codeql|semgrep|trivy|grype|osv-scanner|(?:npm|pnpm|yarn)\s+audit|pip-audit|govulncheck|gitleaks|trufflehog|zizmor|scorecard|checkov|snyk|dependency-check/i;

export const scheduledScans: Rule = {
  id: 'cc4.1/scheduled-scans',
  criterion: 'CC4.1',
  title: 'Security scans also run on a schedule',
  tags: ['CONFIG'],
  severity: 'low',
  redFlag: false,
  checks: ['Scheduled (cron) scans for the default branch'],
  expected:
    'Security scans run on a schedule against the default branch, not only on pull requests, so new vulnerabilities in unchanged code are found.',
  risk: 'A repository nobody touches is never rescanned, while new CVEs land against its dependencies every week.',
  remediation: {
    summary: 'Add a schedule trigger to the workflow that runs your scanners.',
    example: `on:
  pull_request:
  schedule:
    - cron: '17 6 * * 1'  # weekly`,
  },
  detect(ctx) {
    const wfs = workflows(ctx.files);
    const scheduled = wfs.filter(
      (wf) => triggers(wf).includes('schedule') && SCANNERS.test(wf.text),
    );
    if (scheduled[0])
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'file',
            path: scheduled[0].path,
            line: lineOf(scheduled[0], /^\s*schedule:/),
            description: 'Security scans run on a schedule.',
          },
        ],
      };
    const gitlab =
      ctx.files.has('.gitlab-ci.yml') &&
      /\$CI_PIPELINE_SOURCE\s*==\s*["']schedule["']/.test(ctx.files.read('.gitlab-ci.yml') ?? '');
    if (gitlab)
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'file',
            path: '.gitlab-ci.yml',
            description: 'GitLab pipeline has scheduled jobs.',
          },
        ],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No scheduled security scans',
          observed: wfs.length
            ? 'No workflow both runs a security scanner and has a schedule trigger.'
            : 'No CI workflows were found.',
          key: 'missing',
        },
      ],
    };
  },
};
