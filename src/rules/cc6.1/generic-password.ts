import type { RawFinding, Rule } from '../../engine/types.js';
import { isTestPath, isVendored, languageOf } from '../lib/languages.js';
import { absence, entropy, plural } from '../util.js';
import { SECRET_PATTERNS } from './hardcoded-secrets.js';

const CONFIG_FILE = /\.(?:ya?ml|json|properties|ini|toml|cfg|conf)$/;
const SKIP_FILE =
  /(?:^|\/)(?:package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|composer\.lock|tsconfig[^/]*\.json)$|^\.github\//;
const ASSIGNMENT =
  /\b([A-Za-z0-9_.-]*(?:password|passwd|pwd|secret|api_?key|apikey|access_?token|auth_?token|client_?secret)[A-Za-z0-9_]*)["']?\s*[:=]\s*["']([^"'\s]{6,})["']/gi;
const KEY_NOT_A_SECRET =
  /(?:name|ref|key_?id|field|label|placeholder|path|file|env|type|header|param|policy|hint|url|endpoint|length|min|max|regex|pattern|prompt|message|error|title|description|route|selector|input|reset|confirm|forgot|changed?|policy)$/i;
const VALUE_NOT_A_SECRET =
  /^(?:required|optional|string|text|hidden|password|secret|none|null|true|false|undefined|redacted|masked)$|example|sample|dummy|placeholder|changeme|your[_-]|x{4,}|\*{3,}|^\$|^\{|^%|^<|process\.env|os\.environ|getenv/i;

export const genericPassword: Rule = {
  id: 'cc6.1/generic-password',
  criterion: 'CC6.1',
  title: 'No literal passwords or keys assigned in code or config',
  tags: ['CODE', 'CONFIG'],
  severity: 'low',
  redFlag: false,
  checks: ['**Secrets:**'],
  expected:
    'Credential-like settings read their values from the environment or a secrets manager, never from string literals.',
  risk: 'A literal credential in code is shared with everyone who can read the repository and is hard to rotate. This check is heuristic, so confirm each match.',
  remediation: {
    summary:
      'Replace the literal with a value loaded at runtime. If it is not a credential, add an exception with a justification.',
    example: `// After
const client = new Client({ password: process.env.SMTP_PASSWORD });`,
  },
  detect(ctx) {
    const files = ctx.files.files.filter(
      (f) =>
        (languageOf(f.path) || CONFIG_FILE.test(f.path)) &&
        !isTestPath(f.path) &&
        !isVendored(f.path) &&
        !SKIP_FILE.test(f.path),
    );
    const findings: RawFinding[] = [];
    for (const f of files) {
      const text = ctx.files.read(f.path);
      if (!text) continue;
      text.split('\n').forEach((line, i) => {
        if (SECRET_PATTERNS.some((p) => new RegExp(p.re.source).test(line))) return; // reported by cc6.1/hardcoded-secrets
        for (const m of line.matchAll(ASSIGNMENT)) {
          const key = m[1] as string;
          const value = m[2] as string;
          if (KEY_NOT_A_SECRET.test(key) || VALUE_NOT_A_SECRET.test(value)) continue;
          if (value.toLowerCase() === key.toLowerCase() || entropy(value) < 2.5) continue;
          const redacted = ctx.secrets.register(value);
          findings.push({
            path: f.path,
            line: i + 1,
            title: `Possible literal credential: ${key}`,
            observed: `\`${key}\` is assigned a literal value (${redacted}) in ${f.path} at line ${i + 1}. The value is redacted.`,
            key: `${key}:${value.length}:${entropy(value).toFixed(2)}`,
          });
        }
      });
    }
    if (findings.length) return { status: 'fail', findings };
    return absence(
      `No literal credential assignments found in ${plural(files.length, 'source or config file')} (tests excluded).`,
    );
  },
};
