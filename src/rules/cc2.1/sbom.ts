import type { Rule } from '../../engine/types.js';
import { inCi, SBOM_TOOLS } from '../lib/ci.js';

export const sbom: Rule = {
  id: 'cc2.1/sbom',
  criterion: 'CC2.1',
  title: 'CI generates a software bill of materials',
  tags: ['CONFIG'],
  severity: 'low',
  redFlag: false,
  checks: ['SBOM generated in CI or on release'],
  expected: 'CI produces an SBOM (CycloneDX or SPDX) for each release or build.',
  risk: 'Without an SBOM you cannot answer "are we affected?" quickly when a new vulnerability lands.',
  remediation: {
    summary:
      'Generate an SBOM in CI with Syft or a CycloneDX tool and keep it with the release artifacts.',
    example: `- uses: anchore/sbom-action@<sha>  # pin to a commit SHA
  with: { format: cyclonedx-json, output-file: sbom.cdx.json }`,
  },
  detect(ctx) {
    const hit = inCi(ctx.files, SBOM_TOOLS);
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'CI generates an SBOM.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No SBOM generated',
          observed: 'No SBOM tool (Syft, CycloneDX, SPDX, npm sbom) runs in CI.',
          key: 'missing',
        },
      ],
    };
  },
};
