import { createHash } from 'node:crypto';
import type { RawFinding, Rule } from '../../engine/types.js';
import { article, entropy, grep, plural } from '../util.js';

interface SecretPattern {
  name: string;
  re: RegExp;
  /** Capture group holding the secret value (default: whole match). */
  group?: number;
  /** Minimum entropy of the value; filters placeholders like "xxxx". */
  minEntropy?: number;
}

// High-confidence patterns only. Generic "password = ..." matching is too noisy to
// score on; it belongs to an external scanner such as Gitleaks.
export const SECRET_PATTERNS: SecretPattern[] = [
  {
    name: 'private key',
    re: /-----BEGIN ((?:RSA|EC|DSA|OPENSSH|PGP|ENCRYPTED) )?PRIVATE KEY( BLOCK)?-----[\s\S]{40,}?-----END \1?PRIVATE KEY\2?-----/g,
  },
  { name: 'AWS access key ID', re: /\b((?:AKIA|ASIA)[0-9A-Z]{16})\b/g, group: 1, minEntropy: 3 },
  { name: 'GitHub token', re: /\b(gh[pousr]_[A-Za-z0-9]{36,255})\b/g, group: 1, minEntropy: 3.5 },
  {
    name: 'GitHub fine-grained token',
    re: /\b(github_pat_[A-Za-z0-9_]{60,255})\b/g,
    group: 1,
    minEntropy: 3.5,
  },
  { name: 'GitLab token', re: /\b(glpat-[A-Za-z0-9_-]{20,})\b/g, group: 1, minEntropy: 3.5 },
  { name: 'Slack token', re: /\b(xox[baprs]-[A-Za-z0-9-]{10,})\b/g, group: 1, minEntropy: 3.5 },
  { name: 'Stripe live key', re: /\b([sr]k_live_[A-Za-z0-9]{20,})\b/g, group: 1, minEntropy: 3.5 },
  { name: 'Google API key', re: /\b(AIza[0-9A-Za-z_-]{35})\b/g, group: 1, minEntropy: 3.5 },
  {
    name: 'OpenAI API key',
    re: /\b(sk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]{40,})/g,
    group: 1,
    minEntropy: 4,
  },
  {
    name: 'Anthropic API key',
    re: /\b(sk-ant-(?:api|admin)\d{2}-[A-Za-z0-9_-]{80,})/g,
    group: 1,
    minEntropy: 4,
  },
  { name: 'npm token', re: /\b(npm_[A-Za-z0-9]{36})\b/g, group: 1, minEntropy: 3.5 },
  {
    name: 'SendGrid API key',
    re: /\b(SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43})\b/g,
    group: 1,
    minEntropy: 3.5,
  },
  {
    name: 'database URL with password',
    re: /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis|rediss|amqps?):\/\/[^\s:@/'"`]+:([^\s@/'"`]{4,})@[^\s'"`]+/g,
    group: 1,
    minEntropy: 2.5,
  },
];

const PLACEHOLDER =
  /example|sample|dummy|placeholder|changeme|your[_-]?|x{4,}|\*{3,}|\$\{|\{\{|<[^>]*>|%[sd(]/i;
const DOC_PASSWORDS = /^(?:pass(?:word)?|secret|postgres|root|admin|test|user|mysql|redis|guest)$/i;
const LOCAL_HOST = /@(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?:[:/]|$)/;

export const hardcodedSecrets: Rule = {
  id: 'cc6.1/hardcoded-secrets',
  criterion: 'CC6.1',
  title: 'No secrets committed in source or config',
  tags: ['CODE', 'CONFIG'],
  severity: 'critical',
  redFlag: true,
  checks: ['**Secrets:**'],
  expected:
    'No secrets in source, config files, images or history. Secrets are loaded at runtime from a secrets manager or environment.',
  risk: 'Anyone with read access to the repository, its forks or its history can use the credential. Leaked keys are routinely harvested within minutes of a public push.',
  remediation: {
    summary:
      'Revoke and rotate the credential first, then remove it from the code and load it from a secrets manager or environment variable. Rewriting git history does not un-leak a pushed secret.',
    example: `// Before
const stripe = new Stripe('sk_live_...');

// After
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);`,
  },
  detect(ctx) {
    const findings: RawFinding[] = [];
    for (const p of SECRET_PATTERNS) {
      for (const m of grep(ctx.files, p.re)) {
        const value = m.match[p.group ?? 0] ?? m.match[0];
        if (p.group !== undefined && (PLACEHOLDER.test(value) || DOC_PASSWORDS.test(value)))
          continue;
        if (p.minEntropy !== undefined && entropy(value) < p.minEntropy) continue;
        const local = p.name === 'database URL with password' && LOCAL_HOST.test(m.match[0]);
        const redacted = ctx.secrets.register(value);
        const file = ctx.files.files.find((f) => f.path === m.path);
        const where = file && !file.tracked ? ' (untracked file, not gitignored)' : '';
        findings.push({
          path: m.path,
          line: m.line,
          title: `Hard-coded ${p.name}`,
          observed: `${article(p.name)} ${p.name} (${p.name === 'private key' ? 'key material' : redacted}) is present in ${m.path} at line ${m.line}${where}. The value is redacted.`,
          // Hashed so the fingerprint is unique per secret; the key itself is never output.
          key: `${p.name}:${createHash('sha256').update(value).digest('hex').slice(0, 16)}`,
          ...(local
            ? { severity: 'low' as const, redFlag: false }
            : p.name === 'database URL with password'
              ? { severity: 'high' as const }
              : {}),
        });
      }
    }
    if (findings.length) return { status: 'fail', findings };
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'absence',
          description: `No high-confidence secret patterns (${plural(SECRET_PATTERNS.length, 'pattern')}) matched in ${plural(ctx.files.files.length, 'file')}.`,
        },
      ],
    };
  },
};
