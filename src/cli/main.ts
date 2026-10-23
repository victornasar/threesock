import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { ConfigError, parseScope } from '../engine/config.js';
import { CRITERIA } from '../engine/criteria.generated.js';
import { DISCLAIMER } from '../engine/model.js';
import { nowFromEnv, scan } from '../engine/scan.js';
import { SEVERITIES, type Severity } from '../engine/types.js';
import { renderJson } from '../reports/json.js';
import { renderHtml } from '../reports/html.js';
import { renderMarkdown } from '../reports/markdown.js';
import { renderSarif } from '../reports/sarif.js';
import { renderText } from '../reports/text.js';
import { RULES } from '../rules/index.js';
import { VERSION } from '../version.js';
import { BaselineError, runBaseline } from './baseline.js';
import { isFirstRun } from './first-run.js';
import { colorEnabled } from './style.js';
import { INIT_TEMPLATE } from './init-template.js';

const FORMATS = ['text', 'json', 'markdown', 'sarif', 'html'] as const;
const IMPLEMENTED_FORMATS = new Set<string>(FORMATS);

const HELP = `threesock ${VERSION}
One extra layer of confidence before your SOC 2 audit.

Usage
  threesock scan [path]          Scan a repo and print a summary (default command)
    --scope <list>               security,availability,processing-integrity,confidentiality,privacy
    --format <fmt>               text | json | markdown | sarif | html   (default: text)
    --out <file>                 Write the report to a file instead of stdout
    --fail-on <severity>         critical | high | medium | low | none   (default: none)
    --min-readiness <percent>    Exit 1 if any in-scope category is below this readiness
    --min-assessed <count>       Exit 1 if fewer criteria than this are scored (not N/A or MANUAL)
    --config <file>              Use a specific threesock.yaml
    --github                     Enable read-only GitHub API checks (needs GITHUB_TOKEN)
    --github-repo <owner/name>   Repository to check (default: from the origin remote)
    --verbose                    List every in-scope criterion with its score
  threesock init [path]          Create threesock.yaml with scope, thresholds and owners
  threesock explain <criterion>  Explain a criterion, e.g. CC6.1
  threesock report [path]        Write the full scorecard and findings
                                 (threesock-report.md, or .html with --format html)
  threesock baseline [path]      Record accepted findings in threesock-baseline.yaml
    --approver <who> --reason <why> --expires <YYYY-MM-DD>
    --all                        Accept every open Medium and Low finding
    --fingerprint <fp>           Accept one finding (repeatable; any severity, within expiry caps)
    --prune                      Remove entries that no longer match a finding
  threesock mcp                  Start the MCP server for AI agents

Exit codes: 0 ok · 1 findings at or above --fail-on · 2 usage or configuration error

${DISCLAIMER}
`;

class UsageError extends Error {}

function fail(message: string): never {
  throw new UsageError(message);
}

interface ScanDefaults {
  format: string;
  /** Default output file name without extension; the extension follows --format. */
  outBase?: string;
}

const EXTENSIONS: Record<string, string> = {
  text: 'txt',
  json: 'json',
  markdown: 'md',
  sarif: 'sarif',
  html: 'html',
};

async function cmdScan(
  argv: string[],
  defaults: ScanDefaults = { format: 'text' },
): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      scope: { type: 'string' },
      format: { type: 'string', default: defaults.format },
      out: { type: 'string' },
      'fail-on': { type: 'string', default: 'none' },
      config: { type: 'string' },
      github: { type: 'boolean', default: false },
      'github-repo': { type: 'string' },
      verbose: { type: 'boolean', default: false },
      'min-readiness': { type: 'string' },
      'min-assessed': { type: 'string' },
    },
  });
  if (positionals.length > 1) fail('scan takes at most one path.');
  const minReadiness =
    values['min-readiness'] === undefined ? undefined : Number(values['min-readiness']);
  const minAssessed =
    values['min-assessed'] === undefined ? undefined : Number(values['min-assessed']);
  if (minReadiness !== undefined && !(minReadiness >= 0 && minReadiness <= 100))
    fail('--min-readiness must be a number from 0 to 100.');
  if (minAssessed !== undefined && !(Number.isInteger(minAssessed) && minAssessed >= 0))
    fail('--min-assessed must be a whole number.');
  const root = resolve(positionals[0] ?? '.');
  if (!existsSync(root)) fail(`path not found: ${root}`);

  const format = values.format as string;
  if (!(FORMATS as readonly string[]).includes(format))
    fail(`unknown format "${format}". Use one of: ${FORMATS.join(', ')}.`);
  if (!IMPLEMENTED_FORMATS.has(format))
    fail(`--format ${format} is not available in this version yet. Use text, json or markdown.`);

  const failOn = values['fail-on'] as string;
  if (failOn !== 'none' && !(SEVERITIES as readonly string[]).includes(failOn)) {
    fail(`unknown --fail-on "${failOn}". Use one of: ${SEVERITIES.join(', ')}, none.`);
  }
  let github: { token: string; repo?: string; apiUrl?: string } | undefined;
  if (values.github) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      fail(
        '--github needs a GITHUB_TOKEN with read access. For example: GITHUB_TOKEN=$(gh auth token) threesock scan --github',
      );
    }
    const repo = values['github-repo'];
    if (repo !== undefined && !/^[\w.-]+\/[\w.-]+$/.test(repo))
      fail('--github-repo must look like owner/name.');
    github = {
      token,
      ...(repo ? { repo } : {}),
      ...(process.env.GITHUB_API_URL ? { apiUrl: process.env.GITHUB_API_URL } : {}),
    };
  } else if (values['github-repo']) {
    fail('--github-repo only applies together with --github.');
  }

  const scope = values.scope ? parseScope(values.scope.split(',')) : undefined;
  const { report, scrub } = await scan({
    root,
    configPath: values.config,
    scope,
    rules: RULES,
    ...(github ? { github } : {}),
  });

  if (values.out === undefined && defaults.outBase)
    values.out = `${defaults.outBase}.${EXTENSIONS[format]}`;
  const toFile = values.out !== undefined;
  if (format === 'text' && !toFile && isFirstRun(Boolean(process.stdout.isTTY))) {
    process.stderr.write(`${DISCLAIMER}\n\n`);
  }
  const rendered =
    format === 'json'
      ? renderJson(report)
      : format === 'markdown'
        ? renderMarkdown(report)
        : format === 'sarif'
          ? renderSarif(report, RULES)
          : format === 'html'
            ? renderHtml(report)
            : renderText(report, { color: !toFile && colorEnabled(), verbose: values.verbose });
  const safe = scrub(rendered);
  if (toFile) {
    writeFileSync(resolve(values.out as string), safe);
    process.stderr.write(`Wrote ${format} report to ${values.out}\n`);
  } else {
    process.stdout.write(safe);
  }

  const gateFailures: string[] = [];
  for (const c of report.summary.categories.filter((x) => x.inScope)) {
    if (minReadiness !== undefined && (c.percent ?? 0) < minReadiness) {
      gateFailures.push(
        `${c.label} readiness ${c.percent ?? 0}% is below --min-readiness ${minReadiness}%.`,
      );
    }
  }
  if (minAssessed !== undefined && report.summary.overall.assessable < minAssessed) {
    gateFailures.push(
      `${report.summary.overall.assessable} criteria were scored; --min-assessed requires ${minAssessed}.`,
    );
  }
  for (const msg of gateFailures) process.stderr.write(`threesock: ${msg}\n`);

  let tripped = false;
  if (failOn !== 'none') {
    const threshold = SEVERITIES.indexOf(failOn as Severity);
    tripped = report.findings.some(
      (f) => f.status === 'open' && SEVERITIES.indexOf(f.severity) <= threshold,
    );
  }
  return tripped || gateFailures.length ? 1 : 0;
}

function cmdInit(argv: string[]): number {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { force: { type: 'boolean', default: false } },
  });
  const target = join(resolve(positionals[0] ?? '.'), 'threesock.yaml');
  if (existsSync(target) && !values.force)
    fail(`${target} already exists. Use --force to overwrite.`);
  writeFileSync(target, INIT_TEMPLATE);
  process.stdout.write(
    `Created ${target}\nEdit scope, owners and thresholds to match your policies, then run \`threesock scan\`.\n`,
  );
  return 0;
}

function cmdExplain(argv: string[]): number {
  const id = argv[0];
  if (!id) fail('explain needs a criterion id, e.g. `threesock explain CC6.1`.');
  const def = CRITERIA.find((c) => c.id.toLowerCase() === id.toLowerCase());
  if (!def) fail(`unknown criterion "${id}". Criteria run from CC1.1 to P8.1.`);
  const rules = RULES.filter((r) => r.criterion === def.id);
  const out: string[] = [];
  out.push(`${def.id} — ${def.title}  [${def.tags.join(' ')}]`);
  out.push(def.group);
  out.push('');
  out.push(`Requirement: ${def.requirement}`);
  if (def.defaultManual)
    out.push('Default: MANUAL. This criterion is evidenced mostly outside the repository.');
  if (def.checks.length) {
    out.push('');
    out.push(def.checksAreSignals ? 'Repo signals (supporting evidence):' : 'Checks:');
    for (const c of def.checks) out.push(`  - ${c.text}${c.org ? ' (ORG)' : ''}`);
  }
  if (def.redFlags) out.push('', `Red flags: ${def.redFlags}`);
  if (def.evidence) out.push('', `Evidence: ${def.evidence}`);
  out.push('');
  if (rules.length === 0) {
    out.push('threesock has no automated rules for this criterion yet; it is scored MANUAL.');
  } else {
    out.push('Automated by threesock:');
    for (const r of rules) {
      out.push(
        `  ${r.id} (${r.severity})${r.requires?.includes('github') ? ' [needs --github]' : ''}`,
      );
      out.push(`    ${r.title}`);
      out.push(`    Fix: ${r.remediation.summary}`);
    }
  }
  process.stdout.write(`${out.join('\n')}\n`);
  return 0;
}

async function cmdBaseline(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      approver: { type: 'string' },
      reason: { type: 'string' },
      expires: { type: 'string' },
      all: { type: 'boolean', default: false },
      fingerprint: { type: 'string', multiple: true, default: [] },
      prune: { type: 'boolean', default: false },
      config: { type: 'string' },
    },
  });
  if (positionals.length > 1) fail('baseline takes at most one path.');
  try {
    const result = await runBaseline({
      root: resolve(positionals[0] ?? '.'),
      configPath: values.config,
      rules: RULES,
      now: nowFromEnv(),
      approver: values.approver,
      reason: values.reason,
      expires: values.expires,
      all: values.all,
      fingerprints: values.fingerprint,
      prune: values.prune,
    });
    const lines = [
      result.added.length
        ? `Accepted ${result.added.length} finding(s) until ${values.expires}: ${result.added.map((f) => f.id).join(', ')}.`
        : '',
      result.pruned
        ? `Removed ${result.pruned} stale entr${result.pruned === 1 ? 'y' : 'ies'}.`
        : '',
      `${result.path} now holds ${result.total} entr${result.total === 1 ? 'y' : 'ies'}. Commit it so the acceptance is reviewed.`,
    ].filter(Boolean);
    process.stdout.write(`${lines.join('\n')}\n`);
    return 0;
  } catch (err) {
    if (err instanceof BaselineError) fail(err.message);
    throw err;
  }
}

function notYet(command: string): number {
  process.stderr.write(`threesock ${command} is planned but not available in this version yet.\n`);
  return 2;
}

export async function main(argv: string[]): Promise<number> {
  const [first, ...rest] = argv;
  if (first === '--help' || first === '-h' || first === 'help') {
    process.stdout.write(HELP);
    return 0;
  }
  if (first === '--version' || first === '-v') {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }
  try {
    switch (first) {
      case undefined:
        return await cmdScan([]);
      case 'scan':
        return await cmdScan(rest);
      case 'init':
        return cmdInit(rest);
      case 'explain':
        return cmdExplain(rest);
      case 'report':
        return await cmdScan(rest, { format: 'markdown', outBase: 'threesock-report' });
      case 'baseline':
        return await cmdBaseline(rest);
      case 'mcp':
        return notYet(first);
      default:
        // `threesock ./path --format json` is shorthand for scan.
        return await cmdScan(argv);
    }
  } catch (err) {
    if (err instanceof UsageError || err instanceof ConfigError) {
      process.stderr.write(`threesock: ${err.message}\n`);
      return 2;
    }
    if (
      err instanceof TypeError &&
      'code' in err &&
      String(err.code).startsWith('ERR_PARSE_ARGS')
    ) {
      process.stderr.write(`threesock: ${err.message}\nRun \`threesock --help\` for usage.\n`);
      return 2;
    }
    throw err;
  }
}
