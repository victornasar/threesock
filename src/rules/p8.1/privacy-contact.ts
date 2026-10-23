import type { Evidence, Rule } from '../../engine/types.js';
import { docFiles, findDoc } from '../lib/docs.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { findAny } from '../util.js';

const CONTACT =
  /privacy@[\w.-]+\.[a-z]{2,}|dpo@[\w.-]+\.[a-z]{2,}|data protection officer|privacy (?:contact|requests?|inquiries|team)/i;

export const privacyContact: Rule = {
  id: 'p8.1/privacy-contact',
  criterion: 'P8.1',
  title: 'A privacy contact is published and privacy review is part of the SDLC',
  tags: ['DOCS'],
  severity: 'medium',
  redFlag: false,
  checks: ['Privacy contact channel published'],
  expected:
    'A privacy contact (email or form) is published, and new features handling personal data get a privacy review (the PR template asks about personal data).',
  risk: 'Data subjects cannot raise requests or complaints, and features that change data collection ship without review.',
  remediation: {
    summary:
      'Publish a privacy contact in the privacy notice and README, and add a personal-data question to the PR template.',
    example: `Privacy questions and requests: privacy@example.com (answered within 30 days).`,
  },
  detect(ctx) {
    const site = ctx.files.files.filter(
      (f) =>
        /\.(?:html?|[cm]?[jt]sx?|mdx?|vue|svelte)$/.test(f.path) &&
        !isTestPath(f.path) &&
        !isVendored(f.path),
    );
    const contact = findDoc(ctx.files, CONTACT) ?? findAny(ctx.files, site, CONTACT);
    const templates = ctx.files.files.filter((f) =>
      /pull_request_template\.md$|PULL_REQUEST_TEMPLATE/i.test(f.path),
    );
    const review = findAny(
      ctx.files,
      [
        ...templates,
        ...docFiles(ctx.files).filter((f) => /\b(?:dpia|pia)\b|privacy[- _]?review/i.test(f.path)),
      ],
      /personal data|\bPII\b|privacy|\bDPIA\b/i,
    );
    const evidence: Evidence[] = [
      ...(contact
        ? [{ kind: 'file' as const, ...contact, description: 'A privacy contact is published.' }]
        : []),
      ...(review
        ? [
            {
              kind: 'file' as const,
              ...review,
              description: 'Changes are reviewed for personal data impact.',
            },
          ]
        : []),
    ];
    const findings = [
      ...(contact
        ? []
        : [
            {
              title: 'No privacy contact published',
              observed:
                'No privacy contact (privacy@ address, DPO or privacy request channel) was found in the docs or the product.',
              key: 'contact',
            },
          ]),
      ...(review
        ? []
        : [
            {
              title: 'No privacy review in the change process',
              observed: 'Neither the PR template nor a PIA/DPIA process asks about personal data.',
              severity: 'low' as const,
              key: 'review',
            },
          ]),
    ];
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence };
  },
};
