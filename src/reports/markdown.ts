// Markdown report: rubric Appendix A (scorecard) and Appendix B (findings),
// plus a MANUAL evidence checklist.
import { CRITERIA } from '../engine/criteria.generated.js';
import type { CriterionResult, Finding, ScanReport } from '../engine/model.js';
import { BAND_LABELS } from '../engine/scoring.js';
import { SEVERITIES, type Evidence, type Severity } from '../engine/types.js';

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
const DEFS = new Map(CRITERIA.map((c) => [c.id, c]));

/** Escapes text for a Markdown table cell. */
function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

/** A fence longer than any backtick run in the content. */
function fence(content: string, lang = ''): string {
  const longest = Math.max(2, ...[...content.matchAll(/`+/g)].map((m) => m[0].length));
  const f = '`'.repeat(longest + 1);
  return `${f}${lang}\n${content}\n${f}`;
}

function where(e: Evidence): string {
  return e.path ? `\`${e.path}${e.line ? `:${e.line}` : ''}\`` : '';
}

function evidenceCell(c: CriterionResult): string {
  if (c.evidence.length === 0) return '';
  return c.evidence
    .slice(0, 3)
    .map((e) => [where(e), e.description].filter(Boolean).join(' '))
    .concat(c.evidence.length > 3 ? [`+${c.evidence.length - 3} more`] : [])
    .join('<br>');
}

function scoreCell(c: CriterionResult): string {
  return typeof c.score === 'number' ? `${c.score} (${c.label})` : c.score;
}

function findingBlock(f: Finding): string {
  const status =
    f.status === 'accepted' && f.exception
      ? `Accepted until ${f.exception.expires} (approved by ${f.exception.approver}: ${f.exception.justification})`
      : f.expiredException
        ? `Open (exception approved by ${f.expiredException.approver} expired ${f.expiredException.expires})`
        : f.rejectedException
          ? `Open (exception by ${f.rejectedException.approver} until ${f.rejectedException.expires} not applied: ${f.rejectedException.reason})`
          : 'Open';
  const rows: [string, string][] = [
    ['Finding ID', f.id],
    ['Criterion', f.criterion],
    ['Severity', SEVERITY_LABEL[f.severity]],
    ['Title', f.title],
    ['Location', f.location.description],
    ['Observed', f.observed],
    ['Expected', f.expected],
    ['Risk', f.risk],
    ['Recommendation', f.recommendation],
    ['Owner', f.owner ?? 'Unassigned'],
    ['Due date', f.dueDate],
    ['Status', status],
    ['Verification', `Re-run threesock; this finding's fingerprint is ${f.fingerprint}.`],
  ];
  const body = rows.map(([k, v]) => `${`${k}:`.padEnd(19)}${v}`).join('\n');
  const out = [
    `### ${f.id} · ${SEVERITY_LABEL[f.severity]} · ${f.criterion} · ${f.title}`,
    '',
    fence(body),
  ];
  if (f.example) out.push('', 'Example fix:', '', fence(f.example));
  return out.join('\n');
}

export function renderMarkdown(report: ScanReport): string {
  const { summary, repository } = report;
  const date = report.generatedAt.slice(0, 10);
  const scope = summary.categories.map((c) => `[${c.inScope ? 'x' : ' '}] ${c.label}`).join('  ');
  const out: string[] = [];

  out.push('# threesock SOC 2 readiness report', '');
  out.push(`> **Readiness aid, not an audit.** ${report.disclaimer}`, '');
  out.push(
    fence(
      [
        `Repository / System: ${repository.root}`,
        `Commit / Release:    ${repository.commit ?? 'uncommitted working tree'}`,
        `Assessor:            threesock ${report.tool.version} (automated)   Date: ${date}`,
        `Scope:  ${scope}`,
        'Environment(s) reviewed: repository contents only (code, IaC, CI configuration)',
      ].join('\n'),
    ),
    '',
  );

  out.push('## Summary', '');
  out.push(
    '| Category | Assessable criteria | Points earned | Points possible | Readiness % | Band | MANUAL items open |',
  );
  out.push('|---|---|---|---|---|---|---|');
  for (const c of summary.categories) {
    if (!c.inScope) {
      out.push(`| ${c.label} | — | — | — | not in scope | — | — |`);
      continue;
    }
    const pct = c.percent === null ? '—' : `${c.percent.toFixed(1)}%`;
    const band = c.band
      ? `${BAND_LABELS[c.band]}${c.capped ? ' (capped: open Critical)' : ''}`
      : 'nothing assessable';
    out.push(
      `| ${c.label} | ${c.assessable} | ${c.earned} | ${c.possible} | ${pct} | ${band} | ${c.manualOpen} |`,
    );
  }
  out.push('');
  out.push(
    `Open findings: ${SEVERITIES.map((s) => `${summary.severityCounts[s]} ${s}`).join(' · ')}` +
      (summary.acceptedFindings ? ` · ${summary.acceptedFindings} accepted` : ''),
    '',
  );
  out.push(
    'Readiness counts assessable criteria only. MANUAL and N/A criteria are excluded from both sides of the ratio (rubric 1.1), so read it together with the number of criteria assessed.',
    '',
  );
  if (summary.staleExceptions.length) {
    out.push(
      `${summary.staleExceptions.length} exception(s) or baseline entries match no current finding: ${summary.staleExceptions
        .map((e) => e.rule ?? `fingerprint ${e.fingerprint}`)
        .join(', ')}. Remove them, or run \`threesock baseline --prune\`.`,
      '',
    );
  }
  if (summary.topFixes.length) {
    out.push('### Top fixes', '');
    summary.topFixes.forEach((f, i) => {
      const more = f.occurrences > 1 ? ` (+${f.occurrences - 1} more)` : '';
      out.push(
        `${i + 1}. **${SEVERITY_LABEL[f.severity]} · ${f.criterion}** ${f.title}${more}. ${f.recommendation}`,
      );
    });
    out.push('');
  }

  out.push('## Scorecard (Appendix A)', '');
  out.push('| Criterion | Title | Score | Evidence | Finding ID | Owner | Notes |');
  out.push('|---|---|---|---|---|---|---|');
  for (const c of report.criteria) {
    out.push(
      `| ${c.id} | ${cell(c.title)} | ${scoreCell(c)} | ${cell(evidenceCell(c))} | ${c.findingIds.join(', ')} | ${cell(c.owner ?? '')} | ${cell(c.rationale)} |`,
    );
  }
  out.push('');

  out.push('## Findings (Appendix B)', '');
  if (report.findings.length === 0) out.push('Socks on. No gaps found in this scope.', '');
  for (const f of report.findings) out.push(findingBlock(f), '');

  const manual = report.criteria.filter((c) => c.inScope && c.score === 'MANUAL');
  out.push('## Manual evidence checklist', '');
  out.push(
    'These criteria cannot be assessed from the repository. Gather the evidence below and track it in your GRC tool.',
    '',
  );
  for (const c of manual) {
    const def = DEFS.get(c.id);
    out.push(`### ${c.id} · ${c.title}`, '');
    out.push(`Suggested owner: ${c.owner ?? 'Security lead'}  `);
    out.push(`Why manual: ${c.rationale}`, '');
    if (def?.requirement) out.push(`Requirement: ${def.requirement}`, '');
    for (const item of c.manualFollowUps) out.push(`- [ ] ${item}`);
    if (def?.evidence) out.push('', `Evidence to collect: ${def.evidence}`);
    out.push('');
  }

  const partial = report.criteria.filter(
    (c) => c.inScope && typeof c.score === 'number' && c.manualFollowUps.length,
  );
  if (partial.length) {
    out.push('## Checks threesock did not verify', '');
    out.push(
      'These criteria were scored on their automated checks. The rubric checks below still need human review before you can claim them.',
      '',
    );
    for (const c of partial) {
      out.push(`**${c.id} · ${c.title}** (scored ${scoreCell(c)})`, '');
      for (const item of c.manualFollowUps) out.push(`- [ ] ${item}`);
      out.push('');
    }
  }

  out.push(
    '---',
    '',
    `Generated by threesock ${report.tool.version} on ${date} · JSON schema ${report.schemaVersion}`,
  );
  return `${out.join('\n')}\n`;
}
