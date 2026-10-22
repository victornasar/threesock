import type { Rule } from '../../engine/types.js';
import { ciConfigs } from '../lib/build-files.js';
import { findAny } from '../util.js';

const BOTS = [
  '.github/dependabot.yml',
  '.github/dependabot.yaml',
  'renovate.json',
  'renovate.json5',
  '.renovaterc',
  '.renovaterc.json',
  '.github/renovate.json',
  '.github/renovate.json5',
];
const SCANNERS =
  /dependency-review-action|osv-scanner|\bsnyk\b|(?:npm|pnpm|yarn|bun)\s+audit|pip-audit|\bsafety\s+check|govulncheck|\btrivy\b|\bgrype\b|owasp\/dependency-check|socket(?:dev)?\b/i;

export const dependencyScanning: Rule = {
  id: 'cc6.8/dependency-scanning',
  criterion: 'CC6.8',
  title: 'Dependencies are scanned for known vulnerabilities',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Dependency and container scanning in CI'],
  expected:
    'Dependabot or Renovate keeps dependencies current, and a vulnerability scan (dependency review, OSV-Scanner, npm audit, pip-audit, govulncheck) runs in CI.',
  risk: 'Known-vulnerable dependencies are the most common way attackers get in, and they are only fixed if someone notices.',
  remediation: {
    summary: 'Enable Dependabot (or Renovate) and add a dependency scan to pull-request CI.',
    example: `# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }`,
  },
  detect(ctx) {
    const bot = BOTS.find((b) => ctx.files.has(b));
    const scan = findAny(ctx.files, ciConfigs(ctx.files), SCANNERS);
    const evidence = [
      ...(bot
        ? [
            {
              kind: 'file' as const,
              path: bot,
              description: `Automated dependency updates configured (${bot}).`,
            },
          ]
        : []),
      ...(scan
        ? [
            {
              kind: 'file' as const,
              ...scan,
              description: 'A dependency vulnerability scan runs in CI.',
            },
          ]
        : []),
    ];
    if (bot && scan) return { status: 'pass', evidence };
    const missing = [
      !bot && 'automated dependency updates (Dependabot or Renovate)',
      !scan && 'a dependency vulnerability scan in CI',
    ]
      .filter(Boolean)
      .join(' and ');
    return {
      status: 'fail',
      evidence,
      findings: [
        {
          title: `Missing ${missing}`,
          observed: `No ${missing} is configured.`,
          severity: bot || scan ? 'low' : 'medium',
          key: missing,
        },
      ],
    };
  },
};
