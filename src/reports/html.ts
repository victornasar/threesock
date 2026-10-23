// Single-file HTML report (decision 30): no JavaScript, no network, logo and
// favicons inlined, system fonts (brand fonts only if installed locally),
// automatic light/dark. Color is used for severity only.
import { readFileSync } from 'node:fs';
import { CRITERIA } from '../engine/criteria.generated.js';
import type { CategorySummary, CriterionResult, Finding, ScanReport } from '../engine/model.js';
import { BAND_LABELS } from '../engine/scoring.js';
import { controlImpacts } from './controls.js';
import { CATEGORIES, CATEGORY_LABELS, SEVERITIES, type Severity } from '../engine/types.js';

const BRAND = new URL('../../assets/brand/', import.meta.url);

function asset(name: string, type: string): string {
  return `data:${type};base64,${readFileSync(new URL(name, BRAND)).toString('base64')}`;
}

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
const DEFS = new Map(CRITERIA.map((c) => [c.id, c]));

export function esc(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Renders `code` spans from the rubric's Markdown-ish check text. */
function inline(text: string): string {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

const CSS = `
:root {
  color-scheme: light dark;
  --bg: #ffffff; --fg: #0b0b0b; --muted: #5c5c5c; --line: #e4e4e4; --panel: #f6f6f6; --bar: #0b0b0b;
  --critical: #b42318; --high: #b54708; --medium: #175cd3; --low: #5c5c5c;
  --heading: 'Mona Sans', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --body: 'Switzer', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --mono: 'Commit Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #0b0b0b; --fg: #f2f2f2; --muted: #a3a3a3; --line: #262626; --panel: #151515; --bar: #f2f2f2;
    --critical: #f97066; --high: #fdb022; --medium: #84adff; --low: #a3a3a3; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.55 var(--body); }
main { max-width: 1040px; margin: 0 auto; padding: 32px 16px 64px; }
h1, h2, h3 { font-family: var(--heading); font-stretch: 92%; line-height: 1.2; }
h1 { font-size: 28px; margin: 24px 0 4px; }
h2 { font-size: 20px; margin: 40px 0 12px; padding-top: 8px; border-top: 1px solid var(--line); }
h3 { font-size: 16px; margin: 0; }
code, pre, .mono { font-family: var(--mono); font-size: 13px; }
pre { background: var(--panel); padding: 12px; overflow-x: auto; border-radius: 6px; white-space: pre-wrap; }
a { color: inherit; }
.logo img { height: 28px; width: auto; display: block; }
.muted { color: var(--muted); }
.disclaimer { border-left: 3px solid var(--fg); padding: 8px 12px; background: var(--panel); margin: 16px 0; }
.meta { display: grid; grid-template-columns: max-content 1fr; gap: 2px 16px; margin: 16px 0; }
.meta dt { color: var(--muted); }
.meta dd { margin: 0; overflow-wrap: anywhere; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.card { border: 1px solid var(--line); border-radius: 8px; padding: 14px; }
.card .pct { font-family: var(--heading); font-size: 28px; font-weight: 700; }
.bar { height: 6px; background: var(--line); border-radius: 3px; overflow: hidden; margin: 8px 0; }
.bar span { display: block; height: 100%; background: var(--bar); }
.sev { font-weight: 600; white-space: nowrap; }
.sev-critical { color: var(--critical); } .sev-high { color: var(--high); }
.sev-medium { color: var(--medium); } .sev-low { color: var(--low); }
.counts { display: flex; gap: 16px; flex-wrap: wrap; margin: 12px 0; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th, td { text-align: left; vertical-align: top; padding: 6px 8px; border-bottom: 1px solid var(--line); }
th { font-weight: 600; color: var(--muted); }
details { border: 1px solid var(--line); border-radius: 8px; margin: 8px 0; }
details > summary { cursor: pointer; padding: 10px 12px; list-style-position: inside; }
details[open] > summary { border-bottom: 1px solid var(--line); }
details > .body { padding: 12px; }
.fields { display: grid; grid-template-columns: max-content 1fr; gap: 4px 16px; margin: 0; }
.fields dt { color: var(--muted); }
.fields dd { margin: 0; overflow-wrap: anywhere; }
ul.checklist { list-style: none; padding-left: 0; }
ul.checklist li::before { content: '☐ '; }
footer { margin-top: 48px; color: var(--muted); font-size: 13px; }
@media print { details { break-inside: avoid; } details:not([open]) > .body { display: block; } }
`;

function scoreText(c: CriterionResult): string {
  return typeof c.score === 'number'
    ? `${c.score} · ${c.label}`
    : c.score === 'N/A'
      ? 'N/A'
      : 'MANUAL';
}

function card(c: CategorySummary): string {
  if (!c.inScope) return '';
  const pct = c.percent === null ? '—' : `${c.percent.toFixed(1)}%`;
  const band = c.band ? BAND_LABELS[c.band] : 'Nothing assessable yet';
  return `<div class="card"><div class="muted">${esc(c.label)}</div><div class="pct">${pct}</div>
<div class="bar" role="img" aria-label="${pct} ready"><span style="width:${c.percent ?? 0}%"></span></div>
<div>${esc(band)}${c.capped ? ' <span class="sev sev-critical">(capped: open Critical)</span>' : ''}</div>
<div class="muted">${c.assessable}/${c.assessable + c.manualOpen} criteria assessed · ${c.manualOpen} manual</div></div>`;
}

function findingDetails(f: Finding): string {
  const status =
    f.status === 'accepted' && f.exception
      ? `Accepted until ${f.exception.expires} (approved by ${f.exception.approver}: ${f.exception.justification})`
      : f.expiredException
        ? `Open: exception by ${f.expiredException.approver} expired ${f.expiredException.expires}`
        : f.rejectedException
          ? `Open: exception not applied (${f.rejectedException.reason})`
          : 'Open';
  const rows: [string, string][] = [
    ['Finding ID', f.id],
    ['Criterion', f.criterion],
    ['Severity', SEVERITY_LABEL[f.severity]],
    ['Location', f.location.description],
    ...(f.source
      ? ([
          [
            'Source',
            `${f.source.tool} ${f.source.version}${f.source.checkId ? ` (${f.source.checkId})` : ''}`,
          ],
        ] as [string, string][])
      : []),
    ...(f.alsoFoundBy ? ([['Also found by', f.alsoFoundBy.join(', ')]] as [string, string][]) : []),
    ['Observed', f.observed],
    ['Expected', f.expected],
    ['Risk', f.risk],
    ['Recommendation', f.recommendation],
    ['Controls', f.controls.join('; ') || '(none mapped)'],
    ['Policies', f.policies.join('; ') || '(none mapped)'],
    ['Owner', f.owner ?? 'Unassigned'],
    ['Due date', f.dueDate],
    ['Status', status],
    ['Verification', `Re-run threesock; fingerprint ${f.fingerprint}`],
  ];
  return `<details id="${esc(f.id)}"><summary><span class="sev sev-${f.severity}">${SEVERITY_LABEL[f.severity]}</span> · <span class="mono">${esc(f.id)}</span> · ${esc(f.criterion)} · ${esc(f.title)}${f.status === 'accepted' ? ' <span class="muted">(accepted)</span>' : ''}</summary>
<div class="body"><dl class="fields">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
${f.example ? `<p class="muted">Example fix</p><pre><code>${esc(f.example)}</code></pre>` : ''}</div></details>`;
}

export function renderHtml(report: ScanReport): string {
  const { summary, repository } = report;
  const date = report.generatedAt.slice(0, 10);
  const lockupDark = asset('threesock-lockup-white.svg', 'image/svg+xml');
  const lockupLight = asset('threesock-lockup.svg', 'image/svg+xml');
  const open = report.findings.filter((f) => f.status === 'open');
  const accepted = report.findings.filter((f) => f.status === 'accepted');
  const manual = report.criteria.filter((c) => c.inScope && c.score === 'MANUAL');
  const unverified = report.criteria.filter(
    (c) => c.inScope && typeof c.score === 'number' && c.manualFollowUps.length,
  );

  const scorecard = CATEGORIES.map((cat) => {
    const rows = report.criteria.filter((c) => c.category === cat);
    const s = summary.categories.find((x) => x.category === cat);
    const head = `${CATEGORY_LABELS[cat]} ${s?.inScope ? `· ${s.percent === null ? '—' : `${s.percent.toFixed(1)}%`}` : '· not in scope'}`;
    return `<details${s?.inScope ? ' open' : ''}><summary>${esc(head)}</summary><div class="body table-wrap"><table>
<thead><tr><th>Criterion</th><th>Score</th><th>Evidence</th><th>Findings</th><th>Owner</th><th>Notes</th></tr></thead><tbody>
${rows
  .map(
    (
      c,
    ) => `<tr><td><strong>${esc(c.id)}</strong><br><span class="muted">${esc(c.title)}</span></td><td>${esc(scoreText(c))}</td>
<td>${c.evidence
      .slice(0, 3)
      .map(
        (e) =>
          `${e.path ? `<code>${esc(e.path)}${e.line ? `:${e.line}` : ''}</code> ` : ''}${esc(e.description)}`,
      )
      .join(
        '<br>',
      )}${c.evidence.length > 3 ? `<br><span class="muted">+${c.evidence.length - 3} more</span>` : ''}${(c.evidenceLinks ?? []).map((l) => `<br>External: ${esc(l)}`).join('')}</td>
<td>${c.findingIds.map((id) => `<a href="#${esc(id)}">${esc(id)}</a>`).join(' ')}</td><td>${esc(c.owner ?? '')}</td><td>${esc(c.rationale)}</td></tr>`,
  )
  .join('\n')}</tbody></table></div></details>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
<meta name="generator" content="threesock ${esc(report.tool.version)}">
<title>threesock readiness report</title>
<link rel="icon" href="${asset('favicon.ico', 'image/x-icon')}" sizes="any">
<link rel="icon" href="${asset('favicon.svg', 'image/svg+xml')}" type="image/svg+xml">
<style>${CSS}</style>
</head>
<body><main>
<header class="logo"><picture><source media="(prefers-color-scheme: dark)" srcset="${lockupDark}"><img alt="threesock" src="${lockupLight}"></picture></header>
<h1>SOC 2 readiness report</h1>
<p class="muted">One extra layer of confidence before your SOC 2 audit.</p>
<p class="disclaimer"><strong>Readiness aid, not an audit.</strong> ${esc(report.disclaimer)}</p>
<dl class="meta">
<dt>Repository</dt><dd><code>${esc(repository.root)}</code></dd>
<dt>Commit</dt><dd><code>${esc(repository.commit ?? 'uncommitted working tree')}</code></dd>
<dt>Generated</dt><dd>${esc(date)} by threesock ${esc(report.tool.version)} (automated)</dd>
<dt>Scope</dt><dd>${summary.categories.map((c) => `${c.inScope ? '☑' : '☐'} ${esc(c.label)}`).join(' &nbsp; ')}</dd>
<dt>Tools</dt><dd>${esc(
    report.coverage.externalTools
      .filter((t) => t.used)
      .map((t) => `${t.name} ${t.version ?? ''}`.trim())
      .join(', ') || 'Built-in rules only',
  )}</dd>
<dt>Reviewed</dt><dd>Repository contents only: code, IaC and CI configuration (${repository.filesScanned} files)</dd>
</dl>

<h2>Summary</h2>
<div class="cards">${summary.categories.filter((c) => c.inScope).length > 1 ? card({ ...summary.overall, category: 'security', label: 'Overall', inScope: true }) : ''}${summary.categories.map(card).join('')}</div>
<div class="counts">${SEVERITIES.map((s) => `<span class="sev sev-${s}">${summary.severityCounts[s]} ${SEVERITY_LABEL[s]}</span>`).join('')}${summary.acceptedFindings ? `<span class="muted">${summary.acceptedFindings} accepted</span>` : ''}${summary.staleExceptions.length ? `<span class="muted">${summary.staleExceptions.length} stale exception(s)</span>` : ''}</div>
<p class="muted">Readiness counts assessable criteria only; MANUAL and N/A criteria are excluded from both sides of the ratio (rubric 1.1).</p>
${
  summary.topFixes.length
    ? `<h3>Top fixes</h3><ol>${summary.topFixes.map((t) => `<li><span class="sev sev-${t.severity}">${SEVERITY_LABEL[t.severity]}</span> · ${esc(t.criterion)} · ${esc(t.title)}${t.occurrences > 1 ? ` (+${t.occurrences - 1} more)` : ''}<br><span class="muted">${esc(t.recommendation)}</span></li>`).join('')}</ol>`
    : '<p>Socks on. No gaps found in this scope.</p>'
}

<h2>Findings</h2>
${open.length ? open.map(findingDetails).join('\n') : '<p>Socks on. No open findings in this scope.</p>'}
${accepted.length ? `<h3 style="margin-top:24px">Accepted findings</h3>${accepted.map(findingDetails).join('\n')}` : ''}

<h2>Controls and policies affected</h2>
<p class="muted">Mapping: ${esc(report.mapping.name)}${report.mapping.source === 'default' ? '' : ` (${esc(report.mapping.source)})`}.</p>
${(() => {
  const impact = controlImpacts(report);
  if (impact.controls.length === 0)
    return '<p>No open findings affect a mapped control or policy.</p>';
  return (['Control', 'Policy'] as const)
    .map((title) => {
      const rows = title === 'Control' ? impact.controls : impact.policies;
      return `<div class="table-wrap"><table><thead><tr><th>${title}</th><th>Open findings</th><th>Criteria</th></tr></thead><tbody>${rows
        .map(
          (r) =>
            `<tr><td>${esc(r.name)}</td><td>${r.findings.map((f) => `<a href="#${esc(f.id)}">${esc(f.id)}</a>`).join(' ')}</td><td>${esc(r.criteria.join(', '))}</td></tr>`,
        )
        .join('')}</tbody></table></div>`;
    })
    .join('<br>');
})()}

<h2>Scorecard</h2>
${scorecard}

<h2>Manual evidence checklist</h2>
<p class="muted">These criteria cannot be assessed from the repository. Gather the evidence and track it in your GRC tool.</p>
${manual
  .map((c) => {
    const def = DEFS.get(c.id);
    return `<details><summary><strong>${esc(c.id)}</strong> · ${esc(c.title)} <span class="muted">· ${esc(c.owner ?? '')}</span></summary><div class="body">
<p>${esc(c.rationale)}</p>${def?.requirement ? `<p><strong>Requirement:</strong> ${esc(def.requirement)}</p>` : ''}
<ul class="checklist">${c.manualFollowUps.map((m) => `<li>${inline(m)}</li>`).join('')}</ul>
${def?.evidence ? `<p><strong>Evidence to collect:</strong> ${inline(def.evidence)}</p>` : ''}</div></details>`;
  })
  .join('\n')}

${
  unverified.length
    ? `<h2>Checks threesock did not verify</h2><p class="muted">Scored on automated checks only; these rubric checks still need human review.</p>${unverified
        .map(
          (c) =>
            `<details><summary><strong>${esc(c.id)}</strong> · ${esc(c.title)} <span class="muted">· scored ${esc(scoreText(c))}</span></summary><div class="body"><ul class="checklist">${c.manualFollowUps.map((m) => `<li>${inline(m)}</li>`).join('')}</ul></div></details>`,
        )
        .join('\n')}`
    : ''
}

<footer>Generated by threesock ${esc(report.tool.version)} on ${esc(date)} · JSON schema ${esc(report.schemaVersion)} · This file makes no network requests.</footer>
</main></body>
</html>
`;
}
