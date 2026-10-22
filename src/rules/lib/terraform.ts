// Lightweight, block-aware Terraform scanner. It is not a full HCL parser:
// it finds top-level `resource`/`data`/`terraform` blocks, their nested blocks
// and simple `key = value` attributes. Evidence from rules using it says so.
import type { FileIndex } from '../../engine/types.js';
import { lineAt } from '../util.js';

export const TF_SCANNER_NOTE = "detected by threesock's lightweight Terraform scanner";

export interface TfBlock {
  /** e.g. "resource", "ingress", "backend". */
  kind: string;
  /** Block labels, e.g. ["aws_security_group", "web"]. */
  labels: string[];
  path: string;
  line: number;
  /** Raw body between the braces. */
  body: string;
  /** Simple attributes at this block's top level, values unquoted when they are strings. */
  attrs: Record<string, string>;
  children: TfBlock[];
}

/** Index of the brace matching the one at `open` in masked text (strings skipped). */
function matchBrace(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      for (i++; i < text.length && text[i] !== '"' && text[i] !== '\n'; i++)
        if (text[i] === '\\') i++;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Blanks out comments and heredoc bodies (keeping newlines and offsets) so block
 * and attribute scanning never sees their contents. String literals are kept.
 */
export function maskTerraform(text: string): string {
  const out = text.split('');
  const blank = (from: number, to: number) => {
    for (let k = from; k < to && k < out.length; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      for (i++; i < text.length && text[i] !== '"' && text[i] !== '\n'; i++)
        if (text[i] === '\\') i++;
    } else if (ch === '#' || (ch === '/' && text[i + 1] === '/')) {
      const end = text.indexOf('\n', i);
      blank(i, end === -1 ? text.length : end);
      i = end === -1 ? text.length : end;
    } else if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      blank(i, end === -1 ? text.length : end + 2);
      i = end === -1 ? text.length : end + 1;
    } else if (ch === '<' && text.startsWith('<<', i)) {
      const m = /^<<-?([A-Za-z_]+)\n/.exec(text.slice(i));
      if (!m) continue;
      const bodyStart = i + m[0].length;
      const term = new RegExp(`(?:^|\\n)[ \\t]*${m[1]}[ \\t]*(?=\\n|$)`).exec(
        text.slice(bodyStart),
      );
      const end = term ? bodyStart + term.index + term[0].length : text.length;
      blank(bodyStart, end);
      i = end - 1;
    }
  }
  return out.join('');
}

const BLOCK_HEAD =
  /^[ \t]*([a-z_][a-z0-9_]*)((?:[ \t]+"[^"\n]*"|[ \t]+[a-z_][a-z0-9_]*)*)[ \t]*\{/gim;
const ATTR = /^[ \t]*([A-Za-z_][A-Za-z0-9_-]*)[ \t]*=[ \t]*(.+?)[ \t]*$/gm;

function parseBlocks(text: string, offset: number, full: string, path: string): TfBlock[] {
  const blocks: TfBlock[] = [];
  BLOCK_HEAD.lastIndex = 0;
  const re = new RegExp(BLOCK_HEAD.source, BLOCK_HEAD.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const open = m.index + m[0].length - 1;
    const close = matchBrace(text, open);
    if (close === -1) break;
    const body = text.slice(open + 1, close);
    const labels = [...(m[2] ?? '').matchAll(/"([^"]*)"|([a-z_][a-z0-9_]*)/gi)].map(
      (l) => (l[1] ?? l[2]) as string,
    );
    const children = parseBlocks(body, offset + open + 1, full, path);
    // Attributes at this level only: blank out child bodies first.
    let own = body;
    for (const c of children) own = own.replace(c.body, ' '.repeat(c.body.length));
    const attrs: Record<string, string> = {};
    for (const a of own.matchAll(ATTR)) {
      attrs[a[1] as string] = (a[2] as string).replace(/^"(.*)"$/, '$1');
    }
    blocks.push({
      kind: m[1] as string,
      labels,
      path,
      line: lineAt(full, offset + m.index + (m[0].length - m[0].trimStart().length)),
      body,
      attrs,
      children,
    });
    re.lastIndex = close + 1;
  }
  return blocks;
}

export function parseTerraform(text: string, path: string): TfBlock[] {
  const masked = maskTerraform(text);
  return parseBlocks(masked, 0, masked, path);
}

const cache = new WeakMap<FileIndex, TfBlock[]>();

/** All top-level Terraform blocks in the repo. */
export function terraformBlocks(files: FileIndex): TfBlock[] {
  const cached = cache.get(files);
  if (cached) return cached;
  const blocks = files
    .glob('**/*.tf')
    .flatMap((f) => parseTerraform(files.read(f.path) ?? '', f.path));
  cache.set(files, blocks);
  return blocks;
}

export function resources(files: FileIndex, type?: string | RegExp): TfBlock[] {
  return terraformBlocks(files).filter(
    (b) =>
      b.kind === 'resource' &&
      (type === undefined ||
        (typeof type === 'string' ? b.labels[0] === type : type.test(b.labels[0] ?? ''))),
  );
}

/** Values of a list attribute such as `cidr_blocks = ["0.0.0.0/0"]`. */
export function listValues(raw: string | undefined): string[] {
  if (!raw) return [];
  return [...raw.matchAll(/"([^"]*)"/g)].map((m) => m[1] as string);
}

export function blockName(b: TfBlock): string {
  return b.labels.join('.');
}
