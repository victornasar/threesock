// Control and policy mapping (decision 33): which internal controls and policies
// each SOC 2 criterion supports. The default lives in mappings/controls.yaml;
// `mappings:` in threesock.yaml points at a replacement with the same shape.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { ConfigError } from './config.js';
import { CRITERIA } from './criteria.generated.js';

export interface ControlMapping {
  name: string;
  source: string;
  controls: string[];
  policies: string[];
  criteria: Record<string, { controls: string[]; policies: string[] }>;
}

export const DEFAULT_MAPPING_PATH = fileURLToPath(
  new URL('../../mappings/controls.yaml', import.meta.url),
);

function strings(value: unknown, what: string, file: string): string[] {
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || !v.trim())) {
    throw new ConfigError(`${what} must be a list of names.`, file);
  }
  return value.map((v: string) => v.trim());
}

export function parseMapping(text: string, file: string): ControlMapping {
  let raw: unknown;
  try {
    raw = parse(text);
  } catch (err) {
    throw new ConfigError(`invalid YAML: ${(err as Error).message}`, file);
  }
  const data = (raw ?? {}) as Record<string, unknown>;
  if (data.version !== 1) throw new ConfigError('mapping version must be 1.', file);
  const controls = strings(data.controls, 'controls', file);
  const policies = strings(data.policies, 'policies', file);
  const known = new Set(CRITERIA.map((c) => c.id));
  const criteria: ControlMapping['criteria'] = {};
  const entries =
    data.criteria && typeof data.criteria === 'object'
      ? Object.entries(data.criteria as object)
      : [];
  for (const [id, value] of entries) {
    if (!known.has(id)) throw new ConfigError(`criteria.${id} is not a rubric criterion.`, file);
    const v = (value ?? {}) as Record<string, unknown>;
    const c = v.controls === undefined ? [] : strings(v.controls, `criteria.${id}.controls`, file);
    const p = v.policies === undefined ? [] : strings(v.policies, `criteria.${id}.policies`, file);
    for (const name of c)
      if (!controls.includes(name))
        throw new ConfigError(`criteria.${id}: "${name}" is not in controls.`, file);
    for (const name of p)
      if (!policies.includes(name))
        throw new ConfigError(`criteria.${id}: "${name}" is not in policies.`, file);
    criteria[id] = { controls: c, policies: p };
  }
  return {
    name: typeof data.name === 'string' ? data.name : 'custom catalogue',
    source: file,
    controls,
    policies,
    criteria,
  };
}

export function loadMapping(path: string = DEFAULT_MAPPING_PATH): ControlMapping {
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    throw new ConfigError('mapping file not found.', path);
  }
  return parseMapping(text, path);
}
