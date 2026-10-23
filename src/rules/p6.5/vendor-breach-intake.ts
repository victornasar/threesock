import type { Rule } from '../../engine/types.js';
import { findDoc } from '../lib/docs.js';

export const vendorBreachIntake: Rule = {
  id: 'p6.5/vendor-breach-intake',
  criterion: 'P6.5',
  title: 'Breach notices from vendors feed incident response',
  tags: ['DOCS'],
  severity: 'low',
  redFlag: false,
  checks: ['Intake channel/process exists for vendor breach notices'],
  expected:
    'There is a documented intake for breach or incident notices from vendors and subprocessors, routed into incident response.',
  risk: "A vendor's breach notice sent to an unmonitored inbox starts your own notification clock without anyone knowing.",
  remediation: {
    summary:
      'Name the address vendors must notify, who monitors it, and that notices open an incident.',
    example: `## Vendor incident notices
Subprocessors notify security@example.com within 48 hours (per the DPA). Each notice opens an incident and is triaged as SEV2 or higher.`,
  },
  detect(ctx) {
    const hit = findDoc(
      ctx.files,
      /(?:vendor|supplier|sub-?processor|third[- ]part(?:y|ies))[^\n]{0,160}(?:breach|incident)[^\n]{0,160}notif|notif[^\n]{0,160}(?:vendor|supplier|sub-?processor)[^\n]{0,160}(?:breach|incident)|^#+\s.*vendor (?:incident|breach)/im,
    );
    if (hit)
      return {
        status: 'pass',
        evidence: [
          { kind: 'file', ...hit, description: 'Vendor breach notices have a documented intake.' },
        ],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No intake for vendor breach notices',
          observed:
            'No document describes how breach or incident notices from vendors and subprocessors are received and handled.',
          key: 'missing',
        },
      ],
    };
  },
};
