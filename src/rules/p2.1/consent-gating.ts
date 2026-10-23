import type { Rule } from '../../engine/types.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { CONSENT, TRACKERS } from '../lib/trackers.js';
import { findAny } from '../util.js';

const WEB = /\.(?:[cm]?[jt]sx?|vue|svelte|html?|ejs|hbs|njk|astro)$|(?:^|\/)package\.json$/;

export const consentGating: Rule = {
  id: 'p2.1/consent-gating',
  criterion: 'P2.1',
  title: 'Analytics and tracking load only after consent',
  tags: ['CODE'],
  severity: 'high',
  redFlag: false, // set per finding
  checks: ['Cookie/tracker consent enforced'],
  expected:
    'Non-essential trackers (analytics, advertising, session recording) are gated on recorded consent, and Global Privacy Control is respected where required.',
  risk: 'Trackers firing before consent breach ePrivacy and GDPR rules and the privacy notice, and are a rubric red flag.',
  remediation: {
    summary:
      'Load trackers only after the visitor opts in (a consent manager or your own gate), default to opted-out, and honour navigator.globalPrivacyControl.',
    example: `posthog.init(KEY, { opt_out_capturing_by_default: true });
if (consent.analytics && !navigator.globalPrivacyControl) posthog.opt_in_capturing();`,
  },
  detect(ctx) {
    const files = ctx.files.files.filter(
      (f) => WEB.test(f.path) && !isTestPath(f.path) && !isVendored(f.path),
    );
    const found = TRACKERS.flatMap((t) => {
      const hit = findAny(ctx.files, files, t.re);
      return hit ? [{ ...t, hit }] : [];
    });
    if (found.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No analytics, advertising or session-recording SDKs found.',
      };
    const consent = findAny(ctx.files, files, CONSENT);
    if (consent)
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'file',
            ...consent,
            description: `Consent gating found for ${found.map((t) => t.vendor).join(', ')}.`,
          },
        ],
      };
    const first = found[0]?.hit;
    return {
      status: 'fail',
      findings: [
        {
          path: first?.path,
          line: first?.line,
          redFlag: true,
          title: 'Trackers load without a consent check',
          observed: `${found.map((t) => t.vendor).join(', ')} ${found.length === 1 ? 'is' : 'are'} loaded, but no consent manager or consent check was found.`,
          key: found.map((t) => t.vendor).join(','),
        },
      ],
    };
  },
};
