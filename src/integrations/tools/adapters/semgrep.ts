import type { ToolAdapter, ToolContext } from '../types.js';
import { arr, obj, parseJson, repoPath, severityFrom } from './util.js';

const LOCAL_RULES = ['.semgrep.yml', '.semgrep.yaml', 'semgrep.yml', 'semgrep.yaml', '.semgrep'];

function localRules(ctx: ToolContext): string | undefined {
  return LOCAL_RULES.find(
    (p) => ctx.files.has(p) || ctx.files.files.some((f) => f.path.startsWith(`${p}/`)),
  );
}

/** Local rules run offline; the public registry needs --network (decision 39). */
export const semgrep: ToolAdapter = {
  name: 'semgrep',
  binary: 'semgrep',
  network: (ctx) => !localRules(ctx),
  criteria: ['CC6.6'],
  versionArgs: ['--version'],
  okExitCodes: [0, 1],
  describe: 'static analysis findings',
  args: (ctx) => {
    const local = localRules(ctx);
    return [
      'scan',
      '--config',
      local ?? 'p/default',
      '--json',
      '--metrics=off',
      '--disable-version-check',
      '--quiet',
      ctx.root,
    ];
  },
  parse(stdout, ctx) {
    const doc = obj(parseJson(stdout));
    return {
      scanned: arr(obj(doc.paths).scanned).length || undefined,
      findings: arr(doc.results).map((r) => {
        const path = repoPath(ctx.root, r.path as string | undefined);
        const line = Number(obj(r.start).line) || undefined;
        const extra = obj(r.extra);
        const id = String(r.check_id ?? 'semgrep');
        const short = id.split('.').pop() ?? id;
        return {
          criterion: 'CC6.6',
          checkId: id,
          title: `Semgrep ${short}`,
          observed: `${String(extra.message ?? id).split('\n')[0]} (${path ?? 'source'}${line ? `:${line}` : ''}).`,
          severity: severityFrom(extra.severity as string | undefined),
          ...(path ? { path } : {}),
          ...(line ? { line } : {}),
          key: `${id}:${path}:${line}`,
        };
      }),
    };
  },
};
