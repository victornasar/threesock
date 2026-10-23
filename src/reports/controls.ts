// Groups open findings by the internal controls and policies they affect.
import type { Finding, ScanReport } from '../engine/model.js';

export interface ControlImpact {
  name: string;
  findings: Finding[];
  criteria: string[];
}

function impacts(findings: readonly Finding[], key: 'controls' | 'policies'): ControlImpact[] {
  const by = new Map<string, Finding[]>();
  for (const f of findings) for (const name of f[key]) by.set(name, [...(by.get(name) ?? []), f]);
  return [...by.entries()]
    .map(([name, fs]) => ({
      name,
      findings: fs,
      criteria: [...new Set(fs.map((f) => f.criterion))],
    }))
    .sort((a, b) => b.findings.length - a.findings.length || a.name.localeCompare(b.name));
}

export function controlImpacts(report: ScanReport): {
  controls: ControlImpact[];
  policies: ControlImpact[];
} {
  const open = report.findings.filter((f) => f.status === 'open');
  return { controls: impacts(open, 'controls'), policies: impacts(open, 'policies') };
}
