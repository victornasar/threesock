// SARIF 2.1.0 for GitHub code scanning (decision 29).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding, ScanReport } from '../engine/model.js';
import type { Rule, Severity } from '../engine/types.js';

const LEVEL: Record<Severity, 'error' | 'warning' | 'note'> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'note',
};

/** GitHub maps this number to its own Critical/High/Medium/Low labels. */
const SECURITY_SEVERITY: Record<Severity, string> = {
  critical: '9.5',
  high: '8.0',
  medium: '5.5',
  low: '3.0',
};

const ANCHORS = [
  'threesock.yaml',
  'threesock.yml',
  '.threesock.yaml',
  'README.md',
  'README',
  'package.json',
  'pyproject.toml',
  'go.mod',
];

/** GitHub requires a file location; repository-level findings use the most relevant existing file. */
export function anchorFor(
  root: string,
  exists: (path: string) => boolean = (p) => existsSync(join(root, p)),
): string {
  return ANCHORS.find(exists) ?? 'README.md';
}

function pascal(id: string): string {
  return (id.split('/')[1] ?? id).replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase());
}

function result(f: Finding, ruleIndex: number, anchor: string) {
  const repoLevel = !f.location.path;
  const text = `${f.title}. ${f.observed}${repoLevel ? ' (Repository-level finding; shown on this file because code scanning needs a location.)' : ''}`;
  return {
    ruleId: f.ruleId,
    ruleIndex,
    level: LEVEL[f.severity],
    message: { text },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: f.location.path ?? anchor, uriBaseId: '%SRCROOT%' },
          region: { startLine: f.location.line ?? 1 },
        },
      },
    ],
    partialFingerprints: { 'threesock/v1': f.fingerprint },
    properties: {
      findingId: f.id,
      criterion: f.criterion,
      severity: f.severity,
      dueDate: f.dueDate,
      repositoryLevel: repoLevel,
      controls: f.controls,
      policies: f.policies,
      ...(f.source ? { externalTool: f.source } : {}),
      ...(f.alsoFoundBy ? { alsoFoundBy: f.alsoFoundBy } : {}),
    },
    ...(f.status === 'accepted' && f.exception
      ? {
          suppressions: [
            {
              kind: 'external',
              status: 'accepted',
              justification: `${f.exception.justification} (approved by ${f.exception.approver}, expires ${f.exception.expires})`,
            },
          ],
        }
      : {}),
  };
}

export function renderSarif(report: ScanReport, rules: readonly Rule[]): string {
  const used = [...new Set(report.findings.map((f) => f.ruleId))].sort();
  const byId = new Map(rules.map((r) => [r.id, r]));
  const anchor = anchorFor(report.repository.root);
  const sarif = {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'threesock',
            semanticVersion: report.tool.version,
            informationUri: 'https://github.com/threesock/threesock',
            rules: used.map((id) => {
              const r = byId.get(id);
              const severity = r?.severity ?? 'medium';
              const fix = r?.remediation.example
                ? `\n\nExample:\n\n\`\`\`\n${r.remediation.example}\n\`\`\``
                : '';
              return {
                id,
                name: pascal(id),
                shortDescription: { text: r?.title ?? id },
                fullDescription: { text: r?.expected ?? '' },
                help: {
                  text: `${r?.remediation.summary ?? ''}\n\nRisk: ${r?.risk ?? ''}`,
                  markdown: `**${r?.criterion ?? ''}**: ${r?.expected ?? ''}\n\n**Risk:** ${r?.risk ?? ''}\n\n**Fix:** ${r?.remediation.summary ?? ''}${fix}`,
                },
                defaultConfiguration: { level: LEVEL[severity] },
                properties: {
                  tags: ['security', 'soc2', r?.criterion ?? ''],
                  precision: 'high',
                  'security-severity': SECURITY_SEVERITY[severity],
                  criterion: r?.criterion,
                },
              };
            }),
          },
        },
        automationDetails: { id: 'threesock/' },
        results: report.findings.map((f) => result(f, used.indexOf(f.ruleId), anchor)),
        properties: { disclaimer: report.disclaimer, schemaVersion: report.schemaVersion },
      },
    ],
  };
  return `${JSON.stringify(sarif, null, 2)}\n`;
}
