import type { Rule } from '../../engine/types.js';
import { docFiles } from '../lib/docs.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { TRACKERS } from '../lib/trackers.js';
import { findAny } from '../util.js';

export const sdkInventory: Rule = {
  id: 'p6.1/sdk-inventory',
  criterion: 'P6.1',
  title: 'Third-party SDKs that receive personal data are inventoried',
  tags: ['CODE', 'DOCS'],
  severity: 'medium',
  redFlag: false,
  checks: ['Disclosure paths to third parties are inventoried'],
  expected:
    'Every analytics, advertising, support or session-recording SDK is listed in the third-party or subprocessor inventory, with the data it receives.',
  risk: 'Unlisted SDKs collect personal data nobody approved, which the privacy notice then misdescribes.',
  remediation: {
    summary:
      'Add each SDK vendor to the third-party inventory (vendor, purpose, data shared), or remove the SDK.',
    example: `| Vendor | Purpose | Data shared |
|---|---|---|
| PostHog | Product analytics | Pseudonymous user id, page views |`,
  },
  detect(ctx) {
    const code = ctx.files.files.filter(
      (f) =>
        /\.(?:[cm]?[jt]sx?|vue|svelte|html?)$|(?:^|\/)package\.json$|requirements[^/]*\.txt$/.test(
          f.path,
        ) &&
        !isTestPath(f.path) &&
        !isVendored(f.path),
    );
    const sdks = TRACKERS.filter((t) => findAny(ctx.files, code, t.re));
    if (sdks.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No analytics, advertising, support or session-recording SDKs found.',
      };
    const docs = docFiles(ctx.files)
      .map((f) => ctx.files.read(f.path) ?? '')
      .join('\n');
    const missing = sdks.filter(
      (s) => !new RegExp(`\\b${s.vendor.split(' ')[0]}\\b`, 'i').test(docs),
    );
    if (missing.length) {
      return {
        status: 'fail',
        findings: [
          {
            title: `Undocumented third-party SDKs: ${missing.map((s) => s.vendor).join(', ')}`,
            observed: `${missing.map((s) => s.vendor).join(', ')} ${missing.length === 1 ? 'is' : 'are'} used but not named in any third-party or privacy document.`,
            key: missing.map((s) => s.vendor).join(','),
          },
        ],
      };
    }
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'absence',
          description: `All ${sdks.length} SDK vendor(s) in use are named in the documentation: ${sdks.map((s) => s.vendor).join(', ')}.`,
        },
      ],
    };
  },
};
