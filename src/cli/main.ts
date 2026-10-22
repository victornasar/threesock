import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { ConfigError, parseScope } from '../engine/config.js';
import { CRITERIA } from '../engine/criteria.generated.js';
import { DISCLAIMER } from '../engine/model.js';
import { scan } from '../engine/scan.js';
import { SEVERITIES, type Severity } from '../engine/types.js';
import { renderJson } from '../reports/json.js';
import { renderMarkdown } from '../reports/markdown.js';
import { renderText } from '../reports/text.js';
import { RULES } from '../rules/index.js';
import { VERSION } from '../version.js';
import { isFirstRun } from './first-run.js';
import { colorEnabled } from './style.js';
import { INIT_TEMPLATE } from './init-template.js';

const FORMATS = ['text', 'json', 'markdown', 'sarif', 'html'] as const;
const IMPLEMENTED_FORMATS = new Set(['text', 'json', 'markdown']);

const HELP = `threesock ${VERSION}
One extra layer of confidence before your SOC 2 audit.

Usage
  threesock scan [path]          Scan a repo and print a summary (default command)
    --scope <list>               security,availability,processing-integrity,confidentiality,privacy
    --format <fmt>               text | json | markdown | sarif | html   (default: text)
    --out <file>                 Write the report to a file instead of stdout
    --fail-on <severity>         critical | high | medium | low | none   (default: none)
    --config <file>              Use a specific threesock.yaml
    --github                     Enable GitHub API checks (needs GITHUB_TOKEN)
    --verbose                    List every in-scope criterion with its score
  threesock init [path]          Create threesock.yaml with scope, thresholds and owners
  threesock explain <criterion>  Explain a criterion, e.g. CC6.1
  threesock report [path]        Write the full scorecard and findings (default: threesock-report.md)
  threesock baseline             Record accepted findings with approver, reason and expiry
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
  out?: string;
}

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
      out: { type: 'string', default: defaults.out },
      'fail-on': { type: 'string', default: 'none' },
      config: { type: 'string' },
      github: { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
    },
  });
  if (positionals.length > 1) fail('scan takes at most one path.');
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
  if (values.github) {
    process.stderr.write(
      'Note: GitHub API checks are not available in this version yet; continuing with file-based checks.\n',
    );
  }

  const scope = values.scope ? parseScope(values.scope.split(',')) : undefined;
  const { report, scrub } = await scan({ root, configPath: values.config, scope, rules: RULES });

  const toFile = values.out !== undefined;
  if (format === 'text' && !toFile && isFirstRun(Boolean(process.stdout.isTTY))) {
    process.stderr.write(`${DISCLAIMER}\n\n`);
  }
  const rendered =
    format === 'json'
      ? renderJson(report)
      : format === 'markdown'
        ? renderMarkdown(report)
        : renderText(report, { color: !toFile && colorEnabled(), verbose: values.verbose });
  const safe = scrub(rendered);
  if (toFile) {
    writeFileSync(resolve(values.out as string), safe);
    process.stderr.write(`Wrote ${format} report to ${values.out}\n`);
  } else {
    process.stdout.write(safe);
  }

  if (failOn === 'none') return 0;
  const threshold = SEVERITIES.indexOf(failOn as Severity);
  const tripped = report.findings.some(
    (f) => f.status === 'open' && SEVERITIES.indexOf(f.severity) <= threshold,
  );
  return tripped ? 1 : 0;
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
      out.push(`  ${r.id} (${r.severity})`);
      out.push(`    ${r.title}`);
      out.push(`    Fix: ${r.remediation.summary}`);
    }
  }
  process.stdout.write(`${out.join('\n')}\n`);
  return 0;
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
        return await cmdScan(rest, { format: 'markdown', out: 'threesock-report.md' });
      case 'baseline':
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
