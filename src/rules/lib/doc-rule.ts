// Factory for documentation checks (decision 22): a document only counts when it
// covers the content the rubric names. Structure is checked; quality is not judged.
import type { Rule, Severity } from '../../engine/types.js';
import { lineAt } from '../util.js';
import { docFiles } from './docs.js';

export interface DocSection {
  name: string;
  re: RegExp;
}

export type DocRuleDef = Omit<Rule, 'detect' | 'tags'> & {
  /** What the document is called in messages, e.g. "incident response plan". */
  noun: string;
  /** Identifies candidate documents by path or by a Markdown heading. */
  find: RegExp;
  sections: readonly DocSection[];
  /** Severity when a document exists but misses sections (default: low). */
  partialSeverity?: Severity;
};

export function docRule(def: DocRuleDef): Rule {
  const { noun, find, sections, partialSeverity = 'low', ...rule } = def;
  return {
    ...rule,
    tags: ['DOCS'],
    detect(ctx) {
      const candidates = docFiles(ctx.files).flatMap((f) => {
        const text = ctx.files.read(f.path) ?? '';
        const heading = text.split('\n').find((l) => /^#{1,3}\s/.test(l) && find.test(l));
        if (!find.test(f.path) && !heading) return [];
        const covered = sections.filter((s) => s.re.test(text));
        return [{ path: f.path, text, covered }];
      });
      if (candidates.length === 0) {
        return {
          status: 'fail',
          findings: [
            {
              title: `No ${noun}`,
              observed: `No ${noun} was found in the repository's documentation.`,
              key: 'missing',
            },
          ],
        };
      }
      const best = [...candidates].sort(
        (a, b) => b.covered.length - a.covered.length,
      )[0] as (typeof candidates)[number];
      const missing = sections.filter((s) => !best.covered.includes(s));
      if (missing.length) {
        return {
          status: 'fail',
          findings: [
            {
              path: best.path,
              severity: partialSeverity,
              title: `${noun[0]?.toUpperCase()}${noun.slice(1)} is missing ${missing.map((s) => s.name).join(', ')}`,
              observed: `${best.path} covers ${best.covered.map((s) => s.name).join(', ') || 'none of the expected sections'}, but not ${missing.map((s) => s.name).join(', ')}.`,
              key: missing.map((s) => s.name).join(','),
            },
          ],
        };
      }
      const first = sections[0] ? best.text.search(sections[0].re) : -1;
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'file',
            path: best.path,
            ...(first >= 0 ? { line: lineAt(best.text, first) } : {}),
            description: `${best.path} covers ${sections.map((s) => s.name).join(', ')} (structure checked, quality not judged).`,
          },
        ],
      };
    },
  };
}
