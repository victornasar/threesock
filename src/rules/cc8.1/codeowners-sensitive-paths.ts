import { matchesGlob } from '../../engine/glob.js';
import type { Rule } from '../../engine/types.js';
import { CODEOWNERS_LOCATIONS, codeownersMatches, parseCodeowners } from '../cc1.3/codeowners.js';
import { firstExisting, plural } from '../util.js';

const CATCH_ALL = new Set(['*', '/**', '**', '/']);

export const codeownersSensitivePaths: Rule = {
  id: 'cc8.1/codeowners-sensitive-paths',
  criterion: 'CC8.1',
  title: 'Sensitive paths have named CODEOWNERS',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['`CODEOWNERS` review enforced on sensitive paths'],
  expected:
    'Security-sensitive paths (auth, IAM, crypto, payments, infrastructure, workflows, migrations, lockfiles) have a specific CODEOWNERS entry, not just the catch-all.',
  risk: 'Changes to the riskiest code can be approved by any reviewer instead of the people accountable for it.',
  remediation: {
    summary:
      'Add explicit CODEOWNERS entries for sensitive paths and require code owner review. Adjust what counts as sensitive with sensitivePaths in threesock.yaml.',
    example: `/src/auth/            @your-org/security
/infra/               @your-org/platform
/.github/workflows/   @your-org/platform`,
  },
  detect(ctx) {
    const sensitive = ctx.files.files.filter((f) => matchesGlob(f.path, ctx.config.sensitivePaths));
    if (sensitive.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No files match the configured sensitive paths.',
      };
    const path = firstExisting(ctx.files, CODEOWNERS_LOCATIONS);
    if (!path) {
      return {
        status: 'fail',
        findings: [
          {
            title: 'Sensitive paths have no code owners',
            observed: `${plural(sensitive.length, 'sensitive file')} exist but there is no CODEOWNERS file.`,
            key: 'no-codeowners',
          },
        ],
      };
    }
    const entries = parseCodeowners(ctx.files.read(path) ?? '').filter((e) => e.owners.length > 0);
    const uncovered = sensitive.filter((f) => {
      const last = entries.filter((e) => codeownersMatches(e.pattern, f.path)).pop();
      return !last || CATCH_ALL.has(last.pattern);
    });
    if (uncovered.length) {
      const dirs = [...new Set(uncovered.map((f) => f.path.split('/').slice(0, 2).join('/')))];
      return {
        status: 'fail',
        findings: [
          {
            path,
            title: 'Sensitive paths rely on the catch-all owner',
            observed: `${plural(uncovered.length, 'sensitive file')} have no specific CODEOWNERS entry, e.g. ${dirs.slice(0, 5).join(', ')}.`,
            key: 'uncovered',
          },
        ],
      };
    }
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'file',
          path,
          description: `All ${plural(sensitive.length, 'sensitive file')} have a specific code owner.`,
        },
      ],
    };
  },
};
