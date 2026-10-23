// Factory for "does the application implement this data-subject capability?" rules.
// Not applicable unless the repository handles personal data.
import type { Rule } from '../../engine/types.js';
import { isProductionSource } from './languages.js';
import { NO_PERSONAL_DATA, personalData } from './pii.js';
import { findAny } from '../util.js';

export type CodePathRuleDef = Omit<Rule, 'detect'> & {
  /** Evidence that the capability exists (route, handler or job). */
  present: RegExp;
  /** Description used in evidence, e.g. "An account deletion path exists". */
  found: string;
  /** Finding title when missing, e.g. "No account deletion path". */
  missing: string;
};

export function codePathRule(def: CodePathRuleDef): Rule {
  const { present, found, missing, ...rule } = def;
  return {
    ...rule,
    detect(ctx) {
      const pd = personalData(ctx.files);
      if (!pd) return { status: 'not_applicable', justification: NO_PERSONAL_DATA };
      const source = ctx.files.files.filter((f) => isProductionSource(f) || /\.sql$/.test(f.path));
      const hit = findAny(ctx.files, source, present);
      if (hit)
        return { status: 'pass', evidence: [{ kind: 'file', ...hit, description: `${found}.` }] };
      return {
        status: 'fail',
        findings: [
          {
            title: missing,
            observed: `The application stores personal data (e.g. ${pd.path}:${pd.line}), but ${missing.charAt(0).toLowerCase()}${missing.slice(1)} was found in the code.`,
            key: 'missing',
          },
        ],
      };
    },
  };
}
