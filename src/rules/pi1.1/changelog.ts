import type { Rule } from '../../engine/types.js';

export const changelog: Rule = {
  id: 'pi1.1/changelog',
  criterion: 'PI1.1',
  title: 'Changes are versioned and communicated in a changelog',
  tags: ['DOCS'],
  severity: 'low',
  redFlag: false,
  checks: ['Breaking changes communicated and versioned'],
  expected: 'A changelog or release notes record each version, including breaking changes.',
  risk: 'Users and downstream systems are surprised by breaking changes, causing processing errors.',
  remediation: {
    summary:
      'Keep a CHANGELOG.md (Keep a Changelog format) and call out breaking changes explicitly.',
    example: `## 2.0.0
### Breaking
- \`/v1/orders\` removed; use \`/v2/orders\`.`,
  },
  detect(ctx) {
    const file = ctx.files.files.find((f) =>
      /^(?:CHANGELOG|CHANGES|HISTORY|RELEASES?|RELEASE_NOTES)(?:\.mdx?|\.rst|\.txt)?$/i.test(
        f.path,
      ),
    );
    if (file)
      return {
        status: 'pass',
        evidence: [
          { kind: 'file', path: file.path, description: 'Changes are recorded in a changelog.' },
        ],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No changelog',
          observed: 'No CHANGELOG, CHANGES, HISTORY or release notes file at the repository root.',
          key: 'missing',
        },
      ],
    };
  },
};
