import type { Rule } from '../../engine/types.js';
import { scanLines, type CodePattern } from '../lib/code-patterns.js';
import { isProductionSource } from '../lib/languages.js';
import { findAny } from '../util.js';

const USES_JWT =
  /jsonwebtoken|\bjose\b|['"]jwt['"]|\bimport jwt\b|from jwt import|golang-jwt|\bjwt\.(?:sign|verify|decode|encode|Parse)/;
const VERIFIES =
  /\bjwt\.verify\s*\(|\bjwtVerify\s*\(|jwt\.decode\([^)]*algorithms\s*=|\bjwt\.Parse(?:WithClaims)?\s*\(|\.verify_jwt\s*\(/;

const PATTERNS: CodePattern[] = [
  {
    languages: ['js', 'python', 'go'],
    re: /algorithms?\s*[:=]\s*\[?\s*['"]none['"]/i,
    label: 'JWTs accepted with the "none" algorithm',
    severity: 'critical',
  },
  {
    languages: ['js'],
    re: /ignoreExpiration\s*:\s*true/,
    label: 'JWT expiry is ignored during verification',
    severity: 'high',
  },
  {
    languages: ['js'],
    re: /\bjwt\.decode\s*\(/,
    label: 'JWT decoded without verifying its signature',
    severity: 'medium',
  },
  {
    languages: ['python'],
    re: /["']verify_(?:signature|exp)["']\s*:\s*False|jwt\.decode\([^)]*verify\s*=\s*False/,
    label: 'JWT signature or expiry verification is switched off',
    severity: 'high',
  },
  {
    languages: ['go'],
    re: /\.ParseUnverified\s*\(|UnsafeAllowNoneSignatureType/,
    label: 'JWT parsed without verifying its signature',
    severity: 'high',
  },
];

export const jwtVerification: Rule = {
  id: 'cc6.1/jwt-verification',
  criterion: 'CC6.1',
  title: 'JWTs are verified with a strong algorithm and expiry',
  tags: ['CODE'],
  severity: 'high',
  checks: ['**Sessions/tokens:**'],
  expected:
    'JWTs are signed with strong algorithms and validated (alg, exp, aud, iss) on every request.',
  risk: 'An unverified or "none"-algorithm token lets anyone forge a session for any user.',
  remediation: {
    summary:
      'Always verify tokens with an explicit algorithm allow-list, and check exp, aud and iss. Use decode only for logging-free inspection of already-verified tokens.',
    example: `const claims = jwt.verify(token, publicKey, {
  algorithms: ['RS256'], audience: 'api.example.com', issuer: 'https://auth.example.com/',
});`,
  },
  detect(ctx) {
    const source = ctx.files.files.filter((f) => isProductionSource(f));
    const jwtFiles = source.filter((f) => USES_JWT.test(ctx.files.read(f.path) ?? ''));
    if (jwtFiles.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No JWT handling found in production source.',
      };
    const findings = scanLines(ctx, jwtFiles, PATTERNS);
    if (findings.length) return { status: 'fail', findings };
    const ok = findAny(ctx.files, jwtFiles, VERIFIES);
    if (ok)
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'file',
            ...ok,
            description: 'JWTs are verified, and no insecure verification options were found.',
          },
        ],
      };
    return {
      status: 'unknown',
      reason: `JWT code found (${jwtFiles[0]?.path}) but no recognised verification call. Confirm tokens are verified.`,
    };
  },
};
