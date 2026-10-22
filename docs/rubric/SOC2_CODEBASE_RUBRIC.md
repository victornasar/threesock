# SOC 2 Codebase Compliance Rubric

A per-repository readiness rubric covering all 61 SOC 2 Trust Services Criteria (TSC): 33 Security (Common Criteria), 3 Availability, 5 Processing Integrity, 2 Confidentiality, and 18 Privacy.

> **Disclaimer:** This is an engineering readiness aid, not an audit. SOC 2 is attested by a licensed CPA firm against your organization's system description and commitments. A codebase can only demonstrate part of the criteria; the rest (board oversight, HR, vendor contracts, physical security) must be evidenced outside the repo. Use this rubric to find gaps early, not to claim compliance.

---

## 1. How to Use This Rubric

1. **Set scope.** Fill in the header in [Appendix A](#appendix-a--scorecard-template). Mark which optional categories apply (Availability, Processing Integrity, Confidentiality, Privacy). Security is always required.
2. **Walk each in-scope criterion.** For every criterion, work through the **Checks** list against the repository, its IaC, its CI/CD configuration, and its repo/org settings.
3. **Score each criterion** using the scale below and record evidence (file paths, PR links, config screenshots, CI run URLs).
4. **Log findings** using [Appendix B](#appendix-b--finding-template) and assign a severity.
5. **Roll up** category scores and repeat at least quarterly, and after any significant architecture change.

This file works for humans and for AI agents. If you point an agent at a repo, tell it to score every criterion, cite file paths for each check, and never mark a check as met without evidence.

### 1.1 Scoring Scale

| Score | Label | Meaning |
|-------|-------|---------|
| **2** | Met | All checks satisfied, with evidence. |
| **1** | Partial | Some checks satisfied, or control exists but is inconsistently applied or undocumented. |
| **0** | Not Met | Control absent, or a red flag is present. |
| **N/A** | Not Applicable | Category out of scope, or criterion genuinely does not apply (justify in writing). |
| **MANUAL** | Manual Evidence | Cannot be assessed from code; assign an owner and track evidence in your GRC tool. |

**Category readiness** = (sum of scores on assessable criteria) ÷ (2 × number of assessable criteria). Exclude N/A and MANUAL from both sides.

| Readiness | Interpretation |
|-----------|----------------|
| 90–100% | Audit-ready from a codebase perspective |
| 75–89% | Minor gaps; remediate before audit window |
| 50–74% | Significant gaps; remediation plan required |
| < 50% | Not ready |

**Automatic caps:** Any open **Critical** finding caps the affected criterion at score 0 and the category at "Significant gaps" until resolved.

### 1.2 Applicability Tags

| Tag | Where the evidence lives |
|-----|--------------------------|
| `CODE` | Application source code |
| `CONFIG` | IaC, CI/CD pipelines, repo/org settings, cloud configuration |
| `DOCS` | Policies, runbooks, ADRs, and specs stored in or linked from the repo |
| `ORG` | Organizational evidence outside the repo (HR, legal, board, vendor management) |

Criteria tagged only `ORG` default to **MANUAL**. The "Repo signals" listed for them are optional supporting evidence.

### 1.3 Finding Severity

| Severity | Definition | Example | Target remediation |
|----------|------------|---------|--------------------|
| **Critical** | Direct exposure of data/systems or complete control bypass | Hard-coded production secret; public database; auth bypass; unauthenticated admin endpoint | Immediately (≤ 24h) |
| **High** | Control absent or ineffective for a required area | No branch protection on prod repo; no MFA for admins; no encryption at rest for sensitive data | ≤ 30 days |
| **Medium** | Control exists but is inconsistent or undocumented | Review required but admins can bypass; backups exist but never restore-tested | ≤ 90 days |
| **Low** | Hygiene or documentation gap | Outdated runbook; missing CODEOWNERS for a non-sensitive path | Next planning cycle |

### 1.4 Configurable Thresholds

Adjust these defaults to match your own policies. Score against **your documented policy**, and treat a missing policy as a gap.

| Parameter | Default |
|-----------|---------|
| Required PR approvals for protected branches | ≥ 1 (≥ 2 for security-sensitive paths) |
| Vulnerability remediation SLA | Critical 7d · High 30d · Medium 90d · Low 180d |
| Minimum TLS version | 1.2 (prefer 1.3) |
| Password hashing | Argon2id, bcrypt, or scrypt |
| Minimum password length (if passwords used) | 12 characters |
| Access review frequency | Quarterly (privileged), semi-annual (all) |
| Log retention | ≥ 12 months (≥ 90 days hot/searchable) |
| Backup restore test frequency | Quarterly (critical systems) |
| Secret rotation | ≤ 90 days, or on exposure or personnel change |
| DSAR response time | ≤ 30 days |
| Breach notification internal escalation | ≤ 24 hours |

---

## 2. Coverage Summary

| Category | Criteria | Count | Required? | Typical code assessability |
|----------|----------|-------|-----------|----------------------------|
| Security / Common Criteria | CC1.1–CC9.2 | 33 | **Yes** | Mixed (CC6, CC7, CC8 high; CC1–CC4 mostly org) |
| Availability | A1.1–A1.3 | 3 | Optional | High |
| Processing Integrity | PI1.1–PI1.5 | 5 | Optional | High |
| Confidentiality | C1.1–C1.2 | 2 | Optional | High |
| Privacy | P1.1–P8.1 | 18 | Optional | Medium |
| **Total** | | **61** | | |

---

# PART 1 — SECURITY (Common Criteria)

## CC1 — Control Environment

### CC1.1 — Integrity and ethical values `ORG` `DOCS`
**Requirement:** The organization demonstrates a commitment to integrity and ethical values.
**Repo signals:**
- [ ] Code of conduct / ethics policy exists and is linked from the handbook or repo
- [ ] `SECURITY.md` or equivalent gives a reporting channel for security and ethics concerns
- [ ] Employee/contractor acknowledgment of policies is tracked (HRIS/GRC)
- [ ] Whistleblower mechanism, disciplinary procedure, and background screening documented

**Evidence:** Signed acknowledgments, policy documents, screening records. Default: **MANUAL**.

### CC1.2 — Board oversight `ORG`
**Requirement:** The governing body independently oversees internal controls.
**Evidence:** Board/management meeting minutes, security and risk reports, audit committee materials. Default: **MANUAL**. No code checks apply.

### CC1.3 — Organizational structure `CONFIG` `DOCS` `ORG`
**Requirement:** Management establishes structures, reporting lines, authority, and responsibility.
**Checks:**
- [ ] `CODEOWNERS` (or equivalent) assigns owners for every directory, with named teams on security-sensitive paths (auth, IAM, crypto, payments, infra)
- [ ] Service ownership recorded (service catalog, `catalog-info.yaml`, README owner section)
- [ ] Segregation of duties enforced: PR authors cannot approve their own changes; production deploy permission is distinct from write access
- [ ] Org chart, RACI, and job descriptions exist (`ORG`)

**Red flags:** Orphaned services; single person with unreviewed merge + deploy rights.
**Evidence:** CODEOWNERS file, branch protection settings, RACI.

### CC1.4 — Competence `DOCS` `ORG`
**Requirement:** The organization attracts, develops, and retains competent personnel.
**Repo signals:**
- [ ] Secure coding guidelines and onboarding docs exist
- [ ] Contribution guide covers security expectations (dependency policy, secret handling, review standards)
- [ ] Training completion records tracked (`ORG`)

**Evidence:** Training records, role qualification documents. Default: **MANUAL**.

### CC1.5 — Accountability `CONFIG` `DOCS` `ORG`
**Requirement:** Individuals are held accountable for internal-control responsibilities.
**Checks:**
- [ ] Every change is attributable to an individual (no shared accounts; signed commits or SSO-linked identities)
- [ ] Control owners named for each control in documentation
- [ ] Escalation paths documented in runbooks
- [ ] Performance objectives and disciplinary process reference security duties (`ORG`)

**Red flags:** Shared admin logins; service accounts used by humans; commits from unattributable identities.

---

## CC2 — Communication and Information

### CC2.1 — Relevant, quality information `CONFIG` `CODE`
**Requirement:** The organization obtains or generates relevant, quality information to operate internal controls.
**Checks:**
- [ ] System/asset inventory maintained (services, datastores, third-party integrations)
- [ ] SBOM generated in CI or on release
- [ ] Vulnerability scan output retained and queryable
- [ ] Security metrics available (open vulns by severity, MTTR, patch age, coverage of MFA)
- [ ] Dashboards/alerts defined as code

**Evidence:** SBOM artifacts, scan reports, dashboards.

### CC2.2 — Internal communication `DOCS` `CONFIG`
**Requirement:** Relevant information is communicated internally.
**Checks:**
- [ ] Security policies and runbooks are discoverable in-repo or linked from the README
- [ ] PR template includes a security-impact section or checklist
- [ ] Alert routing (Slack/PagerDuty/email) defined as code or documented
- [ ] Security advisories/alerts (e.g., Dependabot, code scanning) route to the responsible team

### CC2.3 — External communication `DOCS` `CODE` `ORG`
**Requirement:** Relevant information is communicated to external parties.
**Checks:**
- [ ] Vulnerability disclosure policy (`SECURITY.md`, `/.well-known/security.txt`)
- [ ] Public privacy/security notices are current and linked in the product
- [ ] Incident notification templates for customers exist
- [ ] Status page configured; API documentation states auth and security requirements
- [ ] Vendor security requirements communicated (`ORG`)

---

## CC3 — Risk Assessment

### CC3.1 — Suitable objectives `DOCS` `ORG`
**Requirement:** The organization specifies objectives clearly enough to identify and assess risks.
**Repo signals:**
- [ ] Security, availability, and data-handling objectives documented (README, architecture docs, SLOs)
- [ ] Data-flow diagrams and trust boundaries documented

**Default: MANUAL** for formal objective-setting.

### CC3.2 — Risk identification and analysis `DOCS` `CONFIG`
**Requirement:** The organization identifies and analyzes risks to achieving its objectives.
**Checks:**
- [ ] Threat models exist for critical services and are updated with major changes
- [ ] Risk register exists and links to issues/tickets
- [ ] Vulnerability findings (SAST/SCA/IaC) are scored with a defined method (e.g., CVSS + exploitability + exposure)
- [ ] ADRs record security considerations for architectural decisions

**Evidence:** Threat models, risk register, scored scan results.

### CC3.3 — Fraud risk `CODE` `CONFIG`
**Requirement:** The organization considers the potential for fraud.
**Checks:**
- [ ] Privileged and financial actions require multi-party approval or step-up authentication
- [ ] Admin/impersonation actions are audit-logged with actor, target, and reason
- [ ] No backdoor accounts, hard-coded admin credentials, or "debug bypass" flags active in production code paths
- [ ] Management override is detectable (admins cannot bypass branch protection silently; bypass events are logged)
- [ ] Rate limiting and anomaly detection on credential-abuse and account-takeover vectors

**Red flags:** `if (user == "admin")` bypasses; feature flags that disable auth; unlogged support impersonation.

### CC3.4 — Significant changes `DOCS` `CONFIG`
**Requirement:** The organization identifies and assesses changes that could significantly affect internal controls.
**Checks:**
- [ ] Design review or ADR required for major architectural changes
- [ ] Adding a new third-party service, SDK, or datastore triggers a review (documented in PR template or CODEOWNERS on manifests)
- [ ] Major dependency/runtime upgrades are reviewed for security impact
- [ ] IaC changes to networking, IAM, or encryption require elevated review

---

## CC4 — Monitoring Activities

### CC4.1 — Ongoing/separate evaluations `CONFIG`
**Requirement:** The organization performs ongoing and/or separate evaluations of internal controls.
**Checks:**
- [ ] CI runs SAST (e.g., CodeQL/Semgrep), SCA/dependency scanning, secret scanning, and IaC scanning on every PR
- [ ] Container image scanning on build and on a schedule
- [ ] Scheduled (cron) scans for the default branch, not just PR-triggered
- [ ] DAST or penetration test performed at least annually, and reports are retained
- [ ] Access reviews performed on a defined cadence (repo, cloud, prod data)
- [ ] Compliance-as-code checks (OPA/Conftest, Checkov, cloud config rules) run automatically

**Red flags:** Scanners configured but set to non-blocking with no triage; scans disabled on legacy repos.

### CC4.2 — Deficiency communication and remediation `CONFIG` `DOCS`
**Requirement:** Deficiencies are communicated to responsible parties and remediated in a timely manner.
**Checks:**
- [ ] Findings automatically create tracked issues with owner and due date
- [ ] Remediation SLAs are defined and measured (see 1.4)
- [ ] CI blocks merge or release on Critical/High findings (or documented, time-boxed exception)
- [ ] Exceptions require approver, justification, and expiry date
- [ ] Escalation path exists for overdue findings

**Red flags:** Aged Critical/High alerts; blanket suppressions (`# nosec`, `// eslint-disable`, `.trivyignore`) with no justification.

---

## CC5 — Control Activities

### CC5.1 — Control selection and design `DOCS` `CONFIG`
**Requirement:** The organization selects and develops control activities that mitigate risks to acceptable levels.
**Checks:**
- [ ] Controls are mapped to identified risks (control matrix)
- [ ] Preventive controls exist as CI gates and policy-as-code, not only documented intent
- [ ] Compensating controls documented where a primary control is not feasible

### CC5.2 — Technology general controls `CODE` `CONFIG`
**Requirement:** The organization selects and develops general control activities over technology.
**Checks:**
- [ ] SSO/MFA enforced on source control, cloud console, CI/CD, and production tooling
- [ ] Centralized logging in place (see CC7)
- [ ] Encryption in transit and at rest configured (see CC6.7, C1.1)
- [ ] Endpoint management/EDR policy for developer machines (`ORG`)
- [ ] CI/CD hardened: least-privilege pipeline tokens; OIDC federation instead of long-lived cloud keys; third-party actions pinned to commit SHAs; protected environments with required reviewers for production; no secrets echoed in logs

**Red flags:** `pull_request_target` with untrusted checkout; `permissions: write-all`; long-lived AWS/GCP keys in CI variables.

### CC5.3 — Policies and procedures `DOCS`
**Requirement:** The organization deploys control activities through policies that establish expectations and procedures that put them into action.
**Checks:**
- [ ] Policies are version-controlled with review history and effective dates
- [ ] Procedures/runbooks exist for onboarding, offboarding, deployment, rollback, incident response, key rotation, and access reviews
- [ ] Policies are reviewed at least annually, with approver recorded
- [ ] Employee acknowledgments tracked (`ORG`)

---

## CC6 — Logical and Physical Access Controls

### CC6.1 — Logical access security `CODE` `CONFIG`
**Requirement:** The entity implements logical access security software, infrastructure, and architectures to protect information assets.
**Checks:**
- [ ] **Authentication:** SSO/OIDC/SAML supported for workforce and enterprise customers; MFA available and enforced for admins/privileged roles
- [ ] **Credentials:** Passwords hashed with Argon2id/bcrypt/scrypt; no plaintext or reversible storage; breached-password and length checks; account lockout or throttling
- [ ] **Sessions/tokens:** Cookies are `HttpOnly`, `Secure`, `SameSite`; sessions expire and are invalidated on logout/password change; JWTs are signed with strong algorithms, validated (`alg`, `exp`, `aud`, `iss`), and short-lived
- [ ] **Authorization:** Server-side RBAC/ABAC enforced on **every** endpoint and object access (no IDOR); deny by default; tenant isolation enforced in queries
- [ ] **Least privilege:** IAM roles/policies avoid `*` actions and resources; DB users are scoped per service; service-to-service auth (mTLS/tokens) in place
- [ ] **Secrets:** No secrets in source, config files, images, or history; a secrets manager is used; secret scanning with push protection enabled
- [ ] **Data stores** are not publicly reachable and require authentication

**Red flags:** Hard-coded credentials/API keys; client-side-only authorization; wildcard IAM; default passwords; unauthenticated admin/debug endpoints; shared DB superuser used by apps.
**Evidence:** Auth middleware, IAM policy files, secret-scanner config, IdP enforcement settings.

### CC6.2 — Registration and authorization before access `CODE` `CONFIG`
**Requirement:** Prior to issuing credentials, the entity registers and authorizes new users.
**Checks:**
- [ ] Workforce access is provisioned through IdP/SCIM or an approved request workflow
- [ ] IAM/permission changes made via IaC with PR review and approval
- [ ] Customer-user registration verifies identity (email/domain verification, invite flows) and cannot self-assign privileged roles
- [ ] No default or shared credentials; service accounts have documented owners and purpose
- [ ] Role definitions documented and mapped to job function

**Red flags:** Roles assignable via mass-assignment/API parameter; manual console-created IAM users outside IaC.

### CC6.3 — Access removal and modification `CODE` `CONFIG`
**Requirement:** The entity authorizes, modifies, or removes access based on roles, responsibilities, or system design.
**Checks:**
- [ ] Offboarding procedure revokes SSO, VCS, cloud, CI/CD, and vendor access, with an SLA (≤ 24h)
- [ ] SCIM/IdP deprovisioning propagates to the application
- [ ] Role changes take effect promptly (no long-lived cached elevated claims)
- [ ] Tokens, API keys, sessions, and deploy keys are revocable; revocation is enforced in code
- [ ] Periodic access reviews identify and remove stale accounts, keys, and contractor access
- [ ] Machine credentials rotate on schedule and on personnel change

**Red flags:** Deploy keys or PATs tied to departed staff; long-lived, non-revocable tokens; no inactive-account detection.

### CC6.4 — Physical access `ORG`
**Requirement:** The entity restricts physical access to facilities and protected information assets.
**Repo signals:**
- [ ] Production runs in providers with current SOC 2 reports (carve-out/inherited controls documented)
- [ ] No on-premises or colo infrastructure defined in IaC unless separately assessed

**Default: MANUAL** (badge access, visitor logs, provider SOC report review).

### CC6.5 — Secure disposal of assets `CONFIG` `ORG`
**Requirement:** The entity discontinues logical and physical protections over assets only after the ability to read or recover data has been diminished.
**Checks:**
- [ ] Decommissioned cloud resources (volumes, snapshots, buckets, DBs) are deleted via IaC/lifecycle rules
- [ ] Storage is encrypted so that key destruction renders data unrecoverable (crypto-shredding)
- [ ] Data-bearing resources have documented decommission steps and verification
- [ ] Device wipe/destruction records exist for endpoints and media (`ORG`)

### CC6.6 — Protection against external threats `CONFIG` `CODE`
**Requirement:** The entity implements logical access security measures to protect against threats from outside its system boundaries.
**Checks:**
- [ ] Security groups/firewall rules avoid `0.0.0.0/0` on admin/DB ports (22, 3389, 5432, 3306, 6379, 27017, etc.)
- [ ] Databases and internal services sit in private subnets; ingress via load balancer/WAF/API gateway only
- [ ] WAF or equivalent protection for public endpoints; DDoS protections available
- [ ] Rate limiting and abuse protections on auth and public APIs
- [ ] Restrictive CORS (no wildcard with credentials); security headers set (CSP, HSTS, X-Content-Type-Options, frame protections)
- [ ] Defenses against common web flaws: injection (parameterized queries), XSS (output encoding), CSRF, SSRF, path traversal, unsafe deserialization, open redirects
- [ ] Admin access via VPN/bastion/zero-trust proxy, not the public internet

**Red flags:** Public S3/GCS buckets; SSH open to the world; string-concatenated SQL; `eval` on user input.

### CC6.7 — Protection of data in transmission `CODE` `CONFIG`
**Requirement:** The entity restricts the transmission, movement, and removal of information to authorized parties and protects it in transit.
**Checks:**
- [ ] TLS 1.2+ enforced on all external and internal endpoints; HTTP redirects to HTTPS; HSTS enabled
- [ ] Certificate validation is never disabled (`verify=False`, `rejectUnauthorized: false`, `InsecureSkipVerify`, `curl -k`)
- [ ] Weak protocols/ciphers disabled
- [ ] Webhooks and callbacks are signed and verified
- [ ] Secrets, tokens, and PII are never placed in URLs/query strings or logs
- [ ] Data exports/transfers use encrypted channels (SFTP, presigned URLs with short expiry)
- [ ] Controls exist to prevent unauthorized bulk export/exfiltration (e.g., egress rules, export permissions)

**Red flags:** Plain `http://` service URLs; disabled TLS verification in production code.

### CC6.8 — Malicious/unauthorized software `CONFIG`
**Requirement:** The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.
**Checks:**
- [ ] Lockfiles committed; installs are reproducible (`npm ci`, hash-pinned `pip`, `go.sum`, etc.)
- [ ] Dependency and container scanning in CI; new dependencies reviewed
- [ ] Base images are minimal and come from trusted registries; pinned by digest where feasible
- [ ] Build artifacts are signed or attested; provenance available (e.g., SLSA, Sigstore)
- [ ] No unverified `curl | bash` in Dockerfiles/CI; downloads are checksum-verified
- [ ] Only approved GitHub Actions/CI plugins are allowed (allowlist or SHA-pinning)
- [ ] File-upload paths scan or sandbox untrusted files
- [ ] Endpoint protection/EDR on developer and production hosts (`ORG`)

---

## CC7 — System Operations

### CC7.1 — Detection of vulnerabilities and configuration changes `CONFIG`
**Requirement:** The entity uses detection and monitoring procedures to identify changes to configurations that introduce vulnerabilities, and susceptibilities to newly discovered vulnerabilities.
**Checks:**
- [ ] Vulnerability scanning of code, dependencies, images, and infrastructure is continuous or scheduled
- [ ] Infrastructure drift detection (e.g., `terraform plan` scheduled, cloud config monitoring)
- [ ] Hardened baseline configurations defined for hosts/containers/clusters
- [ ] Security-relevant events are logged: authentication, authorization failures, privilege changes, admin actions, data export, config changes
- [ ] Logs are centralized and tamper-resistant

### CC7.2 — Monitoring for anomalies `CODE` `CONFIG`
**Requirement:** The entity monitors system components for anomalies that are indicative of malicious acts, natural disasters, and errors.
**Checks:**
- [ ] Alert rules exist for failed-login spikes, privilege escalation, unusual data access/volume, error-rate spikes, and infrastructure anomalies
- [ ] Alerts route to an on-call owner with defined response expectations
- [ ] Logs are structured and include timestamp, actor, action, resource, outcome, and correlation ID
- [ ] **No secrets, credentials, full card numbers, or unnecessary PII in logs**
- [ ] Log retention meets policy (see 1.4); access to logs is restricted and audited

**Red flags:** Logging request bodies with credentials; no alert on production auth failures; logs writable by app users.

### CC7.3 — Security event evaluation `DOCS` `CONFIG`
**Requirement:** The entity evaluates security events to determine whether they could or have resulted in a failure to meet objectives (security incidents).
**Checks:**
- [ ] Severity classification/triage criteria documented
- [ ] Alert-to-ticket automation exists
- [ ] Event evaluation outcomes are recorded (true/false positive, incident yes/no)

### CC7.4 — Incident response `DOCS` `CONFIG`
**Requirement:** The entity responds to identified security incidents by executing a defined incident-response program.
**Checks:**
- [ ] Incident response plan exists with roles, severity levels, communication plans, and escalation paths
- [ ] Runbooks exist for common scenarios (credential leak, data exposure, compromised dependency, DDoS)
- [ ] Emergency capability: revoke keys, disable accounts, kill switches/feature flags, isolate services
- [ ] Incident tickets with timelines exist; postmortems completed with tracked corrective actions
- [ ] Response plan tested (tabletop or simulation) at least annually (`ORG`)

### CC7.5 — Recovery from incidents `DOCS` `CONFIG`
**Requirement:** The entity identifies, develops, and implements activities to recover from identified security incidents.
**Checks:**
- [ ] Infrastructure can be rebuilt from IaC; clean-room redeploy procedure documented
- [ ] Secret and credential rotation procedure exists and is exercised
- [ ] Backup restore procedures documented (see A1.2, A1.3)
- [ ] Post-incident remediation is tracked to completion

---

## CC8 — Change Management

### CC8.1 — Authorized, tested, approved changes `CONFIG` `DOCS`
**Requirement:** The entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures.
**Checks:**
- [ ] **Branch protection** on default and release branches: PR required; ≥ 1 approving review from someone other than the author; stale approvals dismissed; required status checks; conversation resolution; force-push and deletion disabled
- [ ] **Admins are not exempt** from protection, or bypass is logged and reviewed
- [ ] `CODEOWNERS` review enforced on sensitive paths
- [ ] CI runs automated tests, lint, and security scans before merge
- [ ] Production deploys occur only via the pipeline, with protected environment approvals; no manual production changes outside emergency procedure
- [ ] IaC changes go through plan/review/apply with recorded approvals; state is remote, locked, and access-controlled
- [ ] Database migrations are reviewed, tested, and reversible or have a rollback plan
- [ ] Rollback procedure documented and exercised
- [ ] Changes are traceable: commit → PR → ticket → build → deployment, with logs retained
- [ ] Emergency-change process defined, with retroactive review required
- [ ] Production credentials are not available on developer laptops or standing dev access; test and prod are separated
- [ ] Production data is not used in lower environments unless masked

**Red flags:** Direct pushes to `main`; self-approved merges; unreviewed hotfixes; deployments from local machines; `terraform apply` from laptops; no test gate.
**Evidence:** Branch protection/ruleset export, sample PRs, CI logs, deployment history, change tickets.

---

## CC9 — Risk Mitigation

### CC9.1 — Business disruption risk `DOCS` `CONFIG`
**Requirement:** The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.
**Checks:**
- [ ] Business continuity and disaster recovery plans exist and cover this system
- [ ] Single points of failure identified and mitigated (multi-AZ, redundant components)
- [ ] Critical dependencies (cloud region, DNS, auth provider, payment provider) have documented fallback or degradation behavior
- [ ] Runbooks exist for regional/provider outages

### CC9.2 — Vendor and third-party risk `CODE` `CONFIG` `ORG`
**Requirement:** The entity assesses and manages risks associated with vendors and business partners.
**Checks:**
- [ ] Inventory of third-party services, SDKs, APIs, and open-source dependencies (SBOM + integrations list)
- [ ] New dependencies and vendors require review before adoption
- [ ] Third-party credentials are least-privilege and scoped per vendor; rotation supported
- [ ] Data shared with each vendor is documented and minimized; data-flow diagrams cover vendors
- [ ] Webhook/callback authenticity verified; vendor SDKs pinned and scanned
- [ ] Vendor SOC reports, DPAs, security questionnaires, and annual reviews tracked (`ORG`)

**Red flags:** Unknown SDKs collecting data; production API keys with full-account scope; abandoned or unvetted packages in critical paths.

---

# PART 2 — AVAILABILITY *(optional category)*

### A1.1 — Capacity management `CONFIG` `CODE`
**Requirement:** The entity maintains, monitors, and evaluates current processing capacity and use of system components.
**Checks:**
- [ ] Monitoring and alerting on CPU, memory, disk, network, queue depth, DB connections, and storage growth
- [ ] Autoscaling configured, or documented capacity plan with headroom targets
- [ ] Resource requests/limits set for containers/workloads
- [ ] Load or performance tests exist and are run before major releases
- [ ] Back-pressure, timeouts, connection-pool limits, and rate limiting protect from overload
- [ ] Capacity reviews occur on a defined cadence

### A1.2 — Environmental protection, backup, and recovery infrastructure `CONFIG`
**Requirement:** The entity authorizes, designs, develops, implements, operates, approves, maintains, and monitors environmental protections, software, data backup processes, and recovery infrastructure.
**Checks:**
- [ ] Automated backups for all persistent data stores, with retention policy and point-in-time recovery where required
- [ ] Backups are encrypted, access-controlled, and stored in a separate failure domain (account/region); immutability or deletion protection enabled
- [ ] Multi-AZ (and multi-region if required) deployment for critical components
- [ ] Health checks, self-healing, and automated failover configured
- [ ] Availability objectives (SLOs/SLAs) defined and monitored, with alerting on breach
- [ ] Environment is reproducible from IaC
- [ ] Physical/environmental controls inherited from provider with reports reviewed (`ORG`)

**Red flags:** Backups in the same account/region with the same credentials as production; no backup for a critical datastore.

### A1.3 — Recovery plan testing `DOCS` `CONFIG`
**Requirement:** The entity tests recovery plan procedures supporting system recovery to meet its objectives.
**Checks:**
- [ ] RTO and RPO defined per system
- [ ] Backup restoration tested at the defined cadence, with dated results retained
- [ ] DR/failover exercises performed, with results documented
- [ ] Failures during tests generate remediation tickets tracked to closure

---

# PART 3 — PROCESSING INTEGRITY *(optional category)*

### PI1.1 — Processing objectives and specifications `DOCS` `CODE`
**Requirement:** The entity obtains or generates, uses, and communicates relevant, quality information regarding the objectives related to processing, including definitions of data processed and product/service specifications.
**Checks:**
- [ ] API contracts published and versioned (OpenAPI/GraphQL schema/protobuf)
- [ ] Data definitions/dictionary exist for key entities and calculations
- [ ] Service specifications and SLAs/SLOs documented and communicated to users
- [ ] Breaking changes communicated and versioned

### PI1.2 — Input completeness and accuracy `CODE`
**Requirement:** The entity implements policies and procedures over system inputs to result in products and services that meet specifications.
**Checks:**
- [ ] Schema validation at every trust boundary (e.g., Zod, Pydantic, JSON Schema, bean validation): types, ranges, lengths, formats, required fields
- [ ] Server-side validation (never client-only)
- [ ] Duplicate detection and idempotency keys on create/payment/message-ingest operations
- [ ] Invalid input is rejected or quarantined with clear error handling; malformed records are not silently dropped
- [ ] Parameterized queries; safe file-upload validation (type, size, content)

**Red flags:** Silent coercion/truncation; missing validation on batch or webhook ingestion; trusting client-supplied totals or IDs.

### PI1.3 — Processing completeness, accuracy, timeliness, authorization `CODE`
**Requirement:** The entity implements policies and procedures over system processing to result in products and services that meet specifications.
**Checks:**
- [ ] Multi-step operations are transactional/atomic, or use sagas/compensation
- [ ] Idempotent handlers; safe retry with deduplication; concurrency control (optimistic locking/versioning)
- [ ] Explicit timeouts, retry limits, and dead-letter queues for failed jobs
- [ ] Authorization is re-checked at processing time, not only at intake
- [ ] Business-rule and calculation logic covered by automated tests, including edge cases (rounding, currency, time zones)
- [ ] Job/pipeline monitoring alerts on failure, lag, and stuck work

### PI1.4 — Output completeness, accuracy, timeliness `CODE`
**Requirement:** The entity implements policies and procedures to make available or deliver output completely, accurately, and timely in accordance with specifications.
**Checks:**
- [ ] Output validation before release (reports, exports, notifications, invoices)
- [ ] Reconciliation jobs compare inputs vs. outputs and alert on discrepancy
- [ ] Delivery confirmation/acknowledgment and retry for outbound messages and webhooks
- [ ] Output access is authorized and scoped to the recipient
- [ ] Delivery timeliness is measured against specification

### PI1.5 — Storage completeness and accuracy `CODE` `CONFIG`
**Requirement:** The entity implements policies and procedures to store inputs, items in processing, and outputs completely, accurately, and timely.
**Checks:**
- [ ] Database constraints enforce integrity (NOT NULL, UNIQUE, foreign keys, check constraints)
- [ ] Audit trails/history for critical records; append-only or tamper-evident logs where required
- [ ] Checksums or hashes for stored files/artifacts where integrity matters
- [ ] Data retention rules implemented, including soft-delete semantics where needed
- [ ] Safe, tested migrations; backups verified (see A1)
- [ ] Data-integrity tests or reconciliation queries run on a schedule

---

# PART 4 — CONFIDENTIALITY *(optional category)*

### C1.1 — Identify and protect confidential information `CODE` `CONFIG` `DOCS`
**Requirement:** The entity identifies and maintains confidential information to meet its objectives, and protects it through its retention period.
**Checks:**
- [ ] Data classification scheme exists (e.g., public / internal / confidential / restricted), applied to data stores, tables, and fields (schema annotations, tags, data catalog)
- [ ] Inventory/data map of confidential data locations, including logs, caches, analytics, backups, and vendors
- [ ] Encryption at rest with managed keys (KMS/HSM); key access is restricted; rotation configured
- [ ] Field-level encryption or tokenization for the most sensitive fields
- [ ] Access to confidential data is least-privilege and audit-logged
- [ ] Confidential data is excluded from source control, test fixtures, screenshots, logs, error messages, and lower environments (or is masked)
- [ ] Protection against accidental deletion (versioning, deletion protection, backups)
- [ ] Confidentiality agreements with staff and vendors (`ORG`)

**Red flags:** Unencrypted buckets/volumes/DBs; real customer data in seeds or fixtures; secrets in `.env` committed to VCS.

### C1.2 — Dispose of confidential information `CODE` `CONFIG`
**Requirement:** The entity disposes of confidential information to meet its objectives.
**Checks:**
- [ ] Retention periods defined per data class
- [ ] Automated deletion (TTLs, lifecycle policies, purge jobs) enforces retention
- [ ] Deletion propagates to replicas, search indexes, caches, analytics stores, data warehouses, and vendors
- [ ] Backups age out per policy; cryptographic erasure used where feasible
- [ ] Deletion is verified and logged (job outputs, audit records)
- [ ] Media/device disposal records exist (`ORG`)

**Red flags:** "Soft delete" that is never purged; deletion from primary DB only; unlimited log/backup retention.

---

# PART 5 — PRIVACY *(optional category)*

> Privacy criteria are organization-scoped: the privacy notice and your commitments define what must be true. Verify that **code behavior matches the published notice**.

### P1.1 — Privacy notice `CODE` `DOCS`
**Requirement:** The entity provides notice to data subjects about its privacy practices to meet its objectives.
**Checks:**
- [ ] Privacy notice is accessible from the product (signup, footer, app settings)
- [ ] Notice is current, versioned, and describes collection, use, retention, disclosure, and disposal
- [ ] Changes are communicated to affected users; prior versions are retained
- [ ] Notice matches actual behavior (compare against schema, analytics events, and third-party SDKs)

### P2.1 — Choice and consent `CODE`
**Requirement:** The entity communicates choices available regarding the collection, use, retention, disclosure, and disposal of personal information and obtains consent where required.
**Checks:**
- [ ] Consent captured with timestamp, policy/notice version, purpose, and channel
- [ ] Opt-in/opt-out and withdrawal mechanisms exist and are honored in code (analytics, marketing, sharing gates check consent state before executing)
- [ ] Cookie/tracker consent enforced (no non-essential trackers before consent); Global Privacy Control respected where required
- [ ] Re-consent triggered for new purposes or material changes
- [ ] Explicit consent for sensitive data and cross-border transfers where required

**Red flags:** Trackers firing before consent; consent stored only client-side; withdrawal not propagated.

### P3.1 — Collection consistent with objectives `CODE` `DOCS`
**Requirement:** Personal information is collected consistent with the entity's objectives related to privacy.
**Checks:**
- [ ] Data minimization: each collected field has a documented purpose
- [ ] PII fields identified in schemas/APIs and tracked in a data map
- [ ] Collected data matches what the notice says
- [ ] Third-party SDKs and analytics events reviewed for unintended PII collection
- [ ] Legal basis/purpose recorded where applicable

### P3.2 — Sensitive information `CODE` `CONFIG`
**Requirement:** For information requiring explicit consent, the entity communicates the need for consent and obtains it before collection.
**Checks:**
- [ ] Sensitive categories identified (health, biometric, government ID, financial, precise location, children's data, etc.)
- [ ] Explicit consent obtained before collection
- [ ] Enhanced protections: separate storage, stronger encryption, masking, tokenization, stricter access controls
- [ ] Age-gating/parental-consent logic where minors' data is possible

### P4.1 — Use of personal information `CODE` `DOCS`
**Requirement:** The entity limits the use of personal information to the purposes identified in its objectives.
**Checks:**
- [ ] Purpose limitation enforced (purpose tags/access policies, not just documentation)
- [ ] No secondary use without basis (e.g., production PII in analytics, ML training, or marketing without consent)
- [ ] Data-use documented for pipelines and internal tools; internal access is justified and logged

### P4.2 — Retention of personal information `CODE` `CONFIG`
**Requirement:** The entity retains personal information consistent with its objectives.
**Checks:**
- [ ] Retention schedule defined per data type
- [ ] TTLs/purge jobs implemented and monitored
- [ ] Backup and log retention aligned with schedule
- [ ] Legal-hold process exists and is honored by purge jobs

### P4.3 — Disposal of personal information `CODE` `CONFIG`
**Requirement:** The entity securely disposes of personal information to meet its objectives.
**Checks:**
- [ ] Secure deletion or irreversible anonymization implemented
- [ ] Deletion cascades to all stores (primary, replicas, caches, search, warehouse, vendors, backups on expiry)
- [ ] Deletion is verified and audit-logged
- [ ] P4.1–P4.3 operate as one connected data-lifecycle control (use → retain → dispose)

### P5.1 — Data subject access `CODE`
**Requirement:** The entity grants identified and authenticated data subjects the ability to access their stored personal information.
**Checks:**
- [ ] Self-service or request-based access/export endpoint exists
- [ ] Requester identity is authenticated before disclosure; export is scoped to that subject only
- [ ] Machine-readable export format
- [ ] Export covers all stores holding the subject's data, including vendors
- [ ] Requests are tracked with response-time SLA and audit logs
- [ ] Endpoint is rate-limited and abuse-resistant

### P5.2 — Correction and amendment `CODE`
**Requirement:** The entity corrects, amends, or appends personal information based on information provided by data subjects and communicates such information to third parties.
**Checks:**
- [ ] Users can update or request correction of their data
- [ ] Corrections propagate to downstream systems and relevant third parties
- [ ] Change history/audit trail retained; denials documented with rationale

### P6.1 — Authorized disclosure to third parties `CODE` `CONFIG`
**Requirement:** The entity discloses personal information to third parties with the explicit consent of data subjects, and such consent is obtained prior to disclosure.
**Checks:**
- [ ] Disclosure paths to third parties are inventoried (subprocessors, analytics, support tools, integrations)
- [ ] Consent/authorization checked in code before sending PI to third parties
- [ ] Payloads to vendors are minimized (only necessary fields; pseudonymized where possible)
- [ ] Cross-border transfer mechanisms documented where applicable

**Red flags:** Full user objects sent to analytics/support tools; unreviewed SDKs exfiltrating PII.

### P6.2 — Records of authorized disclosures `CODE`
**Requirement:** The entity creates and retains a complete, accurate, and timely record of authorized disclosures of personal information.
**Checks:**
- [ ] Disclosure events are logged (subject, recipient, data categories, purpose, timestamp, authorization basis)
- [ ] Records are retained per policy and queryable by data subject

### P6.3 — Records of unauthorized disclosures `CODE` `DOCS`
**Requirement:** The entity creates and retains a complete, accurate, and timely record of detected or reported unauthorized disclosures (including breaches) of personal information.
**Checks:**
- [ ] Incident register captures unauthorized disclosures with scope, affected subjects, root cause, and remediation
- [ ] Detection exists for likely exposure paths (public buckets, misdirected exports, log leakage, DLP)
- [ ] Records link to the incident-response process (CC7.3–CC7.4)

### P6.4 — Third-party privacy commitments `ORG` `CONFIG`
**Requirement:** The entity obtains privacy commitments from vendors and other third parties who have access to personal information.
**Checks:**
- [ ] Vendor contracts/DPAs include privacy commitments (`ORG`)
- [ ] Technical scopes limit vendor access to necessary data
- [ ] Vendor compliance is monitored (SOC reports, reviews)

### P6.5 — Third-party notification of unauthorized disclosure `ORG` `DOCS`
**Requirement:** The entity obtains commitments from vendors and other third parties to notify the entity of actual or suspected unauthorized disclosures of personal information.
**Checks:**
- [ ] Contracts specify notification timelines (`ORG`)
- [ ] Intake channel/process exists for vendor breach notices and feeds incident response

### P6.6 — Breach notification `DOCS` `CODE`
**Requirement:** The entity provides notification of breaches and incidents to affected data subjects, regulators, and others to meet its objectives.
**Checks:**
- [ ] Breach notification runbook and templates exist, with regulator/customer deadlines documented (e.g., 72h where applicable)
- [ ] Affected data subjects can be identified quickly through queries and tooling
- [ ] Contact data and notification tooling available for affected populations
- [ ] Notification decisions recorded

### P6.7 — Accounting of personal information held and disclosed `CODE`
**Requirement:** The entity provides data subjects with an accounting of the personal information held and disclosure of the data subjects' personal information, upon the data subjects' request.
**Checks:**
- [ ] DSAR output includes what is held (P5.1) and to whom it was disclosed (P6.2)
- [ ] Accounting can be produced within the response SLA

### P7.1 — Data quality `CODE`
**Requirement:** The entity collects and maintains accurate, up-to-date, complete, and relevant personal information to meet its objectives.
**Checks:**
- [ ] Validation on PI fields (format, completeness); duplicate detection and merge handling
- [ ] Users can review and update their own data
- [ ] Data-quality checks or stale-data flagging run on a schedule
- [ ] Irrelevant or unnecessary fields are removed

### P8.1 — Privacy inquiries, complaints, and disputes `DOCS` `ORG`
**Requirement:** The entity implements a process for receiving, addressing, resolving, and communicating the resolution of inquiries, complaints, and disputes from data subjects, and monitors compliance.
**Checks:**
- [ ] Privacy contact channel published (email/form) and monitored
- [ ] Ticketed workflow with SLAs, investigation, resolution, and communication back to the requester
- [ ] Privacy reviews (PIA/DPIA) are part of the SDLC for new features handling PI
- [ ] Periodic privacy compliance monitoring; deficiencies feed corrective actions (CC4.2)

---

# Appendix A — Scorecard Template

```
Repository / System: ______________________
Commit / Release:    ______________________
Assessor:            ______________________   Date: ____________
Scope:  [x] Security  [ ] Availability  [ ] Processing Integrity  [ ] Confidentiality  [ ] Privacy
Environment(s) reviewed: [ ] Dev  [ ] Staging  [ ] Prod
```

| Criterion | Score (0/1/2/N/A/MANUAL) | Evidence (paths, PRs, screenshots) | Finding ID | Owner | Notes |
|-----------|--------------------------|------------------------------------|------------|-------|-------|
| CC1.1 | | | | | |
| CC1.2 | | | | | |
| CC1.3 | | | | | |
| CC1.4 | | | | | |
| CC1.5 | | | | | |
| CC2.1 | | | | | |
| CC2.2 | | | | | |
| CC2.3 | | | | | |
| CC3.1 | | | | | |
| CC3.2 | | | | | |
| CC3.3 | | | | | |
| CC3.4 | | | | | |
| CC4.1 | | | | | |
| CC4.2 | | | | | |
| CC5.1 | | | | | |
| CC5.2 | | | | | |
| CC5.3 | | | | | |
| CC6.1 | | | | | |
| CC6.2 | | | | | |
| CC6.3 | | | | | |
| CC6.4 | | | | | |
| CC6.5 | | | | | |
| CC6.6 | | | | | |
| CC6.7 | | | | | |
| CC6.8 | | | | | |
| CC7.1 | | | | | |
| CC7.2 | | | | | |
| CC7.3 | | | | | |
| CC7.4 | | | | | |
| CC7.5 | | | | | |
| CC8.1 | | | | | |
| CC9.1 | | | | | |
| CC9.2 | | | | | |
| A1.1 | | | | | |
| A1.2 | | | | | |
| A1.3 | | | | | |
| PI1.1 | | | | | |
| PI1.2 | | | | | |
| PI1.3 | | | | | |
| PI1.4 | | | | | |
| PI1.5 | | | | | |
| C1.1 | | | | | |
| C1.2 | | | | | |
| P1.1 | | | | | |
| P2.1 | | | | | |
| P3.1 | | | | | |
| P3.2 | | | | | |
| P4.1 | | | | | |
| P4.2 | | | | | |
| P4.3 | | | | | |
| P5.1 | | | | | |
| P5.2 | | | | | |
| P6.1 | | | | | |
| P6.2 | | | | | |
| P6.3 | | | | | |
| P6.4 | | | | | |
| P6.5 | | | | | |
| P6.6 | | | | | |
| P6.7 | | | | | |
| P7.1 | | | | | |
| P8.1 | | | | | |

### Category Roll-Up

| Category | Assessable criteria | Points earned | Points possible (2 × assessable) | Readiness % | MANUAL items open |
|----------|---------------------|---------------|-----------------------------------|-------------|-------------------|
| Security (CC) | | | | | |
| Availability (A) | | | | | |
| Processing Integrity (PI) | | | | | |
| Confidentiality (C) | | | | | |
| Privacy (P) | | | | | |

---

# Appendix B — Finding Template

```
Finding ID:        F-001
Criterion:         CC8.1
Severity:          Critical | High | Medium | Low
Title:             Direct pushes to main are permitted
Location:          repo settings / path/to/file:line
Observed:          What was found, with evidence
Expected:          What the control requires
Risk:              Impact and likelihood
Recommendation:    Specific remediation
Owner:             name/team
Due date:          YYYY-MM-DD
Status:            Open | In progress | Remediated | Accepted (with expiry + approver)
Verification:      How closure was confirmed (PR, scan, config export)
```

---

# Appendix C — Automated Check Starter Map

Automation supports, but does not replace, judgment. Suggested tooling categories per area:

| Area | Criteria | Example tooling |
|------|----------|-----------------|
| Secret detection | CC6.1, C1.1 | Gitleaks, TruffleHog, GitHub secret scanning + push protection |
| SAST | CC4.1, CC6.6, PI1.2 | CodeQL, Semgrep |
| Dependency / SCA | CC6.8, CC9.2, CC4.2 | Dependabot, Renovate, OSV-Scanner, Snyk, `npm audit`, `pip-audit` |
| Container / image | CC6.8, CC7.1 | Trivy, Grype |
| IaC / cloud config | CC6.6, CC6.7, C1.1, A1.2 | Checkov, tfsec/Trivy config, KICS, cloud-native config rules |
| SBOM / provenance | CC2.1, CC6.8 | Syft, CycloneDX, SLSA provenance, Sigstore cosign |
| Repo posture | CC8.1, CC5.2 | OpenSSF Scorecard, GitHub rulesets/branch-protection exports via API |
| CI hardening | CC5.2, CC8.1 | zizmor, pinact, StepSecurity Harden-Runner |
| DAST / pen test | CC4.1, CC6.6 | OWASP ZAP, annual third-party penetration test |
| Policy-as-code | CC5.1, CC4.1 | OPA/Conftest, Kyverno |
| Log/PII hygiene | CC7.2, P3.1 | Custom lint rules, PII scanners, log-schema tests |

### Quick manual grep checklist

```
# TLS verification disabled
verify=False | rejectUnauthorized: false | InsecureSkipVerify | curl -k | NODE_TLS_REJECT_UNAUTHORIZED=0

# Hard-coded secrets / weak crypto
password\s*= | api[_-]?key | secret | BEGIN (RSA|EC|OPENSSH) PRIVATE KEY | md5( | sha1( | DES | ECB

# Dangerous execution / injection
eval( | exec( | os.system( | subprocess.*shell=True | innerHTML | dangerouslySetInnerHTML | string-concatenated SQL

# Overly permissive infrastructure
0.0.0.0/0 | "Action": "*" | "Resource": "*" | acl = "public-read" | publicly_accessible = true

# CI/CD risk
pull_request_target | permissions: write-all | curl .* | (ba)?sh | unpinned third-party actions
```

---

# Appendix D — Criteria Quick Index

| Group | IDs |
|-------|-----|
| Control Environment | CC1.1 – CC1.5 |
| Communication & Information | CC2.1 – CC2.3 |
| Risk Assessment | CC3.1 – CC3.4 |
| Monitoring Activities | CC4.1 – CC4.2 |
| Control Activities | CC5.1 – CC5.3 |
| Logical & Physical Access | CC6.1 – CC6.8 |
| System Operations | CC7.1 – CC7.5 |
| Change Management | CC8.1 |
| Risk Mitigation | CC9.1 – CC9.2 |
| Availability | A1.1 – A1.3 |
| Processing Integrity | PI1.1 – PI1.5 |
| Confidentiality | C1.1 – C1.2 |
| Privacy | P1.1, P2.1, P3.1–P3.2, P4.1–P4.3, P5.1–P5.2, P6.1–P6.7, P7.1, P8.1 |

**Total: 61 criteria** (33 + 3 + 5 + 2 + 18).
