import type { Rule } from '../../engine/types.js';
import { composeFiles, k8sWorkloads, terraformFiles } from '../lib/infra.js';
import { findDoc } from '../lib/docs.js';
import { findAny } from '../util.js';

const SCALING =
  /kind:\s*(?:HorizontalPodAutoscaler|ScaledObject|VerticalPodAutoscaler)|aws_appautoscaling_target|aws_autoscaling_group|google_compute_autoscaler|google_compute_region_autoscaler|max_instance_count|maxScale|azurerm_monitor_autoscale_setting/;

export const autoscaling: Rule = {
  id: 'a1.1/autoscaling',
  criterion: 'A1.1',
  title: 'Autoscaling or a capacity plan is defined',
  tags: ['CONFIG', 'DOCS'],
  severity: 'low',
  redFlag: false,
  checks: ['Autoscaling configured'],
  expected: 'Workloads autoscale on load, or a documented capacity plan sets headroom targets.',
  risk: 'Traffic spikes (or abuse) exhaust fixed capacity and cause an outage.',
  remediation: {
    summary:
      'Add a HorizontalPodAutoscaler or cloud autoscaling policy, or document a capacity plan with headroom targets.',
    example: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec: { minReplicas: 2, maxReplicas: 10, metrics: [{ type: Resource, resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } } }] }`,
  },
  detect(ctx) {
    const deployable = [
      ...k8sWorkloads(ctx.files),
      ...terraformFiles(ctx.files),
      ...composeFiles(ctx.files),
    ];
    if (deployable.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No deployable infrastructure (Kubernetes, Terraform, compose) found.',
      };
    const hit = findAny(
      ctx.files,
      ctx.files.files.filter((f) => /\.(?:ya?ml|tf|json)$/.test(f.path)),
      SCALING,
    );
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'Autoscaling is configured.' }],
      };
    const plan = findDoc(ctx.files, /capacity plan|headroom|capacity review/i);
    if (plan)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...plan, description: 'A capacity plan is documented.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No autoscaling or capacity plan',
          observed: 'No autoscaling configuration and no documented capacity plan were found.',
          key: 'missing',
        },
      ],
    };
  },
};
