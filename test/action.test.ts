import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const text = readFileSync('action/action.yml', 'utf8');
const action = parse(text) as {
  inputs: Record<string, { default?: string }>;
  runs: { using: string; steps: { uses?: string; run?: string; env?: Record<string, string> }[] };
};
const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

describe('GitHub Action', () => {
  it('is a composite action whose default version matches package.json', () => {
    expect(action.runs.using).toBe('composite');
    expect(action.inputs.version?.default).toBe(pkg.version);
  });
  it('pins every action it uses to a commit SHA', () => {
    for (const s of action.runs.steps.filter((x) => x.uses))
      expect(s.uses).toMatch(/@[0-9a-f]{40}$/);
  });
  it('never interpolates expressions into shell scripts', () => {
    for (const s of action.runs.steps.filter((x) => x.run)) expect(s.run).not.toMatch(/\$\{\{/);
  });
  it('passes every input it uses through the environment', () => {
    const env = action.runs.steps.flatMap((s) => Object.values(s.env ?? {})).join('\n');
    for (const name of [
      'path',
      'scope',
      'fail-on',
      'tools',
      'network',
      'version',
      'github-checks',
      'min-readiness',
      'min-assessed',
      'token',
    ]) {
      expect(env, name).toContain(`inputs.${name}`);
    }
  });
  it('runs threesock at an exact version, never latest', () => {
    expect(text).toContain('npx --yes "threesock@$TS_VERSION"');
    expect(text).not.toMatch(/threesock@latest/);
  });
});
