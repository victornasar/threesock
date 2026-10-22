import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parse } from 'yaml';
import { CRITERIA } from './criteria.generated.js';
import {
  CATEGORIES,
  SEVERITIES,
  type Category,
  type ExceptionEntry,
  type NotApplicableEntry,
  type OwnerEntry,
  type ResolvedConfig,
  type Threshold,
} from './types.js';

export const CONFIG_FILENAMES = ['threesock.yaml', 'threesock.yml', '.threesock.yaml'];

/** Rubric 1.3 (severity SLAs) and 1.4 (thresholds). */
export const DEFAULT_THRESHOLDS: Threshold = {
  requiredApprovals: 1,
  sensitivePathApprovals: 2,
  minTlsVersion: '1.2',
  slaDays: { critical: 1, high: 30, medium: 90, low: 180 },
  logRetentionDays: 365,
  secretRotationDays: 90,
  dsarResponseDays: 30,
};

/** Security-sensitive paths (decision 17 in docs/design.md). */
export const DEFAULT_SENSITIVE_PATHS: readonly string[] = [
  '**/auth/**',
  '**/authn/**',
  '**/authz/**',
  '**/authentication/**',
  '**/authorization/**',
  '**/iam/**',
  '**/crypto/**',
  '**/security/**',
  '**/payment/**',
  '**/payments/**',
  '**/billing/**',
  '**/infra/**',
  '**/infrastructure/**',
  '**/terraform/**',
  '**/*.tf',
  '.github/workflows/**',
  '**/migrations/**',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
  '**/go.sum',
  '**/poetry.lock',
  '**/uv.lock',
];

export class ConfigError extends Error {
  constructor(
    message: string,
    readonly file?: string,
  ) {
    super(file ? `${file}: ${message}` : message);
    this.name = 'ConfigError';
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CRITERION_IDS = new Set(CRITERIA.map((c) => c.id));

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;
}

export function findConfig(root: string): string | undefined {
  for (const name of CONFIG_FILENAMES) {
    const p = join(root, name);
    if (existsSync(p)) return p;
  }
  return undefined;
}

export function parseScope(values: readonly string[], file?: string): Category[] {
  const scope = new Set<Category>(['security']);
  for (const raw of values) {
    const v = raw.trim().toLowerCase();
    if (!v) continue;
    if (!(CATEGORIES as readonly string[]).includes(v)) {
      throw new ConfigError(`unknown scope "${raw}". Use one of: ${CATEGORIES.join(', ')}.`, file);
    }
    scope.add(v as Category);
  }
  return CATEGORIES.filter((c) => scope.has(c));
}

/** Validates raw YAML data into a ResolvedConfig. Throws ConfigError with a clear message. */
export function resolveConfig(raw: unknown, configDir: string, file?: string): ResolvedConfig {
  const input = raw ?? {};
  if (!isRecord(input)) throw new ConfigError('expected a YAML mapping at the top level.', file);
  // A key whose entries are all commented out parses as null; treat it as unset.
  const data = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== null));

  if (data.version !== undefined && data.version !== 1) {
    throw new ConfigError(`unsupported version ${String(data.version)}; expected 1.`, file);
  }

  const scopeRaw = data.scope ?? [];
  if (!Array.isArray(scopeRaw)) throw new ConfigError('scope must be a list.', file);
  const scope = parseScope(scopeRaw.map(String), file);

  const thresholds: Threshold = {
    ...DEFAULT_THRESHOLDS,
    slaDays: { ...DEFAULT_THRESHOLDS.slaDays },
  };
  if (data.thresholds !== undefined) {
    if (!isRecord(data.thresholds)) throw new ConfigError('thresholds must be a mapping.', file);
    const t = data.thresholds;
    for (const key of [
      'requiredApprovals',
      'sensitivePathApprovals',
      'logRetentionDays',
      'secretRotationDays',
      'dsarResponseDays',
    ] as const) {
      if (t[key] === undefined) continue;
      if (typeof t[key] !== 'number' || (t[key] as number) < 0) {
        throw new ConfigError(`thresholds.${key} must be a non-negative number.`, file);
      }
      thresholds[key] = t[key] as number;
    }
    if (t.minTlsVersion !== undefined) {
      const v = String(t.minTlsVersion);
      if (!['1.2', '1.3'].includes(v)) {
        throw new ConfigError('thresholds.minTlsVersion must be "1.2" or "1.3".', file);
      }
      thresholds.minTlsVersion = v;
    }
    if (t.slaDays !== undefined) {
      if (!isRecord(t.slaDays))
        throw new ConfigError('thresholds.slaDays must be a mapping.', file);
      for (const [sev, days] of Object.entries(t.slaDays)) {
        if (!(SEVERITIES as readonly string[]).includes(sev)) {
          throw new ConfigError(`thresholds.slaDays.${sev} is not a severity.`, file);
        }
        if (typeof days !== 'number' || days < 0) {
          throw new ConfigError(`thresholds.slaDays.${sev} must be a non-negative number.`, file);
        }
        thresholds.slaDays[sev as keyof Threshold['slaDays']] = days;
      }
    }
  }

  const owners: OwnerEntry[] = [];
  if (data.owners !== undefined) {
    if (!isRecord(data.owners)) {
      throw new ConfigError(
        'owners must be a mapping of path glob or criterion id to owner.',
        file,
      );
    }
    for (const [match, owner] of Object.entries(data.owners)) {
      const o = str(owner);
      if (!o) throw new ConfigError(`owners.${match} must be a non-empty string.`, file);
      owners.push({ match, owner: o });
    }
  }

  const ignore: string[] = [];
  if (data.ignore !== undefined) {
    if (!Array.isArray(data.ignore)) throw new ConfigError('ignore must be a list of globs.', file);
    for (const g of data.ignore) {
      const s = str(g);
      if (!s) throw new ConfigError('ignore entries must be non-empty strings.', file);
      ignore.push(s);
    }
  }

  const notApplicable: NotApplicableEntry[] = [];
  if (data.notApplicable !== undefined) {
    if (!isRecord(data.notApplicable)) {
      throw new ConfigError(
        'notApplicable must be a mapping of criterion id to justification.',
        file,
      );
    }
    for (const [criterion, justification] of Object.entries(data.notApplicable)) {
      if (!CRITERION_IDS.has(criterion)) {
        throw new ConfigError(`notApplicable.${criterion} is not a rubric criterion.`, file);
      }
      const j = str(justification);
      if (!j || j.length < 10) {
        throw new ConfigError(
          `notApplicable.${criterion} needs a written justification (rubric 1.1).`,
          file,
        );
      }
      notApplicable.push({ criterion, justification: j });
    }
  }

  const exceptions: ExceptionEntry[] = [];
  if (data.exceptions !== undefined) {
    if (!Array.isArray(data.exceptions)) throw new ConfigError('exceptions must be a list.', file);
    data.exceptions.forEach((e, i) => {
      const at = `exceptions[${i}]`;
      if (!isRecord(e)) throw new ConfigError(`${at} must be a mapping.`, file);
      const rule = str(e.rule);
      const fingerprint = str(e.fingerprint);
      if (!rule && !fingerprint)
        throw new ConfigError(`${at} needs a rule or a fingerprint.`, file);
      const approver = str(e.approver);
      const justification = str(e.justification);
      const expires =
        e.expires instanceof Date ? e.expires.toISOString().slice(0, 10) : str(e.expires);
      if (!approver) throw new ConfigError(`${at} needs an approver (rubric CC4.2).`, file);
      if (!justification)
        throw new ConfigError(`${at} needs a justification (rubric CC4.2).`, file);
      if (!expires || !ISO_DATE.test(expires)) {
        throw new ConfigError(`${at} needs an expiry date as YYYY-MM-DD (rubric CC4.2).`, file);
      }
      const entry: ExceptionEntry = { approver, justification, expires };
      if (rule) entry.rule = rule;
      if (fingerprint) entry.fingerprint = fingerprint;
      const path = str(e.path);
      if (path) entry.path = path;
      exceptions.push(entry);
    });
  }

  let sensitivePaths = [...DEFAULT_SENSITIVE_PATHS];
  if (data.sensitivePaths !== undefined) {
    if (!Array.isArray(data.sensitivePaths) || data.sensitivePaths.some((g) => !str(g))) {
      throw new ConfigError('sensitivePaths must be a list of non-empty globs.', file);
    }
    sensitivePaths = data.sensitivePaths.map((g) => String(g).trim());
  }

  const config: ResolvedConfig = {
    configDir,
    scope,
    thresholds,
    owners,
    ignore,
    notApplicable,
    exceptions,
    sensitivePaths,
  };
  if (file) config.configPath = file;
  const mappings = str(data.mappings);
  if (mappings) config.mappingsPath = resolve(configDir, mappings);
  return config;
}

export function loadConfig(root: string, explicitPath?: string): ResolvedConfig {
  const file = explicitPath ? resolve(explicitPath) : findConfig(root);
  if (!file) return resolveConfig({}, root);
  if (!existsSync(file)) throw new ConfigError('config file not found.', file);
  let raw: unknown;
  try {
    raw = parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new ConfigError(`invalid YAML: ${(err as Error).message}`, file);
  }
  return resolveConfig(raw, dirname(file), file);
}
