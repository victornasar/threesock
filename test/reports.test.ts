import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { scan, type ScanOutput } from '../src/engine/scan.js';
import { renderJson } from '../src/reports/json.js';
import { renderMarkdown } from '../src/reports/markdown.js';
import { renderHtml } from '../src/reports/html.js';
import { renderSarif } from '../src/reports/sarif.js';
import { renderText } from '../src/reports/text.js';
import { RULES } from '../src/rules/index.js';
import { CATEGORIES } from '../src/engine/types.js';
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
  bad = await scan({ root: insecure.dir, rules: RULES, now: FIXED_NOW, scope: [...CATEGORIES] });
  good = await scan({ root: compliant.dir, rules: RULES, now: FIXED_NOW, scope: [...CATEGORIES] });
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
  it('markdown: insecure', async () => {
    await expect(
      normalize(bad.scrub(renderMarkdown(bad.report)), insecure.dir),
    ).toMatchFileSnapshot('__snapshots__/insecure.md');
  });
  it('markdown: compliant', async () => {
    await expect(
      normalize(good.scrub(renderMarkdown(good.report)), compliant.dir),
    ).toMatchFileSnapshot('__snapshots__/compliant.md');
  });
  it('markdown follows the Appendix B finding template and lists all 61 criteria', () => {
    const md = renderMarkdown(bad.report);
    for (const field of [
      'Finding ID:',
      'Criterion:',
      'Severity:',
      'Location:',
      'Observed:',
      'Expected:',
      'Risk:',
      'Recommendation:',
      'Owner:',
      'Due date:',
      'Status:',
      'Verification:',
    ]) {
      expect(md).toContain(field);
    }
    expect(md.match(/^\| (?:CC|A|PI|C|P)\d+\.\d+ \|/gm)).toHaveLength(61);
  });
  it('sarif: insecure', async () => {
    await expect(
      normalize(bad.scrub(renderSarif(bad.report, RULES)), insecure.dir),
    ).toMatchFileSnapshot('__snapshots__/insecure.sarif');
  });
  it('html: insecure (inline assets elided)', async () => {
    const html = normalize(bad.scrub(renderHtml(bad.report)), insecure.dir).replace(
      /data:[\w/+.-]+;base64,[A-Za-z0-9+/=]+/g,
      'data:<elided>',
    );
    await expect(html).toMatchFileSnapshot('__snapshots__/insecure.html');
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
      renderMarkdown(bad.report),
      renderSarif(bad.report, RULES),
      renderHtml(bad.report),
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

describe('markdown table escaping', () => {
  it('escapes backslashes before pipes, so a trailing \\ cannot unescape a cell separator', () => {
    const report = structuredClone(bad.report);
    const target = report.criteria[0];
    if (target) target.title = 'odd \\| title';
    const row =
      renderMarkdown(report)
        .split('\n')
        .find((l) => l.startsWith(`| ${target?.id} |`)) ?? '';
    expect(row).toContain('odd \\\\\\| title');
    expect(row.split(/(?<!\\)\|/).length).toBe(9); // 7 cells, plus the empty edges
  });
});
