import { parseAllDocuments } from 'yaml';
import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { composeFiles, k8sWorkloads } from '../lib/infra.js';
import { resources } from '../lib/terraform.js';

/** Follows a property path through parsed YAML, returning undefined on any miss. */
function at(value: unknown, ...path: string[]): unknown {
  let cur = value;
  for (const key of path) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function containersOf(doc: unknown): { name: string; limits: boolean }[] {
  const kind = at(doc, 'kind');
  const podPath =
    kind === 'Pod'
      ? ['spec']
      : kind === 'CronJob'
        ? ['spec', 'jobTemplate', 'spec', 'template', 'spec']
        : ['spec', 'template', 'spec'];
  const pod = at(doc, ...podPath) as
    { containers?: { name?: string; resources?: { limits?: object } }[] } | undefined;
  return (pod?.containers ?? []).map((c) => ({
    name: c.name ?? '(unnamed)',
    limits: Boolean(c.resources?.limits),
  }));
}

export const resourceLimits: Rule = {
  id: 'a1.1/resource-limits',
  criterion: 'A1.1',
  title: 'Workloads declare resource limits',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Resource requests/limits set'],
  expected:
    'Every container and task declares CPU and memory limits (and requests where the scheduler uses them).',
  risk: 'One runaway workload can starve its neighbours and take down unrelated services.',
  remediation: {
    summary:
      'Set requests and limits on every container, and memory/CPU on every task definition or compose service.',
    example: `resources:
  requests: { cpu: 100m, memory: 128Mi }
  limits:   { cpu: 500m, memory: 512Mi }`,
  },
  detect(ctx) {
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    let workloads = 0;
    for (const f of k8sWorkloads(ctx.files)) {
      for (const doc of parseAllDocuments(ctx.files.read(f.path) ?? '', { logLevel: 'silent' })) {
        const containers = containersOf(doc.toJS());
        workloads += containers.length;
        const missing = containers.filter((c) => !c.limits).map((c) => c.name);
        if (missing.length)
          findings.push({
            path: f.path,
            title: `Containers without resource limits in ${f.path}`,
            observed: `No resources.limits for: ${missing.join(', ')}.`,
            key: `${f.path}:${missing.join(',')}`,
          });
        else if (containers.length)
          evidence.push({
            kind: 'file',
            path: f.path,
            description: `All containers set resource limits.`,
          });
      }
    }
    for (const f of composeFiles(ctx.files)) {
      const text = ctx.files.read(f.path) ?? '';
      if (!/^services:/m.test(text)) continue;
      workloads++;
      if (/mem_limit|cpus:|resources:\s*\n\s*limits:/.test(text))
        evidence.push({
          kind: 'file',
          path: f.path,
          description: 'Compose services set resource limits.',
        });
      else
        findings.push({
          path: f.path,
          severity: 'low',
          title: `Compose services without resource limits in ${f.path}`,
          observed: `${f.path} sets no mem_limit, cpus or deploy.resources.limits.`,
          key: f.path,
        });
    }
    for (const t of resources(ctx.files, 'aws_ecs_task_definition')) {
      workloads++;
      if (t.attrs.memory && t.attrs.cpu)
        evidence.push({
          kind: 'file',
          path: t.path,
          line: t.line,
          description: `${t.labels.join('.')} sets cpu and memory.`,
        });
      else
        findings.push({
          path: t.path,
          line: t.line,
          title: `ECS task without cpu/memory: ${t.labels.join('.')}`,
          observed: `${t.labels.join('.')} does not set both cpu and memory.`,
          key: t.labels.join('.'),
        });
    }
    if (workloads === 0)
      return {
        status: 'not_applicable',
        justification: 'No Kubernetes workloads, compose services or ECS task definitions found.',
      };
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence };
  },
};
