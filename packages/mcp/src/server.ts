// threesock-mcp: MCP server for AI coding agents (decisions 22 and 45): scan, list findings, explain a
// criterion, suggest a fix, read the report. Read-only: it never writes files,
// never uses the network, and only scans paths under its allowed roots.
import { realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  CATEGORIES,
  CRITERIA,
  nowFromEnv,
  renderJson,
  renderMarkdown,
  RULES,
  scan,
  SEVERITIES,
  VERSION,
  type Category,
  type Finding,
  type ScanReport,
} from 'threesock';

export interface McpOptions {
  /** Directories the server may scan. The first is the default for tools called without a path. */
  roots: string[];
  now?: () => Date;
}

class PathError extends Error {}

/** Resolves a requested path and refuses anything outside the allowed roots (after following symlinks). */
export function guardPath(roots: readonly string[], requested: string | undefined): string {
  const real = roots.map((r) => realpathSync(r));
  const base = real[0] as string;
  const target = requested ? (isAbsolute(requested) ? requested : resolve(base, requested)) : base;
  let resolved: string;
  try {
    resolved = realpathSync(target);
  } catch {
    throw new PathError(`Path not found: ${requested ?? '.'}`);
  }
  const inside = real.some((r) => {
    const rel = relative(r, resolved);
    return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
  });
  if (!inside)
    throw new PathError(
      `Refusing to scan ${requested}: it is outside the allowed roots. Start the server with --allow-path to permit it.`,
    );
  return resolved;
}

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;
const scopeSchema = z.array(z.enum(CATEGORIES as unknown as [Category, ...Category[]])).optional();

export function createServer(opts: McpOptions): McpServer {
  const server = new McpServer({ name: 'threesock', version: VERSION });
  const cache = new Map<string, { report: ScanReport; scrub: (s: string) => string }>();

  async function getReport(path: string | undefined, scope: Category[] | undefined, fresh = false) {
    const root = guardPath(opts.roots, path);
    const key = `${root}|${(scope ?? []).join(',')}`;
    const cached = cache.get(key);
    if (cached && !fresh) return cached;
    const out = await scan({
      root,
      rules: RULES,
      now: (opts.now ?? nowFromEnv)(),
      ...(scope ? { scope } : {}),
    });
    cache.set(key, out);
    return out;
  }

  const reply = (scrub: (s: string) => string, value: unknown) => ({
    content: [
      {
        type: 'text' as const,
        text: scrub(typeof value === 'string' ? value : JSON.stringify(value, null, 2)),
      },
    ],
  });
  const fail = (err: unknown) => ({
    isError: true,
    content: [{ type: 'text' as const, text: err instanceof Error ? err.message : String(err) }],
  });

  const brief = (f: Finding) => ({
    id: f.id,
    ruleId: f.ruleId,
    criterion: f.criterion,
    severity: f.severity,
    status: f.status,
    title: f.title,
    location: f.location.description,
    observed: f.observed,
    recommendation: f.recommendation,
    fingerprint: f.fingerprint,
  });

  server.registerTool(
    'scan',
    {
      title: 'Scan a repository for SOC 2 readiness',
      description:
        'Scans a repository (default: the server root) and returns readiness per category, finding counts and the top fixes. A readiness aid, not an audit. Re-run after making fixes to see the effect.',
      inputSchema: { path: z.string().optional(), scope: scopeSchema },
      annotations: READ_ONLY,
    },
    async ({ path, scope }) => {
      try {
        const { report, scrub } = await getReport(path, scope, true);
        return reply(scrub, {
          disclaimer: report.disclaimer,
          schemaVersion: report.schemaVersion,
          overall: report.summary.overall,
          categories: report.summary.categories.filter((c) => c.inScope),
          severityCounts: report.summary.severityCounts,
          openFindings: report.findings.filter((f) => f.status === 'open').length,
          manualCriteria: report.summary.manualOpen,
          topFixes: report.summary.topFixes,
          next: 'Call list_findings for details and suggest_fix for a specific finding.',
        });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'list_findings',
    {
      title: 'List findings',
      description:
        'Lists open findings from the latest scan of a path (scanning first if needed), optionally filtered by minimum severity and criterion.',
      inputSchema: {
        path: z.string().optional(),
        scope: scopeSchema,
        minSeverity: z
          .enum(SEVERITIES as unknown as ['critical', 'high', 'medium', 'low'])
          .optional(),
        criterion: z.string().optional(),
        includeAccepted: z.boolean().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      },
      annotations: READ_ONLY,
    },
    async ({ path, scope, minSeverity, criterion, includeAccepted, limit }) => {
      try {
        const { report, scrub } = await getReport(path, scope);
        const max = minSeverity ? SEVERITIES.indexOf(minSeverity) : SEVERITIES.length - 1;
        const list = report.findings
          .filter(
            (f) =>
              (includeAccepted || f.status === 'open') && SEVERITIES.indexOf(f.severity) <= max,
          )
          .filter((f) => !criterion || f.criterion.toLowerCase() === criterion.toLowerCase())
          .slice(0, limit ?? 50)
          .map(brief);
        return reply(scrub, { count: list.length, findings: list });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'explain_criterion',
    {
      title: 'Explain a SOC 2 criterion',
      description:
        'Explains a rubric criterion (e.g. CC6.1): the requirement, checks, red flags, evidence, and which threesock rules automate it.',
      inputSchema: { id: z.string() },
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      const def = CRITERIA.find((c) => c.id.toLowerCase() === id.toLowerCase());
      if (!def)
        return fail(new Error(`Unknown criterion "${id}". Criteria run from CC1.1 to P8.1.`));
      return reply((s) => s, {
        ...def,
        automatedRules: RULES.filter((r) => r.criterion === def.id).map((r) => ({
          id: r.id,
          title: r.title,
          severity: r.severity,
          ...(r.requires ? { requires: r.requires } : {}),
        })),
      });
    },
  );

  server.registerTool(
    'suggest_fix',
    {
      title: 'Suggest a fix for a finding',
      description:
        'Returns what the control expects, the risk, and a concrete example fix for a finding (by id such as F-003, or by fingerprint). It does not change any files; apply the fix yourself, then call scan again.',
      inputSchema: { finding: z.string(), path: z.string().optional(), scope: scopeSchema },
      annotations: READ_ONLY,
    },
    async ({ finding, path, scope }) => {
      try {
        const { report, scrub } = await getReport(path, scope);
        const f = report.findings.find((x) => x.id === finding || x.fingerprint === finding);
        if (!f)
          return fail(
            new Error(`No finding "${finding}" in the latest scan. Call list_findings first.`),
          );
        const rule = RULES.find((r) => r.id === f.ruleId);
        return reply(scrub, {
          ...brief(f),
          expected: f.expected,
          risk: f.risk,
          example: f.example ?? null,
          controls: f.controls,
          policies: f.policies,
          ...(rule?.checks ? { rubricChecks: rule.checks } : {}),
          howToAccept:
            'If this risk is accepted rather than fixed, record it with `threesock baseline --fingerprint <fp>` (a human approver, reason and expiry are required).',
        });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'get_report',
    {
      title: 'Get the full report',
      description:
        'Returns the full report of the latest scan as Markdown (scorecard, findings, manual evidence checklist) or JSON.',
      inputSchema: {
        path: z.string().optional(),
        scope: scopeSchema,
        format: z.enum(['markdown', 'json']).optional(),
      },
      annotations: READ_ONLY,
    },
    async ({ path, scope, format }) => {
      try {
        const { report, scrub } = await getReport(path, scope);
        return reply(scrub, format === 'json' ? renderJson(report) : renderMarkdown(report));
      } catch (err) {
        return fail(err);
      }
    },
  );

  return server;
}

export async function startStdio(opts: McpOptions): Promise<void> {
  const server = createServer(opts);
  await server.connect(new StdioServerTransport());
}
