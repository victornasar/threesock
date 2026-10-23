import type { ToolAdapter } from '../types.js';
import { topicCriterion } from '../topics.js';
import { arr, obj, parseJson, repoPath, severityFrom } from './util.js';

/** IaC misconfiguration scanning; --skip-download keeps it offline (decision 39). */
export const checkov: ToolAdapter = {
  name: 'checkov',
  binary: 'checkov',
  network: false,
  criteria: ['CC6.1', 'CC6.6', 'CC6.7', 'CC7.1', 'CC7.2', 'A1.2', 'C1.1'],
  versionArgs: ['--version'],
  okExitCodes: [0, 1],
  describe: 'infrastructure-as-code misconfigurations',
  args: (ctx) => [
    '-d',
    ctx.root,
    '-o',
    'json',
    '--quiet',
    '--compact',
    '--skip-download',
    '--soft-fail',
  ],
  parse(stdout, ctx) {
    const doc = parseJson(stdout);
    // One object per framework, or a single object when only one framework ran.
    const reports = Array.isArray(doc) ? doc : doc ? [doc] : [];
    let scanned = 0;
    const findings = reports.flatMap((rep) => {
      const r = obj(rep);
      const summary = obj(r.summary);
      scanned += Number(summary.passed ?? 0) + Number(summary.failed ?? 0);
      return arr(obj(r.results).failed_checks).map((c) => {
        const path = repoPath(ctx.root, c.file_path as string | undefined);
        const range = arr<number>(c.file_line_range);
        const name = String(c.check_name ?? c.check_id ?? 'Checkov check');
        const id = String(c.check_id ?? 'checkov');
        return {
          criterion: topicCriterion(`${name} ${id}`),
          checkId: id,
          title: `Checkov ${id}: ${name}`,
          observed: `${String(c.resource ?? 'A resource')} in ${path ?? 'IaC'}${range[0] ? ` (line ${range[0]})` : ''} fails ${id}.`,
          severity: severityFrom(c.severity as string | null, 'medium'),
          ...(path ? { path } : {}),
          ...(range[0] ? { line: range[0] } : {}),
          key: `${id}:${path}:${String(c.resource)}`,
        };
      });
    });
    return { findings, scanned };
  },
};
