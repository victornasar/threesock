import { readFileSync } from 'node:fs';
import { isAbsolute, relative, sep } from 'node:path';
import type { Severity } from '../../../engine/types.js';

/** Parses JSON, tolerating log lines some tools print before the document. */
export function parseJson(text: string): unknown {
  const t = text.trim();
  if (!t) return undefined;
  try {
    return JSON.parse(t);
  } catch {
    const start = t.search(/[[{]/);
    return start >= 0 ? JSON.parse(t.slice(start)) : undefined;
  }
}

export function readReport(path: string): unknown {
  try {
    return parseJson(readFileSync(path, 'utf8'));
  } catch {
    return undefined;
  }
}

/** Repo-relative POSIX path from whatever a tool reports (absolute, ./-prefixed, or /-rooted). */
export function repoPath(root: string, p: string | undefined): string | undefined {
  if (!p) return undefined;
  let rel = isAbsolute(p) && p.startsWith(root) ? relative(root, p) : p;
  rel = rel.split(sep).join('/').replace(/^\.\//, '').replace(/^\/+/, '');
  return rel || undefined;
}

export function severityFrom(
  text: string | undefined | null,
  fallback: Severity = 'medium',
): Severity {
  const s = (text ?? '').toLowerCase();
  if (/critical/.test(s)) return 'critical';
  if (/high|error/.test(s)) return 'high';
  if (/medium|moderate|warning/.test(s)) return 'medium';
  if (/low|info|note/.test(s)) return 'low';
  return fallback;
}

/** CVSS base score to severity. */
export function severityFromScore(score: string | number | undefined): Severity | undefined {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n >= 9 ? 'critical' : n >= 7 ? 'high' : n >= 4 ? 'medium' : 'low';
}

export function arr<T = Record<string, unknown>>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
