// Local git history for rules (decision 25). Read-only, fixed-size, no gpg calls:
// signatures are detected from raw commit headers rather than verified.
import { execFileSync } from 'node:child_process';

export const HISTORY_LIMIT = 200;

export interface GitCommit {
  sha: string;
  authorEmail: string;
  parents: number;
  subject: string;
  /** The commit carries a GPG/SSH/X.509 signature header (not verified). */
  signed: boolean;
}

export interface GitHistory {
  /** False outside a git repository or before the first commit. */
  available: boolean;
  shallow: boolean;
  /** Most recent commits reachable from HEAD. */
  commits: GitCommit[];
  /** First-parent history of the default branch, when it can be identified. */
  defaultBranch?: { name: string; commits: GitCommit[] };
}

function git(root: string, args: string[]): string | undefined {
  try {
    return execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return undefined;
  }
}

/** Parses `git log --pretty=raw` output. */
export function parseRawLog(raw: string): GitCommit[] {
  const commits: GitCommit[] = [];
  for (const block of raw.split(/^commit /m).slice(1)) {
    const [head = '', ...rest] = block.split('\n\n');
    const lines = head.split('\n');
    const sha = (lines[0] ?? '').trim().split(' ')[0] ?? '';
    const author = lines.find((l) => l.startsWith('author ')) ?? '';
    const subject = (
      rest
        .join('\n\n')
        .split('\n')
        .find((l) => l.trim()) ?? ''
    ).trim();
    commits.push({
      sha,
      authorEmail: /<([^>]*)>/.exec(author)?.[1] ?? '',
      parents: lines.filter((l) => l.startsWith('parent ')).length,
      subject,
      signed: lines.some((l) => /^gpgsig(?:-sha256)? /.test(l)),
    });
  }
  return commits;
}

function log(root: string, ref: string, firstParent: boolean): GitCommit[] | undefined {
  const out = git(root, [
    'log',
    '--pretty=raw',
    `-n${HISTORY_LIMIT}`,
    ...(firstParent ? ['--first-parent'] : []),
    ref,
    '--',
  ]);
  return out === undefined ? undefined : parseRawLog(out);
}

function defaultBranchRef(root: string): string | undefined {
  const origin = git(root, ['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD'])?.trim();
  if (origin) return origin.replace(/^refs\/remotes\//, '');
  for (const name of ['main', 'master']) {
    if (git(root, ['rev-parse', '--verify', '--quiet', `refs/heads/${name}`]) !== undefined)
      return name;
  }
  return undefined;
}

export function readGitHistory(root: string): GitHistory {
  const commits = log(root, 'HEAD', false);
  if (!commits || commits.length === 0) return { available: false, shallow: false, commits: [] };
  const shallow = git(root, ['rev-parse', '--is-shallow-repository'])?.trim() === 'true';
  const history: GitHistory = { available: true, shallow, commits };
  const ref = defaultBranchRef(root);
  const branch = ref ? log(root, ref, true) : undefined;
  if (ref && branch) history.defaultBranch = { name: ref, commits: branch };
  return history;
}

/** Lazily reads history once per scan. */
export function lazyGitHistory(root: string): () => GitHistory {
  let cached: GitHistory | undefined;
  return () => (cached ??= readGitHistory(root));
}
