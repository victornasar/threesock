import { describe, expect, it } from 'vitest';
import { ConfigError, DEFAULT_THRESHOLDS, resolveConfig } from '../src/engine/config.js';
import { globToRegExp, matchesGlob } from '../src/engine/glob.js';

describe('resolveConfig', () => {
  it('defaults to security-only scope and rubric thresholds', () => {
    const c = resolveConfig({}, '/r');
    expect(c.scope).toEqual(['security']);
    expect(c.thresholds).toEqual(DEFAULT_THRESHOLDS);
  });
  it('always keeps security in scope and orders categories', () => {
    expect(resolveConfig({ scope: ['privacy', 'availability'] }, '/r').scope).toEqual([
      'security',
      'availability',
      'privacy',
    ]);
  });
  it('rejects unknown scope', () => {
    expect(() => resolveConfig({ scope: ['speed'] }, '/r')).toThrow(ConfigError);
  });
  it('overrides SLA days per severity', () => {
    expect(
      resolveConfig({ thresholds: { slaDays: { critical: 7 } } }, '/r').thresholds.slaDays,
    ).toEqual({ ...DEFAULT_THRESHOLDS.slaDays, critical: 7 });
  });
  it.each([
    [{ rule: 'x' }, /approver/],
    [{ rule: 'x', approver: 'a' }, /justification/],
    [{ rule: 'x', approver: 'a', justification: 'j' }, /expiry/],
    [{ rule: 'x', approver: 'a', justification: 'j', expires: 'next year' }, /expiry/],
    [{ approver: 'a', justification: 'j', expires: '2026-01-01' }, /rule or a fingerprint/],
  ])('rejects incomplete exceptions %j', (exc, msg) => {
    expect(() => resolveConfig({ exceptions: [exc] }, '/r')).toThrow(msg);
  });
  it('requires a written justification for N/A', () => {
    expect(() => resolveConfig({ notApplicable: { 'CC6.4': '' } }, '/r')).toThrow(/justification/);
    expect(() => resolveConfig({ notApplicable: { 'CC9.9': 'Long enough reason' } }, '/r')).toThrow(
      /not a rubric criterion/,
    );
    expect(
      resolveConfig({ notApplicable: { 'CC6.4': 'Runs entirely on AWS.' } }, '/r').notApplicable,
    ).toHaveLength(1);
  });
});

describe('glob', () => {
  it.each([
    ['src/**', 'src/a/b.ts', true],
    ['src/**', 'lib/a.ts', false],
    ['**/*.ts', 'a.ts', true],
    ['**/*.ts', 'x/y/a.ts', true],
    ['*.md', 'docs/a.md', true],
    ['/README.md', 'docs/README.md', false],
    ['test/fixtures/', 'test/fixtures/a/b', true],
    ['*.{yml,yaml}', '.github/workflows/ci.yml', true],
    ['a?c', 'abc', true],
  ])('%s matches %s: %s', (pattern, path, expected) => {
    expect(matchesGlob(path, pattern)).toBe(expected);
  });
  it('escapes regex metacharacters', () => {
    expect(globToRegExp('a.b').test('axb')).toBe(false);
  });
});
