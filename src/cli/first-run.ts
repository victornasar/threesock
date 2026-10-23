// Shows the full disclaimer once per machine (decision 19 in docs/design.md).
// This marker is the only file threesock writes outside the scanned repository.
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function markerPath(env: NodeJS.ProcessEnv = process.env): string {
  const base = env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(base, 'threesock', 'first-run-acknowledged');
}

/** True when this is the first interactive run on this machine (and records it). */
export function isFirstRun(interactive: boolean, env: NodeJS.ProcessEnv = process.env): boolean {
  const ci = Boolean(env.CI) && env.CI !== 'false';
  if (ci || !interactive) return false;
  const marker = markerPath(env);
  try {
    mkdirSync(join(marker, '..'), { recursive: true });
    // 'wx' fails if the marker exists, so check and create are one atomic step.
    writeFileSync(marker, `Disclaimer shown ${new Date().toISOString()}\n`, { flag: 'wx' });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') return false;
    // Read-only home: show the disclaimer every time rather than fail.
  }
  return true;
}
