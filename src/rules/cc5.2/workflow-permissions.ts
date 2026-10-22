import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { jobs, lineOf, workflows } from '../lib/workflows.js';

export const workflowPermissions: Rule = {
  id: 'cc5.2/workflow-permissions',
  criterion: 'CC5.2',
  title: 'Workflow tokens use least-privilege permissions',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['CI/CD hardened'],
  expected:
    'Each workflow declares `permissions:` (read-only by default) and grants write scopes only to the jobs that need them. Nothing uses write-all.',
  risk: 'A broad GITHUB_TOKEN lets any compromised step push code, create releases or change repository settings.',
  remediation: {
    summary:
      'Set a read-only default at the top of each workflow and grant specific write scopes per job.',
    example: `permissions:
  contents: read
jobs:
  release:
    permissions:
      contents: write
      id-token: write`,
  },
  detect(ctx) {
    const wfs = workflows(ctx.files);
    if (wfs.length === 0)
      return { status: 'not_applicable', justification: 'No GitHub Actions workflows found.' };
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    for (const wf of wfs) {
      const writeAll = lineOf(wf, /^\s*permissions:\s*["']?write-all\b/);
      if (writeAll) {
        findings.push({
          path: wf.path,
          line: writeAll,
          severity: 'high',
          redFlag: true,
          title: `write-all token permissions in ${wf.path}`,
          observed: `${wf.path} grants permissions: write-all at line ${writeAll}.`,
          key: 'write-all',
        });
        continue;
      }
      const top = wf.doc && 'permissions' in wf.doc;
      const uncovered = jobs(wf).filter(
        (j) => !('permissions' in j.def) && !('uses' in j.def && typeof j.def.uses === 'string'),
      );
      if (!top && uncovered.length) {
        findings.push({
          path: wf.path,
          title: `No token permissions declared in ${wf.path}`,
          observed: `${wf.path} has no top-level permissions block and ${uncovered.length} job(s) without one (${uncovered
            .map((j) => j.id)
            .slice(0, 4)
            .join(', ')}), so they get the repository default token scope.`,
          key: 'default',
        });
      } else {
        evidence.push({
          kind: 'file',
          path: wf.path,
          line: lineOf(wf, /^\s*permissions:/),
          description: 'Token permissions are declared.',
        });
      }
    }
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence };
  },
};
