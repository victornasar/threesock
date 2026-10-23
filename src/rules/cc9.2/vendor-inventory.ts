import type { Evidence, Rule } from '../../engine/types.js';
import { inCi, SBOM_TOOLS } from '../lib/ci.js';
import { findDoc } from '../lib/docs.js';

export const vendorInventory: Rule = {
  id: 'cc9.2/vendor-inventory',
  criterion: 'CC9.2',
  title: 'Third-party services and dependencies are inventoried',
  tags: ['DOCS', 'CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Inventory of third-party services'],
  expected:
    'An inventory lists third-party services and integrations (with the data they receive), and an SBOM covers open-source dependencies.',
  risk: 'Unknown vendors and SDKs receive data nobody approved, and a vendor breach cannot be assessed quickly.',
  remediation: {
    summary:
      'Keep a third-party inventory (service, purpose, data shared, owner) and generate an SBOM in CI.',
    example: `| Service | Purpose | Data shared | Owner |
|---|---|---|---|
| Stripe | Payments | Name, email, card token | @billing |`,
  },
  detect(ctx) {
    const doc = findDoc(
      ctx.files,
      /^#+\s.*\b(?:third[- ]part(?:y|ies)|vendors?|sub-?processors?|integrations|suppliers?)\b/im,
    );
    const bom = inCi(ctx.files, SBOM_TOOLS);
    const evidence: Evidence[] = [
      ...(doc ? [{ kind: 'file' as const, ...doc, description: 'Third-party inventory.' }] : []),
      ...(bom ? [{ kind: 'file' as const, ...bom, description: 'SBOM generated in CI.' }] : []),
    ];
    if (doc && bom) return { status: 'pass', evidence };
    const missing = [!doc && 'a third-party services inventory', !bom && 'an SBOM']
      .filter(Boolean)
      .join(' and ');
    return {
      status: 'fail',
      evidence,
      findings: [
        {
          title: `Missing ${missing}`,
          observed: `No ${missing} was found.`,
          severity: doc || bom ? 'low' : 'medium',
          key: missing,
        },
      ],
    };
  },
};
