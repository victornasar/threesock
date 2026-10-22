// Helpers shared by rules. Keep rules small: detection logic only.
import type { FileIndex, RepoFile } from '../engine/types.js';

export interface GrepMatch {
  path: string;
  line: number;
  match: RegExpExecArray;
}

/** 1-based line number of a character offset. */
export function lineAt(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

/** Runs a global regex over every readable file accepted by the filter. */
export function grep(
  files: FileIndex,
  pattern: RegExp,
  filter: (f: RepoFile) => boolean = () => true,
): GrepMatch[] {
  const re = pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
  const out: GrepMatch[] = [];
  for (const f of files.files) {
    if (!filter(f)) continue;
    const text = files.read(f.path);
    if (text === undefined) continue;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      out.push({ path: f.path, line: lineAt(text, m.index), match: m });
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return out;
}

/** Shannon entropy in bits per character. */
export function entropy(s: string): number {
  const counts = new Map<string, number>();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let h = 0;
  for (const n of counts.values()) {
    const p = n / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

export function basename(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

/** First file that exists among candidate paths. */
export function firstExisting(files: FileIndex, candidates: readonly string[]): string | undefined {
  return candidates.find((c) => files.has(c));
}

/** "a" or "an" for a noun phrase (by spelling, good enough for rule messages). */
export function article(phrase: string): string {
  return /^(?:[aeio]|AWS|SSH|SSO|HTTP|S3|API|MFA|OIDC|npm)/i.test(phrase) ? 'An' : 'A';
}

export function plural(n: number, word: string, pluralWord = `${word}s`): string {
  return `${n} ${n === 1 ? word : pluralWord}`;
}
