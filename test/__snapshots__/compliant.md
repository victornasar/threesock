# threesock SOC 2 readiness report

> **Readiness aid, not an audit.** threesock is an engineering readiness aid, not an audit. SOC 2 is attested by a licensed CPA firm against your organization's system description and commitments. A codebase can only demonstrate part of the criteria; the rest (board oversight, HR, vendor contracts, physical security) must be evidenced outside the repo. Use this report to find gaps early, not to claim compliance.

```
Repository / System: <root>
Commit / Release:    uncommitted working tree
Assessor:            threesock <version> (automated)   Date: 2026-01-15
Scope:  [x] Security  [ ] Availability  [ ] Processing Integrity  [ ] Confidentiality  [ ] Privacy
Environment(s) reviewed: repository contents only (code, IaC, CI configuration)
```

## Summary

| Category | Assessable criteria | Points earned | Points possible | Readiness % | Band | MANUAL items open |
|---|---|---|---|---|---|---|
| Security | 8 | 16 | 16 | 100.0% | Audit-ready | 25 |
| Availability | — | — | — | not in scope | — | — |
| Processing Integrity | — | — | — | not in scope | — | — |
| Confidentiality | — | — | — | not in scope | — | — |
| Privacy | — | — | — | not in scope | — | — |

Open findings: 0 critical · 0 high · 0 medium · 0 low

Readiness counts assessable criteria only. MANUAL and N/A criteria are excluded from both sides of the ratio (rubric 1.1), so read it together with the number of criteria assessed.

## Scorecard (Appendix A)

| Criterion | Title | Score | Evidence | Finding ID | Owner | Notes |
|---|---|---|---|---|---|---|
| CC1.1 | Integrity and ethical values | MANUAL |  |  | Leadership and People Ops | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC1.2 | Board oversight | MANUAL |  |  | Board / executive leadership | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC1.3 | Organizational structure | 2 (Met) | `.github/CODEOWNERS:1` Catch-all rule assigns @compliant-org/engineering. |  |  | The automated check passed with evidence. |
| CC1.4 | Competence | MANUAL |  |  | Leadership and People Ops | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC1.5 | Accountability | MANUAL |  |  | Leadership and People Ops | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC2.1 | Relevant, quality information | MANUAL |  |  | Security lead | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC2.2 | Internal communication | MANUAL |  |  | Security lead | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC2.3 | External communication | 2 (Met) | `SECURITY.md:5` SECURITY.md gives a reporting channel. |  |  | The automated check passed with evidence. |
| CC3.1 | Suitable objectives | MANUAL |  |  | Security and risk owner | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC3.2 | Risk identification and analysis | MANUAL |  |  | Security and risk owner | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC3.3 | Fraud risk | MANUAL |  |  | Security and risk owner | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC3.4 | Significant changes | MANUAL |  |  | Security and risk owner | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC4.1 | Ongoing/separate evaluations | MANUAL |  |  | Security lead | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC4.2 | Deficiency communication and remediation | MANUAL |  |  | Security lead | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC5.1 | Control selection and design | MANUAL |  |  | Security / GRC | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC5.2 | Technology general controls | 2 (Met) | `.github/workflows/ci.yml` All actions are pinned to commit SHAs.<br>`.github/workflows/deploy.yml` All actions are pinned to commit SHAs.<br>`.github/workflows/deploy.yml:18` Cloud access uses OIDC role assumption.<br>+6 more |  |  | All 7 automated checks passed with evidence. |
| CC5.3 | Policies and procedures | MANUAL |  |  | Security / GRC | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC6.1 | Logical access security | 2 (Met) | `src/server.js:14` Cookie security flags are set explicitly.<br>`.gitignore:2` .gitignore excludes .env files (`.env`).<br>No .env files (other than templates) are present among 19 files.<br>+7 more |  |  | All 9 automated checks passed with evidence. |
| CC6.2 | Registration and authorization before access | MANUAL |  |  | Security and platform engineering | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC6.3 | Access removal and modification | MANUAL |  |  | Security and platform engineering | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC6.4 | Physical access | MANUAL |  |  | IT and facilities (inherit from cloud provider SOC 2 report) | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC6.5 | Secure disposal of assets | MANUAL |  |  | Security and platform engineering | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC6.6 | Protection against external threats | 2 (Met) | `src/server.js` CORS configuration does not combine a wildcard origin with credentials.<br>Checked 4 files (JS/TS, Python, Go source and related config); no dynamic code execution, shell-string commands or unsafe deserialization.<br>`infra/main.tf:11` aws_security_group.web exposes no admin or data ports to the internet (detected by threesock's lightweight Terraform scanner).<br>+6 more |  |  | All 8 automated checks passed with evidence. |
| CC6.7 | Protection of data in transmission | 2 (Met) | Checked 8 files; no plain http:// URLs to non-local hosts.<br>Checked 7 files (JS/TS, Python, Go source and related config); certificate verification is never disabled.<br>Checked 5 files; no TLS below 1.2 and no legacy ciphers found. |  |  | All 3 automated checks passed with evidence. |
| CC6.8 | Malicious/unauthorized software | 2 (Met) | `Dockerfile:1` node:22.11.0-bookworm-slim is pinned by digest.<br>`.github/workflows/ci.yml:25` A container image scanner runs in CI.<br>Checked 3 build files; no remote scripts piped to a shell.<br>+4 more |  |  | All 6 automated checks passed with evidence. |
| CC7.1 | Detection of vulnerabilities and configuration changes | MANUAL |  |  | SRE / security operations | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC7.2 | Monitoring for anomalies | MANUAL |  |  | SRE / security operations | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC7.3 | Security event evaluation | MANUAL |  |  | SRE / security operations | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC7.4 | Incident response | MANUAL |  |  | SRE / security operations | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC7.5 | Recovery from incidents | MANUAL |  |  | SRE / security operations | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC8.1 | Authorized, tested, approved changes | 2 (Met) | `.github/workflows/ci.yml:15` Tests run on every pull request.<br>`.github/workflows/ci.yml:14` Lint runs on every pull request.<br>`.github/CODEOWNERS` All 7 sensitive files have a specific code owner.<br>+4 more |  |  | All 6 automated checks passed with evidence. |
| CC9.1 | Business disruption risk | MANUAL |  |  | SRE / business continuity owner | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC9.2 | Vendor and third-party risk | MANUAL |  |  | Vendor management / procurement | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| A1.1 | Capacity management | N/A |  |  |  | Category not in scope for this scan. |
| A1.2 | Environmental protection, backup, and recovery infrastructure | N/A |  |  |  | Category not in scope for this scan. |
| A1.3 | Recovery plan testing | N/A |  |  |  | Category not in scope for this scan. |
| PI1.1 | Processing objectives and specifications | N/A |  |  |  | Category not in scope for this scan. |
| PI1.2 | Input completeness and accuracy | N/A |  |  |  | Category not in scope for this scan. |
| PI1.3 | Processing completeness, accuracy, timeliness, authorization | N/A |  |  |  | Category not in scope for this scan. |
| PI1.4 | Output completeness, accuracy, timeliness | N/A |  |  |  | Category not in scope for this scan. |
| PI1.5 | Storage completeness and accuracy | N/A |  |  |  | Category not in scope for this scan. |
| C1.1 | Identify and protect confidential information | N/A |  |  |  | Category not in scope for this scan. |
| C1.2 | Dispose of confidential information | N/A |  |  |  | Category not in scope for this scan. |
| P1.1 | Privacy notice | N/A |  |  |  | Category not in scope for this scan. |
| P2.1 | Choice and consent | N/A |  |  |  | Category not in scope for this scan. |
| P3.1 | Collection consistent with objectives | N/A |  |  |  | Category not in scope for this scan. |
| P3.2 | Sensitive information | N/A |  |  |  | Category not in scope for this scan. |
| P4.1 | Use of personal information | N/A |  |  |  | Category not in scope for this scan. |
| P4.2 | Retention of personal information | N/A |  |  |  | Category not in scope for this scan. |
| P4.3 | Disposal of personal information | N/A |  |  |  | Category not in scope for this scan. |
| P5.1 | Data subject access | N/A |  |  |  | Category not in scope for this scan. |
| P5.2 | Correction and amendment | N/A |  |  |  | Category not in scope for this scan. |
| P6.1 | Authorized disclosure to third parties | N/A |  |  |  | Category not in scope for this scan. |
| P6.2 | Records of authorized disclosures | N/A |  |  |  | Category not in scope for this scan. |
| P6.3 | Records of unauthorized disclosures | N/A |  |  |  | Category not in scope for this scan. |
| P6.4 | Third-party privacy commitments | N/A |  |  |  | Category not in scope for this scan. |
| P6.5 | Third-party notification of unauthorized disclosure | N/A |  |  |  | Category not in scope for this scan. |
| P6.6 | Breach notification | N/A |  |  |  | Category not in scope for this scan. |
| P6.7 | Accounting of personal information held and disclosed | N/A |  |  |  | Category not in scope for this scan. |
| P7.1 | Data quality | N/A |  |  |  | Category not in scope for this scan. |
| P8.1 | Privacy inquiries, complaints, and disputes | N/A |  |  |  | Category not in scope for this scan. |

## Findings (Appendix B)

Socks on. No gaps found in this scope.

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
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: Individuals are held accountable for internal-control responsibilities.

- [ ] Every change is attributable to an individual (no shared accounts; signed commits or SSO-linked identities)
- [ ] Control owners named for each control in documentation
- [ ] Escalation paths documented in runbooks
- [ ] Performance objectives and disciplinary process reference security duties

### CC2.1 · Relevant, quality information

Suggested owner: Security lead  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The organization obtains or generates relevant, quality information to operate internal controls.

- [ ] System/asset inventory maintained (services, datastores, third-party integrations)
- [ ] SBOM generated in CI or on release
- [ ] Vulnerability scan output retained and queryable
- [ ] Security metrics available (open vulns by severity, MTTR, patch age, coverage of MFA)
- [ ] Dashboards/alerts defined as code

Evidence to collect: SBOM artifacts, scan reports, dashboards.

### CC2.2 · Internal communication

Suggested owner: Security lead  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: Relevant information is communicated internally.

- [ ] Security policies and runbooks are discoverable in-repo or linked from the README
- [ ] PR template includes a security-impact section or checklist
- [ ] Alert routing (Slack/PagerDuty/email) defined as code or documented
- [ ] Security advisories/alerts (e.g., Dependabot, code scanning) route to the responsible team

### CC3.1 · Suitable objectives

Suggested owner: Security and risk owner  
Why manual: The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only.

Requirement: The organization specifies objectives clearly enough to identify and assess risks.

- [ ] Security, availability, and data-handling objectives documented (README, architecture docs, SLOs)
- [ ] Data-flow diagrams and trust boundaries documented

### CC3.2 · Risk identification and analysis

Suggested owner: Security and risk owner  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The organization identifies and analyzes risks to achieving its objectives.

- [ ] Threat models exist for critical services and are updated with major changes
- [ ] Risk register exists and links to issues/tickets
- [ ] Vulnerability findings (SAST/SCA/IaC) are scored with a defined method (e.g., CVSS + exploitability + exposure)
- [ ] ADRs record security considerations for architectural decisions

Evidence to collect: Threat models, risk register, scored scan results.

### CC3.3 · Fraud risk

Suggested owner: Security and risk owner  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The organization considers the potential for fraud.

- [ ] Privileged and financial actions require multi-party approval or step-up authentication
- [ ] Admin/impersonation actions are audit-logged with actor, target, and reason
- [ ] No backdoor accounts, hard-coded admin credentials, or "debug bypass" flags active in production code paths
- [ ] Management override is detectable (admins cannot bypass branch protection silently; bypass events are logged)
- [ ] Rate limiting and anomaly detection on credential-abuse and account-takeover vectors

### CC3.4 · Significant changes

Suggested owner: Security and risk owner  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The organization identifies and assesses changes that could significantly affect internal controls.

- [ ] Design review or ADR required for major architectural changes
- [ ] Adding a new third-party service, SDK, or datastore triggers a review (documented in PR template or CODEOWNERS on manifests)
- [ ] Major dependency/runtime upgrades are reviewed for security impact
- [ ] IaC changes to networking, IAM, or encryption require elevated review

### CC4.1 · Ongoing/separate evaluations

Suggested owner: Security lead  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The organization performs ongoing and/or separate evaluations of internal controls.

- [ ] CI runs SAST (e.g., CodeQL/Semgrep), SCA/dependency scanning, secret scanning, and IaC scanning on every PR
- [ ] Container image scanning on build and on a schedule
- [ ] Scheduled (cron) scans for the default branch, not just PR-triggered
- [ ] DAST or penetration test performed at least annually, and reports are retained
- [ ] Access reviews performed on a defined cadence (repo, cloud, prod data)
- [ ] Compliance-as-code checks (OPA/Conftest, Checkov, cloud config rules) run automatically

### CC4.2 · Deficiency communication and remediation

Suggested owner: Security lead  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: Deficiencies are communicated to responsible parties and remediated in a timely manner.

- [ ] Findings automatically create tracked issues with owner and due date
- [ ] Remediation SLAs are defined and measured (see 1.4)
- [ ] CI blocks merge or release on Critical/High findings (or documented, time-boxed exception)
- [ ] Exceptions require approver, justification, and expiry date
- [ ] Escalation path exists for overdue findings

### CC5.1 · Control selection and design

Suggested owner: Security / GRC  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The organization selects and develops control activities that mitigate risks to acceptable levels.

- [ ] Controls are mapped to identified risks (control matrix)
- [ ] Preventive controls exist as CI gates and policy-as-code, not only documented intent
- [ ] Compensating controls documented where a primary control is not feasible

### CC5.3 · Policies and procedures

Suggested owner: Security / GRC  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The organization deploys control activities through policies that establish expectations and procedures that put them into action.

- [ ] Policies are version-controlled with review history and effective dates
- [ ] Procedures/runbooks exist for onboarding, offboarding, deployment, rollback, incident response, key rotation, and access reviews
- [ ] Policies are reviewed at least annually, with approver recorded
- [ ] Employee acknowledgments tracked

### CC6.2 · Registration and authorization before access

Suggested owner: Security and platform engineering  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: Prior to issuing credentials, the entity registers and authorizes new users.

- [ ] Workforce access is provisioned through IdP/SCIM or an approved request workflow
- [ ] IAM/permission changes made via IaC with PR review and approval
- [ ] Customer-user registration verifies identity (email/domain verification, invite flows) and cannot self-assign privileged roles
- [ ] No default or shared credentials; service accounts have documented owners and purpose
- [ ] Role definitions documented and mapped to job function

### CC6.3 · Access removal and modification

Suggested owner: Security and platform engineering  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity authorizes, modifies, or removes access based on roles, responsibilities, or system design.

- [ ] Offboarding procedure revokes SSO, VCS, cloud, CI/CD, and vendor access, with an SLA (≤ 24h)
- [ ] SCIM/IdP deprovisioning propagates to the application
- [ ] Role changes take effect promptly (no long-lived cached elevated claims)
- [ ] Tokens, API keys, sessions, and deploy keys are revocable; revocation is enforced in code
- [ ] Periodic access reviews identify and remove stale accounts, keys, and contractor access
- [ ] Machine credentials rotate on schedule and on personnel change

### CC6.4 · Physical access

Suggested owner: IT and facilities (inherit from cloud provider SOC 2 report)  
Why manual: The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only.

Requirement: The entity restricts physical access to facilities and protected information assets.

- [ ] Production runs in providers with current SOC 2 reports (carve-out/inherited controls documented)
- [ ] No on-premises or colo infrastructure defined in IaC unless separately assessed

### CC6.5 · Secure disposal of assets

Suggested owner: Security and platform engineering  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity discontinues logical and physical protections over assets only after the ability to read or recover data has been diminished.

- [ ] Decommissioned cloud resources (volumes, snapshots, buckets, DBs) are deleted via IaC/lifecycle rules
- [ ] Storage is encrypted so that key destruction renders data unrecoverable (crypto-shredding)
- [ ] Data-bearing resources have documented decommission steps and verification
- [ ] Device wipe/destruction records exist for endpoints and media

### CC7.1 · Detection of vulnerabilities and configuration changes

Suggested owner: SRE / security operations  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity uses detection and monitoring procedures to identify changes to configurations that introduce vulnerabilities, and susceptibilities to newly discovered vulnerabilities.

- [ ] Vulnerability scanning of code, dependencies, images, and infrastructure is continuous or scheduled
- [ ] Infrastructure drift detection (e.g., `terraform plan` scheduled, cloud config monitoring)
- [ ] Hardened baseline configurations defined for hosts/containers/clusters
- [ ] Security-relevant events are logged: authentication, authorization failures, privilege changes, admin actions, data export, config changes
- [ ] Logs are centralized and tamper-resistant

### CC7.2 · Monitoring for anomalies

Suggested owner: SRE / security operations  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity monitors system components for anomalies that are indicative of malicious acts, natural disasters, and errors.

- [ ] Alert rules exist for failed-login spikes, privilege escalation, unusual data access/volume, error-rate spikes, and infrastructure anomalies
- [ ] Alerts route to an on-call owner with defined response expectations
- [ ] Logs are structured and include timestamp, actor, action, resource, outcome, and correlation ID
- [ ] **No secrets, credentials, full card numbers, or unnecessary PII in logs**
- [ ] Log retention meets policy (see 1.4); access to logs is restricted and audited

### CC7.3 · Security event evaluation

Suggested owner: SRE / security operations  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity evaluates security events to determine whether they could or have resulted in a failure to meet objectives (security incidents).

- [ ] Severity classification/triage criteria documented
- [ ] Alert-to-ticket automation exists
- [ ] Event evaluation outcomes are recorded (true/false positive, incident yes/no)

### CC7.4 · Incident response

Suggested owner: SRE / security operations  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity responds to identified security incidents by executing a defined incident-response program.

- [ ] Incident response plan exists with roles, severity levels, communication plans, and escalation paths
- [ ] Runbooks exist for common scenarios (credential leak, data exposure, compromised dependency, DDoS)
- [ ] Emergency capability: revoke keys, disable accounts, kill switches/feature flags, isolate services
- [ ] Incident tickets with timelines exist; postmortems completed with tracked corrective actions
- [ ] Response plan tested (tabletop or simulation) at least annually

### CC7.5 · Recovery from incidents

Suggested owner: SRE / security operations  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity identifies, develops, and implements activities to recover from identified security incidents.

- [ ] Infrastructure can be rebuilt from IaC; clean-room redeploy procedure documented
- [ ] Secret and credential rotation procedure exists and is exercised
- [ ] Backup restore procedures documented (see A1.2, A1.3)
- [ ] Post-incident remediation is tracked to completion

### CC9.1 · Business disruption risk

Suggested owner: SRE / business continuity owner  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.

- [ ] Business continuity and disaster recovery plans exist and cover this system
- [ ] Single points of failure identified and mitigated (multi-AZ, redundant components)
- [ ] Critical dependencies (cloud region, DNS, auth provider, payment provider) have documented fallback or degradation behavior
- [ ] Runbooks exist for regional/provider outages

### CC9.2 · Vendor and third-party risk

Suggested owner: Vendor management / procurement  
Why manual: threesock has no automated checks for this criterion yet. Gather evidence manually.

Requirement: The entity assesses and manages risks associated with vendors and business partners.

- [ ] Inventory of third-party services, SDKs, APIs, and open-source dependencies (SBOM + integrations list)
- [ ] New dependencies and vendors require review before adoption
- [ ] Third-party credentials are least-privilege and scoped per vendor; rotation supported
- [ ] Data shared with each vendor is documented and minimized; data-flow diagrams cover vendors
- [ ] Webhook/callback authenticity verified; vendor SDKs pinned and scanned
- [ ] Vendor SOC reports, DPAs, security questionnaires, and annual reviews tracked

## Checks threesock did not verify

These criteria were scored on their automated checks. The rubric checks below still need human review before you can claim them.

**CC1.3 · Organizational structure** (scored 2 (Met))

- [ ] Service ownership recorded (service catalog, `catalog-info.yaml`, README owner section)
- [ ] Segregation of duties enforced: PR authors cannot approve their own changes; production deploy permission is distinct from write access
- [ ] Org chart, RACI, and job descriptions exist

**CC2.3 · External communication** (scored 2 (Met))

- [ ] Public privacy/security notices are current and linked in the product
- [ ] Incident notification templates for customers exist
- [ ] Status page configured; API documentation states auth and security requirements
- [ ] Vendor security requirements communicated

**CC5.2 · Technology general controls** (scored 2 (Met))

- [ ] SSO/MFA enforced on source control, cloud console, CI/CD, and production tooling
- [ ] Centralized logging in place (see CC7)
- [ ] Encryption in transit and at rest configured (see CC6.7, C1.1)
- [ ] Endpoint management/EDR policy for developer machines

**CC6.1 · Logical access security** (scored 2 (Met))

- [ ] **Authentication:** SSO/OIDC/SAML supported for workforce and enterprise customers; MFA available and enforced for admins/privileged roles
- [ ] **Authorization:** Server-side RBAC/ABAC enforced on **every** endpoint and object access (no IDOR); deny by default; tenant isolation enforced in queries

**CC6.6 · Protection against external threats** (scored 2 (Met))

- [ ] WAF or equivalent protection for public endpoints; DDoS protections available
- [ ] Admin access via VPN/bastion/zero-trust proxy, not the public internet

**CC6.7 · Protection of data in transmission** (scored 2 (Met))

- [ ] Webhooks and callbacks are signed and verified
- [ ] Secrets, tokens, and PII are never placed in URLs/query strings or logs
- [ ] Data exports/transfers use encrypted channels (SFTP, presigned URLs with short expiry)
- [ ] Controls exist to prevent unauthorized bulk export/exfiltration (e.g., egress rules, export permissions)

**CC6.8 · Malicious/unauthorized software** (scored 2 (Met))

- [ ] Build artifacts are signed or attested; provenance available (e.g., SLSA, Sigstore)
- [ ] Only approved GitHub Actions/CI plugins are allowed (allowlist or SHA-pinning)
- [ ] File-upload paths scan or sandbox untrusted files
- [ ] Endpoint protection/EDR on developer and production hosts

**CC8.1 · Authorized, tested, approved changes** (scored 2 (Met))

- [ ] **Branch protection** on default and release branches: PR required; ≥ 1 approving review from someone other than the author; stale approvals dismissed; required status checks; conversation resolution; force-push and deletion disabled
- [ ] **Admins are not exempt** from protection, or bypass is logged and reviewed
- [ ] Production deploys occur only via the pipeline, with protected environment approvals; no manual production changes outside emergency procedure
- [ ] Changes are traceable: commit → PR → ticket → build → deployment, with logs retained
- [ ] Production credentials are not available on developer laptops or standing dev access; test and prod are separated
- [ ] Production data is not used in lower environments unless masked

---

Generated by threesock 0.1.0 on 2026-01-15 · JSON schema 1.0.0
