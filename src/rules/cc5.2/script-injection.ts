import type { RawFinding, Rule } from '../../engine/types.js';
import { workflows } from '../lib/workflows.js';
import { absence } from '../util.js';

const UNTRUSTED =
  /\$\{\{\s*github\.(?:head_ref|event\.(?:issue|pull_request|comment|review|review_comment|discussion|discussion_comment|head_commit|workflow_run|pages|commits)\b[^}]*\.(?:title|body|message|name|email|label|ref|head_ref|default_branch|page_name))\b[^}]*\}\}/;

export const scriptInjection: Rule = {
  id: 'cc5.2/script-injection',
  criterion: 'CC5.2',
  title: 'Untrusted event data is not interpolated into shell scripts',
  tags: ['CONFIG'],
  severity: 'high',
  redFlag: false,
  checks: ['CI/CD hardened'],
  expected:
    'run: steps pass attacker-controllable values (issue titles, PR bodies, branch names) through environment variables, never `${{ }}` interpolation.',
  risk: 'A crafted issue title or branch name becomes shell code running in your workflow, with its token and secrets.',
  remediation: {
    summary:
      'Move the value into an environment variable and reference it as a quoted shell variable.',
    example: `- run: echo "Title: $TITLE"
  env:
    TITLE: \${{ github.event.issue.title }}`,
  },
  detect(ctx) {
    const wfs = workflows(ctx.files);
    if (wfs.length === 0)
      return { status: 'not_applicable', justification: 'No GitHub Actions workflows found.' };
    const findings: RawFinding[] = [];
    for (const wf of wfs) {
      let runIndent = -1;
      wf.lines.forEach((line, i) => {
        const indent = line.length - line.trimStart().length;
        const run = /^(\s*)-?\s*run:\s*(.*)$/.exec(line);
        if (run) {
          runIndent = indent;
          if (UNTRUSTED.test(run[2] ?? '')) findings.push(hit(wf.path, i + 1));
          return;
        }
        if (runIndent >= 0 && line.trim() && indent <= runIndent) runIndent = -1;
        if (runIndent >= 0 && UNTRUSTED.test(line)) findings.push(hit(wf.path, i + 1));
      });
    }
    if (findings.length) return { status: 'fail', findings };
    return absence(
      `Checked ${wfs.length} workflow(s); no untrusted event data interpolated into run steps.`,
    );
  },
};

function hit(path: string, line: number): RawFinding {
  return {
    path,
    line,
    title: `Script injection risk in ${path}`,
    observed: `A run step in ${path} interpolates attacker-controllable event data at line ${line}.`,
    key: String(line),
  };
}
