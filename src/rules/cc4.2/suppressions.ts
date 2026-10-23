import type { RawFinding, Rule } from '../../engine/types.js';
import { isCommentLine, isProductionSource, isTestPath } from '../lib/languages.js';
import { absence, plural } from '../util.js';

// Security-tool suppressions without a reason are a rubric red flag; bare linter
// disables are hygiene. A suppression "has a reason" when text follows it.
const SECURITY = [
  { re: /#\s*nosec(?:\s+B\d+)?\s*$/, tool: 'nosec' },
  { re: /\/\/\s*#?nosec(?:\s+G\d+)?\s*$/, tool: 'nosec' },
  { re: /nosemgrep(?::\s*[\w.-]+)?\s*$/, tool: 'nosemgrep' },
  { re: /gitleaks:allow\s*$/, tool: 'gitleaks:allow' },
  { re: /(?:checkov|tfsec|trivy):(?:skip|ignore)=?[\w-]*\s*$/, tool: 'IaC scanner skip' },
];
const LINT = [
  { re: /\/\*\s*eslint-disable\s*\*\//, tool: 'file-wide eslint-disable' },
  { re: /\/\/\s*eslint-disable(?:-next-line|-line)?\s*$/, tool: 'eslint-disable without a rule' },
  { re: /#\s*noqa\s*$/, tool: 'bare noqa' },
  { re: /\/\/\s*nolint\s*$/, tool: 'bare nolint' },
];
const IGNORE_FILES = /(?:^|\/)\.(?:trivyignore|snyk|gitleaksignore|semgrepignore|grype\.ya?ml)$/;

export const suppressions: Rule = {
  id: 'cc4.2/suppressions',
  criterion: 'CC4.2',
  title: 'Scanner suppressions carry a justification',
  tags: ['CODE', 'CONFIG'],
  severity: 'medium',
  redFlag: false, // set per finding
  checks: ['Exceptions require approver, justification, and expiry date'],
  expected:
    'Every suppression of a security finding says why (and ideally who approved it and until when).',
  risk: 'Unexplained suppressions hide real vulnerabilities and cannot be reviewed; auditors treat blanket suppressions as a red flag.',
  remediation: {
    summary:
      'Add the rule id and a reason to each suppression, or move it into threesock.yaml exceptions with an approver and expiry.',
    example: `subprocess.run(cmd, shell=True)  # nosec B602: cmd is a fixed literal, no user input (SEC-41)`,
  },
  detect(ctx) {
    const files = ctx.files.files.filter(
      (f) => (isProductionSource(f) || /\.tf$/.test(f.path)) && !isTestPath(f.path),
    );
    const findings: RawFinding[] = [];
    for (const f of files) {
      const lines = (ctx.files.read(f.path) ?? '').split('\n');
      const hits = lines.flatMap((line, i) => {
        const sec = SECURITY.find((p) => p.re.test(line));
        if (sec) return [{ line: i + 1, tool: sec.tool, security: true }];
        const lint = LINT.find((p) => p.re.test(line));
        return lint ? [{ line: i + 1, tool: lint.tool, security: false }] : [];
      });
      for (const security of [true, false]) {
        const group = hits.filter((h) => h.security === security);
        if (!group.length) continue;
        findings.push({
          path: f.path,
          line: group[0]?.line,
          severity: security ? 'medium' : 'low',
          redFlag: security,
          title: `${plural(group.length, security ? 'unexplained security suppression' : 'blanket lint suppression')} in ${f.path}`,
          observed: `${[...new Set(group.map((g) => g.tool))].join(', ')} without a reason at line${group.length > 1 ? 's' : ''} ${group
            .slice(0, 8)
            .map((g) => g.line)
            .join(', ')}.`,
          key: `${security}`,
        });
      }
    }
    for (const f of ctx.files.files.filter((x) => IGNORE_FILES.test(x.path))) {
      const lines = (ctx.files.read(f.path) ?? '').split('\n');
      const bare = lines.flatMap((l, i) =>
        l.trim() && !isCommentLine(l) && !/#/.test(l) && !isCommentLine(lines[i - 1] ?? '')
          ? [i + 1]
          : [],
      );
      if (bare.length && !/\.(?:snyk|grype\.ya?ml)$/.test(f.path)) {
        findings.push({
          path: f.path,
          line: bare[0],
          redFlag: true,
          title: `Unexplained entries in ${f.path}`,
          observed: `${plural(bare.length, 'entry', 'entries')} in ${f.path} have no comment explaining why.`,
          key: 'ignorefile',
        });
      }
    }
    if (findings.length) return { status: 'fail', findings };
    return absence(
      `Checked ${plural(files.length, 'source file')} and scanner ignore files; every suppression has a reason.`,
    );
  },
};
