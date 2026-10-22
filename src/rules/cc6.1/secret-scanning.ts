import type { Rule } from '../../engine/types.js';
import { workflows } from '../lib/workflows.js';
import { findAny, findIn } from '../util.js';

const CONFIGS = [
  '.gitleaks.toml',
  '.gitleaksignore',
  '.secrets.baseline',
  '.trufflehog.yml',
  '.trufflehogignore',
];
const TOOL = /gitleaks|trufflehog|detect-secrets|ggshield|secretlint|git-secrets/i;

export const secretScanning: Rule = {
  id: 'cc6.1/secret-scanning',
  criterion: 'CC6.1',
  title: 'Secret scanning runs automatically',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['**Secrets:**'],
  expected:
    'A secret scanner runs on every push or pull request (and ideally as a pre-commit hook), with push protection enabled on the hosting platform.',
  risk: 'Without automated scanning, a committed credential is found by an attacker before it is found by you.',
  remediation: {
    summary:
      'Add Gitleaks (or TruffleHog) to CI and to pre-commit, and enable GitHub secret scanning with push protection.',
    example: `# .github/workflows/secrets.yml
on: [push, pull_request]
permissions: { contents: read }
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>  # pin to a commit SHA
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@<sha>`,
  },
  detect(ctx) {
    const config = CONFIGS.find((c) => ctx.files.has(c));
    if (config)
      return {
        status: 'pass',
        evidence: [
          { kind: 'file', path: config, description: `Secret scanner configuration: ${config}.` },
        ],
      };
    for (const wf of workflows(ctx.files)) {
      const hit = findIn(ctx.files, wf.path, TOOL);
      if (hit)
        return {
          status: 'pass',
          evidence: [{ kind: 'file', ...hit, description: 'A workflow runs a secret scanner.' }],
        };
    }
    const other = ctx.files.files.filter((f) =>
      /^\.pre-commit-config\.ya?ml$|^\.gitlab-ci\.yml$|^\.circleci\/config\.yml$|^\.husky\//.test(
        f.path,
      ),
    );
    const hit = findAny(ctx.files, other, TOOL);
    if (hit)
      return {
        status: 'pass',
        evidence: [
          { kind: 'file', ...hit, description: 'A secret scanner runs in CI or pre-commit.' },
        ],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No automated secret scanning',
          observed:
            'No Gitleaks, TruffleHog, detect-secrets or similar scanner is configured in CI, pre-commit or the repository. Platform-level push protection is checked with --github.',
          key: 'missing',
        },
      ],
    };
  },
};
