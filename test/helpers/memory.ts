// In-memory repositories for focused rule tests.
import { resolveConfig } from '../../src/engine/config.js';
import { matchesGlob } from '../../src/engine/glob.js';
import { SecretVault } from '../../src/engine/redact.js';
import type { FileIndex, Rule, RuleContext, RuleOutcome } from '../../src/engine/types.js';

export function memoryIndex(files: Record<string, string>): FileIndex {
  const list = Object.keys(files)
    .sort()
    .map((path) => ({ path, size: (files[path] ?? '').length, tracked: true }));
  return {
    root: '/memory',
    files: list,
    isGitRepo: true,
    has: (p) => p in files,
    glob: (patterns) => list.filter((f) => matchesGlob(f.path, patterns)),
    read: (p) => files[p],
  };
}

export function memoryContext(
  files: Record<string, string>,
  config: Record<string, unknown> = {},
): RuleContext {
  return {
    files: memoryIndex(files),
    config: resolveConfig(config, '/memory'),
    secrets: new SecretVault(),
  };
}

/** Runs one rule against an in-memory repo. */
export async function run(
  rule: Rule,
  files: Record<string, string>,
  config?: Record<string, unknown>,
): Promise<RuleOutcome> {
  return rule.detect(memoryContext(files, config));
}

export function titles(outcome: RuleOutcome): string[] {
  return outcome.status === 'fail' ? outcome.findings.map((f) => f.title ?? '') : [];
}
