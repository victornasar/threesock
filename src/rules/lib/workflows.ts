// GitHub Actions workflow loading. Structural checks use the parsed YAML;
// line numbers come from the raw text.
import { parse } from 'yaml';
import type { FileIndex } from '../../engine/types.js';

export interface Workflow {
  path: string;
  text: string;
  lines: string[];
  /** Parsed document, or undefined when the YAML is invalid. */
  doc: Record<string, unknown> | undefined;
}

const cache = new WeakMap<FileIndex, Workflow[]>();

export function workflows(files: FileIndex): Workflow[] {
  const cached = cache.get(files);
  if (cached) return cached;
  // Composite actions (action.yml) contain run steps and `uses:` too, so the same checks apply.
  const list = files
    .glob([
      '.github/workflows/*.yml',
      '.github/workflows/*.yaml',
      '**/action.yml',
      '**/action.yaml',
    ])
    .filter((f) => !/(?:^|\/)(?:node_modules|test|tests|fixtures)\//.test(f.path))
    .map((f) => {
      const text = files.read(f.path) ?? '';
      let doc: Record<string, unknown> | undefined;
      try {
        const parsed: unknown = parse(text);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
          doc = parsed as Record<string, unknown>;
      } catch {
        doc = undefined;
      }
      return { path: f.path, text, lines: text.split('\n'), doc };
    });
  cache.set(files, list);
  return list;
}

/** Trigger names of a workflow (`on:` may be a string, list or mapping). */
export function triggers(wf: Workflow): string[] {
  // YAML 1.1 parsers read a bare `on` key as boolean true; the yaml package keeps it as "on".
  const on = wf.doc?.on ?? wf.doc?.true;
  if (typeof on === 'string') return [on];
  if (Array.isArray(on)) return on.map(String);
  if (on && typeof on === 'object') return Object.keys(on);
  return [];
}

export interface Job {
  id: string;
  def: Record<string, unknown>;
}

export function jobs(wf: Workflow): Job[] {
  const j = wf.doc?.jobs;
  if (!j || typeof j !== 'object') return [];
  return Object.entries(j as Record<string, unknown>)
    .filter(([, v]) => v && typeof v === 'object')
    .map(([id, def]) => ({ id, def: def as Record<string, unknown> }));
}

/** 1-based line of the first line matching `re`, at or after `from` (1-based). */
export function lineOf(wf: Workflow, re: RegExp, from = 1): number | undefined {
  for (let i = from - 1; i < wf.lines.length; i++) if (re.test(wf.lines[i] as string)) return i + 1;
  return undefined;
}

/** Every line matching `re`, with its 1-based number and match. */
export function matchLines(wf: Workflow, re: RegExp): { line: number; match: RegExpExecArray }[] {
  const out: { line: number; match: RegExpExecArray }[] = [];
  wf.lines.forEach((l, i) => {
    if (/^\s*#/.test(l)) return;
    const m = re.exec(l);
    if (m) out.push({ line: i + 1, match: m });
  });
  return out;
}
