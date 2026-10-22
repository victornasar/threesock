import type { RawFinding, Rule } from '../../engine/types.js';
import { lineOf, triggers, workflows } from '../lib/workflows.js';

const UNTRUSTED_REF =
  /\$\{\{\s*github\.(?:event\.pull_request\.head\.(?:sha|ref)|head_ref|event\.workflow_run\.head_(?:sha|branch))\s*\}\}|refs\/pull\/[^/\s]+\/(?:head|merge)/;

export const pullRequestTarget: Rule = {
  id: 'cc5.2/pull-request-target',
  criterion: 'CC5.2',
  title: 'Privileged workflows never check out untrusted pull request code',
  tags: ['CONFIG'],
  severity: 'critical',
  checks: ['CI/CD hardened'],
  expected:
    'Workflows triggered by pull_request_target or workflow_run do not check out or run code from the pull request.',
  risk: 'These triggers run with secrets and a write token. Checking out the PR head lets anyone who opens a pull request run code with them ("pwn request").',
  remediation: {
    summary:
      'Use the pull_request trigger for anything that builds or tests PR code. Keep pull_request_target for labelling or commenting, without checking out the head.',
    example: `on: pull_request          # untrusted code, no secrets, read-only token
permissions:
  contents: read`,
  },
  detect(ctx) {
    const wfs = workflows(ctx.files);
    if (wfs.length === 0)
      return { status: 'not_applicable', justification: 'No GitHub Actions workflows found.' };
    const privileged = wfs.filter((wf) =>
      triggers(wf).some((t) => t === 'pull_request_target' || t === 'workflow_run'),
    );
    const findings: RawFinding[] = [];
    for (const wf of privileged) {
      const line = lineOf(wf, UNTRUSTED_REF);
      if (line) {
        findings.push({
          path: wf.path,
          line,
          title: `Untrusted PR code checked out in a privileged workflow (${wf.path})`,
          observed: `${wf.path} runs on ${triggers(wf)
            .filter((t) => t !== 'pull_request')
            .join('/')} and references the pull request head at line ${line}.`,
          key: 'checkout',
        });
      }
    }
    if (findings.length) return { status: 'fail', findings };
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'config',
          description: privileged.length
            ? `${privileged.length} privileged workflow(s) do not check out pull request code.`
            : `None of ${wfs.length} workflow(s) use pull_request_target or workflow_run.`,
        },
      ],
    };
  },
};
