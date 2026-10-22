import type { RawFinding, Rule } from '../../engine/types.js';
import { isCommentLine, isProductionSource } from '../lib/languages.js';
import { findAny } from '../util.js';

const SETS_COOKIES =
  /\bres\.cookie\s*\(|set_cookie\s*\(|http\.Cookie\s*\{|\bcookies\(\)\.set\s*\(|\bcookie\s*:\s*\{|express-session|cookie-session|SESSION_COOKIE_|SetCookie|setCookie\s*\(/;
const INSECURE = [
  {
    re: /\bhttpOnly\s*:\s*false\b|\bHttpOnly\s*:\s*false\b|SESSION_COOKIE_HTTPONLY\s*=\s*False|httponly\s*=\s*False/,
    label: 'Session cookie is readable from JavaScript (HttpOnly disabled)',
  },
  {
    re: /SESSION_COOKIE_SECURE\s*=\s*False|CSRF_COOKIE_SECURE\s*=\s*False|\bsecure\s*=\s*False/,
    label: 'Cookie is sent over plain HTTP (Secure disabled)',
  },
];
// `secure: false` is too generic on its own (SMTP clients use it), so only count it near cookie code.
const SECURE_FALSE_JS = /\b[Ss]ecure\s*:\s*false\b/;
const GOOD =
  /\bhttpOnly\s*:\s*true|HttpOnly\s*:\s*true|SESSION_COOKIE_SECURE\s*=\s*True|SESSION_COOKIE_HTTPONLY\s*=\s*True|\bsecure\s*:\s*true|Secure\s*:\s*true/;

export const cookieFlags: Rule = {
  id: 'cc6.1/cookie-flags',
  criterion: 'CC6.1',
  title: 'Session cookies are HttpOnly and Secure',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['**Sessions/tokens:**'],
  expected: 'Session and auth cookies set HttpOnly, Secure and SameSite.',
  risk: 'Without HttpOnly an XSS bug can steal sessions; without Secure the cookie can leak over plain HTTP.',
  remediation: {
    summary:
      'Set httpOnly, secure and sameSite on every session or auth cookie. Use an environment check only to relax Secure for local HTTP development.',
    example: `app.use(session({
  cookie: { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 },
}));`,
  },
  detect(ctx) {
    const source = ctx.files.files.filter((f) => isProductionSource(f));
    const cookieFiles = source.filter((f) => SETS_COOKIES.test(ctx.files.read(f.path) ?? ''));
    if (cookieFiles.length === 0) {
      return {
        status: 'not_applicable',
        justification: 'No code that sets cookies or configures sessions was found.',
      };
    }
    const findings: RawFinding[] = [];
    for (const f of cookieFiles) {
      const lines = (ctx.files.read(f.path) ?? '').split('\n');
      lines.forEach((line, i) => {
        if (isCommentLine(line)) return;
        const hit = INSECURE.find((p) => p.re.test(line));
        const nearCookie = lines
          .slice(Math.max(0, i - 4), i + 1)
          .some((l) => /cookie|session/i.test(l));
        const label =
          hit?.label ?? (SECURE_FALSE_JS.test(line) && nearCookie ? INSECURE[1]?.label : undefined);
        if (label)
          findings.push({
            path: f.path,
            line: i + 1,
            title: label,
            observed: `${label} in ${f.path} at line ${i + 1}.`,
            key: label,
          });
      });
    }
    if (findings.length) return { status: 'fail', findings };
    const good = findAny(ctx.files, cookieFiles, GOOD);
    if (good)
      return {
        status: 'pass',
        evidence: [
          { kind: 'file', ...good, description: 'Cookie security flags are set explicitly.' },
        ],
      };
    return {
      status: 'unknown',
      reason: `Cookies are set in ${cookieFiles[0]?.path} but security flags are left to framework defaults. Confirm HttpOnly, Secure and SameSite manually.`,
    };
  },
};
