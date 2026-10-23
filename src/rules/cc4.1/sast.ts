import type { Rule } from '../../engine/types.js';
import { inCi } from '../lib/ci.js';
import { isProductionSource } from '../lib/languages.js';

const SAST =
  /codeql|semgrep|sonar(?:qube|cloud|-scanner)?|\bbandit\b|\bgosec\b|brakeman|snyk\s+code|eslint-plugin-security|njsscan|horusec|bearer\/bearer/i;

export const sast: Rule = {
  id: 'cc4.1/sast',
  criterion: 'CC4.1',
  title: 'Static analysis (SAST) runs in CI',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['CI runs SAST'],
  expected: 'A SAST tool (CodeQL, Semgrep, Bandit, gosec, ...) runs on every pull request.',
  risk: 'Injection and other code-level flaws reach production without automated review.',
  remediation: {
    summary: 'Enable CodeQL (GitHub default setup or a workflow) or run Semgrep on pull requests.',
    example: `- uses: github/codeql-action/init@<sha>  # pin to a commit SHA
  with: { languages: javascript-typescript }
- uses: github/codeql-action/analyze@<sha>`,
  },
  detect(ctx) {
    if (!ctx.files.files.some((f) => isProductionSource(f)))
      return {
        status: 'not_applicable',
        justification: 'No production JS/TS, Python or Go source to analyse.',
      };
    const hit = inCi(ctx.files, SAST);
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'A SAST tool runs in CI.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No static analysis in CI',
          observed:
            'No SAST tool (CodeQL, Semgrep, Bandit, gosec, SonarQube, ...) runs in CI. GitHub CodeQL default setup is not visible from the repository; if it is enabled, add an exception that says so.',
          key: 'missing',
        },
      ],
    };
  },
};
