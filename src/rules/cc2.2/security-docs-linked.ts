import type { Rule } from '../../engine/types.js';
import { findIn } from '../util.js';

export const securityDocsLinked: Rule = {
  id: 'cc2.2/security-docs-linked',
  criterion: 'CC2.2',
  title: 'Security policies and runbooks are linked from the README',
  tags: ['DOCS'],
  severity: 'low',
  redFlag: false,
  checks: ['Security policies and runbooks are discoverable'],
  expected:
    'The README links to the security policy and the security documentation, so people can find them.',
  risk: 'Documentation nobody can find is not followed.',
  remediation: {
    summary:
      'Add a Security section to the README linking SECURITY.md and your security docs folder.',
    example: `## Security
See [SECURITY.md](SECURITY.md) to report a vulnerability, and [docs/security](docs/security) for policies and runbooks.`,
  },
  detect(ctx) {
    const readme = ['README.md', 'README.rst', 'README', 'readme.md'].find((r) => ctx.files.has(r));
    if (!readme)
      return {
        status: 'fail',
        findings: [
          {
            title: 'No README',
            observed: 'The repository has no README at its root.',
            key: 'no-readme',
          },
        ],
      };
    const hit = findIn(
      ctx.files,
      readme,
      /SECURITY\.md|\]\([^)]*security[^)]*\)|docs\/security|\/security\b/i,
    );
    if (hit)
      return {
        status: 'pass',
        evidence: [
          { kind: 'file', ...hit, description: 'The README links to security documentation.' },
        ],
      };
    return {
      status: 'fail',
      findings: [
        {
          path: readme,
          title: 'README does not link security documentation',
          observed: `${readme} has no link to SECURITY.md or security documentation.`,
          key: 'unlinked',
        },
      ],
    };
  },
};
