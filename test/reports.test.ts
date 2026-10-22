import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { scan, type ScanOutput } from '../src/engine/scan.js';
import { renderJson } from '../src/reports/json.js';
import { renderText } from '../src/reports/text.js';
import { RULES } from '../src/rules/index.js';
import { VERSION } from '../src/version.js';
import { FIXED_NOW, materialize, normalizeRoot, type Materialized } from './helpers/fixtures.js';

const GOLDEN = new URL('./golden/insecure-app.json', import.meta.url);

let insecure: Materialized;
let compliant: Materialized;
let bad: ScanOutput;
let good: ScanOutput;

function normalize(text: string, dir: string): string {
  return normalizeRoot(text, dir)
    .split(`"version": "${VERSION}"`)
    .join('"version": "<version>"')
    .replace(/threesock \d+\.\d+\.\d+\S*/, 'threesock <version>');
}

beforeAll(async () => {
  insecure = materialize('insecure-app');
  compliant = materialize('compliant-app');
  bad = await scan({ root: insecure.dir, rules: RULES, now: FIXED_NOW });
  good = await scan({ root: compliant.dir, rules: RULES, now: FIXED_NOW });
});
afterAll(() => {
  rmSync(insecure.dir, { recursive: true, force: true });
  rmSync(compliant.dir, { recursive: true, force: true });
});

describe('golden JSON report for the insecure fixture', () => {
  it('matches test/golden/insecure-app.json (UPDATE_GOLDEN=1 to regenerate)', () => {
    const actual = normalize(bad.scrub(renderJson(bad.report)), insecure.dir);
    if (process.env.UPDATE_GOLDEN || !existsSync(GOLDEN)) {
      mkdirSync(new URL('./golden/', import.meta.url), { recursive: true });
      writeFileSync(GOLDEN, actual);
    }
    expect(actual).toBe(readFileSync(GOLDEN, 'utf8'));
  });
  it('declares a schema version', () => {
    expect(bad.report.schemaVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('report snapshots', () => {
  it('text: insecure', async () => {
    await expect(normalize(bad.scrub(renderText(bad.report)), insecure.dir)).toMatchFileSnapshot(
      '__snapshots__/insecure.txt',
    );
  });
  it('text: insecure, verbose', async () => {
    await expect(
      normalize(bad.scrub(renderText(bad.report, { verbose: true })), insecure.dir),
    ).toMatchFileSnapshot('__snapshots__/insecure-verbose.txt');
  });
  it('text: compliant (empty state)', async () => {
    const text = normalize(good.scrub(renderText(good.report)), compliant.dir);
    expect(text).toContain('Socks on. No gaps found in this scope.');
    await expect(text).toMatchFileSnapshot('__snapshots__/compliant.txt');
  });
  it('json: compliant', async () => {
    await expect(normalize(good.scrub(renderJson(good.report)), compliant.dir)).toMatchFileSnapshot(
      '__snapshots__/compliant.json',
    );
  });
});

describe('secret values never appear in output', () => {
  it('in any report format, with or without color', () => {
    const outputs = [
      renderJson(bad.report),
      renderText(bad.report),
      renderText(bad.report, { color: true, verbose: true, maxFindings: 1000 }),
    ];
    for (const out of outputs) {
      for (const secret of insecure.secrets) {
        expect(out).not.toContain(secret);
        // At most the first 4 characters may be shown: no 6-character window of the rest may appear.
        for (const line of secret.split('\n').filter((l) => !l.startsWith('-----'))) {
          for (let i = 4; i + 6 <= line.length; i++)
            expect(out).not.toContain(line.slice(i, i + 6));
        }
      }
    }
  });
  it('scrub() replaces any registered secret that slips into output', () => {
    const leaked = `oops ${insecure.secrets[0]}`;
    expect(bad.scrub(leaked)).not.toContain(insecure.secrets[0]);
  });
});
