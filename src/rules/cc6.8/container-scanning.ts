import type { Rule } from '../../engine/types.js';
import { ciConfigs, dockerfiles } from '../lib/build-files.js';
import { findAny } from '../util.js';

const SCANNERS =
  /\btrivy\b|\bgrype\b|anchore\/scan-action|snyk\/actions\/docker|snyk container|docker scout|aquasecurity|clair|prisma-cloud-scan|\bwiz\b/i;

export const containerScanning: Rule = {
  id: 'cc6.8/container-scanning',
  criterion: 'CC6.8',
  title: 'Container images are scanned in CI',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Dependency and container scanning in CI'],
  expected:
    'Images built from this repository are scanned (Trivy, Grype, Snyk, Docker Scout) before they are pushed or deployed.',
  risk: 'Base images and OS packages carry their own vulnerabilities that dependency scanning of your code does not see.',
  remediation: {
    summary:
      'Scan each built image in CI and fail on Critical/High vulnerabilities with a fix available.',
    example: `- uses: aquasecurity/trivy-action@<sha>  # pin to a commit SHA
  with: { image-ref: 'app:\${{ github.sha }}', severity: 'CRITICAL,HIGH', exit-code: '1', ignore-unfixed: true }`,
  },
  detect(ctx) {
    if (dockerfiles(ctx.files).length === 0)
      return { status: 'not_applicable', justification: 'No Dockerfiles found.' };
    const hit = findAny(ctx.files, ciConfigs(ctx.files), SCANNERS);
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'A container image scanner runs in CI.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'Container images are not scanned',
          observed:
            'The repository builds container images but no image scanner (Trivy, Grype, Snyk, Docker Scout) runs in CI.',
          key: 'missing',
        },
      ],
    };
  },
};
