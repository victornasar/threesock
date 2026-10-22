import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { matchesGlob } from './glob.js';
import type { FileIndex, RepoFile } from './types.js';

/** Directories never worth walking when git is unavailable. */
const DEFAULT_IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'bower_components',
  '.venv',
  'venv',
  '__pycache__',
  '.terraform',
  '.next',
  '.nuxt',
  '.cache',
  'coverage',
]);

const MAX_READ_BYTES = 1024 * 1024;

function toPosix(p: string): string {
  return sep === '/' ? p : p.split(sep).join('/');
}

function gitList(root: string, args: string[]): string[] | undefined {
  try {
    const out = execFileSync('git', ['-C', root, 'ls-files', '-z', ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 256 * 1024 * 1024,
    });
    return out.split('\0').filter(Boolean);
  } catch {
    return undefined;
  }
}

function walk(root: string, dir: string, out: string[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const abs = join(dir, e.name);
    if (e.isDirectory()) {
      if (!DEFAULT_IGNORED_DIRS.has(e.name)) walk(root, abs, out);
    } else if (e.isFile()) {
      out.push(toPosix(relative(root, abs)));
    }
  }
}

export interface FileIndexOptions {
  ignore?: readonly string[];
}

export function buildFileIndex(root: string, opts: FileIndexOptions = {}): FileIndex {
  const ignore = opts.ignore ?? [];
  const listed = gitList(root, ['--cached', '--others', '--exclude-standard']);
  const isGitRepo = listed !== undefined;
  const tracked = new Set(isGitRepo ? (gitList(root, ['--cached']) ?? []) : []);

  let paths: string[];
  if (listed) {
    paths = [...new Set(listed)];
  } else {
    paths = [];
    walk(root, root, paths);
  }

  const files: RepoFile[] = [];
  for (const p of paths.sort()) {
    if (ignore.length && matchesGlob(p, ignore)) continue;
    let st;
    try {
      st = lstatSync(join(root, p));
    } catch {
      continue; // deleted in the working tree
    }
    if (!st.isFile()) continue; // skip symlinks and submodules
    files.push({ path: p, size: st.size, tracked: isGitRepo ? tracked.has(p) : true });
  }

  const byPath = new Map(files.map((f) => [f.path, f]));
  const contents = new Map<string, string | undefined>();

  return {
    root,
    files,
    isGitRepo,
    has: (p) => byPath.has(p),
    glob: (patterns) => files.filter((f) => matchesGlob(f.path, patterns)),
    read(p) {
      if (contents.has(p)) return contents.get(p);
      const f = byPath.get(p);
      let text: string | undefined;
      if (f && f.size <= MAX_READ_BYTES) {
        try {
          const buf = readFileSync(join(root, p));
          const head = buf.subarray(0, 8000);
          text = head.includes(0) ? undefined : buf.toString('utf8');
        } catch {
          text = undefined;
        }
      }
      contents.set(p, text);
      return text;
    },
  };
}

/** Returns the current commit SHA, or undefined outside git / before the first commit. */
export function gitHead(root: string): string | undefined {
  try {
    return execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}
