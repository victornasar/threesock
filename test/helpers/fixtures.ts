// Materializes fixture repos into temp directories, replacing {{PLACEHOLDER}}
// tokens with fake secrets. The fakes are assembled from fragments so that no
// complete secret-shaped string exists in the committed source.
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FIXTURES = fileURLToPath(new URL('../fixtures/', import.meta.url));
export const FIXED_NOW = new Date('2026-01-15T12:00:00.000Z');

const dash = '-----';

/** Appends a Luhn check digit. */
function withLuhn(partial: string): string {
  let sum = 0;
  for (let i = 0; i < partial.length; i++) {
    let d = Number(partial[partial.length - 1 - i]);
    if (i % 2 === 0) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return partial + String((10 - (sum % 10)) % 10);
}
export const FAKE_SECRETS: Record<string, string> = {
  AWS_KEY: ['AK', 'IA', 'Q7RZ3XK2M9PLW4TB'].join(''),
  GITHUB_TOKEN: ['gh', 'p_', 'R8sLq2VxN4mT7wKc9ZbH3yJd6FgPa1Ue5Xo0'].join(''),
  STRIPE_KEY: ['sk', '_live_', '4fTq9LmZ2xRw8VcN1bKp7HsJ'].join(''),
  DB_PASSWORD: ['Vq8', 'zL2r', 'Wm5nT'].join(''),
  // Generated so no personal-data-shaped value is committed (see c1.1/pii-in-fixtures).
  CARD_NUMBER: withLuhn('45320151128303'),
  CONSUMER_EMAIL: ['fixture', '.only', '@', 'gmail', '.com'].join(''),
  SSN: ['078', '05', '1120'].join('-'), // the published, long-invalidated "Woolworth" SSN
  PRIVATE_KEY: [
    `${dash}BEGIN RSA ${'PRIVATE'} KEY${dash}`,
    'MIIEpAIBAAKCAQEA3Tz2mR5Lq9VxN4mT7wKc9ZbH3yJd6FgPa1Ue5Xo0R8sLq2Vx',
    'N4mT7wKc9ZbH3yJd6FgPa1Ue5Xo0R8sLq2VxN4mT7wKc9ZbH3yJd6FgPa1Ue5Xo0',
    `${dash}END RSA ${'PRIVATE'} KEY${dash}`,
  ].join('\n'),
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

export interface Materialized {
  dir: string;
  /** Secret values that were written into the fixture. */
  secrets: string[];
}

/** Copies a fixture to a temp dir, fills placeholders, and stages it in a fresh git repo. */
export function materialize(name: string, opts: { git?: boolean } = {}): Materialized {
  const dir = mkdtempSync(join(tmpdir(), `threesock-${name}-`));
  cpSync(join(FIXTURES, name), dir, { recursive: true });
  // Fixture .env files are stored as dot.env so the repo's .gitignore doesn't drop them.
  for (const file of walk(dir)) {
    if (file.endsWith('/dot.env')) renameSync(file, file.replace(/dot\.env$/, '.env'));
  }
  const used = new Set<string>();
  for (const file of walk(dir)) {
    const text = readFileSync(file, 'utf8');
    if (!text.includes('{{')) continue;
    const filled = text.replace(/\{\{([A-Z_]+)\}\}/g, (m, key: string) => {
      const value = FAKE_SECRETS[key];
      if (!value) return m;
      used.add(value);
      return value;
    });
    writeFileSync(file, filled);
  }
  if (opts.git !== false) {
    execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
    execFileSync('git', ['add', '-A'], { cwd: dir });
  }
  return { dir, secrets: [...used] };
}

/** Replaces the temp path so reports can be compared across machines. */
export function normalizeRoot(text: string, dir: string): string {
  return text.split(dir).join('<root>');
}
