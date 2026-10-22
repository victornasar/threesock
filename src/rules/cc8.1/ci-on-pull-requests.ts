import type { RawFinding, Rule } from '../../engine/types.js';
import { ciConfigs } from '../lib/build-files.js';
import { lineOf, triggers, workflows } from '../lib/workflows.js';
import { findIn } from '../util.js';

const TESTS =
  /\b(?:(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test|vitest|jest|mocha|playwright\s+test|pytest|tox|nox|go\s+test|cargo\s+test|mvn\s+(?:-\S+\s+)?(?:test|verify)|gradle\w*\s+test|make\s+(?:test|check)|(?:npm|pnpm|yarn)\s+(?:run\s+)?check)\b/;
const LINT =
  /\b(?:eslint|biome|(?:npm|pnpm|yarn)\s+(?:run\s+)?(?:lint|check)|ruff|flake8|pylint|golangci-lint|go\s+vet|tsc\b|prettier\s+--check|mypy)\b/;

export const ciOnPullRequests: Rule = {
  id: 'cc8.1/ci-on-pull-requests',
  criterion: 'CC8.1',
  title: 'CI runs tests and lint on every pull request',
  tags: ['CONFIG'],
  severity: 'high',
  redFlag: false,
  checks: ['CI runs automated tests, lint, and security scans before merge'],
  expected:
    'A CI pipeline runs automated tests and lint on every pull request, and branch protection requires it to pass before merge.',
  risk: 'Without a test gate, broken or unreviewed behaviour reaches the default branch and production.',
  remediation: {
    summary:
      'Add a pull-request workflow that runs tests and lint, then make it a required status check.',
    example: `on: pull_request
permissions: { contents: read }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>
      - run: npm ci && npm run lint && npm test`,
  },
  detect(ctx) {
    const wfs = workflows(ctx.files);
    const others = ciConfigs(ctx.files).filter((f) => !f.path.startsWith('.github/'));
    if (wfs.length === 0 && others.length === 0) {
      return {
        status: 'fail',
        findings: [
          {
            title: 'No CI pipeline',
            observed:
              'No CI configuration was found (GitHub Actions, GitLab CI, CircleCI, Jenkins, Azure Pipelines, Bitbucket, Buildkite, Cloud Build).',
            key: 'no-ci',
          },
        ],
      };
    }
    const prWorkflows = wfs.filter((wf) =>
      triggers(wf).some((t) => t === 'pull_request' || t === 'merge_group'),
    );
    const testing = prWorkflows.find((wf) => TESTS.test(wf.text));
    const linting = prWorkflows.find((wf) => LINT.test(wf.text));
    if (testing) {
      const findings: RawFinding[] = [];
      if (!linting)
        findings.push({
          title: 'Pull-request CI runs no linter',
          observed: `${testing.path} runs tests on pull requests, but no lint or type-check step was found.`,
          severity: 'low',
          key: 'no-lint',
        });
      const evidence = [
        {
          kind: 'file' as const,
          path: testing.path,
          line: lineOf(testing, TESTS),
          description: 'Tests run on every pull request.',
        },
      ];
      if (linting)
        evidence.push({
          kind: 'file' as const,
          path: linting.path,
          line: lineOf(linting, LINT),
          description: 'Lint runs on every pull request.',
        });
      return findings.length
        ? { status: 'fail', findings, evidence }
        : { status: 'pass', evidence };
    }
    for (const f of others) {
      const hit = findIn(ctx.files, f.path, TESTS);
      if (hit)
        return {
          status: 'pass',
          evidence: [
            {
              kind: 'file',
              ...hit,
              description: `${f.path} runs tests (merge-request pipelines assumed; confirm they are required).`,
            },
          ],
        };
    }
    const why = prWorkflows.length
      ? `${prWorkflows.length} workflow(s) run on pull requests but none runs a recognised test command.`
      : 'No workflow is triggered by pull_request.';
    return {
      status: 'fail',
      findings: [{ title: 'Tests do not run on pull requests', observed: why, key: 'no-tests' }],
    };
  },
};
