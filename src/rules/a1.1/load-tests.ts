import type { Rule } from '../../engine/types.js';
import { detectWebApp } from '../lib/web.js';
import { findAny } from '../util.js';

const LOAD =
  /from ['"]k6(?:\/http)?['"]|\bk6\s+run\b|artillery|locust|\bjmeter\b|gatling|vegeta|autocannon|\bwrk\b\s+-|\bhey\b\s+-n/i;

export const loadTests: Rule = {
  id: 'a1.1/load-tests',
  criterion: 'A1.1',
  title: 'Load or performance tests exist',
  tags: ['CODE'],
  severity: 'low',
  redFlag: false,
  checks: ['Load or performance tests exist'],
  expected: 'Load tests (k6, Artillery, Locust, Gatling, ...) exist and run before major releases.',
  risk: 'Capacity limits are discovered in production, during the busiest hour.',
  remediation: {
    summary: 'Add a load test for the critical paths and run it before major releases.',
    example: `import http from 'k6/http';
export const options = { vus: 50, duration: '2m' };
export default () => http.get(\`\${__ENV.BASE_URL}/health\`);`,
  },
  detect(ctx) {
    if (!detectWebApp(ctx.files))
      return { status: 'not_applicable', justification: 'No HTTP service to load test.' };
    if (ctx.files.files.some((f) => /\.jmx$|(?:^|\/)locustfile\.py$|(?:^|\/)k6\//.test(f.path))) {
      const f = ctx.files.files.find((x) =>
        /\.jmx$|(?:^|\/)locustfile\.py$|(?:^|\/)k6\//.test(x.path),
      );
      return {
        status: 'pass',
        evidence: [
          { kind: 'file', path: f?.path as string, description: 'Load test definitions exist.' },
        ],
      };
    }
    const hit = findAny(
      ctx.files,
      ctx.files.files.filter((f) => /\.(?:[cm]?[jt]s|py|ya?ml|json|sh)$/.test(f.path)),
      LOAD,
    );
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'Load tests exist.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No load tests',
          observed: 'The repository serves HTTP but has no load or performance tests.',
          key: 'missing',
        },
      ],
    };
  },
};
