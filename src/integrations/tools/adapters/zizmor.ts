import type { ToolAdapter } from '../types.js';
import { arr, obj, parseJson, repoPath, severityFrom } from './util.js';

/** GitHub Actions security linting, offline mode (decision 39). */
export const zizmor: ToolAdapter = {
  name: 'zizmor',
  binary: 'zizmor',
  network: false,
  criteria: ['CC5.2'],
  versionArgs: ['--version'],
  // zizmor exits 10-14 when it reports findings.
  okExitCodes: [0, 10, 11, 12, 13, 14],
  describe: 'GitHub Actions workflow weaknesses',
  skip: (ctx) =>
    ctx.files.glob('.github/workflows/*.{yml,yaml}').length
      ? undefined
      : 'no GitHub Actions workflows',
  args: (ctx) => ['--offline', '--format', 'json', '--no-progress', ctx.root],
  parse(stdout, ctx) {
    const results = arr(parseJson(stdout));
    return {
      scanned: ctx.files.glob('.github/workflows/*.{yml,yaml}').length,
      findings: results.map((r) => {
        const loc = obj(arr(r.locations)[0]);
        const key = obj(obj(obj(loc.symbolic).key).Local);
        const path = repoPath(ctx.root, (key.given_path ?? key.path) as string | undefined);
        const row = obj(obj(obj(loc.concrete).location).start_point).row;
        const line = typeof row === 'number' ? row + 1 : undefined;
        const ident = String(r.ident ?? 'zizmor');
        return {
          criterion: 'CC5.2',
          checkId: ident,
          title: `zizmor: ${String(r.desc ?? ident)}`,
          observed: `zizmor (${ident}) flagged ${path ?? 'a workflow'}${line ? ` at line ${line}` : ''}.`,
          severity: severityFrom(obj(r.determinations).severity as string | undefined),
          ...(path ? { path } : {}),
          ...(line ? { line } : {}),
          key: `${ident}:${path}:${line}`,
        };
      }),
    };
  },
};
