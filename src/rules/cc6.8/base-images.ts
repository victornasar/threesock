import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { dockerfiles } from '../lib/build-files.js';

export const baseImages: Rule = {
  id: 'cc6.8/base-images',
  criterion: 'CC6.8',
  title: 'Container base images are pinned',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Base images are minimal'],
  expected:
    'Base images use an explicit version tag, ideally pinned by digest, from a trusted registry.',
  risk: 'An untagged or :latest base image changes underneath you, so builds are not reproducible and a compromised upstream image flows straight in.',
  remediation: {
    summary:
      'Pin base images to a version and digest, and let Dependabot or Renovate propose updates.',
    example: `FROM node:22.11.0-bookworm-slim@sha256:<digest>`,
  },
  detect(ctx) {
    const files = dockerfiles(ctx.files);
    if (files.length === 0)
      return { status: 'not_applicable', justification: 'No Dockerfiles found.' };
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    for (const f of files) {
      const stages = new Set<string>();
      (ctx.files.read(f.path) ?? '').split('\n').forEach((line, i) => {
        const m = /^\s*FROM\s+(?:--platform=\S+\s+)?(\S+)(?:\s+AS\s+(\S+))?/i.exec(line);
        if (!m) return;
        const image = m[1] as string;
        if (m[2]) stages.add(m[2].toLowerCase());
        if (image === 'scratch' || stages.has(image.toLowerCase()) || image.includes('$')) return;
        const at = `${f.path} at line ${i + 1}`;
        if (image.includes('@sha256:')) {
          evidence.push({
            kind: 'file',
            path: f.path,
            line: i + 1,
            description: `${image.split('@')[0]} is pinned by digest.`,
          });
        } else if (/:[^/]+$/.test(image) && !image.endsWith(':latest')) {
          evidence.push({
            kind: 'file',
            path: f.path,
            line: i + 1,
            description: `${image} is pinned to a tag (not a digest).`,
          });
        } else {
          findings.push({
            path: f.path,
            line: i + 1,
            title: `Unpinned base image ${image}`,
            observed: `${image} in ${at} has no version tag or uses :latest.`,
            key: image,
          });
        }
      });
    }
    if (findings.length) return { status: 'fail', findings, evidence };
    if (evidence.length === 0)
      return {
        status: 'unknown',
        reason:
          'Dockerfiles use build arguments or stages only; base image pinning could not be determined.',
      };
    return { status: 'pass', evidence };
  },
};
