import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { plural } from '../util.js';

const POLICY_DIR = /^(?:docs\/)?(?:security|policies|policy|compliance)\/[^/]+\.mdx?$/i;
const REVIEWED =
  /(?:last reviewed|reviewed|effective(?: date)?|review date)\s*[:|]\s*\**\s*(\d{4}-\d{2}-\d{2})/i;
const OWNER = /\bowner\s*[:|]/i;

export const policyReview: Rule = {
  id: 'cc5.3/policy-review',
  criterion: 'CC5.3',
  title: 'Policies record an owner and a review within the last year',
  tags: ['DOCS'],
  severity: 'low',
  redFlag: false,
  checks: ['Policies are reviewed at least annually'],
  expected:
    'Each policy states its owner and the date it was last reviewed, and is reviewed at least annually.',
  risk: 'Stale or ownerless policies describe controls that no longer operate, which auditors test against.',
  remediation: {
    summary:
      'Add an owner and a "Last reviewed: YYYY-MM-DD" line to each policy, and review them yearly.',
    example: `Owner: @security-lead
Last reviewed: 2026-10-01`,
  },
  detect(ctx) {
    const policies = ctx.files.files.filter(
      (f) => POLICY_DIR.test(f.path) && !/(?:^|\/)README\.md$/i.test(f.path),
    );
    if (policies.length === 0)
      return {
        status: 'not_applicable',
        justification:
          'No policy documents found in docs/security, docs/policies or similar folders.',
      };
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    const yearAgo = new Date(ctx.now.getTime() - 365 * 86_400_000).toISOString().slice(0, 10);
    for (const p of policies) {
      const text = ctx.files.read(p.path) ?? '';
      const date = REVIEWED.exec(text)?.[1];
      const problems = [
        !date && 'no review date',
        !OWNER.test(text) && 'no owner',
        date && date < yearAgo && `last reviewed ${date}, over a year ago`,
      ].filter(Boolean);
      if (problems.length)
        findings.push({
          path: p.path,
          title: `Policy review metadata incomplete: ${p.path}`,
          observed: `${p.path}: ${problems.join('; ')}.`,
          key: p.path,
        });
      else
        evidence.push({
          kind: 'file',
          path: p.path,
          description: `Owner set, last reviewed ${date}.`,
        });
    }
    if (findings.length) return { status: 'fail', findings, evidence };
    return {
      status: 'pass',
      evidence:
        evidence.length > 5
          ? [
              ...evidence.slice(0, 5),
              {
                kind: 'file',
                path: policies[5]?.path as string,
                description: `...and ${plural(evidence.length - 5, 'more policy', 'more policies')}.`,
              },
            ]
          : evidence,
    };
  },
};
