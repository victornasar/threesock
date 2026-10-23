import { makeStyle, type Style } from '../cli/style.js';
import type { CategorySummary, ScanReport } from '../engine/model.js';
import { BAND_LABELS } from '../engine/scoring.js';
import { SEVERITIES } from '../engine/types.js';

export interface TextOptions {
  color?: boolean;
  verbose?: boolean;
  /** Maximum findings to list; the rest are summarized. */
  maxFindings?: number;
}

const BAR_WIDTH = 20;

export function bar(percent: number): string {
  const filled = Math.round((percent / 100) * BAR_WIDTH);
  return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
}

function readinessLine(
  label: string,
  s: Pick<
    CategorySummary,
    'percent' | 'band' | 'capped' | 'manualOpen' | 'assessable' | 'notApplicable'
  >,
): string {
  const name = label.padEnd(22);
  const total = s.assessable + s.manualOpen;
  // The ratio only covers assessable criteria, so always show how many that is.
  const assessed = `${s.assessable}/${total} criteria assessed`;
  if (s.percent === null || s.band === null) {
    return `  ${name}${'·'.repeat(BAR_WIDTH)}      —  nothing assessable yet · ${assessed}`;
  }
  const pct = `${s.percent.toFixed(1)}%`.padStart(6);
  const cap = s.capped ? ', capped by open Critical' : '';
  return `  ${name}${bar(s.percent)}  ${pct}  ${BAND_LABELS[s.band]} · ${assessed}${cap}`;
}

function scoreCell(score: ScanReport['criteria'][number]['score']): string {
  return typeof score === 'number' ? `${score}` : score;
}

export function renderText(report: ScanReport, opts: TextOptions = {}): string {
  const st: Style = makeStyle(opts.color ?? false);
  const maxFindings = opts.maxFindings ?? 15;
  const out: string[] = [];
  const { summary, repository } = report;

  out.push(`${st.bold('threesock')} ${report.tool.version} · SOC 2 readiness scan`);
  out.push('Readiness aid, not an audit. A clean scan does not mean SOC 2 compliant.');
  out.push('');
  const commit = repository.commit ? ` @ ${repository.commit.slice(0, 7)}` : '';
  out.push(`Repository  ${repository.root}${commit}`);
  out.push(
    `Scanned     ${repository.filesScanned} files${repository.gitAware ? ' (git-aware)' : ''} · ${report.coverage.rulesRun} rules`,
  );
  out.push(
    `Scope       ${summary.categories
      .filter((c) => c.inScope)
      .map((c) => c.label)
      .join(', ')}`,
  );
  out.push('');

  out.push(st.bold('Readiness'));
  out.push(readinessLine('Overall', summary.overall));
  for (const c of summary.categories.filter((c) => c.inScope)) out.push(readinessLine(c.label, c));
  out.push('');

  const counts = SEVERITIES.map((s) => st.severity(s, `${summary.severityCounts[s]} ${s}`)).join(
    ' · ',
  );
  const accepted = summary.acceptedFindings ? `  (${summary.acceptedFindings} accepted)` : '';
  out.push(`${st.bold('Findings')}    ${counts}${accepted}`);
  out.push('');

  const open = report.findings.filter((f) => f.status === 'open');
  if (open.length === 0) {
    out.push('Socks on. No gaps found in this scope.');
    out.push('');
  } else {
    out.push(st.bold('Top fixes'));
    summary.topFixes.forEach((fix, i) => {
      const sev = st.severity(fix.severity, fix.severity.toUpperCase().padEnd(8));
      const n = fix.occurrences > 1 ? ` (+${fix.occurrences - 1} more)` : '';
      out.push(`  ${i + 1}. ${sev} ${fix.criterion.padEnd(6)} ${fix.title}${n}`);
      out.push(`     ${fix.recommendation}`);
    });
    out.push('');

    out.push(st.bold('Open findings'));
    for (const f of open.slice(0, maxFindings)) {
      const sev = st.severity(f.severity, f.severity.toUpperCase().padEnd(8));
      out.push(`  ${f.id}  ${sev} ${f.criterion.padEnd(6)} ${f.title}`);
      out.push(`         ${f.location.description} · due ${f.dueDate}`);
    }
    if (open.length > maxFindings) {
      out.push(
        `  ... and ${open.length - maxFindings} more. Use --format json or markdown for the full list.`,
      );
    }
    out.push('');
  }

  if (opts.verbose) {
    out.push(st.bold('Criteria'));
    for (const c of report.criteria.filter((c) => c.inScope)) {
      out.push(
        `  ${c.id.padEnd(6)} ${scoreCell(c.score).padEnd(7)} ${c.label.padEnd(16)} ${c.title}`,
      );
    }
    out.push('');
  }

  const expired = report.findings.filter((f) => f.expiredException).length;
  if (expired)
    out.push(`${expired} exception(s) have expired and are counted as open findings again.`);
  const rejected = report.findings.filter((f) => f.rejectedException).length;
  if (rejected)
    out.push(
      `${rejected} exception(s) run longer than allowed for their severity and were not applied.`,
    );
  const stale = summary.staleExceptions.length;
  if (stale)
    out.push(
      `${stale} exception(s) or baseline entries match no finding; remove them, or run \`threesock baseline --prune\`.`,
    );
  out.push(
    `Manual evidence: ${summary.manualOpen} in-scope criteria need evidence a human must gather. ` +
      'Run `threesock explain <criterion>` for guidance.',
  );
  if (report.coverage.rulesErrored.length) {
    out.push(
      `Warning: ${report.coverage.rulesErrored.length} rule(s) errored and were scored as inconclusive.`,
    );
  }
  return `${out.join('\n')}\n`;
}
