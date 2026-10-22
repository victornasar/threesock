import type { RawFinding, Rule } from '../../engine/types.js';
import { matchLines, workflows } from '../lib/workflows.js';

const USES = /^\s*-?\s*uses:\s*["']?([^\s"'#]+)["']?/;
const FIRST_PARTY = /^(?:actions|github)\//;

export const actionsPinned: Rule = {
  id: 'cc5.2/actions-pinned',
  criterion: 'CC5.2',
  title: 'GitHub Actions are pinned to commit SHAs',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['CI/CD hardened'],
  expected:
    'Every third-party action is pinned to a full 40-character commit SHA (with the version in a comment), so a moved tag cannot change what runs.',
  risk: "Tags can be moved. A compromised action tag (as in the tj-actions/changed-files incident) runs attacker code with your workflow's secrets.",
  remediation: {
    summary:
      'Pin each action to the commit SHA of the release you reviewed, keep the version as a comment, and let Dependabot update the pins.',
    example: `- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2`,
  },
  detect(ctx) {
    const wfs = workflows(ctx.files);
    if (wfs.length === 0)
      return { status: 'not_applicable', justification: 'No GitHub Actions workflows found.' };
    const findings: RawFinding[] = [];
    let total = 0;
    for (const wf of wfs) {
      const unpinned: { action: string; line: number; firstParty: boolean }[] = [];
      for (const { line, match } of matchLines(wf, USES)) {
        const ref = match[1] as string;
        if (ref.startsWith('./') || ref.startsWith('docker://')) continue;
        total++;
        const [action, version] = ref.split('@');
        if (version && /^[0-9a-f]{40}$/.test(version)) continue;
        unpinned.push({ action: ref, line, firstParty: FIRST_PARTY.test(action ?? '') });
      }
      if (unpinned.length === 0) continue;
      const thirdParty = unpinned.some((u) => !u.firstParty);
      findings.push({
        path: wf.path,
        line: unpinned[0]?.line,
        severity: thirdParty ? 'medium' : 'low',
        title: `${unpinned.length} action${unpinned.length === 1 ? '' : 's'} not pinned to a SHA in ${wf.path}`,
        observed: `Unpinned: ${unpinned
          .slice(0, 6)
          .map((u) => `${u.action} (line ${u.line})`)
          .join(', ')}${unpinned.length > 6 ? ', ...' : ''}.`,
        key: wf.path,
      });
    }
    if (total === 0)
      return { status: 'not_applicable', justification: 'Workflows use no external actions.' };
    if (findings.length) return { status: 'fail', findings };
    return {
      status: 'pass',
      evidence: wfs.map((wf) => ({
        kind: 'file' as const,
        path: wf.path,
        description: 'All actions are pinned to commit SHAs.',
      })),
    };
  },
};
