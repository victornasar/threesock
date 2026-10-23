// Opt-in GitHub API checks (decisions 34-38). Read-only GET requests with the
// user's GITHUB_TOKEN; no SDK. Every failure becomes a reason string so rules
// can report "inconclusive" instead of failing the scan.
import { execFileSync } from 'node:child_process';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; reason: string };

export interface GitHubOptions {
  token: string;
  /** owner/name */
  repo: string;
  apiUrl?: string;
  fetch?: typeof fetch;
}

/** Parses owner/name from a GitHub remote URL (https or ssh). */
export function parseRemote(url: string): string | undefined {
  const m = /github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(url.trim());
  return m ? `${m[1]}/${m[2]}` : undefined;
}

export function repoFromRemote(root: string): string | undefined {
  try {
    const url = execFileSync('git', ['-C', root, 'remote', 'get-url', 'origin'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return parseRemote(url);
  } catch {
    return undefined;
  }
}

export interface RepoInfo {
  full_name: string;
  default_branch: string;
  private: boolean;
  owner: { login: string; type: 'User' | 'Organization' };
  security_and_analysis?: Record<string, { status?: string } | undefined> | null;
}

export interface ClassicProtection {
  required_pull_request_reviews?: {
    required_approving_review_count?: number;
    dismiss_stale_reviews?: boolean;
    require_code_owner_reviews?: boolean;
  };
  required_status_checks?: { contexts?: string[]; checks?: unknown[] } | null;
  enforce_admins?: { enabled?: boolean };
  allow_force_pushes?: { enabled?: boolean };
  allow_deletions?: { enabled?: boolean };
  required_signatures?: { enabled?: boolean };
  required_conversation_resolution?: { enabled?: boolean };
}

export interface BranchRule {
  type: string;
  ruleset_id?: number;
  parameters?: Record<string, unknown>;
}

export interface Ruleset {
  id: number;
  name: string;
  bypass_actors?: { actor_type?: string; bypass_mode?: string }[];
}

export interface Alert {
  number: number;
  state: string;
  created_at: string;
  html_url?: string;
  security_advisory?: { severity?: string };
  security_vulnerability?: { severity?: string };
  rule?: { security_severity_level?: string | null; severity?: string };
}

export interface Environment {
  name: string;
  protection_rules?: { type: string }[];
}

export interface Org {
  login: string;
  two_factor_requirement_enabled?: boolean | null;
  default_repository_permission?: string | null;
}

const PERMISSION_HINTS: [RegExp, string][] = [
  [/\/protection$/, 'Administration: read'],
  [/\/rulesets\//, 'Administration: read'],
  [/\/vulnerability-alerts$/, 'Administration: read'],
  [/\/dependabot\/alerts/, 'Dependabot alerts: read'],
  [/\/code-scanning\/alerts/, 'Code scanning alerts: read'],
  [/\/environments$/, 'Environments: read (or Actions: read)'],
  [/^\/orgs\//, 'organization Administration: read (organization owner)'],
];

function hint(path: string): string {
  return (
    PERMISSION_HINTS.find(([re]) => re.test(path.split('?')[0] ?? path))?.[1] ?? 'Metadata: read'
  );
}

export class GitHubClient {
  readonly repo: string;
  private readonly apiUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly cache = new Map<string, Promise<ApiResult<unknown>>>();
  /** Distinct problems seen, for the report's coverage section. */
  readonly problems = new Set<string>();

  constructor(private readonly opts: GitHubOptions) {
    this.repo = opts.repo;
    this.apiUrl = (opts.apiUrl ?? 'https://api.github.com').replace(/\/$/, '');
    this.fetchImpl = opts.fetch ?? fetch;
  }

  private async request(path: string): Promise<{ result: ApiResult<unknown>; next?: string }> {
    let res: Response;
    try {
      res = await this.fetchImpl(path.startsWith('http') ? path : `${this.apiUrl}${path}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.opts.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'threesock',
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      return {
        result: { ok: false, status: 0, reason: `GitHub API unreachable (${(err as Error).name})` },
      };
    }
    if (res.status === 204) return { result: { ok: true, data: null } };
    const body: unknown = await res.json().catch(() => null);
    if (res.ok) {
      const next = /<([^>]+)>;\s*rel="next"/.exec(res.headers.get('link') ?? '')?.[1];
      return { result: { ok: true, data: body }, ...(next ? { next } : {}) };
    }
    const message = (body as { message?: string } | null)?.message ?? res.statusText;
    let reason: string;
    if (res.status === 401) reason = 'GITHUB_TOKEN was rejected (401)';
    else if (
      (res.status === 403 || res.status === 429) &&
      res.headers.get('x-ratelimit-remaining') === '0'
    )
      reason = 'GitHub API rate limit reached';
    else if (res.status === 403)
      reason = `token lacks permission (needs ${res.headers.get('x-accepted-github-permissions') ?? hint(path)}): ${message}`;
    else if (res.status === 404)
      reason = `not found, or the token cannot see it (needs ${hint(path)}): ${message}`;
    else reason = `GitHub API error ${res.status}: ${message}`;
    return { result: { ok: false, status: res.status, reason } };
  }

  /** GET with memoization. 404s are returned as failures; callers decide what a 404 means. */
  get<T>(path: string): Promise<ApiResult<T>> {
    let p = this.cache.get(path);
    if (!p) {
      p = this.request(path).then(({ result }) => {
        if (!result.ok && result.status !== 404) this.problems.add(result.reason);
        return result;
      });
      this.cache.set(path, p);
    }
    return p as Promise<ApiResult<T>>;
  }

  /** GET every page (up to 10) of a list endpoint. */
  async getAll<T>(path: string, pick?: (body: unknown) => T[]): Promise<ApiResult<T[]>> {
    const key = `all:${path}`;
    let p = this.cache.get(key);
    if (!p) {
      p = (async (): Promise<ApiResult<unknown>> => {
        const items: T[] = [];
        let url: string | undefined = path;
        for (let page = 0; url && page < 10; page++) {
          const { result, next } = await this.request(url);
          if (!result.ok) {
            if (result.status !== 404) this.problems.add(result.reason);
            return result;
          }
          items.push(...(pick ? pick(result.data) : (result.data as T[])));
          url = next;
        }
        return { ok: true, data: items };
      })();
      this.cache.set(key, p);
    }
    return p as Promise<ApiResult<T[]>>;
  }
}

/** Typed accessors for the facts the GitHub rules need. */
export class GitHubFacts {
  constructor(readonly client: GitHubClient) {}

  private get r(): string {
    return `/repos/${this.client.repo}`;
  }

  repo(): Promise<ApiResult<RepoInfo>> {
    return this.client.get<RepoInfo>(this.r);
  }

  async branch(): Promise<ApiResult<string>> {
    const repo = await this.repo();
    return repo.ok ? { ok: true, data: repo.data.default_branch } : repo;
  }

  /** Classic branch protection; `null` when the branch is not protected. */
  async classicProtection(): Promise<ApiResult<ClassicProtection | null>> {
    const branch = await this.branch();
    if (!branch.ok) return branch;
    const res = await this.client.get<ClassicProtection>(
      `${this.r}/branches/${encodeURIComponent(branch.data)}/protection`,
    );
    if (!res.ok && res.status === 404 && /not protected/i.test(res.reason))
      return { ok: true, data: null };
    return res;
  }

  /** Rules (from rulesets) that apply to the default branch. */
  async branchRules(): Promise<ApiResult<BranchRule[]>> {
    const branch = await this.branch();
    if (!branch.ok) return branch;
    return this.client.getAll<BranchRule>(
      `${this.r}/rules/branches/${encodeURIComponent(branch.data)}?per_page=100`,
    );
  }

  ruleset(id: number): Promise<ApiResult<Ruleset>> {
    return this.client.get<Ruleset>(`${this.r}/rulesets/${id}`);
  }

  /** True when Dependabot alerts are enabled (204), false when disabled (404). */
  async dependabotEnabled(): Promise<ApiResult<boolean>> {
    const res = await this.client.get<null>(`${this.r}/vulnerability-alerts`);
    if (res.ok) return { ok: true, data: true };
    if (res.status === 404) return { ok: true, data: false };
    return res;
  }

  dependabotAlerts(): Promise<ApiResult<Alert[]>> {
    return this.client.getAll<Alert>(`${this.r}/dependabot/alerts?state=open&per_page=100`);
  }

  codeScanningAlerts(): Promise<ApiResult<Alert[]>> {
    return this.client.getAll<Alert>(`${this.r}/code-scanning/alerts?state=open&per_page=100`);
  }

  environments(): Promise<ApiResult<Environment[]>> {
    return this.client.getAll<Environment>(
      `${this.r}/environments?per_page=100`,
      (b) => (b as { environments?: Environment[] }).environments ?? [],
    );
  }

  org(login: string): Promise<ApiResult<Org>> {
    return this.client.get<Org>(`/orgs/${encodeURIComponent(login)}`);
  }
}
