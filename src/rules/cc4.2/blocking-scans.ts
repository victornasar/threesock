import type { RawFinding, Rule } from '../../engine/types.js';
import { ciConfigs } from '../lib/build-files.js';
import { plural } from '../util.js';

const SCANNER =
  /codeql|semgrep|trivy|grype|osv-scanner|(?:npm|pnpm|yarn)\s+audit|pip-audit|govulncheck|gitleaks|trufflehog|checkov|tfsec|snyk|dependency-review|zizmor|threesock/i;
const SOFT =
  /continue-on-error:\s*true|\|\|\s*true\b|exit-code:\s*['"]?0['"]?|--exit-code[ =]0\b|soft_fail:\s*true|--soft-fail|fail-on-severity:\s*['"]?(?:none|never)/i;

export const blockingScans: Rule = {
  id: 'cc4.2/blocking-scans',
  criterion: 'CC4.2',
  title: 'Security scans block the pipeline on findings',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['CI blocks merge or release on Critical/High findings'],
  expected:
    'Security scan steps fail the pipeline on Critical/High findings instead of reporting and carrying on.',
  risk: 'Non-blocking scanners produce reports nobody reads; known issues merge anyway.',
  remediation: {
    summary:
      'Remove continue-on-error / "|| true" from scan steps and set the scanner to fail on Critical and High.',
    example: `- run: trivy fs --exit-code 1 --severity CRITICAL,HIGH .`,
  },
  detect(ctx) {
    const findings: RawFinding[] = [];
    let scanSteps = 0;
    for (const f of ciConfigs(ctx.files)) {
      const lines = (ctx.files.read(f.path) ?? '').split('\n');
      lines.forEach((line, i) => {
        if (!SCANNER.test(line)) return;
        scanSteps++;
        // The step's own block: this line plus following lines indented deeper.
        const indent = line.length - line.trimStart().length;
        const block = [line];
        for (let j = i + 1; j < lines.length; j++) {
          const l = lines[j] as string;
          if (
            l.trim() &&
            l.length - l.trimStart().length <= indent &&
            !/^\s*with:|^\s*env:/.test(l)
          )
            break;
          block.push(l);
        }
        const prev = lines.slice(Math.max(0, i - 3), i).join('\n');
        if (SOFT.test(block.join('\n')) || /continue-on-error:\s*true/.test(prev)) {
          findings.push({
            path: f.path,
            line: i + 1,
            title: `Non-blocking security scan in ${f.path}`,
            observed: `The scan at line ${i + 1} of ${f.path} is configured not to fail the pipeline.`,
            key: line.trim(),
          });
        }
      });
    }
    if (scanSteps === 0)
      return {
        status: 'not_applicable',
        justification: 'No security scan steps found in CI configuration.',
      };
    if (findings.length) return { status: 'fail', findings };
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'config',
          description: `${plural(scanSteps, 'security scan step')} in CI, none configured to ignore failures.`,
        },
      ],
    };
  },
};
