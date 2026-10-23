import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan } from '../src/engine/scan.js';
import { RULES } from '../src/rules/index.js';
import { describe, expect, it } from 'vitest';
import { CRITERIA } from '../src/engine/criteria.generated.js';
import { ConfigError } from '../src/engine/config.js';
import { loadMapping, parseMapping } from '../src/engine/mappings.js';

describe('default control and policy mapping', () => {
  const m = loadMapping();

  it('uses the catalogue from COMPLIANCE_QUESTIONS.txt without the company name', () => {
    const lines = readFileSync('docs/rubric/COMPLIANCE_QUESTIONS.txt', 'utf8')
      .split('\n')
      .map((l) => l.trim());
    expect(m.controls).toEqual(lines.slice(4, 39));
    expect(m.policies).toEqual(lines.slice(41, 66));
    expect(readFileSync('mappings/controls.yaml', 'utf8')).not.toMatch(/Rational/);
  });

  it('maps every criterion, and uses every control and policy at least once', () => {
    expect(Object.keys(m.criteria).sort()).toEqual(CRITERIA.map((c) => c.id).sort());
    const usedControls = new Set(Object.values(m.criteria).flatMap((c) => c.controls));
    const usedPolicies = new Set(Object.values(m.criteria).flatMap((c) => c.policies));
    expect(m.controls.filter((c) => !usedControls.has(c))).toEqual([]);
    expect(m.policies.filter((p) => !usedPolicies.has(p))).toEqual([]);
  });

  it('links CC8.1 to change management, as the brief requires', () => {
    expect(m.criteria['CC8.1']?.controls).toEqual(
      expect.arrayContaining(['Change management', 'Secure SDLC Integration']),
    );
    expect(m.criteria['CC8.1']?.policies).toContain('Change & Release Management');
  });
});

describe('custom mappings', () => {
  it('rejects names that are not in the catalogue', () => {
    const text =
      'version: 1\ncontrols: [A]\npolicies: [P]\ncriteria:\n  CC8.1: { controls: [B] }\n';
    expect(() => parseMapping(text, 'x.yaml')).toThrow(ConfigError);
    expect(() => parseMapping(text, 'x.yaml')).toThrow(/"B" is not in controls/);
  });
  it('accepts a partial mapping of your own catalogue', () => {
    const m = parseMapping(
      'version: 1\nname: Acme\ncontrols: [Peer review]\npolicies: [SDLC]\ncriteria:\n  CC8.1: { controls: [Peer review], policies: [SDLC] }\n',
      'x.yaml',
    );
    expect(m).toMatchObject({
      name: 'Acme',
      criteria: { 'CC8.1': { controls: ['Peer review'], policies: ['SDLC'] } },
    });
  });
});

describe('mappings in threesock.yaml', () => {
  it('replaces the default catalogue for findings and reports', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'threesock-map-'));
    writeFileSync(
      join(dir, 'acme-controls.yaml'),
      'version: 1\nname: Acme controls\ncontrols: [AC-7 Disclosure]\npolicies: [Security Policy]\ncriteria:\n  CC2.3: { controls: [AC-7 Disclosure], policies: [Security Policy] }\n',
    );
    writeFileSync(join(dir, 'threesock.yaml'), 'mappings: ./acme-controls.yaml\n');
    const { report } = await scan({
      root: dir,
      rules: RULES,
      now: new Date('2026-01-15T00:00:00Z'),
    });
    expect(report.mapping.name).toBe('Acme controls');
    expect(report.findings.find((f) => f.ruleId === 'cc2.3/security-policy')).toMatchObject({
      controls: ['AC-7 Disclosure'],
      policies: ['Security Policy'],
    });
    expect(report.findings.find((f) => f.ruleId === 'cc1.3/codeowners')?.controls).toEqual([]);
    rmSync(dir, { recursive: true, force: true });
  });
});
