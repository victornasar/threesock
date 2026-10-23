import { parseAllDocuments } from 'yaml';
import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { dockerfiles } from '../lib/build-files.js';
import { composeFiles, k8sWorkloads } from '../lib/infra.js';
import { resources } from '../lib/terraform.js';

export const healthChecks: Rule = {
  id: 'a1.2/health-checks',
  criterion: 'A1.2',
  title: 'Workloads have health checks for self-healing',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Health checks, self-healing, and automated failover configured'],
  expected:
    'Every workload declares liveness/readiness probes (or a HEALTHCHECK / load balancer health check) so failures are detected and replaced automatically.',
  risk: 'A hung process keeps receiving traffic and is never restarted.',
  remediation: {
    summary:
      'Add readiness and liveness probes to containers (or HEALTHCHECK / target group health checks).',
    example: `readinessProbe: { httpGet: { path: /healthz, port: 8080 }, periodSeconds: 10 }
livenessProbe:  { httpGet: { path: /healthz, port: 8080 }, initialDelaySeconds: 15 }`,
  },
  detect(ctx) {
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    const k8s = k8sWorkloads(ctx.files);
    for (const f of k8s) {
      for (const doc of parseAllDocuments(ctx.files.read(f.path) ?? '', { logLevel: 'silent' })) {
        const text = JSON.stringify(doc.toJS() ?? {});
        if (!/"containers"/.test(text) || /"kind":"(?:Job|CronJob)"/.test(text)) continue;
        if (/"(?:readinessProbe|livenessProbe)"/.test(text))
          evidence.push({ kind: 'file', path: f.path, description: 'Probes are defined.' });
        else
          findings.push({
            path: f.path,
            title: `No probes in ${f.path}`,
            observed: `${f.path} defines a workload without readiness or liveness probes.`,
            key: f.path,
          });
      }
    }
    const lbChecks = resources(ctx.files, /^aws_lb_target_group$|^google_compute_health_check$/);
    for (const t of lbChecks)
      evidence.push({
        kind: 'file',
        path: t.path,
        line: t.line,
        description: `Load balancer health check on ${t.labels.join('.')}.`,
      });
    const containers = [...dockerfiles(ctx.files), ...composeFiles(ctx.files)];
    if (k8s.length === 0) {
      for (const f of containers) {
        if (/^\s*HEALTHCHECK\s|^\s+healthcheck:/m.test(ctx.files.read(f.path) ?? ''))
          evidence.push({
            kind: 'file',
            path: f.path,
            description: 'Container health check defined.',
          });
      }
      if (containers.length && evidence.length === 0) {
        findings.push({
          path: containers[0]?.path,
          title: 'Containers have no health checks',
          observed:
            'Dockerfiles and compose files define no HEALTHCHECK, and no load balancer health checks were found.',
          key: 'containers',
        });
      }
    }
    if (k8s.length === 0 && containers.length === 0 && lbChecks.length === 0) {
      return {
        status: 'not_applicable',
        justification: 'No container, Kubernetes or load balancer definitions found.',
      };
    }
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence };
  },
};
