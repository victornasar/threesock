import type { Rule } from '../../engine/types.js';
import { findIn } from '../util.js';

export const prTemplateSecurity: Rule = {
  id: 'cc2.2/pr-template-security',
  criterion: 'CC2.2',
  title: 'The pull request template has a security section',
  tags: ['DOCS', 'CONFIG'],
  severity: 'low',
  redFlag: false,
  checks: ['PR template includes a security-impact section'],
  expected: 'The PR template asks authors to state the security impact of each change.',
  risk: 'Without a prompt, security-relevant changes (new endpoints, data flows, dependencies) go through review unflagged.',
  remediation: {
    summary: 'Add a security section with a short checklist to .github/pull_request_template.md.',
    example: `## Security impact
- [ ] Touches auth, permissions, secrets or personal data
- [ ] Adds a dependency or third-party service
- [ ] Changes infrastructure, network or IAM`,
  },
  detect(ctx) {
    const templates = ctx.files.files.filter((f) =>
      /(?:^|\/)pull_request_template\.md$|(?:^|\/)PULL_REQUEST_TEMPLATE(?:\.md|\/[^/]+\.md)$|(?:^|\/)merge_request_templates\/[^/]+\.md$/i.test(
        f.path,
      ),
    );
    if (templates.length === 0) {
      return {
        status: 'fail',
        findings: [
          {
            title: 'No pull request template',
            observed: 'No pull request (or merge request) template was found.',
            key: 'missing',
          },
        ],
      };
    }
    for (const t of templates) {
      const hit = findIn(ctx.files, t.path, /\bsecurity\b/i);
      if (hit)
        return {
          status: 'pass',
          evidence: [
            { kind: 'file', ...hit, description: 'The PR template asks about security impact.' },
          ],
        };
    }
    return {
      status: 'fail',
      findings: [
        {
          path: templates[0]?.path,
          title: 'PR template has no security section',
          observed: `${templates[0]?.path} does not mention security.`,
          key: 'no-security',
        },
      ],
    };
  },
};
