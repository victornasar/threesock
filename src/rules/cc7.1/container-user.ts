import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { dockerfiles } from '../lib/build-files.js';

export const containerUser: Rule = {
  id: 'cc7.1/container-user',
  criterion: 'CC7.1',
  title: 'Containers run as a non-root user',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Hardened baseline configurations defined'],
  expected: 'The final stage of each Dockerfile switches to a non-root USER.',
  risk: 'A process running as root turns any code execution bug into full control of the container and an easier escape to the host.',
  remediation: {
    summary: 'Create or use an unprivileged user and switch to it in the final stage.',
    example: `RUN addgroup --system app && adduser --system --ingroup app app
USER app`,
  },
  detect(ctx) {
    const files = dockerfiles(ctx.files);
    if (files.length === 0)
      return { status: 'not_applicable', justification: 'No Dockerfiles found.' };
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    for (const f of files) {
      const lines = (ctx.files.read(f.path) ?? '').split('\n');
      const lastFrom =
        lines
          .map((l, i) => (/^\s*FROM\s/i.test(l) ? i : -1))
          .filter((i) => i >= 0)
          .pop() ?? 0;
      const users = lines
        .map((l, i) => ({ l, i }))
        .filter(({ l, i }) => i > lastFrom && /^\s*USER\s+/i.test(l));
      const last = users.pop();
      const name = last?.l.trim().split(/\s+/)[1] ?? '';
      if (last && !/^(?:root|0)(?::|$)/.test(name))
        evidence.push({
          kind: 'file',
          path: f.path,
          line: last.i + 1,
          description: `Final stage runs as ${name}.`,
        });
      else if (/distroless[^\n]*:nonroot|chainguard/i.test(lines[lastFrom] ?? ''))
        evidence.push({
          kind: 'file',
          path: f.path,
          line: lastFrom + 1,
          description: 'Base image runs as non-root by default.',
        });
      else
        findings.push({
          path: f.path,
          line: (last?.i ?? lastFrom) + 1,
          title: `Container runs as root: ${f.path}`,
          observed: last
            ? `${f.path} switches to USER ${name}.`
            : `${f.path} never sets a non-root USER in its final stage.`,
          key: f.path,
        });
    }
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence };
  },
};
