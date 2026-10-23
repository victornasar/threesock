// Factory for rules that look for dangerous constructs line by line in
// production source. Findings describe the construct; they never quote the line,
// which could carry a secret.
import type {
  RawFinding,
  RepoFile,
  Rule,
  RuleContext,
  RuleOutcome,
  Severity,
} from '../../engine/types.js';
import { plural } from '../util.js';
import {
  isCommentLine,
  isGenerated,
  isProductionSource,
  languageOf,
  LANGUAGE_LABELS,
  type Language,
} from './languages.js';

export interface CodePattern {
  languages: readonly Language[];
  re: RegExp;
  /** What was found, e.g. "`verify=False` disables certificate verification". */
  label: string;
  severity?: Severity;
  redFlag?: boolean;
  /** Match against the line with string-literal contents blanked, so prose in messages can't match. */
  code?: boolean;
}

/** Blanks the contents of '...', "..." and `...` literals on one line. */
export function stripStrings(line: string): string {
  return line.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, (m) => `${m[0]}${m[0]}`);
}

export type CodePatternRuleDef = Omit<Rule, 'detect'> & {
  patterns: readonly CodePattern[];
  /** What a clean result means, completing "Checked N files; ...", e.g. "no disabled certificate checks". */
  clean: string;
  /** Extra files to scan beyond production source (e.g. config files). */
  extraFiles?: (f: RepoFile) => boolean;
};

export function scanLines(
  ctx: RuleContext,
  files: readonly RepoFile[],
  patterns: readonly CodePattern[],
): RawFinding[] {
  const findings: RawFinding[] = [];
  for (const f of files) {
    const text = ctx.files.read(f.path);
    if (text === undefined || isGenerated(text)) continue;
    const lang = languageOf(f.path);
    const applicable = patterns.filter((p) => !lang || p.languages.includes(lang));
    if (!applicable.length) continue;
    text.split('\n').forEach((line, i) => {
      if (isCommentLine(line)) return;
      for (const p of applicable) {
        if (!p.re.test(p.code ? stripStrings(line) : line)) continue;
        const finding: RawFinding = {
          path: f.path,
          line: i + 1,
          title: p.label,
          observed: `${p.label} in ${f.path} at line ${i + 1}.`,
          key: `${p.label}:${line.trim()}`,
        };
        if (p.severity) finding.severity = p.severity;
        if (p.redFlag !== undefined) finding.redFlag = p.redFlag;
        findings.push(finding);
        break; // one finding per line
      }
    });
  }
  return findings;
}

export function codePatternRule(def: CodePatternRuleDef): Rule {
  const { patterns, extraFiles, clean, ...rule } = def;
  const languages = [...new Set(patterns.flatMap((p) => p.languages))];
  return {
    ...rule,
    detect(ctx): RuleOutcome {
      const files = ctx.files.files.filter(
        (f) => isProductionSource(f, languages) || extraFiles?.(f),
      );
      const langs = languages.map((l) => LANGUAGE_LABELS[l]).join(', ');
      if (files.length === 0) {
        return {
          status: 'not_applicable',
          justification: `No production ${langs} source files to check (tests and vendored code are excluded).`,
        };
      }
      const findings = scanLines(ctx, files, patterns);
      if (findings.length) return { status: 'fail', findings };
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'absence',
            description: `Checked ${plural(files.length, 'file')} (${langs} source and related config); ${clean}.`,
          },
        ],
      };
    },
  };
}
