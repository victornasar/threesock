import type { RawFinding, Rule } from '../../engine/types.js';
import { isCommentLine, isProductionSource, languageOf } from '../lib/languages.js';
import { plural } from '../util.js';

const SIGN = { js: /\bjwt\.sign\s*\(|new SignJWT\s*\(/, python: /\bjwt\.encode\s*\(/ } as const;
const EXPIRY = /expiresIn|setExpirationTime|\bexp\b|["']exp["']|timedelta/;

export const tokenExpiry: Rule = {
  id: 'cc6.3/token-expiry',
  criterion: 'CC6.3',
  title: 'Issued tokens expire',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['Tokens, API keys, sessions, and deploy keys are revocable'],
  expected:
    'Every token the application issues has an expiry, so access ends even if revocation fails.',
  risk: 'A token without expiry stays valid forever; one leak is permanent access.',
  remediation: {
    summary: 'Set a short expiry on every issued token and use refresh tokens that can be revoked.',
    example: `jwt.sign(claims, key, { algorithm: 'RS256', expiresIn: '15m' });`,
  },
  detect(ctx) {
    const files = ctx.files.files.filter((f) => isProductionSource(f, ['js', 'python']));
    const findings: RawFinding[] = [];
    let issuers = 0;
    for (const f of files) {
      const lang = languageOf(f.path) as 'js' | 'python';
      const lines = (ctx.files.read(f.path) ?? '').split('\n');
      lines.forEach((line, i) => {
        if (isCommentLine(line) || !SIGN[lang].test(line)) return;
        issuers++;
        // The call and its options usually fit in the next few lines; the payload may be built just above.
        const window = lines.slice(Math.max(0, i - 6), i + 8).join('\n');
        if (!EXPIRY.test(window)) {
          findings.push({
            path: f.path,
            line: i + 1,
            title: 'Token issued without an expiry',
            observed: `A token is signed in ${f.path} at line ${i + 1} with no expiry nearby.`,
            key: String(i + 1),
          });
        }
      });
    }
    if (issuers === 0)
      return { status: 'not_applicable', justification: 'The application does not issue JWTs.' };
    if (findings.length) return { status: 'fail', findings };
    return {
      status: 'pass',
      evidence: [
        { kind: 'absence', description: `${plural(issuers, 'token issuing call')} set an expiry.` },
      ],
    };
  },
};
