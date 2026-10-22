import type { RawFinding, Rule } from '../../engine/types.js';
import { isCommentLine, isProductionSource, isTestPath, isVendored } from '../lib/languages.js';
import { absence, plural } from '../util.js';

const CONFIG = /\.(?:ya?ml|json|toml|tf|ini|conf|properties)$/;
const SKIP =
  /(?:^|\/)(?:package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|composer\.lock|docker-compose[^/]*\.ya?ml|compose\.ya?ml|tsconfig[^/]*\.json|\.devcontainer\/[^/]+)$/;
const URL = /["'`]http:\/\/([A-Za-z0-9.-]+)(?::\d+)?[^"'`\s]*["'`]/g;
const SAFE_HOST =
  /^(?:localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|[\w-]+\.local(?:host)?|(?:[\w-]+\.)*(?:example\.(?:com|org|net)|test|invalid)|(?:www\.)?w3\.org|schemas\.[\w.-]+|json-schema\.org|purl\.org|ns\.adobe\.com|xmlns\.com|(?:www\.)?apache\.org|opensource\.org|169\.254\.169\.254)$/i;

export const plainHttpUrls: Rule = {
  id: 'cc6.7/plain-http-urls',
  criterion: 'CC6.7',
  title: 'Service URLs use HTTPS, not plain HTTP',
  tags: ['CODE', 'CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['TLS 1.2+ enforced on all external and internal endpoints'],
  expected:
    'Every external and internal service URL uses https://. Plain HTTP is limited to localhost and documentation examples.',
  risk: 'Requests over plain HTTP can be read and modified in transit, including tokens and personal data.',
  remediation: {
    summary:
      'Switch the URL to https:// and make sure the target service redirects HTTP to HTTPS with HSTS.',
    example: `const API_URL = process.env.API_URL ?? 'https://api.example.com';`,
  },
  detect(ctx) {
    const files = ctx.files.files.filter(
      (f) =>
        (isProductionSource(f) ||
          (CONFIG.test(f.path) && !isTestPath(f.path) && !isVendored(f.path))) &&
        !SKIP.test(f.path),
    );
    if (files.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No production source or config files to check.',
      };
    const findings: RawFinding[] = [];
    for (const f of files) {
      (ctx.files.read(f.path) ?? '').split('\n').forEach((line, i) => {
        if (isCommentLine(line)) return;
        for (const m of line.matchAll(URL)) {
          const host = m[1] ?? '';
          // Dotless hosts are container or cluster service names on a private network.
          if (!host.includes('.') || SAFE_HOST.test(host)) continue;
          findings.push({
            path: f.path,
            line: i + 1,
            title: `Plain HTTP URL to ${host}`,
            observed: `http://${host} is used in ${f.path} at line ${i + 1}.`,
            key: host,
          });
        }
      });
    }
    if (findings.length) return { status: 'fail', findings };
    return absence(
      `Checked ${plural(files.length, 'file')}; no plain http:// URLs to non-local hosts.`,
    );
  },
};
