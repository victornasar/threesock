// Monitoring and alerting defined as code.
import type { FileIndex } from '../../engine/types.js';
import { isTestPath, isVendored } from './languages.js';
import { findAny } from '../util.js';

export const ALERTS =
  /(?:^\s*-?\s*alert:\s*\S)|aws_cloudwatch_metric_alarm|datadog_monitor|newrelic_(?:nrql_)?alert|grafana_rule_group|google_monitoring_alert_policy|azurerm_monitor_metric_alert|pagerduty_service|opsgenie_|alertmanager|AWS::CloudWatch::Alarm/m;
export const OBSERVABILITY =
  /Sentry\.init|sentry_sdk\.init|@sentry\/|opentelemetry|dd-trace|datadog|newrelic|prometheus|grafana|honeycomb|"panels"\s*:|aws_cloudwatch_dashboard|AWS::CloudWatch::Dashboard/i;

export function monitoringFiles(files: FileIndex) {
  return files.files.filter(
    (f) =>
      /\.(?:tf|ya?ml|json|[cm]?[jt]s|py|go)$/.test(f.path) &&
      !isTestPath(f.path) &&
      !isVendored(f.path) &&
      !/(?:^|\/)(?:package-lock\.json|pnpm-lock\.yaml)$/.test(f.path),
  );
}

export function findMonitoring(files: FileIndex, re: RegExp) {
  return findAny(files, monitoringFiles(files), re);
}
