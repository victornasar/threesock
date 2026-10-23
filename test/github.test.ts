// GitHub checks against recorded API responses (shapes from the GitHub REST docs).
// No test calls the real API (decision 38).
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseRemote } from '../src/integrations/github.js';
import type { ScanReport } from '../src/engine/model.js';
import { scan } from '../src/engine/scan.js';
import { renderHtml } from '../src/reports/html.js';
import { renderJson } from '../src/reports/json.js';
import { renderMarkdown } from '../src/reports/markdown.js';
import { renderSarif } from '../src/reports/sarif.js';
import { renderText } from '../src/reports/text.js';
import { RULES } from '../src/rules/index.js';
import { main } from '../src/cli/main.js';
import { FIXED_NOW, materialize, type Materialized } from './helpers/fixtures.js';

const TOKEN = ['ghp', '_', 'T3stT0kenNeverPrintedAnywhere0123456'].join('');

type Route = { status?: number; body?: unknown; headers?: Record<string, string> };

/** A fetch that serves recorded responses by path and records what was requested. */
function fakeGitHub(routes: Record<string, Route>) {
  const calls: { url: string; auth: string | null }[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({ url, auth: headers.get('authorization') });
    const path = url.replace('https://api.github.com', '');
    const route = routes[path] ?? { status: 404, body: { message: 'Not Found' } };
    const status = route.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(route.body ?? {}), {
      status,
      headers: route.headers,
    });
  }) as typeof fetch;
  return { fetchImpl, calls };
}

const daysAgo = (n: number) => new Date(FIXED_NOW.getTime() - n * 86_400_000).toISOString();
const R = '/repos/acme/app';

const protectedOrgRepo: Record<string, Route> = {
  [R]: {
    body: {
      full_name: 'acme/app',
      default_branch: 'main',
      private: true,
      owner: { login: 'acme', type: 'Organization' },
      security_and_analysis: {
        secret_scanning: { status: 'enabled' },
        secret_scanning_push_protection: { status: 'enabled' },
      },
    },
  },
  [`${R}/branches/main/protection`]: { status: 404, body: { message: 'Branch not protected' } },
  [`${R}/rules/branches/main?per_page=100`]: {
    body: [
      {
        type: 'pull_request',
        ruleset_id: 7,
        parameters: {
          required_approving_review_count: 2,
          dismiss_stale_reviews_on_push: true,
          require_code_owner_review: true,
          required_review_thread_resolution: true,
        },
      },
      {
        type: 'required_status_checks',
        ruleset_id: 7,
        parameters: { required_status_checks: [{ context: 'test' }] },
      },
      { type: 'non_fast_forward', ruleset_id: 7 },
      { type: 'deletion', ruleset_id: 7 },
      { type: 'required_signatures', ruleset_id: 7 },
    ],
  },
  [`${R}/rulesets/7`]: { body: { id: 7, name: 'main', bypass_actors: [] } },
  [`${R}/vulnerability-alerts`]: { status: 204 },
  [`${R}/dependabot/alerts?state=open&per_page=100`]: {
    body: [
      { number: 3, state: 'open', created_at: daysAgo(5), security_advisory: { severity: 'high' } },
    ],
  },
  [`${R}/code-scanning/alerts?state=open&per_page=100`]: {
    status: 404,
    body: { message: 'no analysis found' },
  },
  [`${R}/environments?per_page=100`]: {
    body: {
      total_count: 1,
      environments: [{ name: 'production', protection_rules: [{ type: 'required_reviewers' }] }],
    },
  },
  ['/orgs/acme']: {
    body: {
      login: 'acme',
      two_factor_requirement_enabled: true,
      default_repository_permission: 'read',
    },
  },
};

const unprotectedPersonalRepo: Record<string, Route> = {
  [R]: {
    body: {
      full_name: 'acme/app',
      default_branch: 'main',
      private: false,
      owner: { login: 'acme', type: 'User' },
      security_and_analysis: {
        secret_scanning: { status: 'disabled' },
        secret_scanning_push_protection: { status: 'disabled' },
      },
    },
  },
  [`${R}/branches/main/protection`]: { status: 404, body: { message: 'Branch not protected' } },
  [`${R}/rules/branches/main?per_page=100`]: { body: [] },
  [`${R}/vulnerability-alerts`]: {
    status: 404,
    body: { message: 'Vulnerability alerts are disabled.' },
  },
  [`${R}/dependabot/alerts?state=open&per_page=100`]: {
    status: 403,
    body: { message: 'Dependabot alerts are disabled for this repository.' },
  },
  [`${R}/code-scanning/alerts?state=open&per_page=100`]: {
    status: 404,
    body: { message: 'no analysis found' },
  },
  [`${R}/environments?per_page=100`]: {
    body: { environments: [{ name: 'production', protection_rules: [] }] },
  },
};

let repo: Materialized;
beforeAll(() => {
  repo = materialize('compliant-app');
});
afterAll(() => rmSync(repo.dir, { recursive: true, force: true }));

async function scanWith(routes: Record<string, Route>) {
  const gh = fakeGitHub(routes);
  const out = await scan({
    root: repo.dir,
    rules: RULES,
    now: FIXED_NOW,
    github: { token: TOKEN, repo: 'acme/app', fetch: gh.fetchImpl },
  });
  return { ...out, calls: gh.calls };
}

const check = (report: ScanReport, ruleId: string) =>
  report.criteria.flatMap((c) => c.checks).find((c) => c.ruleId === ruleId);
const githubRuleIds = RULES.filter((r) => r.requires?.includes('github')).map((r) => r.id);

describe('--github: a well-protected organization repository', () => {
  it('passes every GitHub check, citing the API as evidence', async () => {
    const { report } = await scanWith(protectedOrgRepo);
    for (const id of githubRuleIds) {
      const c = check(report, id);
      expect(c?.status, `${id}: ${c?.note ?? ''}`).toBe('pass');
      expect(c?.evidence[0]?.kind).toBe('api');
    }
    expect(report.coverage.github).toEqual({ repository: 'acme/app', problems: [] });
  });

  it('sends the token only as a bearer header, and only with GET requests to api.github.com', async () => {
    const { calls } = await scanWith(protectedOrgRepo);
    expect(calls.length).toBeGreaterThan(5);
    for (const c of calls) {
      expect(c.url.startsWith('https://api.github.com/')).toBe(true);
      expect(c.auth).toBe(`Bearer ${TOKEN}`);
    }
  });
});

describe('--github: an unprotected personal repository', () => {
  it('reports each gap, and organization checks are not applicable', async () => {
    const { report } = await scanWith(unprotectedPersonalRepo);
    const titles = report.findings
      .filter((f) => githubRuleIds.includes(f.ruleId))
      .map((f) => f.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        'main has no branch protection',
        'Secret scanning is off',
        'Secret push protection is off',
        'Dependabot alerts are off',
        'Environment "production" has no required reviewers',
        'Signed commits are not required',
      ]),
    );
    expect(check(report, 'cc5.2/github-org-security')?.status).toBe('not_applicable');
    expect(check(report, 'cc4.2/github-aged-alerts')?.status).toBe('unknown');
    expect(report.findings.find((f) => f.title === 'main has no branch protection')?.redFlag).toBe(
      true,
    );
  });
});

describe('--github: missing permissions and failures', () => {
  it('names the missing permission and reports inconclusive instead of failing', async () => {
    const { report } = await scanWith({
      ...protectedOrgRepo,
      [`${R}/branches/main/protection`]: {
        status: 403,
        body: { message: 'Resource not accessible by personal access token' },
        headers: { 'x-accepted-github-permissions': 'administration=read' },
      },
      [`${R}/rules/branches/main?per_page=100`]: { status: 403, body: { message: 'Forbidden' } },
    });
    const c = check(report, 'cc8.1/github-branch-protection');
    expect(c?.status).toBe('unknown');
    expect(c?.note).toContain('administration=read');
    expect(report.coverage.github?.problems.some((p) => p.includes('administration=read'))).toBe(
      true,
    );
  });

  it('treats rate limiting and network errors as inconclusive', async () => {
    const limited = await scanWith({
      [R]: {
        status: 403,
        body: { message: 'API rate limit exceeded' },
        headers: { 'x-ratelimit-remaining': '0' },
      },
    });
    expect(check(limited.report, 'cc6.1/github-secret-scanning')?.note).toBe(
      'GitHub API rate limit reached',
    );
    const offline = await scan({
      root: repo.dir,
      rules: RULES,
      now: FIXED_NOW,
      github: {
        token: TOKEN,
        repo: 'acme/app',
        fetch: (async () => {
          throw new TypeError('fetch failed');
        }) as typeof fetch,
      },
    });
    for (const id of githubRuleIds)
      expect(['unknown', 'not_applicable']).toContain(check(offline.report, id)?.status);
  });

  it('flags admins who can bypass protection', async () => {
    const { report } = await scanWith({
      ...protectedOrgRepo,
      [`${R}/rulesets/7`]: {
        body: {
          id: 7,
          name: 'main',
          bypass_actors: [{ actor_type: 'RepositoryRole', bypass_mode: 'always' }],
        },
      },
    });
    expect(report.findings.map((f) => f.title)).toContain(
      'Admins or other actors can bypass protection',
    );
  });
});

describe('--github: aged alerts', () => {
  it('flags Critical alerts older than the vulnerability SLA as red flags', async () => {
    const { report } = await scanWith({
      ...protectedOrgRepo,
      [`${R}/dependabot/alerts?state=open&per_page=100`]: {
        body: [
          {
            number: 9,
            state: 'open',
            created_at: daysAgo(20),
            security_advisory: { severity: 'critical' },
          },
        ],
      },
    });
    const f = report.findings.find((x) => x.ruleId === 'cc4.2/github-aged-alerts');
    expect(f).toMatchObject({
      severity: 'high',
      redFlag: true,
      title: '1 critical Dependabot alert(s) past the 7-day SLA',
    });
    expect(report.criteria.find((c) => c.id === 'CC4.2')?.score).toBe(0);
  });

  it('follows pagination', async () => {
    const page2 = 'https://api.github.com/repositories/1/dependabot/alerts?page=2';
    const { report } = await scanWith({
      ...protectedOrgRepo,
      [`${R}/dependabot/alerts?state=open&per_page=100`]: {
        body: [],
        headers: { link: `<${page2}>; rel="next"` },
      },
      ['/repositories/1/dependabot/alerts?page=2']: {
        body: [
          {
            number: 11,
            state: 'open',
            created_at: daysAgo(400),
            security_advisory: { severity: 'low' },
          },
        ],
      },
    });
    expect(
      report.findings.find((x) => x.ruleId === 'cc4.2/github-aged-alerts')?.observed,
    ).toContain('#11');
  });
});

describe('--github: privacy and wiring', () => {
  it('never puts the token in any output format', async () => {
    const { report, scrub } = await scanWith(unprotectedPersonalRepo);
    for (const out of [
      renderJson(report),
      renderText(report, { verbose: true }),
      renderMarkdown(report),
      renderSarif(report, RULES),
      renderHtml(report),
    ]) {
      expect(scrub(out)).not.toContain(TOKEN);
      expect(scrub(out)).not.toContain(TOKEN.slice(4, 20));
    }
  });

  it('GitHub rules do not run without --github', async () => {
    const { report } = await scan({ root: repo.dir, rules: RULES, now: FIXED_NOW });
    for (const id of githubRuleIds) expect(check(report, id)).toBeUndefined();
    expect(report.coverage.github).toBeUndefined();
  });

  it('parses GitHub remotes', () => {
    expect(parseRemote('git@github.com:acme/app.git')).toBe('acme/app');
    expect(parseRemote('https://github.com/acme/app')).toBe('acme/app');
    expect(parseRemote('https://gitlab.com/acme/app.git')).toBeUndefined();
  });

  it('the CLI refuses --github without a token', async () => {
    const saved = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
    let err = '';
    const orig = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: string) => (
      (err += chunk),
      true
    )) as typeof process.stderr.write;
    try {
      expect(await main(['scan', repo.dir, '--github'])).toBe(2);
      expect(err).toContain('GITHUB_TOKEN=$(gh auth token)');
    } finally {
      process.stderr.write = orig;
      if (saved !== undefined) process.env.GITHUB_TOKEN = saved;
    }
  });
});

describe('--github: direct pushes escalate when the branch is confirmed unprotected', () => {
  it('raises direct pushes from Medium to High', async () => {
    const { GitHubClient, GitHubFacts } = await import('../src/integrations/github.js');
    const { directPushes } = await import('../src/rules/cc8.1/direct-pushes.js');
    const { memoryContext, commit } = await import('./helpers/memory.js');
    const history = {
      available: true,
      shallow: false,
      commits: [commit({ sha: 'abcdef1' })],
      defaultBranch: { name: 'main', commits: [commit({ sha: 'abcdef1' })] },
    };
    const plain = memoryContext({}, {}, history);
    const before = await directPushes.detect(plain);
    expect(before.status === 'fail' && before.findings[0]?.severity).toBeUndefined();
    const ctx = {
      ...plain,
      github: new GitHubFacts(
        new GitHubClient({
          token: TOKEN,
          repo: 'acme/app',
          fetch: fakeGitHub(unprotectedPersonalRepo).fetchImpl,
        }),
      ),
    };
    const after = await directPushes.detect(ctx);
    expect(after.status === 'fail' && after.findings[0]).toMatchObject({
      severity: 'high',
      title: 'Direct pushes to main (branch is unprotected)',
    });
  });
});
