import { join } from 'node:path';
import type { ToolAdapter } from '../types.js';
import { arr, readReport, repoPath } from './util.js';

interface Leak {
  RuleID?: string;
  Description?: string;
  File?: string;
  StartLine?: number;
  Commit?: string;
  Secret?: string;
  Match?: string;
}

/** Full git history (decision 39). Secret values are registered for scrubbing and never copied (decision 42). */
export const gitleaks: ToolAdapter = {
  name: 'gitleaks',
  binary: 'gitleaks',
  network: false,
  criteria: ['CC6.1'],
  versionArgs: ['version'],
  okExitCodes: [0, 1],
  describe: 'secrets anywhere in git history',
  skip: (ctx) => (ctx.files.isGitRepo ? undefined : 'not a git repository'),
  args: (ctx) => [
    'git',
    '--report-format',
    'json',
    '--report-path',
    join(ctx.tmpDir, 'gitleaks.json'),
    '--redact',
    '--no-banner',
    '--exit-code',
    '0',
    ctx.root,
  ],
  parse(_stdout, ctx) {
    const leaks = arr<Leak>(readReport(join(ctx.tmpDir, 'gitleaks.json')));
    for (const l of leaks) {
      if (l.Secret && l.Secret !== 'REDACTED') ctx.secrets.register(l.Secret);
      if (l.Match) ctx.secrets.register(l.Match);
    }
    return {
      findings: leaks.map((l) => {
        const path = repoPath(ctx.root, l.File);
        const sha = (l.Commit ?? '').slice(0, 7);
        const what = l.Description ?? l.RuleID ?? 'secret';
        return {
          criterion: 'CC6.1',
          checkId: l.RuleID ?? 'gitleaks',
          title: `Secret in git history: ${what}`,
          observed: `Gitleaks found a ${what} in ${path ?? 'a file'}${l.StartLine ? ` at line ${l.StartLine}` : ''}${sha ? ` in commit ${sha}` : ''}. The value is redacted. Removing it from the current files does not remove it from history: revoke and rotate it.`,
          severity: 'high' as const,
          ...(path ? { path } : {}),
          ...(l.StartLine ? { line: l.StartLine } : {}),
          key: `${l.RuleID}:${path}:${sha}`,
        };
      }),
    };
  },
};
