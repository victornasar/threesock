import type { Rule } from '../../engine/types.js';
import { firstExisting, lineAt } from '../util.js';

const LOCATIONS = ['SECURITY.md', '.github/SECURITY.md', 'docs/SECURITY.md'];
const SECURITY_TXT = [
  '.well-known/security.txt',
  'public/.well-known/security.txt',
  'static/.well-known/security.txt',
];
const CONTACT =
  /[\w.+-]+@[\w-]+\.[\w.-]+|https?:\/\/\S+|security advisor(y|ies)|report a vulnerability/i;

export const securityPolicy: Rule = {
  id: 'cc2.3/security-policy',
  criterion: 'CC2.3',
  title: 'Vulnerability disclosure policy with a reporting channel',
  tags: ['DOCS'],
  severity: 'medium',
  checks: ['Vulnerability disclosure policy'],
  expected:
    'A SECURITY.md (or /.well-known/security.txt) tells external researchers how to report a vulnerability and what response to expect.',
  risk: 'Without a published channel, vulnerabilities get reported publicly, to the wrong person, or not at all.',
  remediation: {
    summary:
      'Add SECURITY.md at the repository root with a private reporting channel, supported versions and expected response time.',
    example: `# Security policy

## Reporting a vulnerability
Email security@example.com or use GitHub private vulnerability reporting.
We acknowledge reports within 2 business days and aim to fix Critical issues within 7 days.`,
  },
  detect(ctx) {
    const path = firstExisting(ctx.files, LOCATIONS) ?? firstExisting(ctx.files, SECURITY_TXT);
    if (!path) {
      return {
        status: 'fail',
        findings: [
          {
            title: 'No vulnerability disclosure policy',
            observed: `No SECURITY.md or security.txt found (looked in ${[...LOCATIONS, ...SECURITY_TXT].join(', ')}).`,
            key: 'missing',
          },
        ],
      };
    }
    const text = ctx.files.read(path) ?? '';
    const contact = CONTACT.exec(text);
    if (!contact) {
      return {
        status: 'fail',
        findings: [
          {
            path,
            title: 'Security policy names no reporting channel',
            observed: `${path} exists but names no reporting channel (email, URL or advisory process).`,
            key: 'no-contact',
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
          line: lineAt(text, contact.index),
          description: `${path} gives a reporting channel.`,
        },
      ],
    };
  },
};
