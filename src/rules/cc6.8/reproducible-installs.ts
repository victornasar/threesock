import type { RawFinding, Rule } from '../../engine/types.js';
import { buildFiles } from '../lib/build-files.js';
import { isCommentLine } from '../lib/languages.js';

const NPM_INSTALL = /\bnpm\s+(?:install|i)(?=\s*(?:$|&&|;|\||\\|--(?!save|global|g\b)|-[^gD-]))/;
const FROZEN =
  /\bnpm\s+ci\b|--frozen-lockfile|--immutable\b|\bpnpm\s+install\b|\byarn\s+install\b|\bbun\s+install\b|--require-hashes|\bpip\s+install\b[^\n]*-r\b|\buv\s+sync\b|\bpoetry\s+install\b|\bgo\s+mod\s+download\b/;

export const reproducibleInstalls: Rule = {
  id: 'cc6.8/reproducible-installs',
  criterion: 'CC6.8',
  title: 'CI and image builds install from the lockfile',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Lockfiles committed'],
  expected:
    'Builds install exactly what the lockfile says (npm ci, pnpm install --frozen-lockfile, pip --require-hashes).',
  risk: '`npm install` in CI can rewrite the lockfile and pull versions nobody reviewed.',
  remediation: {
    summary: 'Use the lockfile-respecting install command in CI and Dockerfiles.',
    example: `RUN npm ci --omit=dev
# or
RUN pnpm install --frozen-lockfile --prod`,
  },
  detect(ctx) {
    const files = buildFiles(ctx.files);
    const findings: RawFinding[] = [];
    let installs = 0;
    let firstGood: { path: string; line: number } | undefined;
    for (const f of files) {
      (ctx.files.read(f.path) ?? '').split('\n').forEach((line, i) => {
        if (isCommentLine(line)) return;
        if (NPM_INSTALL.test(line)) {
          installs++;
          findings.push({
            path: f.path,
            line: i + 1,
            title: '`npm install` used in a build',
            observed: `${f.path} runs npm install at line ${i + 1}; use npm ci to install from the lockfile.`,
            key: line.trim(),
          });
        } else if (FROZEN.test(line)) {
          installs++;
          firstGood ??= { path: f.path, line: i + 1 };
        }
      });
    }
    if (installs === 0)
      return {
        status: 'not_applicable',
        justification: 'No dependency installs found in CI configs, Dockerfiles or build scripts.',
      };
    if (findings.length) return { status: 'fail', findings };
    return {
      status: 'pass',
      evidence: [
        {
          kind: 'file',
          ...(firstGood as { path: string; line: number }),
          description: 'Builds install dependencies from the lockfile.',
        },
      ],
    };
  },
};
