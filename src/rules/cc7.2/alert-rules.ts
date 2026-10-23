import type { Rule } from '../../engine/types.js';
import { hasIac } from '../lib/infra.js';
import { ALERTS, findMonitoring } from '../lib/monitoring.js';
import { detectWebApp } from '../lib/web.js';

export const alertRules: Rule = {
  id: 'cc7.2/alert-rules',
  criterion: 'CC7.2',
  title: 'Alert rules are defined and routed to an owner',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Alert rules exist'],
  expected:
    'Alerts for auth-failure spikes, error rates and infrastructure anomalies are defined as code and routed to on-call.',
  risk: 'Attacks and outages that nobody is alerted to run for hours or days.',
  remediation: {
    summary:
      'Define alert rules in code (Prometheus, CloudWatch, Datadog, Grafana) with routing to an on-call channel.',
    example: `- alert: LoginFailureSpike
  expr: sum(rate(auth_login_failures_total[5m])) > 20
  labels: { severity: page }`,
  },
  detect(ctx) {
    if (!detectWebApp(ctx.files) && !hasIac(ctx.files))
      return {
        status: 'not_applicable',
        justification: 'No service or infrastructure to alert on (no web server and no IaC found).',
      };
    const hit = findMonitoring(ctx.files, ALERTS);
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'Alert rules are defined in code.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No alert rules defined in code',
          observed:
            'No alert definitions (Prometheus rules, CloudWatch alarms, Datadog monitors, ...) were found.',
          key: 'missing',
        },
      ],
    };
  },
};
