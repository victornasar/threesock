import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { jobs, lineOf, workflows } from '../lib/workflows.js';

const DEPLOY_ID = /deploy|release|publish|prod/i;
const DEPLOY_CMD =
  /vercel\s+(?:deploy\s+)?--prod|terraform\s+apply|kubectl\s+apply|helm\s+(?:upgrade|install)|(?:npm|pnpm|yarn)\s+publish|aws\s+s3\s+sync|flyctl?\s+deploy|serverless\s+deploy|sam\s+deploy|cdk\s+deploy|gcloud\s+(?:run|app)\s+deploy|firebase\s+deploy|wrangler\s+(?:deploy|publish)/;

export const deployEnvironments: Rule = {
  id: 'cc5.2/deploy-environments',
  criterion: 'CC5.2',
  title: 'Deploy jobs run in protected environments',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['CI/CD hardened'],
  expected:
    'Jobs that deploy or publish run in a GitHub environment, so required reviewers, branch restrictions and environment-scoped secrets apply.',
  risk: 'Without an environment gate, anyone who can push to a triggering branch can deploy to production.',
  remediation: {
    summary:
      'Add `environment: production` to deploy jobs and configure required reviewers and deployment branch rules on that environment.',
    example: `jobs:
  deploy:
    environment: production
    runs-on: ubuntu-latest`,
  },
  detect(ctx) {
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    for (const wf of workflows(ctx.files)) {
      for (const job of jobs(wf)) {
        const body = JSON.stringify(job.def);
        if (
          !DEPLOY_ID.test(job.id) &&
          !DEPLOY_ID.test(String(job.def.name ?? '')) &&
          !DEPLOY_CMD.test(body)
        )
          continue;
        if (!DEPLOY_CMD.test(body) && !/deploy/i.test(job.id)) continue; // "release notes" jobs are not deploys
        const line = lineOf(
          wf,
          new RegExp(`^\\s{2,}${job.id.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')}:\\s*$`),
        );
        if (job.def.environment)
          evidence.push({
            kind: 'file',
            path: wf.path,
            line,
            description: `Job ${job.id} deploys through an environment.`,
          });
        else
          findings.push({
            path: wf.path,
            line,
            title: `Deploy job without an environment: ${job.id}`,
            observed: `Job ${job.id} in ${wf.path} deploys or publishes without an environment, so no reviewer or branch gate applies.`,
            key: job.id,
          });
      }
    }
    if (findings.length === 0 && evidence.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No deploy or publish jobs found in workflows.',
      };
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence };
  },
};
