import { matchesGlob } from '../../engine/glob.js';
import type { Rule } from '../../engine/types.js';
import { firstExisting, plural } from '../util.js';

export const CODEOWNERS_LOCATIONS = ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS'];

export interface CodeownersEntry {
  pattern: string;
  owners: string[];
  line: number;
}

export function parseCodeowners(text: string): CodeownersEntry[] {
  return text.split('\n').flatMap((raw, i) => {
    const line = raw.replace(/(^|\s)#.*$/, '').trim();
    if (!line) return [];
    const [pattern, ...owners] = line.split(/\s+/);
    return pattern ? [{ pattern, owners, line: i + 1 }] : [];
  });
}

/** CODEOWNERS patterns follow gitignore rules; "/" anchors to the root. */
export function codeownersMatches(pattern: string, path: string): boolean {
  if (pattern === '*') return true;
  const p = pattern.startsWith('/') ? pattern.slice(1) : pattern;
  const anchored = pattern.startsWith('/') || p.replace(/\/$/, '').includes('/');
  const glob = anchored ? p : `**/${p}`;
  return (
    matchesGlob(path, glob) || matchesGlob(path, glob.endsWith('/') ? `${glob}**` : `${glob}/**`)
  );
}

export const codeowners: Rule = {
  id: 'cc1.3/codeowners',
  criterion: 'CC1.3',
  title: 'CODEOWNERS assigns an owner to every path',
  tags: ['CONFIG'],
  severity: 'medium',
  checks: ['`CODEOWNERS` (or equivalent) assigns owners'],
  expected:
    'A CODEOWNERS file assigns an owner to every directory, with named teams on security-sensitive paths.',
  risk: 'Changes to unowned code can merge without review from anyone accountable for it.',
  remediation: {
    summary:
      'Add .github/CODEOWNERS with a catch-all owner and named teams for sensitive paths, then require code owner review in branch protection.',
    example: `# .github/CODEOWNERS
*                 @your-org/engineering
/src/auth/        @your-org/security
/infra/           @your-org/platform`,
  },
  detect(ctx) {
    const path = firstExisting(ctx.files, CODEOWNERS_LOCATIONS);
    if (!path) {
      return {
        status: 'fail',
        findings: [
          {
            title: 'No CODEOWNERS file',
            observed: 'No CODEOWNERS file found in .github/, the root or docs/.',
            key: 'missing',
          },
        ],
      };
    }
    const entries = parseCodeowners(ctx.files.read(path) ?? '').filter((e) => e.owners.length > 0);
    const catchAll = entries.find(
      (e) => e.pattern === '*' || e.pattern === '/**' || e.pattern === '**',
    );
    if (catchAll) {
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'file',
            path,
            line: catchAll.line,
            description: `Catch-all rule assigns ${catchAll.owners.join(' ')}.`,
          },
        ],
      };
    }
    const unowned = ctx.files.files.filter(
      (f) => !entries.some((e) => codeownersMatches(e.pattern, f.path)),
    );
    if (unowned.length === 0) {
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'file',
            path,
            description: `All ${ctx.files.files.length} files match a CODEOWNERS rule.`,
          },
        ],
      };
    }
    return {
      status: 'fail',
      findings: [
        {
          path,
          title: 'CODEOWNERS leaves paths without an owner',
          severity: 'low',
          observed: `${plural(unowned.length, 'file')} match no CODEOWNERS rule, for example ${unowned
            .slice(0, 3)
            .map((f) => f.path)
            .join(', ')}.`,
          key: 'uncovered',
        },
      ],
    };
  },
};
