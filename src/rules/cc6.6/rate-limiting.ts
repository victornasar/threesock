import type { Rule } from '../../engine/types.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { detectWebApp } from '../lib/web.js';
import { findAny } from '../util.js';

const LIMITERS =
  /express-rate-limit|rate-limiter-flexible|@fastify\/rate-limit|@nestjs\/throttler|hono-rate-limiter|@upstash\/ratelimit|\bslowapi\b|django[-_]ratelimit|flask[-_]limiter|golang\.org\/x\/time\/rate|ulule\/limiter|didip\/tollbooth|\blimit_req\b|rate_based_statement|RateBasedStatement|throttl/i;

export const rateLimiting: Rule = {
  id: 'cc6.6/rate-limiting',
  criterion: 'CC6.6',
  title: 'Rate limiting protects auth and public APIs',
  tags: ['CODE', 'CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Rate limiting and abuse protections'],
  expected:
    'Login, signup, password reset and public APIs are rate limited, in code or at a gateway/WAF.',
  risk: 'Without limits, credential stuffing and brute force run at full speed, and a single client can exhaust capacity.',
  remediation: {
    summary:
      'Add a rate limiter to auth endpoints and public APIs, or configure a WAF/gateway rate rule and record where it lives.',
    example: `import rateLimit from 'express-rate-limit';
app.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }));`,
  },
  detect(ctx) {
    const app = detectWebApp(ctx.files);
    if (!app)
      return {
        status: 'not_applicable',
        justification: 'No HTTP server or web framework detected.',
      };
    const files = ctx.files.files.filter(
      (f) =>
        !isTestPath(f.path) &&
        !isVendored(f.path) &&
        /\.(?:[cm]?[jt]sx?|py|go|json|toml|txt|tf|conf|ya?ml)$/.test(f.path),
    );
    const hit = findAny(ctx.files, files, LIMITERS);
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'Rate limiting is configured.' }],
      };
    return {
      status: 'unknown',
      reason: `${app.description}, but no rate limiter was found in code or config. It may be enforced by a gateway or WAF; confirm manually.`,
    };
  },
};
