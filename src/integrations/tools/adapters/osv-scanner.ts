import type { ToolAdapter } from '../types.js';
import { arr, obj, parseJson, repoPath, severityFromScore } from './util.js';

/** Known-vulnerable dependencies; queries osv.dev, so it needs --network (decision 39). */
export const osvScanner: ToolAdapter = {
  name: 'osv-scanner',
  binary: 'osv-scanner',
  network: true,
  criteria: ['CC6.8'],
  versionArgs: ['--version'],
  okExitCodes: [0, 1],
  describe: 'known-vulnerable dependencies in lockfiles',
  args: (ctx) => ['scan', 'source', '--recursive', '--format', 'json', ctx.root],
  parse(stdout, ctx) {
    const results = arr(obj(parseJson(stdout)).results);
    let scanned = 0;
    const findings = results.flatMap((res) => {
      const path = repoPath(ctx.root, obj(res.source).path as string | undefined);
      return arr(res.packages).flatMap((p) => {
        scanned++;
        const pkg = obj(p.package);
        const vulns = arr(p.vulnerabilities);
        if (!vulns.length) return [];
        const groups = arr(p.groups);
        const max = groups.map((g) => severityFromScore(g.max_severity as string)).find(Boolean);
        const ids = vulns.map((v) => String(v.id)).slice(0, 5);
        const name = `${String(pkg.name)}@${String(pkg.version)}`;
        return [
          {
            criterion: 'CC6.8',
            checkId: ids[0] ?? 'osv',
            title: `Vulnerable dependency ${name}`,
            observed: `${name} (${String(pkg.ecosystem)}) in ${path ?? 'a lockfile'} has ${vulns.length} known vulnerabilit${vulns.length === 1 ? 'y' : 'ies'}: ${ids.join(', ')}.`,
            severity: max ?? 'medium',
            ...(path ? { path } : {}),
            key: `${name}:${path}`,
          },
        ];
      });
    });
    return { findings, scanned };
  },
};
