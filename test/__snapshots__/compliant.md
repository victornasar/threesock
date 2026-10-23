# threesock SOC 2 readiness report

> **Readiness aid, not an audit.** threesock is an engineering readiness aid, not an audit. SOC 2 is attested by a licensed CPA firm against your organization's system description and commitments. A codebase can only demonstrate part of the criteria; the rest (board oversight, HR, vendor contracts, physical security) must be evidenced outside the repo. Use this report to find gaps early, not to claim compliance.

```
Repository / System: <root>
Commit / Release:    uncommitted working tree
Assessor:            threesock <version> (automated)   Date: 2026-01-15
Scope:  [x] Security  [x] Availability  [x] Processing Integrity  [x] Confidentiality  [x] Privacy
Environment(s) reviewed: repository contents only (code, IaC, CI configuration)
External tools:      none (built-in rules only)
```

## Summary

| Category | Assessable criteria | Points earned | Points possible | Readiness % | Band | MANUAL items open |
|---|---|---|---|---|---|---|
| Security | 27 | 54 | 54 | 100.0% | Audit-ready | 6 |
| Availability | 3 | 6 | 6 | 100.0% | Audit-ready | 0 |
| Processing Integrity | 4 | 8 | 8 | 100.0% | Audit-ready | 1 |
| Confidentiality | 2 | 4 | 4 | 100.0% | Audit-ready | 0 |
| Privacy | 14 | 28 | 28 | 100.0% | Audit-ready | 4 |

Open findings: 0 critical · 0 high · 0 medium · 0 low

Readiness counts assessable criteria only. MANUAL and N/A criteria are excluded from both sides of the ratio (rubric 1.1), so read it together with the number of criteria assessed.

## Scorecard (Appendix A)

| Criterion | Title | Score | Evidence | Finding ID | Owner | Notes |
|---|---|---|---|---|---|---|
| CC1.1 | Integrity and ethical values | MANUAL |  |  | Leadership and People Ops | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC1.2 | Board oversight | MANUAL |  |  | Board / executive leadership | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC1.3 | Organizational structure | 2 (Met) | `.github/CODEOWNERS:1` Catch-all rule assigns @compliant-org/engineering. |  |  | The automated check passed with evidence. |
| CC1.4 | Competence | MANUAL |  |  | Leadership and People Ops | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC1.5 | Accountability | MANUAL |  |  | Leadership and People Ops | None of the automated checks apply to this repository. Confirm manually, or declare N/A with a justification in threesock.yaml. |
| CC2.1 | Relevant, quality information | 2 (Met) | `package.json:10` Monitoring is configured in code.<br>`.github/workflows/ci.yml:33` CI generates an SBOM. |  |  | All 2 automated checks passed with evidence. |
| CC2.2 | Internal communication | 2 (Met) | `.github/pull_request_template.md:3` The PR template asks about security impact.<br>`README.md:7` The README links to security documentation. |  |  | All 2 automated checks passed with evidence. |
| CC2.3 | External communication | 2 (Met) | `SECURITY.md:5` SECURITY.md gives a reporting channel. |  |  | The automated check passed with evidence. |
| CC3.1 | Suitable objectives | MANUAL |  |  | Security and risk owner | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC3.2 | Risk identification and analysis | 2 (Met) | `docs/adr/0001-oidc-for-ci.md` 1 ADR, 1 with a security section.<br>`docs/security/risk-register.md:6` docs/security/risk-register.md covers likelihood, impact, owner, treatment (structure checked, quality not judged).<br>`docs/security/threat-model.md:6` docs/security/threat-model.md covers assets or data, trust boundaries or entry points, threats, mitigations (structure checked, quality not judged). |  |  | All 3 automated checks passed with evidence. |
| CC3.3 | Fraud risk | 2 (Met) | Checked 10 files (JS/TS, Python, Go source and related config); no auth-bypass flags or hard-coded privileged usernames. |  |  | The automated check passed with evidence. |
| CC3.4 | Significant changes | 2 (Met) | `.github/CODEOWNERS` All 3 manifests and IaC files have specific code owners. |  |  | The automated check passed with evidence. |
| CC4.1 | Ongoing/separate evaluations | 2 (Met) | `.github/workflows/ci.yml:31` Infrastructure code is scanned.<br>`.github/workflows/ci.yml:32` A SAST tool runs in CI.<br>`.github/workflows/ci.yml:6` Security scans run on a schedule. |  |  | All 3 automated checks passed with evidence. |
| CC4.2 | Deficiency communication and remediation | 2 (Met) | 5 security scan steps in CI, none configured to ignore failures.<br>`docs/security/vulnerability-management.md:8` docs/security/vulnerability-management.md covers per-severity deadlines, escalation of overdue findings (structure checked, quality not judged).<br>Checked 11 source files and scanner ignore files; every suppression has a reason. |  |  | All 3 automated checks passed with evidence. |
| CC5.1 | Control selection and design | 2 (Met) | `docs/security/risk-register.md:6` docs/security/risk-register.md covers a risks column, a controls column (structure checked, quality not judged). |  |  | The automated check passed with evidence. |
| CC5.2 | Technology general controls | 2 (Met) | `.github/workflows/ci.yml` All actions are pinned to commit SHAs.<br>`.github/workflows/deploy.yml` All actions are pinned to commit SHAs.<br>`.github/workflows/drift.yml` All actions are pinned to commit SHAs.<br>+8 more |  |  | All 7 automated checks passed with evidence. |
| CC5.3 | Policies and procedures | 2 (Met) | `docs/security/access-management.md` Owner set, last reviewed 2025-11-01.<br>`docs/security/breach-notification.md` Owner set, last reviewed 2025-11-01.<br>`docs/security/business-continuity.md` Owner set, last reviewed 2025-11-01.<br>+10 more |  |  | All 2 automated checks passed with evidence. |
| CC6.1 | Logical access security | 2 (Met) | `src/server.js:14` Cookie security flags are set explicitly.<br>`.gitignore:2` .gitignore excludes .env files (`.env`).<br>No .env files (other than templates) are present among 43 files.<br>+7 more |  |  | All 9 automated checks passed with evidence. |
| CC6.2 | Registration and authorization before access | 2 (Met) | Checked 10 files (JS/TS, Python source and related config); no request bodies spread into models and no client-supplied roles. |  |  | The automated check passed with evidence. |
| CC6.3 | Access removal and modification | 2 (Met) | `docs/security/access-management.md:10` docs/security/access-management.md covers access revocation, systems covered (SSO, source control, cloud, CI), deadline (structure checked, quality not judged).<br>1 token issuing call set an expiry. |  |  | All 2 automated checks passed with evidence. |
| CC6.4 | Physical access | MANUAL |  |  | IT and facilities (inherit from cloud provider SOC 2 report) | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC6.5 | Secure disposal of assets | 2 (Met) | `infra/main.tf:34` aws_db_instance.main uses a customer-managed key (detected by threesock's lightweight Terraform scanner). |  |  | The automated check passed with evidence. |
| CC6.6 | Protection against external threats | 2 (Met) | `src/server.js` CORS configuration does not combine a wildcard origin with credentials.<br>Checked 10 files (JS/TS, Python, Go source and related config); no dynamic code execution, shell-string commands or unsafe deserialization.<br>`infra/main.tf:11` aws_security_group.web exposes no admin or data ports to the internet (detected by threesock's lightweight Terraform scanner).<br>+6 more |  |  | All 8 automated checks passed with evidence. |
| CC6.7 | Protection of data in transmission | 2 (Met) | Checked 18 files; no plain http:// URLs to non-local hosts.<br>Checked 14 files (JS/TS, Python, Go source and related config); certificate verification is never disabled.<br>Checked 11 files; no TLS below 1.2 and no legacy ciphers found.<br>+1 more |  |  | All 4 automated checks passed with evidence. |
| CC6.8 | Malicious/unauthorized software | 2 (Met) | `Dockerfile:1` node:22.11.0-bookworm-slim is pinned by digest.<br>`.github/workflows/ci.yml:27` A container image scanner runs in CI.<br>Checked 4 build files; no remote scripts piped to a shell.<br>+4 more |  |  | All 6 automated checks passed with evidence. |
| CC7.1 | Detection of vulnerabilities and configuration changes | 2 (Met) | `Dockerfile:6` Final stage runs as node.<br>`.github/workflows/drift.yml` Scheduled terraform plan detects drift.<br>`.github/dependabot.yml` Dependency update and alert bot configured. |  |  | All 3 automated checks passed with evidence. |
| CC7.2 | Monitoring for anomalies | 2 (Met) | `infra/main.tf:83` Alert rules are defined in code.<br>Checked 10 files (JS/TS, Python, Go source and related config); no personal data fields passed to loggers.<br>Checked 10 files (JS/TS, Python, Go source and related config); no credentials, auth headers or request bodies passed to loggers. |  |  | All 3 automated checks passed with evidence. |
| CC7.3 | Security event evaluation | 2 (Met) | `docs/security/incident-response.md:9` docs/security/incident-response.md covers severity levels, classification criteria, outcome recording (structure checked, quality not judged). |  |  | The automated check passed with evidence. |
| CC7.4 | Incident response | 2 (Met) | `docs/security/incident-response.md:6` docs/security/incident-response.md covers roles, severity levels, escalation, communication (structure checked, quality not judged).<br>`docs/security/incident-response.md:25` Runbook for credential leak.<br>`docs/security/incident-response.md:12` Runbook for data exposure.<br>+2 more |  |  | All 2 automated checks passed with evidence. |
| CC7.5 | Recovery from incidents | 2 (Met) | `docs/security/access-management.md:15` docs/security/access-management.md covers what is rotated, when (schedule or trigger) (structure checked, quality not judged). |  |  | The automated check passed with evidence. |
| CC8.1 | Authorized, tested, approved changes | 2 (Met) | `.github/workflows/ci.yml:17` Tests run on every pull request.<br>`.github/workflows/ci.yml:16` Lint runs on every pull request.<br>`.github/CODEOWNERS` All 18 sensitive files have a specific code owner.<br>+4 more |  |  | All 6 automated checks passed with evidence. |
| CC9.1 | Business disruption risk | 2 (Met) | `docs/security/business-continuity.md:6` docs/security/business-continuity.md covers critical dependencies and fallbacks, recovery steps, provider or regional outages (structure checked, quality not judged). |  |  | The automated check passed with evidence. |
| CC9.2 | Vendor and third-party risk | 2 (Met) | `docs/security/breach-notification.md:12` Third-party inventory.<br>`.github/workflows/ci.yml:33` SBOM generated in CI. |  |  | The automated check passed with evidence. |
| A1.1 | Capacity management | 2 (Met) | `k8s/deployment.yaml:21` Autoscaling is configured.<br>`k6/smoke.js` Load test definitions exist.<br>`k8s/deployment.yaml` All containers set resource limits. |  |  | All 3 automated checks passed with evidence. |
| A1.2 | Environmental protection, backup, and recovery infrastructure | 2 (Met) | `infra/main.tf:34` aws_db_instance.main keeps backups for 14 days.<br>`infra/main.tf:34` aws_db_instance.main is deletion-protected (detected by threesock's lightweight Terraform scanner).<br>`k8s/deployment.yaml` Probes are defined.<br>+1 more |  |  | All 4 automated checks passed with evidence. |
| A1.3 | Recovery plan testing | 2 (Met) | `docs/security/business-continuity.md:21` Dated restore or DR test results are recorded.<br>`docs/security/business-continuity.md:19` docs/security/business-continuity.md covers RTO, RPO (structure checked, quality not judged). |  |  | All 2 automated checks passed with evidence. |
| PI1.1 | Processing objectives and specifications | 2 (Met) | `openapi.yaml` API contract file.<br>`CHANGELOG.md` Changes are recorded in a changelog. |  |  | All 2 automated checks passed with evidence. |
| PI1.2 | Input completeness and accuracy | 2 (Met) | `src/webhooks.js:13` Idempotency or deduplication is implemented.<br>`package.json:22` A schema validation library is used. |  |  | All 2 automated checks passed with evidence. |
| PI1.3 | Processing completeness, accuracy, timeliness, authorization | 2 (Met) | `src/jobs.js:6` Retry limits or dead-letter handling are configured.<br>`src/webhooks.js:12` Database transactions are used. |  |  | All 2 automated checks passed with evidence. |
| PI1.4 | Output completeness, accuracy, timeliness | MANUAL |  |  | Engineering lead | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| PI1.5 | Storage completeness and accuracy | 2 (Met) | `migrations/001_init.up.sql:1` Schemas declare integrity constraints. |  |  | The automated check passed with evidence. |
| C1.1 | Identify and protect confidential information | 2 (Met) | `docs/security/data-handling.md:8` docs/security/data-handling.md covers classification levels, handling rules (structure checked, quality not judged).<br>`infra/main.tf:34` aws_db_instance.main sets storage_encrypted = true (detected by threesock's lightweight Terraform scanner).<br>`infra/main.tf:44` aws_s3_bucket.uploads is encrypted at rest by the provider by default.<br>+1 more |  |  | All 3 automated checks passed with evidence. |
| C1.2 | Dispose of confidential information | 2 (Met) | `infra/main.tf:44` aws_s3_bucket.uploads has lifecycle rules (detected by threesock's lightweight Terraform scanner).<br>`infra/main.tf:78` aws_cloudwatch_log_group.api retains logs for 90 days.<br>`docs/security/data-handling.md:14` docs/security/data-handling.md covers retention periods, deletion or disposal (structure checked, quality not judged). |  |  | All 2 automated checks passed with evidence. |
| P1.1 | Privacy notice | 2 (Met) | `public/privacy.html` A privacy notice page exists. |  |  | The automated check passed with evidence. |
| P2.1 | Choice and consent | 2 (Met) | `public/analytics.js:4` Consent gating found for PostHog. |  |  | The automated check passed with evidence. |
| P3.1 | Collection consistent with objectives | 2 (Met) | `docs/security/data-handling.md:19` docs/security/data-handling.md covers personal data fields or categories, purpose, retention (structure checked, quality not judged). |  |  | The automated check passed with evidence. |
| P3.2 | Sensitive information | 2 (Met) | `migrations/002_profile.down.sql:1` Field-level encryption or tokenization is used for sensitive data. |  |  | The automated check passed with evidence. |
| P4.1 | Use of personal information | MANUAL |  |  | Privacy / legal | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| P4.2 | Retention of personal information | 2 (Met) | `src/jobs.js:9` A purge job, TTL or retention routine exists. |  |  | The automated check passed with evidence. |
| P4.3 | Disposal of personal information | 2 (Met) | `src/account/routes.js:9` A deletion or anonymization path exists. |  |  | The automated check passed with evidence. |
| P5.1 | Data subject access | 2 (Met) | `src/account/routes.js:7` A personal data export path exists. |  |  | The automated check passed with evidence. |
| P5.2 | Correction and amendment | 2 (Met) | `src/account/routes.js:8` A profile or account update path exists. |  |  | The automated check passed with evidence. |
| P6.1 | Authorized disclosure to third parties | 2 (Met) | All 1 SDK vendor(s) in use are named in the documentation: PostHog.<br>Checked 10 files (JS/TS, Python source and related config); no whole user objects or email addresses passed to analytics or support SDKs. |  |  | All 2 automated checks passed with evidence. |
| P6.2 | Records of authorized disclosures | MANUAL |  |  | Privacy / legal | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| P6.3 | Records of unauthorized disclosures | 2 (Met) | `docs/security/breach-notification.md:16` docs/security/breach-notification.md covers scope, affected subjects, root cause, remediation (structure checked, quality not judged). |  |  | The automated check passed with evidence. |
| P6.4 | Third-party privacy commitments | MANUAL |  |  | Privacy / legal | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| P6.5 | Third-party notification of unauthorized disclosure | 2 (Met) | `docs/security/breach-notification.md:12` Vendor breach notices have a documented intake. |  |  | The automated check passed with evidence. |
| P6.6 | Breach notification | 2 (Met) | `docs/security/breach-notification.md:7` docs/security/breach-notification.md covers notification deadlines, regulators and affected people, templates (structure checked, quality not judged). |  |  | The automated check passed with evidence. |
| P6.7 | Accounting of personal information held and disclosed | MANUAL |  |  | Privacy / legal | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| P7.1 | Data quality | 2 (Met) | `src/account/routes.js:4` Personal data fields are validated. |  |  | The automated check passed with evidence. |
| P8.1 | Privacy inquiries, complaints, and disputes | 2 (Met) | `public/privacy.html:4` A privacy contact is published.<br>`.github/pull_request_template.md:4` Changes are reviewed for personal data impact. |  |  | The automated check passed with evidence. |

## Findings (Appendix B)

Socks on. No gaps found in this scope.

## Controls and policies affected

Mapping: threesock default catalogue (mappings/controls.yaml).

No open findings affect a mapped control or policy.

## Manual evidence checklist

These criteria cannot be assessed from the repository. Gather the evidence below and track it in your GRC tool.

### CC1.1 · Integrity and ethical values

Suggested owner: Leadership and People Ops  
Why manual: The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only.

Requirement: The organization demonstrates a commitment to integrity and ethical values.

- [ ] Code of conduct / ethics policy exists and is linked from the handbook or repo
- [ ] `SECURITY.md` or equivalent gives a reporting channel for security and ethics concerns
- [ ] Employee/contractor acknowledgment of policies is tracked (HRIS/GRC)
- [ ] Whistleblower mechanism, disciplinary procedure, and background screening documented

Evidence to collect: Signed acknowledgments, policy documents, screening records.

### CC1.2 · Board oversight

Suggested owner: Board / executive leadership  
Why manual: The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only.

Requirement: The governing body independently oversees internal controls.


Evidence to collect: Board/management meeting minutes, security and risk reports, audit committee materials.

### CC1.4 · Competence

Suggested owner: Leadership and People Ops  
Why manual: The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only.

Requirement: The organization attracts, develops, and retains competent personnel.

- [ ] Secure coding guidelines and onboarding docs exist
- [ ] Contribution guide covers security expectations (dependency policy, secret handling, review standards)
- [ ] Training completion records tracked

Evidence to collect: Training records, role qualification documents.

### CC1.5 · Accountability

Suggested owner: Leadership and People Ops  
Why manual: None of the automated checks apply to this repository. Confirm manually, or declare N/A with a justification in threesock.yaml.

Requirement: Individuals are held accountable for internal-control responsibilities.

- [ ] Every change is attributable to an individual (no shared accounts; signed commits or SSO-linked identities)
- [ ] Control owners named for each control in documentation
- [ ] Escalation paths documented in runbooks
- [ ] Performance objectives and disciplinary process reference security duties

### CC3.1 · Suitable objectives

Suggested owner: Security and risk owner  
Why manual: The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only.

Requirement: The organization specifies objectives clearly enough to identify and assess risks.

- [ ] Security, availability, and data-handling objectives documented (README, architecture docs, SLOs)
- [ ] Data-flow diagrams and trust boundaries documented

### CC6.4 · Physical access

Suggested owner: IT and facilities (inherit from cloud provider SOC 2 report)  
Why manual: The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only.

Requirement: The entity restricts physical access to facilities and protected information assets.

- [ ] Production runs in providers with current SOC 2 reports (carve-out/inherited controls documented)
- [ ] No on-premises or colo infrastructure defined in IaC unless separately assessed

### PI1.4 · Output completeness, accuracy, timeliness

Suggested owner: Engineering lead  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity implements policies and procedures to make available or deliver output completely, accurately, and timely in accordance with specifications.

- [ ] Output validation before release (reports, exports, notifications, invoices)
- [ ] Reconciliation jobs compare inputs vs. outputs and alert on discrepancy
- [ ] Delivery confirmation/acknowledgment and retry for outbound messages and webhooks
- [ ] Output access is authorized and scoped to the recipient
- [ ] Delivery timeliness is measured against specification

### P4.1 · Use of personal information

Suggested owner: Privacy / legal  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity limits the use of personal information to the purposes identified in its objectives.

- [ ] Purpose limitation enforced (purpose tags/access policies, not just documentation)
- [ ] No secondary use without basis (e.g., production PII in analytics, ML training, or marketing without consent)
- [ ] Data-use documented for pipelines and internal tools; internal access is justified and logged

### P6.2 · Records of authorized disclosures

Suggested owner: Privacy / legal  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity creates and retains a complete, accurate, and timely record of authorized disclosures of personal information.

- [ ] Disclosure events are logged (subject, recipient, data categories, purpose, timestamp, authorization basis)
- [ ] Records are retained per policy and queryable by data subject

### P6.4 · Third-party privacy commitments

Suggested owner: Privacy / legal  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity obtains privacy commitments from vendors and other third parties who have access to personal information.

- [ ] Vendor contracts/DPAs include privacy commitments
- [ ] Technical scopes limit vendor access to necessary data
- [ ] Vendor compliance is monitored (SOC reports, reviews)

### P6.7 · Accounting of personal information held and disclosed

Suggested owner: Privacy / legal  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity provides data subjects with an accounting of the personal information held and disclosure of the data subjects' personal information, upon the data subjects' request.

- [ ] DSAR output includes what is held (P5.1) and to whom it was disclosed (P6.2)
- [ ] Accounting can be produced within the response SLA

## Checks threesock did not verify

These criteria were scored on their automated checks. The rubric checks below still need human review before you can claim them.

**CC1.3 · Organizational structure** (scored 2 (Met))

- [ ] Service ownership recorded (service catalog, `catalog-info.yaml`, README owner section)
- [ ] Segregation of duties enforced: PR authors cannot approve their own changes; production deploy permission is distinct from write access
- [ ] Org chart, RACI, and job descriptions exist

**CC2.1 · Relevant, quality information** (scored 2 (Met))

- [ ] System/asset inventory maintained (services, datastores, third-party integrations)
- [ ] Vulnerability scan output retained and queryable
- [ ] Security metrics available (open vulns by severity, MTTR, patch age, coverage of MFA)

**CC2.2 · Internal communication** (scored 2 (Met))

- [ ] Alert routing (Slack/PagerDuty/email) defined as code or documented
- [ ] Security advisories/alerts (e.g., Dependabot, code scanning) route to the responsible team

**CC2.3 · External communication** (scored 2 (Met))

- [ ] Public privacy/security notices are current and linked in the product
- [ ] Incident notification templates for customers exist
- [ ] Status page configured; API documentation states auth and security requirements
- [ ] Vendor security requirements communicated

**CC3.2 · Risk identification and analysis** (scored 2 (Met))

- [ ] Vulnerability findings (SAST/SCA/IaC) are scored with a defined method (e.g., CVSS + exploitability + exposure)

**CC3.3 · Fraud risk** (scored 2 (Met))

- [ ] Privileged and financial actions require multi-party approval or step-up authentication
- [ ] Admin/impersonation actions are audit-logged with actor, target, and reason
- [ ] Management override is detectable (admins cannot bypass branch protection silently; bypass events are logged)
- [ ] Rate limiting and anomaly detection on credential-abuse and account-takeover vectors

**CC3.4 · Significant changes** (scored 2 (Met))

- [ ] Design review or ADR required for major architectural changes
- [ ] Major dependency/runtime upgrades are reviewed for security impact
- [ ] IaC changes to networking, IAM, or encryption require elevated review

**CC4.1 · Ongoing/separate evaluations** (scored 2 (Met))

- [ ] Container image scanning on build and on a schedule
- [ ] DAST or penetration test performed at least annually, and reports are retained
- [ ] Access reviews performed on a defined cadence (repo, cloud, prod data)
- [ ] Compliance-as-code checks (OPA/Conftest, Checkov, cloud config rules) run automatically

**CC4.2 · Deficiency communication and remediation** (scored 2 (Met))

- [ ] Findings automatically create tracked issues with owner and due date
- [ ] Escalation path exists for overdue findings

**CC5.1 · Control selection and design** (scored 2 (Met))

- [ ] Preventive controls exist as CI gates and policy-as-code, not only documented intent
- [ ] Compensating controls documented where a primary control is not feasible

**CC5.2 · Technology general controls** (scored 2 (Met))

- [ ] Centralized logging in place (see CC7)
- [ ] Encryption in transit and at rest configured (see CC6.7, C1.1)
- [ ] Endpoint management/EDR policy for developer machines

**CC5.3 · Policies and procedures** (scored 2 (Met))

- [ ] Policies are version-controlled with review history and effective dates
- [ ] Employee acknowledgments tracked

**CC6.1 · Logical access security** (scored 2 (Met))

- [ ] **Authentication:** SSO/OIDC/SAML supported for workforce and enterprise customers; MFA available and enforced for admins/privileged roles
- [ ] **Authorization:** Server-side RBAC/ABAC enforced on **every** endpoint and object access (no IDOR); deny by default; tenant isolation enforced in queries

**CC6.2 · Registration and authorization before access** (scored 2 (Met))

- [ ] Workforce access is provisioned through IdP/SCIM or an approved request workflow
- [ ] IAM/permission changes made via IaC with PR review and approval
- [ ] No default or shared credentials; service accounts have documented owners and purpose
- [ ] Role definitions documented and mapped to job function

**CC6.3 · Access removal and modification** (scored 2 (Met))

- [ ] SCIM/IdP deprovisioning propagates to the application
- [ ] Role changes take effect promptly (no long-lived cached elevated claims)
- [ ] Periodic access reviews identify and remove stale accounts, keys, and contractor access
- [ ] Machine credentials rotate on schedule and on personnel change

**CC6.5 · Secure disposal of assets** (scored 2 (Met))

- [ ] Decommissioned cloud resources (volumes, snapshots, buckets, DBs) are deleted via IaC/lifecycle rules
- [ ] Data-bearing resources have documented decommission steps and verification
- [ ] Device wipe/destruction records exist for endpoints and media

**CC6.6 · Protection against external threats** (scored 2 (Met))

- [ ] WAF or equivalent protection for public endpoints; DDoS protections available
- [ ] Admin access via VPN/bastion/zero-trust proxy, not the public internet

**CC6.7 · Protection of data in transmission** (scored 2 (Met))

- [ ] Secrets, tokens, and PII are never placed in URLs/query strings or logs
- [ ] Data exports/transfers use encrypted channels (SFTP, presigned URLs with short expiry)
- [ ] Controls exist to prevent unauthorized bulk export/exfiltration (e.g., egress rules, export permissions)

**CC6.8 · Malicious/unauthorized software** (scored 2 (Met))

- [ ] Build artifacts are signed or attested; provenance available (e.g., SLSA, Sigstore)
- [ ] Only approved GitHub Actions/CI plugins are allowed (allowlist or SHA-pinning)
- [ ] File-upload paths scan or sandbox untrusted files
- [ ] Endpoint protection/EDR on developer and production hosts

**CC7.1 · Detection of vulnerabilities and configuration changes** (scored 2 (Met))

- [ ] Security-relevant events are logged: authentication, authorization failures, privilege changes, admin actions, data export, config changes
- [ ] Logs are centralized and tamper-resistant

**CC7.2 · Monitoring for anomalies** (scored 2 (Met))

- [ ] Alerts route to an on-call owner with defined response expectations
- [ ] Logs are structured and include timestamp, actor, action, resource, outcome, and correlation ID
- [ ] Log retention meets policy (see 1.4); access to logs is restricted and audited

**CC7.3 · Security event evaluation** (scored 2 (Met))

- [ ] Alert-to-ticket automation exists
- [ ] Event evaluation outcomes are recorded (true/false positive, incident yes/no)

**CC7.4 · Incident response** (scored 2 (Met))

- [ ] Emergency capability: revoke keys, disable accounts, kill switches/feature flags, isolate services
- [ ] Incident tickets with timelines exist; postmortems completed with tracked corrective actions
- [ ] Response plan tested (tabletop or simulation) at least annually

**CC7.5 · Recovery from incidents** (scored 2 (Met))

- [ ] Infrastructure can be rebuilt from IaC; clean-room redeploy procedure documented
- [ ] Backup restore procedures documented (see A1.2, A1.3)
- [ ] Post-incident remediation is tracked to completion

**CC8.1 · Authorized, tested, approved changes** (scored 2 (Met))

- [ ] Production deploys occur only via the pipeline, with protected environment approvals; no manual production changes outside emergency procedure
- [ ] Changes are traceable: commit → PR → ticket → build → deployment, with logs retained
- [ ] Production credentials are not available on developer laptops or standing dev access; test and prod are separated
- [ ] Production data is not used in lower environments unless masked

**CC9.1 · Business disruption risk** (scored 2 (Met))

- [ ] Single points of failure identified and mitigated (multi-AZ, redundant components)
- [ ] Critical dependencies (cloud region, DNS, auth provider, payment provider) have documented fallback or degradation behavior
- [ ] Runbooks exist for regional/provider outages

**CC9.2 · Vendor and third-party risk** (scored 2 (Met))

- [ ] New dependencies and vendors require review before adoption
- [ ] Third-party credentials are least-privilege and scoped per vendor; rotation supported
- [ ] Data shared with each vendor is documented and minimized; data-flow diagrams cover vendors
- [ ] Webhook/callback authenticity verified; vendor SDKs pinned and scanned
- [ ] Vendor SOC reports, DPAs, security questionnaires, and annual reviews tracked

**A1.1 · Capacity management** (scored 2 (Met))

- [ ] Monitoring and alerting on CPU, memory, disk, network, queue depth, DB connections, and storage growth
- [ ] Back-pressure, timeouts, connection-pool limits, and rate limiting protect from overload
- [ ] Capacity reviews occur on a defined cadence

**A1.2 · Environmental protection, backup, and recovery infrastructure** (scored 2 (Met))

- [ ] Availability objectives (SLOs/SLAs) defined and monitored, with alerting on breach
- [ ] Environment is reproducible from IaC
- [ ] Physical/environmental controls inherited from provider with reports reviewed

**A1.3 · Recovery plan testing** (scored 2 (Met))

- [ ] DR/failover exercises performed, with results documented
- [ ] Failures during tests generate remediation tickets tracked to closure

**PI1.1 · Processing objectives and specifications** (scored 2 (Met))

- [ ] Data definitions/dictionary exist for key entities and calculations
- [ ] Service specifications and SLAs/SLOs documented and communicated to users

**PI1.2 · Input completeness and accuracy** (scored 2 (Met))

- [ ] Server-side validation (never client-only)
- [ ] Invalid input is rejected or quarantined with clear error handling; malformed records are not silently dropped
- [ ] Parameterized queries; safe file-upload validation (type, size, content)

**PI1.3 · Processing completeness, accuracy, timeliness, authorization** (scored 2 (Met))

- [ ] Idempotent handlers; safe retry with deduplication; concurrency control (optimistic locking/versioning)
- [ ] Authorization is re-checked at processing time, not only at intake
- [ ] Business-rule and calculation logic covered by automated tests, including edge cases (rounding, currency, time zones)
- [ ] Job/pipeline monitoring alerts on failure, lag, and stuck work

**PI1.5 · Storage completeness and accuracy** (scored 2 (Met))

- [ ] Audit trails/history for critical records; append-only or tamper-evident logs where required
- [ ] Checksums or hashes for stored files/artifacts where integrity matters
- [ ] Data retention rules implemented, including soft-delete semantics where needed
- [ ] Safe, tested migrations; backups verified (see A1)
- [ ] Data-integrity tests or reconciliation queries run on a schedule

**C1.1 · Identify and protect confidential information** (scored 2 (Met))

- [ ] Inventory/data map of confidential data locations, including logs, caches, analytics, backups, and vendors
- [ ] Field-level encryption or tokenization for the most sensitive fields
- [ ] Access to confidential data is least-privilege and audit-logged
- [ ] Protection against accidental deletion (versioning, deletion protection, backups)
- [ ] Confidentiality agreements with staff and vendors

**C1.2 · Dispose of confidential information** (scored 2 (Met))

- [ ] Deletion propagates to replicas, search indexes, caches, analytics stores, data warehouses, and vendors
- [ ] Backups age out per policy; cryptographic erasure used where feasible
- [ ] Deletion is verified and logged (job outputs, audit records)
- [ ] Media/device disposal records exist

**P1.1 · Privacy notice** (scored 2 (Met))

- [ ] Notice is current, versioned, and describes collection, use, retention, disclosure, and disposal
- [ ] Changes are communicated to affected users; prior versions are retained
- [ ] Notice matches actual behavior (compare against schema, analytics events, and third-party SDKs)

**P2.1 · Choice and consent** (scored 2 (Met))

- [ ] Consent captured with timestamp, policy/notice version, purpose, and channel
- [ ] Opt-in/opt-out and withdrawal mechanisms exist and are honored in code (analytics, marketing, sharing gates check consent state before executing)
- [ ] Re-consent triggered for new purposes or material changes
- [ ] Explicit consent for sensitive data and cross-border transfers where required

**P3.1 · Collection consistent with objectives** (scored 2 (Met))

- [ ] Data minimization: each collected field has a documented purpose
- [ ] Collected data matches what the notice says
- [ ] Third-party SDKs and analytics events reviewed for unintended PII collection
- [ ] Legal basis/purpose recorded where applicable

**P3.2 · Sensitive information** (scored 2 (Met))

- [ ] Sensitive categories identified (health, biometric, government ID, financial, precise location, children's data, etc.)
- [ ] Explicit consent obtained before collection
- [ ] Age-gating/parental-consent logic where minors' data is possible

**P4.2 · Retention of personal information** (scored 2 (Met))

- [ ] Retention schedule defined per data type
- [ ] Backup and log retention aligned with schedule
- [ ] Legal-hold process exists and is honored by purge jobs

**P4.3 · Disposal of personal information** (scored 2 (Met))

- [ ] Deletion cascades to all stores (primary, replicas, caches, search, warehouse, vendors, backups on expiry)
- [ ] Deletion is verified and audit-logged
- [ ] P4.1–P4.3 operate as one connected data-lifecycle control (use → retain → dispose)

**P5.1 · Data subject access** (scored 2 (Met))

- [ ] Requester identity is authenticated before disclosure; export is scoped to that subject only
- [ ] Machine-readable export format
- [ ] Export covers all stores holding the subject's data, including vendors
- [ ] Requests are tracked with response-time SLA and audit logs
- [ ] Endpoint is rate-limited and abuse-resistant

**P5.2 · Correction and amendment** (scored 2 (Met))

- [ ] Corrections propagate to downstream systems and relevant third parties
- [ ] Change history/audit trail retained; denials documented with rationale

**P6.1 · Authorized disclosure to third parties** (scored 2 (Met))

- [ ] Consent/authorization checked in code before sending PI to third parties
- [ ] Cross-border transfer mechanisms documented where applicable

**P6.3 · Records of unauthorized disclosures** (scored 2 (Met))

- [ ] Detection exists for likely exposure paths (public buckets, misdirected exports, log leakage, DLP)
- [ ] Records link to the incident-response process (CC7.3–CC7.4)

**P6.5 · Third-party notification of unauthorized disclosure** (scored 2 (Met))

- [ ] Contracts specify notification timelines

**P6.6 · Breach notification** (scored 2 (Met))

- [ ] Affected data subjects can be identified quickly through queries and tooling
- [ ] Contact data and notification tooling available for affected populations
- [ ] Notification decisions recorded

**P7.1 · Data quality** (scored 2 (Met))

- [ ] Users can review and update their own data
- [ ] Data-quality checks or stale-data flagging run on a schedule
- [ ] Irrelevant or unnecessary fields are removed

**P8.1 · Privacy inquiries, complaints, and disputes** (scored 2 (Met))

- [ ] Ticketed workflow with SLAs, investigation, resolution, and communication back to the requester
- [ ] Privacy reviews (PIA/DPIA) are part of the SDLC for new features handling PI
- [ ] Periodic privacy compliance monitoring; deficiencies feed corrective actions (CC4.2)

---

Generated by threesock 0.1.0 on 2026-01-15 · JSON schema 1.4.0
