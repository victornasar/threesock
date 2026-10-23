import type { ToolAdapter } from '../types.js';
import { topicCriterion } from '../topics.js';
import { arr, obj, parseJson, repoPath, severityFrom } from './util.js';

/** Dependency vulnerabilities and misconfigurations; downloads its databases, so it needs --network. */
export const trivy: ToolAdapter = {
  name: 'trivy',
  binary: 'trivy',
  network: true,
  criteria: ['CC6.8', 'CC6.1', 'CC6.6', 'CC6.7', 'CC7.1', 'CC7.2', 'A1.2', 'C1.1'],
  versionArgs: ['--version'],
  okExitCodes: [0],
  describe: 'vulnerable dependencies and misconfigurations',
  args: (ctx) => [
    'fs',
    '--scanners',
    'vuln,misconfig',
    '--format',
    'json',
    '--quiet',
    '--exit-code',
    '0',
    ctx.root,
  ],
  parse(stdout, ctx) {
    const results = arr(obj(parseJson(stdout)).Results);
    const findings = results.flatMap((r) => {
      const path = repoPath(ctx.root, r.Target as string | undefined);
      const vulns = arr(r.Vulnerabilities);
      const byPkg = new Map<string, Record<string, unknown>[]>();
      for (const v of vulns) {
        const k = `${String(v.PkgName)}@${String(v.InstalledVersion)}`;
        byPkg.set(k, [...(byPkg.get(k) ?? []), v]);
      }
      const vulnFindings = [...byPkg.entries()].map(([name, vs]) => {
        const worst =
          vs
            .map((v) => severityFrom(v.Severity as string))
            .sort(
              (a, b) =>
                ['critical', 'high', 'medium', 'low'].indexOf(a) -
                ['critical', 'high', 'medium', 'low'].indexOf(b),
            )[0] ?? 'medium';
        return {
          criterion: 'CC6.8',
          checkId: String(vs[0]?.VulnerabilityID ?? 'trivy'),
          title: `Vulnerable dependency ${name}`,
          observed: `${name} in ${path ?? 'a manifest'} has ${vs.length} known vulnerabilit${vs.length === 1 ? 'y' : 'ies'}: ${vs
            .slice(0, 5)
            .map((v) => String(v.VulnerabilityID))
            .join(', ')}.`,
          severity: worst,
          ...(path ? { path } : {}),
          key: `${name}:${path}`,
        };
      });
      const misconfigs = arr(r.Misconfigurations)
        .filter((m) => m.Status === undefined || m.Status === 'FAIL')
        .map((m) => {
          const line = Number(obj(m.CauseMetadata).StartLine) || undefined;
          const id = String(m.AVDID ?? m.ID ?? 'trivy');
          const title = String(m.Title ?? id);
          return {
            criterion: topicCriterion(`${title} ${id}`),
            checkId: id,
            title: `Trivy ${id}: ${title}`,
            observed: `${path ?? 'A config file'}${line ? ` (line ${line})` : ''} fails ${id}: ${String(m.Message ?? title)}`,
            severity: severityFrom(m.Severity as string),
            ...(path ? { path } : {}),
            ...(line ? { line } : {}),
            key: `${id}:${path}:${line}`,
          };
        });
      return [...vulnFindings, ...misconfigs];
    });
    return { findings, scanned: results.length };
  },
};
