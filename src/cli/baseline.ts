// `threesock baseline`: records accepted findings in threesock-baseline.yaml
// (decision 31). Every entry needs an approver, a reason and an expiry; bulk
// acceptance is limited to Medium and Low; expiry caps apply per severity.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Document, parse } from 'yaml';
import { BASELINE_FILENAME, loadConfig } from '../engine/config.js';
import type { Finding } from '../engine/model.js';
import { scan } from '../engine/scan.js';
import type { Rule } from '../engine/types.js';

export interface BaselineOptions {
  root: string;
  configPath?: string;
  rules: readonly Rule[];
  now: Date;
  approver?: string;
  reason?: string;
  expires?: string;
  /** Accept every open Medium and Low finding. */
  all: boolean;
  /** Accept these findings (any severity) one by one. */
  fingerprints: string[];
  /** Remove entries that match no current finding. */
  prune: boolean;
}

export interface BaselineResult {
  path: string;
  added: Finding[];
  pruned: number;
  total: number;
}

export class BaselineError extends Error {}

interface Entry {
  fingerprint: string;
  rule?: string;
  title?: string;
  approver: string;
  justification: string;
  expires: string;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

function readEntries(path: string): Entry[] {
  if (!existsSync(path)) return [];
  const raw = parse(readFileSync(path, 'utf8')) as { exceptions?: Entry[] } | null;
  return (raw?.exceptions ?? []).filter((e) => e && typeof e.fingerprint === 'string');
}

export async function runBaseline(opts: BaselineOptions): Promise<BaselineResult> {
  const accepting = opts.all || opts.fingerprints.length > 0;
  if (!accepting && !opts.prune) {
    throw new BaselineError('Nothing to do. Use --all, --fingerprint <fp> or --prune.');
  }
  const today = iso(opts.now);
  if (accepting) {
    if (!opts.approver) throw new BaselineError('--approver is required (rubric CC4.2).');
    if (!opts.reason) throw new BaselineError('--reason is required (rubric CC4.2).');
    if (!opts.expires || !/^\d{4}-\d{2}-\d{2}$/.test(opts.expires)) {
      throw new BaselineError('--expires is required, as YYYY-MM-DD (rubric CC4.2).');
    }
    if (opts.expires < today) throw new BaselineError(`--expires ${opts.expires} is in the past.`);
  }

  const config = loadConfig(opts.root, opts.configPath);
  const path = join(config.configDir, BASELINE_FILENAME);
  const { report } = await scan({
    root: opts.root,
    configPath: opts.configPath,
    rules: opts.rules,
    now: opts.now,
  });
  const byFingerprint = new Map(report.findings.map((f) => [f.fingerprint, f]));

  let candidates: Finding[] = [];
  if (opts.all) {
    candidates = report.findings.filter(
      (f) => f.status === 'open' && (f.severity === 'medium' || f.severity === 'low'),
    );
  }
  for (const fp of opts.fingerprints) {
    const f = byFingerprint.get(fp);
    if (!f)
      throw new BaselineError(
        `No current finding has fingerprint ${fp}. Run \`threesock scan --format json\` to list fingerprints.`,
      );
    if (!candidates.includes(f)) candidates.push(f);
  }

  // Expiry caps by severity (decision 32).
  const tooLong = candidates.flatMap((f) => {
    const cap = config.thresholds.maxExceptionDays[f.severity];
    if (cap === undefined) return [];
    const latest = iso(new Date(opts.now.getTime() + cap * 86_400_000));
    return opts.expires && opts.expires > latest
      ? [`${f.id} (${f.severity}) may be accepted until ${latest} at most`]
      : [];
  });
  if (tooLong.length)
    throw new BaselineError(`--expires ${opts.expires} is too far out: ${tooLong.join('; ')}.`);

  let entries = readEntries(path);
  const before = entries.length;
  if (opts.prune) entries = entries.filter((e) => byFingerprint.has(e.fingerprint));
  const pruned = before - entries.length;

  for (const f of candidates) {
    const entry: Entry = {
      fingerprint: f.fingerprint,
      rule: f.ruleId,
      title: f.title,
      approver: opts.approver as string,
      justification: opts.reason as string,
      expires: opts.expires as string,
    };
    const i = entries.findIndex((e) => e.fingerprint === f.fingerprint);
    if (i >= 0) entries[i] = entry;
    else entries.push(entry);
  }

  const doc = new Document({ version: 1, exceptions: entries });
  doc.commentBefore =
    ' threesock baseline: accepted findings, matched by fingerprint.\n' +
    ' Written by `threesock baseline`. Review changes to this file like code.\n' +
    ' Expired entries turn back into open findings; `threesock baseline --prune` removes fixed ones.';
  writeFileSync(path, doc.toString({ lineWidth: 0 }));
  return { path, added: candidates, pruned, total: entries.length };
}
