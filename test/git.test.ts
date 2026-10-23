import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseRawLog, readGitHistory, type GitHistory } from '../src/engine/git.js';
import { commitAttribution } from '../src/rules/cc1.5/commit-attribution.js';
import { directPushes } from '../src/rules/cc8.1/direct-pushes.js';
import { commit, run } from './helpers/memory.js';

const history = (commits: ReturnType<typeof commit>[], branch = commits): GitHistory => ({
  available: true,
  shallow: false,
  commits,
  defaultBranch: { name: 'main', commits: branch },
});

describe('parseRawLog', () => {
  it('reads author email, parents, subject and signature headers without verifying them', () => {
    const raw = [
      'commit aaaaaaa1111111111111111111111111111111111',
      'tree 1111111111111111111111111111111111111111',
      'parent bbbbbbb1111111111111111111111111111111111',
      'parent ccccccc1111111111111111111111111111111111',
      'author Ada <ada@company.example> 1700000000 +0000',
      'committer Ada <ada@company.example> 1700000000 +0000',
      'gpgsig -----BEGIN SSH SIGNATURE-----',
      ' U1NIU0lH',
      ' -----END SSH SIGNATURE-----',
      '',
      '    Merge pull request #12 from ada/feature',
      '',
      'commit ddddddd1111111111111111111111111111111111',
      'tree 1111111111111111111111111111111111111111',
      'author root <root@localhost> 1700000000 +0000',
      'committer root <root@localhost> 1700000000 +0000',
      '',
      '    hotfix',
      '',
    ].join('\n');
    expect(parseRawLog(raw)).toEqual([
      {
        sha: 'aaaaaaa1111111111111111111111111111111111',
        authorEmail: 'ada@company.example',
        parents: 2,
        subject: 'Merge pull request #12 from ada/feature',
        signed: true,
      },
      {
        sha: 'ddddddd1111111111111111111111111111111111',
        authorEmail: 'root@localhost',
        parents: 0,
        subject: 'hotfix',
        signed: false,
      },
    ]);
  });

  it('reads a real repository, including the default branch', () => {
    const dir = mkdtempSync(join(tmpdir(), 'threesock-git-'));
    const git = (...args: string[]) =>
      execFileSync('git', args, {
        cwd: dir,
        stdio: 'pipe',
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: 'T',
          GIT_AUTHOR_EMAIL: 't@company.example',
          GIT_COMMITTER_NAME: 'T',
          GIT_COMMITTER_EMAIL: 't@company.example',
        },
      });
    git('init', '-q', '-b', 'main');
    writeFileSync(join(dir, 'a.txt'), 'a');
    git('add', '.');
    git('-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'Add a (#1)');
    const h = readGitHistory(dir);
    expect(h.available).toBe(true);
    expect(h.defaultBranch?.name).toBe('main');
    expect(h.commits[0]?.subject).toBe('Add a (#1)');
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('cc1.5/commit-attribution', () => {
  it('fails on unattributable identities and shows short SHAs, never emails', async () => {
    const out = await run(
      commitAttribution,
      {},
      {},
      history([
        commit({ sha: 'abc1234def', authorEmail: 'root@localhost' }),
        commit({ sha: 'f00' }),
      ]),
    );
    expect(out.status).toBe('fail');
    const text = JSON.stringify(out);
    expect(text).toContain('abc1234');
    expect(text).not.toContain('root@localhost');
  });
  it('passes when at least 90% of commits are signed', async () => {
    const commits = Array.from({ length: 10 }, (_, i) => commit({ sha: `s${i}`, signed: i > 0 }));
    expect((await run(commitAttribution, {}, {}, history(commits))).status).toBe('pass');
  });
  it('is inconclusive when unsigned commits might still be SSO-linked', async () => {
    expect((await run(commitAttribution, {}, {}, history([commit({ sha: 'a' })]))).status).toBe(
      'unknown',
    );
  });
  it('is inconclusive on shallow clones and not applicable without history', async () => {
    expect(
      (await run(commitAttribution, {}, {}, { ...history([commit({ sha: 'a' })]), shallow: true }))
        .status,
    ).toBe('unknown');
    expect((await run(commitAttribution, {})).status).toBe('not_applicable');
  });
});

describe('cc8.1/direct-pushes', () => {
  it('passes when every default-branch commit has a pull request trail', async () => {
    const out = await run(
      directPushes,
      {},
      {},
      history([
        commit({ sha: 'a', subject: 'Fix login (#42)' }),
        commit({ sha: 'b', parents: 2, subject: 'Merge branch x' }),
      ]),
    );
    expect(out.status).toBe('pass');
  });
  it('fails with a count and SHAs when commits were pushed directly', async () => {
    const out = await run(
      directPushes,
      {},
      {},
      history([
        commit({ sha: 'abcdef123', subject: 'quick fix' }),
        commit({ sha: 'b', subject: 'Feature (#7)' }),
      ]),
    );
    expect(out.status === 'fail' && out.findings[0]?.observed).toMatch(
      /^1 of the last 2 commits on main .*abcdef1/,
    );
  });
  it('is inconclusive when the default branch is unknown', async () => {
    expect(
      (
        await run(
          directPushes,
          {},
          {},
          { available: true, shallow: false, commits: [commit({ sha: 'a' })] },
        )
      ).status,
    ).toBe('unknown');
  });
});
