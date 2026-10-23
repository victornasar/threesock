import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { basename, lineAt } from '../util.js';

const ENV_FILE = /^\.env(\..+)?$/;
const TEMPLATE_SUFFIX = /\.(example|sample|template|dist|defaults?|schema)$/i;
const SECRET_NAME =
  /(?:SECRET|TOKEN|PASSWORD|PASSWD|PWD|PRIVATE|CREDENTIAL|API_?KEY|ACCESS_?KEY|DSN|DATABASE_URL)|(?:_KEY$)/i;
const GITIGNORE_ENV = /^\s*\/?(\*\*\/)?\.env(\*|\.\*|\.local|\b)/m;

export const envFiles: Rule = {
  id: 'cc6.1/env-files',
  criterion: 'CC6.1',
  title: '.env files are not committed and are gitignored',
  tags: ['CONFIG'],
  severity: 'high',
  redFlag: true,
  checks: ['**Secrets:**'],
  expected:
    'Environment files with real values stay out of version control. Only templates such as .env.example are committed, and .gitignore excludes .env files.',
  risk: 'A committed .env file usually holds live credentials, which are then exposed to everyone with repository access and remain in git history.',
  remediation: {
    summary:
      'Rotate any credentials the file contains, remove it from git with `git rm --cached`, add `.env*` to .gitignore, and commit a .env.example with empty values instead.',
    example: `# .gitignore
.env
.env.*
!.env.example`,
  },
  detect(ctx) {
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    const candidates = ctx.files.files.filter(
      (f) => ENV_FILE.test(basename(f.path)) && !TEMPLATE_SUFFIX.test(f.path),
    );

    for (const f of candidates) {
      const text = ctx.files.read(f.path) ?? '';
      const assigned = [
        ...text.matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(\S.*)$/gm),
      ];
      const secretNames = assigned.map((m) => m[1] as string).filter((n) => SECRET_NAME.test(n));
      const names = secretNames.length
        ? ` Secret-looking variables: ${secretNames.slice(0, 5).join(', ')}${secretNames.length > 5 ? ', ...' : ''}. Values are not shown.`
        : '';
      if (f.tracked) {
        findings.push({
          path: f.path,
          title: `Environment file committed: ${f.path}`,
          observed: `${f.path} is tracked by git and assigns ${assigned.length} variable(s).${names}`,
          severity: secretNames.length ? 'critical' : 'high',
          key: 'tracked',
        });
      } else {
        findings.push({
          path: f.path,
          title: `Environment file not gitignored: ${f.path}`,
          observed: `${f.path} exists in the working tree and is not covered by .gitignore, so it can be committed by accident.${names}`,
          severity: 'medium',
          key: 'untracked',
          redFlag: false,
        });
      }
    }

    const gitignore = ctx.files.read('.gitignore');
    const ignoreMatch = gitignore ? GITIGNORE_ENV.exec(gitignore) : null;
    if (gitignore && ignoreMatch) {
      evidence.push({
        kind: 'file',
        path: '.gitignore',
        line: lineAt(
          gitignore,
          ignoreMatch.index + (ignoreMatch[0].length - ignoreMatch[0].trimStart().length),
        ),
        description: `.gitignore excludes .env files (\`${ignoreMatch[0].trim()}\`).`,
      });
    } else if (ctx.files.isGitRepo) {
      findings.push({
        path: '.gitignore',
        title: '.gitignore does not exclude .env files',
        observed: gitignore
          ? '.gitignore has no entry matching .env files.'
          : 'The repository has no .gitignore file.',
        severity: 'low',
        key: 'gitignore',
        redFlag: false,
      });
    }

    if (findings.length) return { status: 'fail', findings, evidence };
    evidence.push({
      kind: 'absence',
      description: `No .env files (other than templates) are present among ${ctx.files.files.length} files.`,
    });
    return { status: 'pass', evidence };
  },
};
