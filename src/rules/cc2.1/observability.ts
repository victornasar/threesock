import type { Rule } from '../../engine/types.js';
import { hasIac } from '../lib/infra.js';
import { findMonitoring, OBSERVABILITY } from '../lib/monitoring.js';
import { detectWebApp } from '../lib/web.js';

export const observability: Rule = {
  id: 'cc2.1/observability',
  criterion: 'CC2.1',
  title: 'Monitoring and dashboards are defined as code',
  tags: ['CODE', 'CONFIG'],
  severity: 'low',
  redFlag: false,
  checks: ['Dashboards/alerts defined as code'],
  expected:
    'Error tracking, metrics and dashboards are configured in code (Sentry, OpenTelemetry, Prometheus, Grafana, Datadog, CloudWatch, ...).',
  risk: 'Without instrumentation, security-relevant failures and abuse are invisible until users report them.',
  remediation: {
    summary:
      'Instrument the service (error tracking and metrics) and keep dashboards and monitors in code.',
    example: `import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });`,
  },
  detect(ctx) {
    if (!detectWebApp(ctx.files) && !hasIac(ctx.files))
      return {
        status: 'not_applicable',
        justification: 'No service or infrastructure to monitor (no web server and no IaC found).',
      };
    const hit = findMonitoring(ctx.files, OBSERVABILITY);
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'Monitoring is configured in code.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No monitoring defined in code',
          observed:
            'No error tracking, metrics or dashboard configuration was found in code or IaC.',
          key: 'missing',
        },
      ],
    };
  },
};
