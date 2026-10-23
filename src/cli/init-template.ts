export const INIT_TEMPLATE = `# threesock configuration. See https://github.com/threesock/threesock#configuration
version: 1

# Security is always in scope. Add the optional categories your SOC 2 report covers.
scope:
  - security
  # - availability
  # - processing-integrity
  # - confidentiality
  # - privacy

# Defaults come from rubric sections 1.3 and 1.4. Score against your own documented policy.
thresholds:
  requiredApprovals: 1
  sensitivePathApprovals: 2
  minTlsVersion: "1.2"
  slaDays: { critical: 1, high: 30, medium: 90, low: 180 }
  logRetentionDays: 365
  secretRotationDays: 90
  dsarResponseDays: 30

# Owners for finding paths (globs, last match wins) and for MANUAL criteria (by id).
owners:
  # "src/auth/**": "@your-org/security"
  # "CC1.2": "CEO"

# Paths threesock should not scan, such as vendored code or test fixtures.
ignore:
  # - "vendor/**"

# Security-sensitive paths that need named CODEOWNERS. Setting this replaces the defaults
# (auth, iam, crypto, security, payments/billing, infra/terraform, workflows, migrations, lockfiles).
# sensitivePaths:
#   - "src/auth/**"
#   - "infra/**"

# Evidence kept outside the repository (Notion, Confluence, a GRC tool), by criterion
# or rule id. Linked documentation checks are reported, never counted as Met.
evidenceLinks:
  # CC7.4: "https://notion.so/acme/incident-response"

# Criteria that genuinely do not apply. Each needs a written justification.
notApplicable:
  # CC6.4: "No physical facilities; production runs on AWS, covered by its SOC 2 report."

# Accepted risks. Every exception needs an approver, a justification and an expiry date.
# Expired exceptions turn back into open findings.
exceptions:
  # - rule: cc1.3/codeowners
  #   approver: "jane@example.com"
  #   justification: "CODEOWNERS rollout tracked in ENG-123."
  #   expires: 2026-12-31
`;
