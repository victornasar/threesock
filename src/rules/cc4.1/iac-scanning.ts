import type { Rule } from '../../engine/types.js';
import { inCi } from '../lib/ci.js';
import { hasIac } from '../lib/infra.js';
import { findAny } from '../util.js';

const IAC_SCANNERS =
  /checkov|tfsec|trivy[^\n]*\b(?:config|fs|iac)\b|\bkics\b|terrascan|conftest|tflint|hadolint|kube-linter|kubescape|snyk\s+iac|datree|polaris/i;

export const iacScanning: Rule = {
  id: 'cc4.1/iac-scanning',
  criterion: 'CC4.1',
  title: 'Infrastructure as code is scanned in CI',
  tags: ['CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['CI runs SAST'],
  expected:
    'Terraform, Kubernetes, CloudFormation and Dockerfiles are scanned for misconfigurations (Checkov, Trivy config, tfsec, hadolint, ...) on every change.',
  risk: 'Misconfigurations such as public buckets or open ports are the leading cause of cloud breaches, and are cheap to catch before apply.',
  remediation: {
    summary: 'Run Checkov or Trivy in config mode on pull requests that touch infrastructure.',
    example: `- run: trivy config --exit-code 1 --severity HIGH,CRITICAL .`,
  },
  detect(ctx) {
    if (!hasIac(ctx.files))
      return {
        status: 'not_applicable',
        justification: 'No Terraform, CloudFormation, Kubernetes manifests or Dockerfiles found.',
      };
    const hit =
      inCi(ctx.files, IAC_SCANNERS) ??
      findAny(
        ctx.files,
        ctx.files.files.filter((f) => /^\.pre-commit-config\.ya?ml$/.test(f.path)),
        IAC_SCANNERS,
      );
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'Infrastructure code is scanned.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'Infrastructure code is not scanned',
          observed:
            'The repository defines infrastructure, but no IaC scanner (Checkov, Trivy config, tfsec, KICS, hadolint, kube-linter, ...) runs in CI.',
          key: 'missing',
        },
      ],
    };
  },
};
