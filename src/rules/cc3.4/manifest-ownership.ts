import type { Rule } from '../../engine/types.js';
import { CODEOWNERS_LOCATIONS, codeownersMatches, parseCodeowners } from '../cc1.3/codeowners.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { firstExisting } from '../util.js';

const MANIFEST =
  /(?:^|\/)(?:package\.json|requirements[^/]*\.txt|pyproject\.toml|Pipfile|go\.mod|Gemfile|composer\.json|Cargo\.toml|Dockerfile[^/]*|[^/]+\.tf)$/;
const CATCH_ALL = new Set(['*', '/**', '**', '/']);

export const manifestOwnership: Rule = {
  id: 'cc3.4/manifest-ownership',
  criterion: 'CC3.4',
  title: 'New dependencies and infrastructure changes need a named reviewer',
  tags: ['CONFIG'],
  severity: 'low',
  redFlag: false,
  checks: ['Adding a new third-party service, SDK, or datastore triggers a review'],
  expected:
    'Dependency manifests, Dockerfiles and IaC have specific CODEOWNERS, so adding a dependency, service or datastore is reviewed by someone accountable.',
  risk: 'New SDKs and services slip in through routine reviews, bringing data flows and vulnerabilities nobody assessed.',
  remediation: {
    summary:
      'Give manifests, Dockerfiles and infrastructure directories specific CODEOWNERS and require code owner review.',
    example: `/package.json   @your-org/platform
/infra/         @your-org/platform`,
  },
  detect(ctx) {
    const manifests = ctx.files.files.filter(
      (f) => MANIFEST.test(f.path) && !isTestPath(f.path) && !isVendored(f.path),
    );
    if (manifests.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No dependency manifests, Dockerfiles or IaC files found.',
      };
    const path = firstExisting(ctx.files, CODEOWNERS_LOCATIONS);
    const entries = path
      ? parseCodeowners(ctx.files.read(path) ?? '').filter((e) => e.owners.length)
      : [];
    const unowned = manifests.filter((f) => {
      const last = entries.filter((e) => codeownersMatches(e.pattern, f.path)).pop();
      return !last || CATCH_ALL.has(last.pattern);
    });
    if (unowned.length === 0)
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'file',
            path: path as string,
            description: `All ${manifests.length} manifests and IaC files have specific code owners.`,
          },
        ],
      };
    return {
      status: 'fail',
      findings: [
        {
          path,
          title: 'Dependency and infrastructure changes have no specific reviewer',
          observed: `${unowned.length} manifest or IaC file(s) rely on the catch-all owner or none, e.g. ${unowned
            .slice(0, 4)
            .map((f) => f.path)
            .join(', ')}.`,
          key: 'unowned',
        },
      ],
    };
  },
};
