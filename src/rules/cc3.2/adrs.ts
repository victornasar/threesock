import type { Rule } from '../../engine/types.js';
import { plural } from '../util.js';

const ADR_DIR =
  /(?:^|\/)(?:adrs?|decisions|architecture\/decisions|decision-records)\/[^/]+\.mdx?$/i;

export const adrs: Rule = {
  id: 'cc3.2/adrs',
  criterion: 'CC3.2',
  title: 'Architecture decision records cover security considerations',
  tags: ['DOCS'],
  severity: 'low',
  redFlag: false,
  checks: ['ADRs record security considerations'],
  expected:
    'Significant architectural decisions are recorded as ADRs, and ADRs discuss their security considerations.',
  risk: 'Without recorded decisions, the security reasoning behind an architecture is lost and gets undone by later changes.',
  remediation: {
    summary: 'Record decisions in docs/adr/NNNN-title.md with a "Security considerations" section.',
    example: `# 0003. Use OIDC for CI cloud access
## Status
Accepted
## Decision
CI assumes a deploy role through OIDC.
## Security considerations
No long-lived keys in CI; role scoped to the deploy bucket.`,
  },
  detect(ctx) {
    const records = ctx.files.files.filter(
      (f) => ADR_DIR.test(f.path) && !/(?:^|\/)(?:README|index|template)\.mdx?$/i.test(f.path),
    );
    if (records.length === 0) {
      return {
        status: 'fail',
        findings: [
          {
            title: 'No architecture decision records',
            observed: 'No ADR directory (docs/adr, decisions/) with decision records was found.',
            key: 'missing',
          },
        ],
      };
    }
    const withSecurity = records.filter((f) =>
      /^#+\s.*\bsecurity\b/im.test(ctx.files.read(f.path) ?? ''),
    );
    if (withSecurity.length === 0) {
      return {
        status: 'fail',
        findings: [
          {
            path: records[0]?.path,
            title: 'ADRs do not discuss security',
            observed: `${plural(records.length, 'ADR')} found, but none has a security section.`,
            key: 'no-security',
          },
        ],
      };
    }
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'file',
          path: withSecurity[0]?.path as string,
          description: `${plural(records.length, 'ADR')}, ${withSecurity.length} with a security section.`,
        },
      ],
    };
  },
};
