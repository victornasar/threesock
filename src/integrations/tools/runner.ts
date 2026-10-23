import { execFile } from 'node:child_process';
import type { ToolRunner } from './types.js';

/** Default runner: execFile with a timeout and no shell. */
export const execRunner: ToolRunner = (binary, args, { cwd, timeoutMs }) =>
  new Promise((resolve) => {
    execFile(
      binary,
      args,
      {
        cwd,
        timeout: timeoutMs,
        maxBuffer: 128 * 1024 * 1024,
        encoding: 'utf8',
        env: { ...process.env, NO_COLOR: '1' },
      },
      (err, stdout, stderr) => {
        const e = err as
          | (NodeJS.ErrnoException & { killed?: boolean; code?: number | string; signal?: string })
          | null;
        resolve({
          code: e ? (typeof e.code === 'number' ? e.code : null) : 0,
          stdout: stdout ?? '',
          stderr: stderr ?? '',
          timedOut: Boolean(e?.killed && e.signal === 'SIGTERM'),
          missing: e?.code === 'ENOENT',
        });
      },
    );
  });

/** First version-looking token in a tool's --version output. */
export function parseVersion(output: string): string | undefined {
  return /\bv?(\d+\.\d+(?:\.\d+)?(?:[-+][\w.]+)?)\b/.exec(output)?.[1];
}
