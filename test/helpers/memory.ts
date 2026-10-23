// In-memory repositories for focused rule tests.
import { resolveConfig } from '../../src/engine/config.js';
import type { GitCommit, GitHistory } from '../../src/engine/git.js';
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

const NO_HISTORY: GitHistory = { available: false, shallow: false, commits: [] };

export function memoryContext(
  files: Record<string, string>,
  config: Record<string, unknown> = {},
  git: GitHistory = NO_HISTORY,
): RuleContext {
  return {
    files: memoryIndex(files),
    config: resolveConfig(config, '/memory'),
    secrets: new SecretVault(),
    git: () => git,
    now: new Date('2026-01-15T12:00:00Z'),
  };
}

/** Runs one rule against an in-memory repo. */
export async function run(
  rule: Rule,
  files: Record<string, string>,
  config?: Record<string, unknown>,
  git?: GitHistory,
): Promise<RuleOutcome> {
  return rule.detect(memoryContext(files, config, git));
}

/** Builds a commit for history tests. */
export function commit(over: Partial<GitCommit> & { sha: string }): GitCommit {
  return {
    authorEmail: 'dev@company.example',
    parents: 1,
    subject: 'Change things',
    signed: false,
    ...over,
  };
}

export function titles(outcome: RuleOutcome): string[] {
  return outcome.status === 'fail' ? outcome.findings.map((f) => f.title ?? '') : [];
}
