import type { Rule } from '../../engine/types.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { NO_PERSONAL_DATA, personalData } from '../lib/pii.js';
import { findAny } from '../util.js';

const NOTICE = /privacy[-_ ]?(?:policy|notice)|href=["'][^"']*\/privacy|['"`]\/privacy['"`]/i;

export const privacyNotice: Rule = {
  id: 'p1.1/privacy-notice',
  criterion: 'P1.1',
  title: 'The product links to a privacy notice',
  tags: ['CODE', 'DOCS'],
  severity: 'medium',
  redFlag: false,
  checks: ['Privacy notice is accessible from the product'],
  expected:
    'A privacy notice is reachable from the product (signup, footer, settings) and describes collection, use, retention, disclosure and disposal.',
  risk: 'Collecting personal data without an accessible notice breaches transparency obligations and the SOC 2 privacy commitments.',
  remediation: {
    summary:
      'Publish a privacy notice and link it from signup and the site footer; keep prior versions.',
    example: `<footer><a href="/privacy">Privacy notice</a></footer>`,
  },
  detect(ctx) {
    const pd = personalData(ctx.files);
    if (!pd) return { status: 'not_applicable', justification: NO_PERSONAL_DATA };
    const files = ctx.files.files.filter(
      (f) =>
        /\.(?:[cm]?[jt]sx?|vue|svelte|html?|ejs|hbs|njk|astro|mdx?|py|go)$/.test(f.path) &&
        !isTestPath(f.path) &&
        !isVendored(f.path),
    );
    const page = files.find((f) =>
      /(?:^|\/)privacy(?:[-_]?(?:policy|notice))?(?:\/page)?\.(?:[cm]?[jt]sx?|vue|svelte|html?|mdx?|astro)$/i.test(
        f.path,
      ),
    );
    if (page)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', path: page.path, description: 'A privacy notice page exists.' }],
      };
    const link = findAny(ctx.files, files, NOTICE);
    if (link)
      return {
        status: 'pass',
        evidence: [
          { kind: 'file', ...link, description: 'The product links to a privacy notice.' },
        ],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No privacy notice in the product',
          observed: `The application stores personal data (e.g. ${pd.path}:${pd.line}), but no privacy notice page or link was found.`,
          key: 'missing',
        },
      ],
    };
  },
};
