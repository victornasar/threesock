import type { Rule } from '../../engine/types.js';
import { plural } from '../util.js';

// Identities that cannot be traced to a person. Bot accounts are attributable.
const UNATTRIBUTABLE =
  /^$|^(?:root|admin|administrator|user|ubuntu|ec2-user|vagrant|jenkins|runner|git|deploy|build)@|@localhost$|@[^@]*\.(?:local|localdomain|lan|internal)$|@(?:[\w-]+\.)?(?:example\.(?:com|org|net)|invalid)$/i;
const SIGNED_THRESHOLD = 0.9;

export const commitAttribution: Rule = {
  id: 'cc1.5/commit-attribution',
  criterion: 'CC1.5',
  title: 'Every change is attributable to an individual',
  tags: ['CONFIG'],
  severity: 'medium',
  checks: ['Every change is attributable to an individual'],
  expected:
    'Commits come from identifiable people (SSO-linked accounts or signed commits); no shared or machine-default identities.',
  risk: 'Unattributable changes defeat accountability: nobody can say who introduced a change or whether it was authorized.',
  remediation: {
    summary:
      'Configure real identities on every machine and CI job, and require signed commits (SSH or GPG) on protected branches.',
    example: `git config --global user.email "you@company.com"
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true`,
  },
  detect(ctx) {
    const history = ctx.git();
    if (!history.available)
      return { status: 'not_applicable', justification: 'No git history to examine.' };
    if (history.shallow)
      return {
        status: 'unknown',
        reason:
          'The clone is shallow, so commit history is incomplete. Fetch full history (fetch-depth: 0) to check attribution.',
      };
    const commits = history.commits;
    const anonymous = commits.filter((c) => UNATTRIBUTABLE.test(c.authorEmail));
    if (anonymous.length) {
      return {
        status: 'fail',
        findings: [
          {
            title: 'Commits from unattributable identities',
            observed: `${anonymous.length} of the last ${plural(commits.length, 'commit')} use machine-default or placeholder identities (e.g. ${anonymous
              .slice(0, 5)
              .map((c) => c.sha.slice(0, 7))
              .join(', ')}). Author details are not shown.`,
            key: 'unattributable',
          },
        ],
      };
    }
    const signed = commits.filter((c) => c.signed).length;
    if (signed / commits.length >= SIGNED_THRESHOLD) {
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'config',
            description: `${signed} of the last ${plural(commits.length, 'commit')} are signed, and none uses an unattributable identity.`,
          },
        ],
      };
    }
    return {
      status: 'unknown',
      reason: `${signed} of the last ${plural(commits.length, 'commit')} are signed (below ${SIGNED_THRESHOLD * 100}%). Identities may still be SSO-linked on the hosting platform; confirm with --github or manually.`,
    };
  },
};
