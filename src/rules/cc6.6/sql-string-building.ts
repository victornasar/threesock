import type { RawFinding, Rule } from '../../engine/types.js';
import { scanLines } from '../lib/code-patterns.js';
import { isProductionSource, languageOf } from '../lib/languages.js';
import { absence, lineAt, plural } from '../util.js';

// Uppercase keywords only: lowercase "select" is mostly UI copy, and SQL in code is conventionally uppercase.
const SQL =
  /\bSELECT\b[\s\S]*\bFROM\b|\bINSERT\s+INTO\b|\bUPDATE\b[\s\S]*\bSET\b|\bDELETE\s+FROM\b/;
// Untagged template literals: tagged ones (sql`...`, Prisma.sql`...`) are parameterized by their library.
const JS_TEMPLATE = /(?<![\w$.)\]])`((?:[^`\\]|\\.)*)`/g;
const PY_FSTRING = /\b[fF][rR]?("""|'''|"|')([\s\S]*?)\1/g;

export const sqlStringBuilding: Rule = {
  id: 'cc6.6/sql-string-building',
  criterion: 'CC6.6',
  title: 'SQL queries are parameterized, not built from strings',
  tags: ['CODE'],
  severity: 'high',
  checks: ['Defenses against common web flaws'],
  expected:
    'Queries use bound parameters or a query builder; user input is never concatenated or interpolated into SQL.',
  risk: 'String-built SQL is the classic injection flaw: one unescaped value can read, change or delete the whole database.',
  remediation: {
    summary:
      'Pass values as bound parameters (placeholders) or use a tagged template or query builder that parameterizes for you.',
    example: `// Node (pg)
await db.query('SELECT * FROM users WHERE id = $1', [id]);

# Python (psycopg)
cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))`,
  },
  detect(ctx) {
    const files = ctx.files.files.filter((f) => isProductionSource(f));
    if (files.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No production JS/TS, Python or Go source files to check.',
      };
    const findings: RawFinding[] = [];
    const add = (path: string, line: number, how: string) =>
      findings.push({
        path,
        line,
        title: 'SQL built from strings',
        observed: `SQL query ${how} in ${path} at line ${line}.`,
        key: `${how}:${line}`,
      });

    for (const f of files) {
      const text = ctx.files.read(f.path) ?? '';
      const lang = languageOf(f.path);
      if (lang === 'js') {
        for (const m of text.matchAll(JS_TEMPLATE)) {
          const body = m[1] ?? '';
          if (body.includes('${') && SQL.test(body))
            add(f.path, lineAt(text, m.index), 'built with template literal interpolation');
        }
      } else if (lang === 'python') {
        for (const m of text.matchAll(PY_FSTRING)) {
          const body = m[2] ?? '';
          if (/\{[^}]+\}/.test(body) && SQL.test(body))
            add(f.path, lineAt(text, m.index), 'built with an f-string');
        }
      }
    }
    findings.push(
      ...scanLines(ctx, files, [
        {
          languages: ['js', 'python'],
          re: /["'](?:SELECT\b[^"']*\bFROM|INSERT INTO|UPDATE\b[^"']*\bSET|DELETE FROM)\b[^"']*["']\s*\+\s*[\w(]/,
          label: 'SQL query built by string concatenation',
        },
        {
          languages: ['python'],
          re: /["'](?:SELECT\b[^"']*\bFROM|INSERT INTO|UPDATE\b[^"']*\bSET|DELETE FROM)\b[^"']*["']\s*(?:%\s*[\w(]|\.format\s*\()/,
          label: 'SQL query built with % or .format()',
        },
        {
          languages: ['go'],
          re: /fmt\.Sprintf\(\s*"[^"]*\b(?:SELECT|INSERT INTO|UPDATE|DELETE FROM)\b[^"]*%[sdv]/,
          label: 'SQL query built with fmt.Sprintf',
        },
      ]),
    );
    if (findings.length) return { status: 'fail', findings };
    return absence(
      `Checked ${plural(files.length, 'production file')}; no SQL built by interpolation, concatenation or formatting.`,
    );
  },
};
