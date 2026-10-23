import type { Alert } from '../../integrations/github.js';
import type { RawFinding, Rule, Severity } from '../../engine/types.js';
import { daysBetween } from '../lib/github.js';

function severityOf(a: Alert): Severity | undefined {
  const s = (
    a.security_advisory?.severity ??
    a.security_vulnerability?.severity ??
    a.rule?.security_severity_level ??
    ''
  ).toLowerCase();
  return s === 'critical' || s === 'high' || s === 'medium' || s === 'low'
    ? s
    : s === 'moderate'
      ? 'medium'
      : undefined;
}

export const githubAgedAlerts: Rule = {
  id: 'cc4.2/github-aged-alerts',
  criterion: 'CC4.2',
  title: 'Security alerts are fixed within the remediation SLA',
  tags: ['CONFIG'],
  severity: 'high',
  redFlag: false,
  requires: ['github'],
  checks: ['Remediation SLAs are defined and measured'],
  expected:
    'Open Dependabot and code scanning alerts are remediated within the vulnerability SLA (rubric 1.4, thresholds.vulnerabilitySlaDays).',
  risk: 'Aged Critical and High alerts are known, exploitable weaknesses left open; auditors treat them as a control failure.',
  remediation: {
    summary:
      'Fix or upgrade past the vulnerable versions, or dismiss alerts that do not apply with a recorded reason. Assign owners to anything that cannot meet the SLA and record an exception.',
    example: `gh api repos/OWNER/REPO/dependabot/alerts?state=open --jq '.[] | [.number, .security_advisory.severity, .created_at] | @tsv'`,
  },
  async detect(ctx) {
    if (!ctx.github) return { status: 'unknown', reason: 'GitHub checks are not enabled.' };
    const sla = ctx.config.thresholds.vulnerabilitySlaDays;
    const sources = [
      { name: 'Dependabot', res: await ctx.github.dependabotAlerts() },
      { name: 'code scanning', res: await ctx.github.codeScanningAlerts() },
    ];
    const read = sources.filter((s) => s.res.ok);
    if (read.length === 0)
      return {
        status: 'unknown',
        reason: sources.map((s) => `${s.name}: ${s.res.ok ? '' : s.res.reason}`).join('; '),
      };
    const findings: RawFinding[] = [];
    let open = 0;
    for (const { name, res } of read) {
      if (!res.ok) continue;
      open += res.data.length;
      for (const sev of ['critical', 'high', 'medium', 'low'] as const) {
        const aged = res.data.filter(
          (a) => severityOf(a) === sev && daysBetween(a.created_at, ctx.now) > sla[sev],
        );
        if (!aged.length) continue;
        const oldest = Math.max(...aged.map((a) => daysBetween(a.created_at, ctx.now)));
        const serious = sev === 'critical' || sev === 'high';
        findings.push({
          title: `${aged.length} ${sev} ${name} alert(s) past the ${sla[sev]}-day SLA`,
          observed: `${aged.length} open ${sev} ${name} alert(s) are older than ${sla[sev]} days (oldest ${oldest} days): #${aged
            .slice(0, 8)
            .map((a) => a.number)
            .join(', #')} (GitHub API).`,
          severity: serious ? 'high' : 'medium',
          redFlag: serious, // rubric CC4.2 red flag: aged Critical/High alerts
          key: `${name}:${sev}`,
        });
      }
    }
    const unread = sources
      .filter((s) => !s.res.ok)
      .map((s) => `${s.name} alerts could not be read`);
    if (findings.length) return { status: 'fail', findings };
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'api',
          description: `${open} open ${read.map((s) => s.name).join(' and ')} alert(s), none past the vulnerability SLA${unread.length ? `; ${unread.join('; ')}` : ''} (GitHub API).`,
        },
      ],
    };
  },
};
