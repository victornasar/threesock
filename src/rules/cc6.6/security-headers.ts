import type { Rule } from '../../engine/types.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { detectWebApp } from '../lib/web.js';
import { findAny } from '../util.js';

const HEADERS =
  /\bhelmet\b|@fastify\/helmet|koa-helmet|secureHeaders|secure-headers|Content-Security-Policy|Strict-Transport-Security|SECURE_HSTS_SECONDS|flask[-_]talisman|\bTalisman\(|unrolled\/secure|gin-contrib\/secure|SecurityMiddleware/;
const CANDIDATES =
  /\.(?:[cm]?[jt]sx?|py|go|json|toml|conf|ya?ml)$|(?:^|\/)_headers$|(?:^|\/)nginx[^/]*$/;

export const securityHeaders: Rule = {
  id: 'cc6.6/security-headers',
  criterion: 'CC6.6',
  title: 'HTTP security headers are set',
  tags: ['CODE', 'CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['security headers set'],
  expected:
    'Responses set CSP, HSTS, X-Content-Type-Options and frame protections, in code or at the edge (CDN, proxy, platform config).',
  risk: 'Missing headers remove browser-side defences against XSS, clickjacking and protocol downgrade.',
  remediation: {
    summary:
      'Add a security-headers middleware (helmet, Talisman, SecurityMiddleware) or set the headers in your proxy or platform configuration.',
    example: `import helmet from 'helmet';
app.use(helmet({ hsts: { maxAge: 31536000, includeSubDomains: true } }));`,
  },
  detect(ctx) {
    const app = detectWebApp(ctx.files);
    if (!app)
      return {
        status: 'not_applicable',
        justification: 'No HTTP server or web framework detected.',
      };
    const files = ctx.files.files.filter(
      (f) => CANDIDATES.test(f.path) && !isTestPath(f.path) && !isVendored(f.path),
    );
    const hit = findAny(ctx.files, files, HEADERS);
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'Security headers are configured.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          path: app.path,
          title: 'No HTTP security headers configured',
          observed: `${app.description}, but no security-headers middleware or CSP/HSTS configuration was found in code or config. They may be set at a CDN; if so, add an exception that says where.`,
          key: 'missing',
        },
      ],
    };
  },
};
