// Turns installed external scanners into checks (decisions 39-40): each tool
// becomes one check per criterion it covers, present only when the tool ran.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FileIndex, Rule } from '../../engine/types.js';
import { checkov } from './adapters/checkov.js';
import { gitleaks } from './adapters/gitleaks.js';
import { osvScanner } from './adapters/osv-scanner.js';
import { semgrep } from './adapters/semgrep.js';
import { trivy } from './adapters/trivy.js';
import { zizmor } from './adapters/zizmor.js';
import { execRunner, parseVersion } from './runner.js';
import type { ParseResult, ToolAdapter, ToolContext, ToolRunner, ToolStatus } from './types.js';

export const ADAPTERS: readonly ToolAdapter[] = [
  gitleaks,
  zizmor,
  checkov,
  semgrep,
  osvScanner,
  trivy,
];
export const TOOL_NAMES = ADAPTERS.map((a) => a.name);
export const DEFAULT_TIMEOUT_MS = 60_000;

export interface ToolOptions {
  /** 'auto' runs every installed tool allowed by `network`; a list runs only those; 'none' runs nothing. */
  mode: 'auto' | 'none' | string[];
  network: boolean;
  runner?: ToolRunner;
  timeoutMs?: number;
}

export interface PreparedTools {
  statuses: ToolStatus[];
  rules: Rule[];
  /** Removes temporary report files. */
  cleanup(): void;
}

const PRETTY: Record<string, string> = {
  gitleaks: 'Gitleaks',
  zizmor: 'zizmor',
  checkov: 'Checkov',
  semgrep: 'Semgrep',
  'osv-scanner': 'OSV-Scanner',
  trivy: 'Trivy',
};

export async function prepareTools(
  opts: ToolOptions,
  env: {
    root: string;
    files: FileIndex;
    secrets: ToolContext['secrets'];
    inScope: (criterion: string) => boolean;
  },
): Promise<PreparedTools> {
  if (opts.mode === 'none') return { statuses: [], rules: [], cleanup: () => undefined };
  const runner = opts.runner ?? execRunner;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const tmpDir = mkdtempSync(join(tmpdir(), 'threesock-tools-'));
  const ctx: ToolContext = {
    root: env.root,
    files: env.files,
    network: opts.network,
    secrets: env.secrets,
    tmpDir,
  };
  const selected =
    opts.mode === 'auto'
      ? ADAPTERS
      : ADAPTERS.filter((a) => (opts.mode as string[]).includes(a.name));

  const statuses: ToolStatus[] = [];
  const rules: Rule[] = [];
  await Promise.all(
    selected.map(async (adapter) => {
      const probe = await runner(adapter.binary, adapter.versionArgs, {
        cwd: env.root,
        timeoutMs: 10_000,
      });
      if (probe.missing) {
        statuses.push({ name: adapter.name, available: false, used: false, note: 'not installed' });
        return;
      }
      const version = parseVersion(`${probe.stdout}\n${probe.stderr}`) ?? 'unknown';
      const needsNetwork =
        typeof adapter.network === 'function' ? adapter.network(ctx) : adapter.network;
      const skip =
        adapter.skip?.(ctx) ?? (needsNetwork && !opts.network ? 'needs --network' : undefined);
      if (skip) {
        statuses.push({ name: adapter.name, available: true, used: false, version, note: skip });
        return;
      }
      statuses.push({ name: adapter.name, available: true, used: true, version });
      rules.push(...toolRules(adapter, version, ctx, runner, timeoutMs, env.inScope));
    }),
  );
  statuses.sort((a, b) => TOOL_NAMES.indexOf(a.name) - TOOL_NAMES.indexOf(b.name));
  return { statuses, rules, cleanup: () => rmSync(tmpDir, { recursive: true, force: true }) };
}

type RunOutcome = { ok: true; result: ParseResult } | { ok: false; reason: string };

function toolRules(
  adapter: ToolAdapter,
  version: string,
  ctx: ToolContext,
  runner: ToolRunner,
  timeoutMs: number,
  inScope: (criterion: string) => boolean,
): Rule[] {
  const label = `${PRETTY[adapter.name] ?? adapter.name} ${version}`;
  let pending: Promise<RunOutcome> | undefined;
  const run = () =>
    (pending ??= (async (): Promise<RunOutcome> => {
      const res = await runner(adapter.binary, adapter.args(ctx), { cwd: ctx.root, timeoutMs });
      if (res.timedOut)
        return {
          ok: false,
          reason: `${label} timed out after ${Math.round(timeoutMs / 1000)}s; coverage from this tool is missing.`,
        };
      if (res.code === null || !adapter.okExitCodes.includes(res.code)) {
        return {
          ok: false,
          reason:
            `${label} exited with code ${res.code ?? 'null'}: ${res.stderr.trim().split('\n').slice(-1)[0] ?? ''}`.trim(),
        };
      }
      try {
        const result = adapter.parse(res.stdout, ctx);
        // Findings for out-of-scope categories land on CC7.1 so they stay visible (decision 41).
        for (const f of result.findings) if (!inScope(f.criterion)) f.criterion = 'CC7.1';
        return { ok: true, result };
      } catch (err) {
        return {
          ok: false,
          reason: `${label} output could not be parsed: ${(err as Error).message}`,
        };
      }
    })());

  const criteria = [
    ...new Set([
      ...adapter.criteria.filter(inScope),
      ...(adapter.criteria.some((c) => !inScope(c)) ? ['CC7.1'] : []),
    ]),
  ];
  return criteria.map((criterion): Rule => ({
    id: `${criterion.toLowerCase()}/${adapter.name}`,
    criterion,
    title: `${PRETTY[adapter.name] ?? adapter.name} finds no ${adapter.describe}`,
    tags: ['CODE', 'CONFIG'],
    severity: 'medium',
    redFlag: false,
    source: { tool: adapter.name, version },
    expected: `${PRETTY[adapter.name] ?? adapter.name} reports no ${adapter.describe}.`,
    risk: `Issues found by ${PRETTY[adapter.name] ?? adapter.name} are concrete weaknesses in this repository; see the tool's documentation for each check.`,
    remediation: {
      summary: `Fix each issue as the ${PRETTY[adapter.name] ?? adapter.name} rule describes, or suppress it with a written justification.`,
    },
    async detect() {
      const outcome = await run();
      if (!outcome.ok) return { status: 'unknown', reason: outcome.reason };
      const mine = outcome.result.findings.filter((f) => f.criterion === criterion);
      if (mine.length) {
        return {
          status: 'fail',
          findings: mine.map((f) => ({
            title: f.title,
            observed: f.observed,
            severity: f.severity,
            key: f.key,
            checkId: f.checkId,
            ...(f.path ? { path: f.path } : {}),
            ...(f.line ? { line: f.line } : {}),
          })),
        };
      }
      if (outcome.result.scanned === 0)
        return { status: 'not_applicable', justification: `${label} found nothing to scan.` };
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'config',
            description: `${label} ran and reported no ${adapter.describe} for ${criterion}.`,
          },
        ],
      };
    },
  }));
}
