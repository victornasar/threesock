// Minimal, dependency-free glob matching for repo-relative POSIX paths.
// Supports `**`, `*`, `?`, `{a,b}` and gitignore-style basename patterns (no slash).

const cache = new Map<string, RegExp>();

function escape(ch: string): string {
  return /[.+^$()|[\]\\]/.test(ch) ? `\\${ch}` : ch;
}

export function globToRegExp(pattern: string): RegExp {
  const cached = cache.get(pattern);
  if (cached) return cached;
  let p = pattern.trim().replace(/^\.\//, '');
  if (p.endsWith('/')) p += '**';
  const anchored = p.includes('/');
  if (p.startsWith('/')) p = p.slice(1);

  let re = '';
  for (let i = 0; i < p.length; i++) {
    const ch = p[i] as string;
    if (ch === '*') {
      if (p[i + 1] === '*') {
        const atSegmentStart = i === 0 || p[i - 1] === '/';
        const followedBySlash = p[i + 2] === '/';
        if (atSegmentStart && followedBySlash) {
          re += '(?:.*/)?';
          i += 2;
        } else {
          re += '.*';
          i += 1;
        }
      } else {
        re += '[^/]*';
      }
    } else if (ch === '?') {
      re += '[^/]';
    } else if (ch === '{') {
      const end = p.indexOf('}', i);
      if (end === -1) {
        re += '\\{';
      } else {
        const alts = p
          .slice(i + 1, end)
          .split(',')
          .map((a) => a.split('').map(escape).join(''));
        re += `(?:${alts.join('|')})`;
        i = end;
      }
    } else {
      re += escape(ch);
    }
  }
  const source = anchored ? `^${re}$` : `^(?:.*/)?${re}$`;
  const compiled = new RegExp(source);
  cache.set(pattern, compiled);
  return compiled;
}

export function matchesGlob(path: string, patterns: string | readonly string[]): boolean {
  const list = typeof patterns === 'string' ? [patterns] : patterns;
  return list.some((p) => globToRegExp(p).test(path));
}
