import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isFirstRun, markerPath } from '../src/cli/first-run.js';

describe('first-run disclaimer', () => {
  it('shows once per machine, then remembers', () => {
    const home = mkdtempSync(join(tmpdir(), 'threesock-xdg-'));
    const env = { XDG_CONFIG_HOME: home };
    expect(isFirstRun(true, env)).toBe(true);
    expect(existsSync(markerPath(env))).toBe(true);
    expect(isFirstRun(true, env)).toBe(false);
    rmSync(home, { recursive: true, force: true });
  });
  it('never writes in CI or non-interactive runs', () => {
    const home = mkdtempSync(join(tmpdir(), 'threesock-xdg-'));
    expect(isFirstRun(true, { XDG_CONFIG_HOME: home, CI: 'true' })).toBe(false);
    expect(isFirstRun(false, { XDG_CONFIG_HOME: home })).toBe(false);
    expect(existsSync(markerPath({ XDG_CONFIG_HOME: home }))).toBe(false);
    rmSync(home, { recursive: true, force: true });
  });
});
