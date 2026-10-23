import type { RawFinding, Rule } from '../../engine/types.js';
import { isProductionSource } from '../lib/languages.js';
import { lineAt } from '../util.js';

const CORS = /cors|Access-Control-Allow-Origin|AllowedOrigins|CORS_ALLOW/i;
const WILDCARD =
  /\borigin\s*:\s*(?:['"]\*['"]|true\b)|Access-Control-Allow-Origin['"]?\s*[,:]\s*['"]\*['"]|allow_origins\s*=\s*\[\s*['"]\*['"]|CORS_ALLOW_ALL_ORIGINS\s*=\s*True|CORS_ORIGIN_ALLOW_ALL\s*=\s*True|AllowedOrigins\s*:\s*\[\]string\{\s*"\*"|AllowAllOrigins\s*:\s*true|CORS\(\s*app\s*,(?![^)]*origins)[^)]*supports_credentials\s*=\s*True/;
const CREDENTIALS =
  /credentials\s*:\s*true|Allow-Credentials['"]?\s*[,:]\s*['"]?true|allow_credentials\s*=\s*True|CORS_ALLOW_CREDENTIALS\s*=\s*True|supports_credentials\s*=\s*True|AllowCredentials\s*:\s*true/i;

export const corsCredentials: Rule = {
  id: 'cc6.6/cors-credentials',
  criterion: 'CC6.6',
  title: 'CORS does not allow any origin with credentials',
  tags: ['CODE'],
  severity: 'high',
  redFlag: false,
  checks: ['Restrictive CORS'],
  expected:
    'Credentialed CORS is limited to an explicit allow-list of origins; wildcard or reflected origins are only used for public, credential-less APIs.',
  risk: 'Any website a user visits can make authenticated requests to the API and read the responses.',
  remediation: {
    summary:
      'Replace the wildcard or reflected origin with an explicit list of trusted origins, or drop credentials for truly public endpoints.',
    example: `app.use(cors({ origin: ['https://app.example.com'], credentials: true }));`,
  },
  detect(ctx) {
    const files = ctx.files.files.filter(
      (f) => isProductionSource(f) && CORS.test(ctx.files.read(f.path) ?? ''),
    );
    if (files.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No CORS configuration found in production source.',
      };
    const findings: RawFinding[] = [];
    for (const f of files) {
      const text = ctx.files.read(f.path) ?? '';
      const wild = WILDCARD.exec(text);
      if (wild && CREDENTIALS.test(text)) {
        const line = lineAt(text, wild.index);
        findings.push({
          path: f.path,
          line,
          title: 'CORS allows any origin with credentials',
          observed: `${f.path} allows any (or reflected) origin at line ${line} and also enables credentials.`,
          key: 'wildcard+credentials',
        });
      }
    }
    if (findings.length) return { status: 'fail', findings };
    return {
      status: 'pass',
      evidence: files.slice(0, 5).map((f) => ({
        kind: 'file' as const,
        path: f.path,
        description: 'CORS configuration does not combine a wildcard origin with credentials.',
      })),
    };
  },
};
