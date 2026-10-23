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
| Security | 27 | 0 | 54 | 0.0% | Not ready (capped: open Critical) | 6 |
| Availability | 3 | 0 | 6 | 0.0% | Not ready | 0 |
| Processing Integrity | 4 | 0 | 8 | 0.0% | Not ready | 1 |
| Confidentiality | 2 | 0 | 4 | 0.0% | Not ready | 0 |
| Privacy | 14 | 0 | 28 | 0.0% | Not ready | 4 |

Open findings: 9 critical · 27 high · 60 medium · 26 low

Readiness counts assessable criteria only. MANUAL and N/A criteria are excluded from both sides of the ratio (rubric 1.1), so read it together with the number of criteria assessed.

### Top fixes

1. **Critical · CC6.1** Hard-coded Stripe live key (+4 more). Revoke and rotate the credential first, then remove it from the code and load it from a secrets manager or environment variable. Rewriting git history does not un-leak a pushed secret.
2. **Critical · CC6.1** Environment file committed: .env (+1 more). Rotate any credentials the file contains, remove it from git with `git rm --cached`, add `.env*` to .gitignore, and commit a .env.example with empty values instead.
3. **Critical · CC6.1** JWTs accepted with the "none" algorithm (+1 more). Always verify tokens with an explicit algorithm allow-list, and check exp, aud and iss. Use decode only for logging-free inspection of already-verified tokens.
4. **Critical · CC5.2** Untrusted PR code checked out in a privileged workflow (.github/workflows/ci.yml). Use the pull_request trigger for anything that builds or tests PR code. Keep pull_request_target for labelling or commenting, without checking out the head.
5. **Critical · CC6.1** Publicly accessible database: aws_db_instance.main. Turn off public accessibility, place the database in private subnets, and reach it through the application, a bastion or a private endpoint.

## Scorecard (Appendix A)

| Criterion | Title | Score | Evidence | Finding ID | Owner | Notes |
|---|---|---|---|---|---|---|
| CC1.1 | Integrity and ethical values | MANUAL |  |  | Leadership and People Ops | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC1.2 | Board oversight | MANUAL |  |  | Board / executive leadership | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC1.3 | Organizational structure | 0 (Not Met) |  | F-037 |  | No automated check passed. |
| CC1.4 | Competence | MANUAL |  |  | Leadership and People Ops | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC1.5 | Accountability | MANUAL |  |  | Leadership and People Ops | None of the automated checks apply to this repository. Confirm manually, or declare N/A with a justification in threesock.yaml. |
| CC2.1 | Relevant, quality information | 0 (Not Met) |  | F-097, F-098 |  | No automated check passed. |
| CC2.2 | Internal communication | 0 (Not Met) |  | F-099, F-100 |  | No automated check passed. |
| CC2.3 | External communication | 0 (Not Met) |  | F-038 |  | No automated check passed. |
| CC3.1 | Suitable objectives | MANUAL |  |  | Security and risk owner | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC3.2 | Risk identification and analysis | 0 (Not Met) |  | F-039, F-040, F-101 |  | No automated check passed. |
| CC3.3 | Fraud risk | 0 (Not Met) |  | F-010, F-011 |  | No automated check passed. |
| CC3.4 | Significant changes | 0 (Not Met) |  | F-102 |  | No automated check passed. |
| CC4.1 | Ongoing/separate evaluations | 0 (Not Met) |  | F-041, F-042, F-103 |  | No automated check passed. |
| CC4.2 | Deficiency communication and remediation | 0 (Not Met) |  | F-043, F-044, F-045, F-046 |  | Red flag present: Unexplained entries in .trivyignore (F-045). |
| CC5.1 | Control selection and design | 0 (Not Met) |  | F-104 |  | No automated check passed. |
| CC5.2 | Technology general controls | 0 (Not Met) |  | F-001, F-012, F-013, F-014, F-015, F-047, F-048 |  | An open Critical finding caps this criterion at 0 until it is resolved. |
| CC5.3 | Policies and procedures | 0 (Not Met) |  | F-049, F-105 |  | No automated check passed. |
| CC6.1 | Logical access security | 0 (Not Met) |  | F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-016, F-017, F-018, F-050, F-051, F-052, F-106, F-107 |  | An open Critical finding caps this criterion at 0 until it is resolved. |
| CC6.2 | Registration and authorization before access | 0 (Not Met) |  | F-019 |  | No automated check passed. |
| CC6.3 | Access removal and modification | 0 (Not Met) |  | F-053, F-054 |  | No automated check passed. |
| CC6.4 | Physical access | MANUAL |  |  | IT and facilities (inherit from cloud provider SOC 2 report) | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC6.5 | Secure disposal of assets | 0 (Not Met) |  | F-108 |  | No automated check passed. |
| CC6.6 | Protection against external threats | 0 (Not Met) |  | F-009, F-020, F-021, F-022, F-023, F-024, F-055, F-056 |  | An open Critical finding caps this criterion at 0 until it is resolved. |
| CC6.7 | Protection of data in transmission | 0 (Not Met) |  | F-025, F-026, F-027, F-057 |  | Red flag present: Node TLS client with certificate rejection turned off (F-025). |
| CC6.8 | Malicious/unauthorized software | 0 (Not Met) |  | F-028, F-029, F-058, F-059, F-060, F-109, F-110 |  | No automated check passed. |
| CC7.1 | Detection of vulnerabilities and configuration changes | 0 (Not Met) |  | F-061, F-062, F-111 |  | No automated check passed. |
| CC7.2 | Monitoring for anomalies | 0 (Not Met) |  | F-030, F-063, F-064 |  | No automated check passed. |
| CC7.3 | Security event evaluation | 0 (Not Met) |  | F-065 |  | No automated check passed. |
| CC7.4 | Incident response | 0 (Not Met) |  | F-031, F-066 |  | No automated check passed. |
| CC7.5 | Recovery from incidents | 0 (Not Met) |  | F-067 |  | No automated check passed. |
| CC8.1 | Authorized, tested, approved changes | 0 (Not Met) |  | F-032, F-033, F-068, F-069, F-070, F-112, F-113 |  | No automated check passed. |
| CC9.1 | Business disruption risk | 0 (Not Met) |  | F-071 |  | No automated check passed. |
| CC9.2 | Vendor and third-party risk | 0 (Not Met) |  | F-072 |  | No automated check passed. |
| A1.1 | Capacity management | 0 (Not Met) |  | F-073, F-114, F-115 |  | No automated check passed. |
| A1.2 | Environmental protection, backup, and recovery infrastructure | 0 (Not Met) |  | F-034, F-074, F-075, F-076 |  | Red flag present: No reliable backups for aws_db_instance.main (F-034). |
| A1.3 | Recovery plan testing | 0 (Not Met) |  | F-077, F-078 |  | No automated check passed. |
| PI1.1 | Processing objectives and specifications | 0 (Not Met) |  | F-116, F-117 |  | No automated check passed. |
| PI1.2 | Input completeness and accuracy | 0 (Not Met) |  | F-079 |  | No automated check passed. |
| PI1.3 | Processing completeness, accuracy, timeliness, authorization | 0 (Not Met) |  | F-080 |  | No automated check passed. |
| PI1.4 | Output completeness, accuracy, timeliness | MANUAL |  |  | Engineering lead | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| PI1.5 | Storage completeness and accuracy | 0 (Not Met) |  | F-081 |  | No automated check passed. |
| C1.1 | Identify and protect confidential information | 0 (Not Met) |  | F-035, F-082, F-083 |  | No automated check passed. |
| C1.2 | Dispose of confidential information | 0 (Not Met) |  | F-084, F-118 |  | No automated check passed. |
| P1.1 | Privacy notice | 0 (Not Met) |  | F-085 |  | No automated check passed. |
| P2.1 | Choice and consent | 0 (Not Met) |  | F-036 |  | Red flag present: Trackers load without a consent check (F-036). |
| P3.1 | Collection consistent with objectives | 0 (Not Met) |  | F-086 |  | No automated check passed. |
| P3.2 | Sensitive information | 0 (Not Met) |  | F-087 |  | No automated check passed. |
| P4.1 | Use of personal information | MANUAL |  |  | Privacy / legal | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| P4.2 | Retention of personal information | 0 (Not Met) |  | F-088 |  | No automated check passed. |
| P4.3 | Disposal of personal information | 0 (Not Met) |  | F-089, F-090 |  | Red flag present: Soft-deleted records are never purged (F-090). |
| P5.1 | Data subject access | 0 (Not Met) |  | F-091 |  | No automated check passed. |
| P5.2 | Correction and amendment | 0 (Not Met) |  | F-119 |  | No automated check passed. |
| P6.1 | Authorized disclosure to third parties | 0 (Not Met) |  | F-092, F-093 |  | Red flag present: Whole user object sent to a third-party SDK (F-093). |
| P6.2 | Records of authorized disclosures | MANUAL |  |  | Privacy / legal | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| P6.3 | Records of unauthorized disclosures | 0 (Not Met) |  | F-094 |  | No automated check passed. |
| P6.4 | Third-party privacy commitments | MANUAL |  |  | Privacy / legal | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| P6.5 | Third-party notification of unauthorized disclosure | 0 (Not Met) |  | F-120 |  | No automated check passed. |
| P6.6 | Breach notification | 0 (Not Met) |  | F-095 |  | No automated check passed. |
| P6.7 | Accounting of personal information held and disclosed | MANUAL |  |  | Privacy / legal | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| P7.1 | Data quality | 0 (Not Met) |  | F-121 |  | No automated check passed. |
| P8.1 | Privacy inquiries, complaints, and disputes | 0 (Not Met) |  | F-096, F-122 |  | No automated check passed. |

## Findings (Appendix B)

### F-001 · Critical · CC5.2 · Untrusted PR code checked out in a privileged workflow (.github/workflows/ci.yml)

```
Finding ID:        F-001
Criterion:         CC5.2
Severity:          Critical
Title:             Untrusted PR code checked out in a privileged workflow (.github/workflows/ci.yml)
Location:          .github/workflows/ci.yml:10
Observed:          .github/workflows/ci.yml runs on pull_request_target and references the pull request head at line 10.
Expected:          Workflows triggered by pull_request_target or workflow_run do not check out or run code from the pull request.
Risk:              These triggers run with secrets and a write token. Checking out the PR head lets anyone who opens a pull request run code with them ("pwn request").
Recommendation:    Use the pull_request trigger for anything that builds or tests PR code. Keep pull_request_target for labelling or commenting, without checking out the head.
Controls:          Configuration & Patch Management; Secure SDLC Integration; Credential Management; Endpoint Security; Endpoint Protection
Policies:          Secure Configuration & Hardening; Secure Software Development Lifecycle; Authentication & Password
Owner:             Unassigned
Due date:          2026-01-16
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 2e38110b587137ff.
```

Example fix:

```
on: pull_request          # untrusted code, no secrets, read-only token
permissions:
  contents: read
```

### F-002 · Critical · CC6.1 · Environment file committed: .env

```
Finding ID:        F-002
Criterion:         CC6.1
Severity:          Critical
Title:             Environment file committed: .env
Location:          .env
Observed:          .env is tracked by git and assigns 3 variable(s). Secret-looking variables: DATABASE_URL, STRIPE_SECRET_KEY. Values are not shown.
Expected:          Environment files with real values stay out of version control. Only templates such as .env.example are committed, and .gitignore excludes .env files.
Risk:              A committed .env file usually holds live credentials, which are then exposed to everyone with repository access and remain in git history.
Recommendation:    Rotate any credentials the file contains, remove it from git with `git rm --cached`, add `.env*` to .gitignore, and commit a .env.example with empty values instead.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-01-16
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 19b2fdd7597cd865.
```

Example fix:

```
# .gitignore
.env
.env.*
!.env.example
```

### F-003 · Critical · CC6.1 · Hard-coded Stripe live key

```
Finding ID:        F-003
Criterion:         CC6.1
Severity:          Critical
Title:             Hard-coded Stripe live key
Location:          .env:3
Observed:          A Stripe live key (sk_l********) is present in .env at line 3. The value is redacted.
Expected:          No secrets in source, config files, images or history. Secrets are loaded at runtime from a secrets manager or environment.
Risk:              Anyone with read access to the repository, its forks or its history can use the credential. Leaked keys are routinely harvested within minutes of a public push.
Recommendation:    Revoke and rotate the credential first, then remove it from the code and load it from a secrets manager or environment variable. Rewriting git history does not un-leak a pushed secret.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-01-16
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 5abcffbf8a26b92f.
```

Example fix:

```
// Before
const stripe = new Stripe('sk_live_...');

// After
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

### F-004 · Critical · CC6.1 · Hard-coded private key

```
Finding ID:        F-004
Criterion:         CC6.1
Severity:          Critical
Title:             Hard-coded private key
Location:          config/deploy.pem:1
Observed:          A private key (key material) is present in config/deploy.pem at line 1. The value is redacted.
Expected:          No secrets in source, config files, images or history. Secrets are loaded at runtime from a secrets manager or environment.
Risk:              Anyone with read access to the repository, its forks or its history can use the credential. Leaked keys are routinely harvested within minutes of a public push.
Recommendation:    Revoke and rotate the credential first, then remove it from the code and load it from a secrets manager or environment variable. Rewriting git history does not un-leak a pushed secret.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-01-16
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 578d58a6ea3d3f78.
```

Example fix:

```
// Before
const stripe = new Stripe('sk_live_...');

// After
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

### F-005 · Critical · CC6.1 · Hard-coded AWS access key ID

```
Finding ID:        F-005
Criterion:         CC6.1
Severity:          Critical
Title:             Hard-coded AWS access key ID
Location:          src/config.js:3
Observed:          An AWS access key ID (AKIA********) is present in src/config.js at line 3. The value is redacted.
Expected:          No secrets in source, config files, images or history. Secrets are loaded at runtime from a secrets manager or environment.
Risk:              Anyone with read access to the repository, its forks or its history can use the credential. Leaked keys are routinely harvested within minutes of a public push.
Recommendation:    Revoke and rotate the credential first, then remove it from the code and load it from a secrets manager or environment variable. Rewriting git history does not un-leak a pushed secret.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-01-16
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 362be198fe5c6855.
```

Example fix:

```
// Before
const stripe = new Stripe('sk_live_...');

// After
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

### F-006 · Critical · CC6.1 · Hard-coded GitHub token

```
Finding ID:        F-006
Criterion:         CC6.1
Severity:          Critical
Title:             Hard-coded GitHub token
Location:          src/config.js:7
Observed:          A GitHub token (ghp_********) is present in src/config.js at line 7. The value is redacted.
Expected:          No secrets in source, config files, images or history. Secrets are loaded at runtime from a secrets manager or environment.
Risk:              Anyone with read access to the repository, its forks or its history can use the credential. Leaked keys are routinely harvested within minutes of a public push.
Recommendation:    Revoke and rotate the credential first, then remove it from the code and load it from a secrets manager or environment variable. Rewriting git history does not un-leak a pushed secret.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-01-16
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is bfc919acd0d513b7.
```

Example fix:

```
// Before
const stripe = new Stripe('sk_live_...');

// After
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

### F-007 · Critical · CC6.1 · JWTs accepted with the "none" algorithm

```
Finding ID:        F-007
Criterion:         CC6.1
Severity:          Critical
Title:             JWTs accepted with the "none" algorithm
Location:          src/server.js:31
Observed:          JWTs accepted with the "none" algorithm in src/server.js at line 31.
Expected:          JWTs are signed with strong algorithms and validated (alg, exp, aud, iss) on every request.
Risk:              An unverified or "none"-algorithm token lets anyone forge a session for any user.
Recommendation:    Always verify tokens with an explicit algorithm allow-list, and check exp, aud and iss. Use decode only for logging-free inspection of already-verified tokens.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-01-16
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is dbc842e483c9a34d.
```

Example fix:

```
const claims = jwt.verify(token, publicKey, {
  algorithms: ['RS256'], audience: 'api.example.com', issuer: 'https://auth.example.com/',
});
```

### F-008 · Critical · CC6.1 · Publicly accessible database: aws_db_instance.main

```
Finding ID:        F-008
Criterion:         CC6.1
Severity:          Critical
Title:             Publicly accessible database: aws_db_instance.main
Location:          infra/main.tf:12
Observed:          aws_db_instance.main sets publicly_accessible = true (detected by threesock's lightweight Terraform scanner).
Expected:          Data stores sit in private networks, are not publicly reachable, and require authentication.
Risk:              A publicly reachable database is one leaked or weak password away from a full data breach, and is scanned for continuously.
Recommendation:    Turn off public accessibility, place the database in private subnets, and reach it through the application, a bastion or a private endpoint.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-01-16
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is abc0c452ae79b734.
```

Example fix:

```
resource "aws_db_instance" "main" {
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.private.name
  vpc_security_group_ids = [aws_security_group.db.id]
}
```

### F-009 · Critical · CC6.6 · Public bucket ACL on aws_s3_bucket.exports

```
Finding ID:        F-009
Criterion:         CC6.6
Severity:          Critical
Title:             Public bucket ACL on aws_s3_bucket.exports
Location:          infra/main.tf:19
Observed:          aws_s3_bucket.exports sets acl = "public-read" (detected by threesock's lightweight Terraform scanner).
Expected:          Object storage is private by default, with public access blocks enabled; public content is served through a CDN with origin access control.
Risk:              Public buckets are one of the most common causes of large data exposures and are discovered by automated scanners.
Recommendation:    Remove public ACLs and allUsers bindings, enable the public access block, and serve intentionally public assets through a CDN with origin access control.
Controls:          Network Security; Vulnerability Management; Remote-Work Security
Policies:          Secure Configuration & Hardening; Remote Access & BYOD
Owner:             Unassigned
Due date:          2026-01-16
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 710b00c25be90b65.
```

Example fix:

```
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

### F-010 · High · CC3.3 · Authentication can be switched off by an environment variable

```
Finding ID:        F-010
Criterion:         CC3.3
Severity:          High
Title:             Authentication can be switched off by an environment variable
Location:          src/auth.js:6
Observed:          Authentication can be switched off by an environment variable in src/auth.js at line 6.
Expected:          Authentication cannot be switched off by a flag or environment variable, and no code grants privileges to a hard-coded username.
Risk:              A bypass meant for debugging reaches production sooner or later, giving anyone who finds it full access.
Recommendation:    Remove the bypass. For local development, use a seeded test user against the real auth path, and authorize by role, never by username.
Controls:          Risk Management; Segregation of duties; Security Logging
Policies:          Risk Management; Access Control & Least Privilege; Logging, Monitoring & Audit
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 53644da3b9edf3d1.
```

Example fix:

```
if (!session.user.roles.includes('admin')) return res.sendStatus(403);
```

### F-011 · High · CC3.3 · Privileges granted by comparing to a hard-coded username

```
Finding ID:        F-011
Criterion:         CC3.3
Severity:          High
Title:             Privileges granted by comparing to a hard-coded username
Location:          src/auth.js:7
Observed:          Privileges granted by comparing to a hard-coded username in src/auth.js at line 7.
Expected:          Authentication cannot be switched off by a flag or environment variable, and no code grants privileges to a hard-coded username.
Risk:              A bypass meant for debugging reaches production sooner or later, giving anyone who finds it full access.
Recommendation:    Remove the bypass. For local development, use a seeded test user against the real auth path, and authorize by role, never by username.
Controls:          Risk Management; Segregation of duties; Security Logging
Policies:          Risk Management; Access Control & Least Privilege; Logging, Monitoring & Audit
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 84838710166e87cf.
```

Example fix:

```
if (!session.user.roles.includes('admin')) return res.sendStatus(403);
```

### F-012 · High · CC5.2 · Long-lived cloud credentials in .github/workflows/ci.yml

```
Finding ID:        F-012
Criterion:         CC5.2
Severity:          High
Title:             Long-lived cloud credentials in .github/workflows/ci.yml
Location:          .github/workflows/ci.yml:22
Observed:          .github/workflows/ci.yml passes stored cloud keys to the workflow (line 22) instead of using OIDC.
Expected:          Workflows assume cloud roles through OIDC federation (id-token: write), so no long-lived cloud keys are stored as CI secrets.
Risk:              Long-lived cloud keys in CI leak through logs, forks and compromised actions, and stay valid until someone remembers to rotate them.
Recommendation:    Configure an OIDC trust between GitHub and your cloud, assume a scoped role in the workflow, and delete the stored keys.
Controls:          Configuration & Patch Management; Secure SDLC Integration; Credential Management; Endpoint Security; Endpoint Protection
Policies:          Secure Configuration & Hardening; Secure Software Development Lifecycle; Authentication & Password
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 4d89b8195decb0b5.
```

Example fix:

```
permissions:
  id-token: write
  contents: read
steps:
  - uses: aws-actions/configure-aws-credentials@<sha>  # pin to a commit SHA
    with:
      role-to-assume: arn:aws:iam::123456789012:role/deploy
      aws-region: us-east-1
```

### F-013 · High · CC5.2 · Script injection risk in .github/workflows/ci.yml

```
Finding ID:        F-013
Criterion:         CC5.2
Severity:          High
Title:             Script injection risk in .github/workflows/ci.yml
Location:          .github/workflows/ci.yml:12
Observed:          A run step in .github/workflows/ci.yml interpolates attacker-controllable event data at line 12.
Expected:          run: steps pass attacker-controllable values (issue titles, PR bodies, branch names) through environment variables, never `${{ }}` interpolation.
Risk:              A crafted issue title or branch name becomes shell code running in your workflow, with its token and secrets.
Recommendation:    Move the value into an environment variable and reference it as a quoted shell variable.
Controls:          Configuration & Patch Management; Secure SDLC Integration; Credential Management; Endpoint Security; Endpoint Protection
Policies:          Secure Configuration & Hardening; Secure Software Development Lifecycle; Authentication & Password
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 534af5d23c19ca4f.
```

Example fix:

```
- run: echo "Title: $TITLE"
  env:
    TITLE: ${{ github.event.issue.title }}
```

### F-014 · High · CC5.2 · Secret printed in .github/workflows/ci.yml

```
Finding ID:        F-014
Criterion:         CC5.2
Severity:          High
Title:             Secret printed in .github/workflows/ci.yml
Location:          .github/workflows/ci.yml:14
Observed:          A run step prints a secret in .github/workflows/ci.yml at line 14.
Expected:          Workflows never print secrets; they pass them to tools through environment variables or files.
Risk:              Masking is best-effort: transformed or partial values slip through, and logs are readable by everyone with repository read access.
Recommendation:    Remove the echo. Pass the secret through env and let the tool read it, or write it to a file with restricted permissions.
Controls:          Configuration & Patch Management; Secure SDLC Integration; Credential Management; Endpoint Security; Endpoint Protection
Policies:          Secure Configuration & Hardening; Secure Software Development Lifecycle; Authentication & Password
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 39cc5f9477bf680e.
```

Example fix:

```
- run: ./deploy.sh
  env:
    DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

### F-015 · High · CC5.2 · write-all token permissions in .github/workflows/ci.yml

```
Finding ID:        F-015
Criterion:         CC5.2
Severity:          High
Title:             write-all token permissions in .github/workflows/ci.yml
Location:          .github/workflows/ci.yml:3
Observed:          .github/workflows/ci.yml grants permissions: write-all at line 3.
Expected:          Each workflow declares `permissions:` (read-only by default) and grants write scopes only to the jobs that need them. Nothing uses write-all.
Risk:              A broad GITHUB_TOKEN lets any compromised step push code, create releases or change repository settings.
Recommendation:    Set a read-only default at the top of each workflow and grant specific write scopes per job.
Controls:          Configuration & Patch Management; Secure SDLC Integration; Credential Management; Endpoint Security; Endpoint Protection
Policies:          Secure Configuration & Hardening; Secure Software Development Lifecycle; Authentication & Password
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is be121b3e14b471ef.
```

Example fix:

```
permissions:
  contents: read
jobs:
  release:
    permissions:
      contents: write
      id-token: write
```

### F-016 · High · CC6.1 · Hard-coded database URL with password

```
Finding ID:        F-016
Criterion:         CC6.1
Severity:          High
Title:             Hard-coded database URL with password
Location:          .env:2
Observed:          A database URL with password (Vq8********) is present in .env at line 2. The value is redacted.
Expected:          No secrets in source, config files, images or history. Secrets are loaded at runtime from a secrets manager or environment.
Risk:              Anyone with read access to the repository, its forks or its history can use the credential. Leaked keys are routinely harvested within minutes of a public push.
Recommendation:    Revoke and rotate the credential first, then remove it from the code and load it from a secrets manager or environment variable. Rewriting git history does not un-leak a pushed secret.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 01a87178c156b224.
```

Example fix:

```
// Before
const stripe = new Stripe('sk_live_...');

// After
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

### F-017 · High · CC6.1 · IAM policy allows every action ("*")

```
Finding ID:        F-017
Criterion:         CC6.1
Severity:          High
Title:             IAM policy allows every action ("*")
Location:          infra/main.tf:27
Observed:          IAM policy allows every action ("*") in infra/main.tf at line 27.
Expected:          IAM roles and policies grant specific actions on specific resources; no "*" actions and no primitive owner/editor roles.
Risk:              A wildcard policy turns any compromise of that identity into full control of the account.
Recommendation:    Replace wildcards with the specific actions the workload needs. IAM Access Analyzer or CloudTrail-based policy generation can produce a least-privilege policy from real usage.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 9a99d0ea6971b2f7.
```

Example fix:

```
data "aws_iam_policy_document" "app" {
  statement {
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.uploads.arn}/*"]
  }
}
```

### F-018 · High · CC6.1 · Password hashed with a fast, general-purpose hash function

```
Finding ID:        F-018
Criterion:         CC6.1
Severity:          High
Title:             Password hashed with a fast, general-purpose hash function
Location:          src/server.js:27
Observed:          Password hashed with a fast, general-purpose hash function in src/server.js at line 27.
Expected:          Passwords are hashed with Argon2id, bcrypt or scrypt (rubric 1.4). Fast hashes such as MD5, SHA-1 or SHA-256 are never used for passwords.
Risk:              Fast hashes can be brute-forced at billions of guesses per second, so a database leak becomes a credential leak.
Recommendation:    Hash passwords with Argon2id (preferred), bcrypt or scrypt through a maintained library, and rehash on next login when migrating.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 512fd13149795fb3.
```

Example fix:

```
import argon2 from 'argon2';
const hash = await argon2.hash(password, { type: argon2.argon2id });
const ok = await argon2.verify(hash, candidate);
```

### F-019 · High · CC6.2 · Whole request body spread into a database write

```
Finding ID:        F-019
Criterion:         CC6.2
Severity:          High
Title:             Whole request body spread into a database write
Location:          src/auth.js:17
Observed:          Whole request body spread into a database write in src/auth.js at line 17.
Expected:          Create and update handlers copy only allow-listed fields from requests; roles and permissions are set by privileged code paths only.
Risk:              Mass assignment lets a user send `"role": "admin"` in a signup or profile update and become an administrator.
Recommendation:    Validate request bodies against a schema of allowed fields and set roles explicitly on the server.
Controls:          Access Rights; Personnel Security
Policies:          Access Control & Least Privilege; Background Screening & On/Off-boarding
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 4652b4f328c9728c.
```

Example fix:

```
const input = SignupSchema.parse(req.body); // { email, password, name } only
await User.create({ ...input, role: 'member' });
```

### F-020 · High · CC6.6 · CORS allows any origin with credentials

```
Finding ID:        F-020
Criterion:         CC6.6
Severity:          High
Title:             CORS allows any origin with credentials
Location:          src/server.js:12
Observed:          src/server.js allows any (or reflected) origin at line 12 and also enables credentials.
Expected:          Credentialed CORS is limited to an explicit allow-list of origins; wildcard or reflected origins are only used for public, credential-less APIs.
Risk:              Any website a user visits can make authenticated requests to the API and read the responses.
Recommendation:    Replace the wildcard or reflected origin with an explicit list of trusted origins, or drop credentials for truly public endpoints.
Controls:          Network Security; Vulnerability Management; Remote-Work Security
Policies:          Secure Configuration & Hardening; Remote Access & BYOD
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is bded86cd02c319b9.
```

Example fix:

```
app.use(cors({ origin: ['https://app.example.com'], credentials: true }));
```

### F-021 · High · CC6.6 · Dynamic evaluation of a string as code

```
Finding ID:        F-021
Criterion:         CC6.6
Severity:          High
Title:             Dynamic evaluation of a string as code
Location:          src/server.js:22
Observed:          Dynamic evaluation of a string as code in src/server.js at line 22.
Expected:          Code never evaluates strings as code, never builds shell commands from strings, and never deserializes untrusted data with unsafe loaders.
Risk:              If any part of the evaluated string or command can be influenced by a user, the result is remote code execution.
Recommendation:    Replace dynamic evaluation with explicit logic, pass command arguments as an array without a shell, and use safe loaders (json, yaml.safe_load).
Controls:          Network Security; Vulnerability Management; Remote-Work Security
Policies:          Secure Configuration & Hardening; Remote Access & BYOD
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 665117d0ae33f77c.
```

Example fix:

```
# Python: argument list, no shell
subprocess.run(["convert", src, dst], check=True)

// Node: execFile with arguments, no shell
execFile('convert', [src, dst]);
```

### F-022 · High · CC6.6 · Shell command built with string interpolation

```
Finding ID:        F-022
Criterion:         CC6.6
Severity:          High
Title:             Shell command built with string interpolation
Location:          src/server.js:23
Observed:          Shell command built with string interpolation in src/server.js at line 23.
Expected:          Code never evaluates strings as code, never builds shell commands from strings, and never deserializes untrusted data with unsafe loaders.
Risk:              If any part of the evaluated string or command can be influenced by a user, the result is remote code execution.
Recommendation:    Replace dynamic evaluation with explicit logic, pass command arguments as an array without a shell, and use safe loaders (json, yaml.safe_load).
Controls:          Network Security; Vulnerability Management; Remote-Work Security
Policies:          Secure Configuration & Hardening; Remote Access & BYOD
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is ffbea44c97b0072a.
```

Example fix:

```
# Python: argument list, no shell
subprocess.run(["convert", src, dst], check=True)

// Node: execFile with arguments, no shell
execFile('convert', [src, dst]);
```

### F-023 · High · CC6.6 · SSH (22) open to the internet in aws_security_group.bastion

```
Finding ID:        F-023
Criterion:         CC6.6
Severity:          High
Title:             SSH (22) open to the internet in aws_security_group.bastion
Location:          infra/main.tf:4
Observed:          aws_security_group.bastion allows ingress from 0.0.0.0/0 to SSH (22) (detected by threesock's lightweight Terraform scanner).
Expected:          Firewall rules never allow 0.0.0.0/0 or ::/0 to admin ports (SSH, RDP) or data ports (PostgreSQL, MySQL, Redis, MongoDB, ...).
Risk:              Internet-exposed admin and database ports are scanned constantly and are a leading entry point for breaches and ransomware.
Recommendation:    Restrict ingress to known CIDRs or security groups, and reach admin interfaces through a VPN, bastion, SSM Session Manager or an identity-aware proxy.
Controls:          Network Security; Vulnerability Management; Remote-Work Security
Policies:          Secure Configuration & Hardening; Remote Access & BYOD
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is a018d583cbc96df7.
```

Example fix:

```
ingress {
  from_port       = 5432
  to_port         = 5432
  protocol        = "tcp"
  security_groups = [aws_security_group.app.id]  # not 0.0.0.0/0
}
```

### F-024 · High · CC6.6 · SQL built from strings

```
Finding ID:        F-024
Criterion:         CC6.6
Severity:          High
Title:             SQL built from strings
Location:          src/server.js:24
Observed:          SQL query built with template literal interpolation in src/server.js at line 24.
Expected:          Queries use bound parameters or a query builder; user input is never concatenated or interpolated into SQL.
Risk:              String-built SQL is the classic injection flaw: one unescaped value can read, change or delete the whole database.
Recommendation:    Pass values as bound parameters (placeholders) or use a tagged template or query builder that parameterizes for you.
Controls:          Network Security; Vulnerability Management; Remote-Work Security
Policies:          Secure Configuration & Hardening; Remote Access & BYOD
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 1a0881ed5c779226.
```

Example fix:

```
// Node (pg)
await db.query('SELECT * FROM users WHERE id = $1', [id]);

# Python (psycopg)
cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
```

### F-025 · High · CC6.7 · Node TLS client with certificate rejection turned off

```
Finding ID:        F-025
Criterion:         CC6.7
Severity:          High
Title:             Node TLS client with certificate rejection turned off
Location:          src/server.js:36
Observed:          Node TLS client with certificate rejection turned off in src/server.js at line 36.
Expected:          Every TLS client validates certificates and hostnames. Private CAs are trusted explicitly instead of turning validation off.
Risk:              With validation off, anyone on the network path can impersonate the server and read or alter traffic, including credentials.
Recommendation:    Remove the override. For internal or self-signed services, trust the specific CA bundle instead.
Controls:          Secure Data Transfer; Network Security
Policies:          Encryption & Crypto Controls; Information Sharing & Transfer
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is a4a096edf2831697.
```

Example fix:

```
// Node: trust a private CA instead of disabling checks
https.request(url, { ca: fs.readFileSync('certs/internal-ca.pem') });

# Python
requests.get(url, verify="certs/internal-ca.pem")
```

### F-026 · High · CC6.7 · Weak cipher (DES, 3DES, RC4, Blowfish or ECB mode)

```
Finding ID:        F-026
Criterion:         CC6.7
Severity:          High
Title:             Weak cipher (DES, 3DES, RC4, Blowfish or ECB mode)
Location:          src/server.js:41
Observed:          Weak cipher (DES, 3DES, RC4, Blowfish or ECB mode) in src/server.js at line 41.
Expected:          TLS endpoints and clients require at least the configured minimum version (default 1.2), and code uses modern ciphers (AES-GCM, ChaCha20-Poly1305).
Risk:              Legacy protocols and ciphers have practical attacks that expose traffic or encrypted data.
Recommendation:    Raise the minimum TLS version to 1.2 or 1.3 and replace legacy ciphers with an authenticated cipher such as AES-256-GCM.
Controls:          Secure Data Transfer; Network Security
Policies:          Encryption & Crypto Controls; Information Sharing & Transfer
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 731d8c5f1ef22bf4.
```

Example fix:

```
tls.createServer({ minVersion: 'TLSv1.3', key, cert });
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
```

### F-027 · High · CC6.7 · Webhook handler without signature verification

```
Finding ID:        F-027
Criterion:         CC6.7
Severity:          High
Title:             Webhook handler without signature verification
Location:          src/webhooks.js:7
Observed:          src/webhooks.js handles webhooks at line 7, but no signature verification was found.
Expected:          Every webhook handler verifies the sender signature over the raw body, with a constant-time comparison, before acting.
Risk:              Unsigned webhooks let anyone forge events such as "payment succeeded" or "user verified".
Recommendation:    Verify the provider signature with its SDK (or an HMAC over the raw body with timingSafeEqual) before processing.
Controls:          Secure Data Transfer; Network Security
Policies:          Encryption & Crypto Controls; Information Sharing & Transfer
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is bddf14bf0738a3f6.
```

Example fix:

```
const event = stripe.webhooks.constructEvent(rawBody, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
```

### F-028 · High · CC6.8 · Remote script piped straight into a shell

```
Finding ID:        F-028
Criterion:         CC6.8
Severity:          High
Title:             Remote script piped straight into a shell
Location:          Dockerfile:5
Observed:          Remote script piped straight into a shell in Dockerfile at line 5.
Expected:          Downloaded tools and scripts are verified with a checksum or signature before they run.
Risk:              Piping a remote script to a shell runs whatever the server (or anyone who compromises it) sends, inside your build.
Recommendation:    Download to a file, verify its checksum or signature, then run it, or install from a package manager.
Controls:          Configuration & Patch Management; Endpoint Protection; Secure SDLC Integration; Supplier Security
Policies:          Vulnerability & Patch Management; Secure Software Development Lifecycle; Vendor & Third-Party Risk
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 309d1158cf9e78ea.
```

Example fix:

```
curl -fsSLo install.sh https://example.com/install.sh
echo "<sha256>  install.sh" | sha256sum -c -
sh install.sh
```

### F-029 · High · CC6.8 · No lockfile for package.json

```
Finding ID:        F-029
Criterion:         CC6.8
Severity:          High
Title:             No lockfile for package.json
Location:          package.json
Observed:          package.json declares npm dependencies but no lockfile (package-lock.json, npm-shrinkwrap.json, pnpm-lock.yaml, yarn.lock, bun.lock, bun.lockb) is committed.
Expected:          Every dependency manifest has a committed lockfile (or hash-pinned requirements) so installs are reproducible.
Risk:              Without a lockfile, each install can pull different, possibly compromised, versions, and a build cannot be reproduced.
Recommendation:    Generate the lockfile with your package manager, commit it, and install with the frozen/ci mode in CI.
Controls:          Configuration & Patch Management; Endpoint Protection; Secure SDLC Integration; Supplier Security
Policies:          Vulnerability & Patch Management; Secure Software Development Lifecycle; Vendor & Third-Party Risk
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 8f9488b34667e010.
```

Example fix:

```
pnpm install && git add pnpm-lock.yaml       # Node
uv lock && git add uv.lock                    # Python
pip-compile --generate-hashes requirements.in # pip
```

### F-030 · High · CC7.2 · Request body or headers passed to a logger

```
Finding ID:        F-030
Criterion:         CC7.2
Severity:          High
Title:             Request body or headers passed to a logger
Location:          src/auth.js:16
Observed:          Request body or headers passed to a logger in src/auth.js at line 16.
Expected:          Logs never contain passwords, tokens, authorization headers, full request bodies or card numbers.
Risk:              Logs are copied widely (log platforms, support tools, laptops). Credentials in them become a breach with a long tail.
Recommendation:    Log identifiers and outcomes, not payloads. Use a logger with redaction paths for anything sensitive.
Controls:          Security Monitoring & Detection; Security Logging
Policies:          Logging, Monitoring & Audit
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is eb77d5808f5e2c89.
```

Example fix:

```
const log = pino({ redact: ['req.headers.authorization', 'req.body.password'] });
log.info({ userId, outcome: 'login_failed' });
```

### F-031 · High · CC7.4 · No incident response plan

```
Finding ID:        F-031
Criterion:         CC7.4
Severity:          High
Title:             No incident response plan
Location:          repository
Observed:          No incident response plan was found in the repository's documentation.
Expected:          An incident response plan defines roles, severity levels, escalation paths and how internal and external communication happens.
Risk:              During an incident, an undocumented process means slow, inconsistent response and missed notification deadlines.
Recommendation:    Write docs/security/incident-response.md covering who leads, how severity is set, when to escalate, and who tells customers and regulators.
Controls:          Security Incident Management
Policies:          Incident Response & Breach Notification
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is f3e66946d186a412.
```

Example fix:

```
## Roles
Incident lead: on-call engineer. Comms: head of support.
## Severity
SEV1: data exposure or full outage. SEV2: partial outage. SEV3: minor.
## Escalation
SEV1 pages the CTO within 15 minutes.
## Communication
Status page within 30 minutes; customers notified within 72 hours of a confirmed breach.
```

### F-032 · High · CC8.1 · Tests do not run on pull requests

```
Finding ID:        F-032
Criterion:         CC8.1
Severity:          High
Title:             Tests do not run on pull requests
Location:          repository
Observed:          No workflow is triggered by pull_request.
Expected:          A CI pipeline runs automated tests and lint on every pull request, and branch protection requires it to pass before merge.
Risk:              Without a test gate, broken or unreviewed behaviour reaches the default branch and production.
Recommendation:    Add a pull-request workflow that runs tests and lint, then make it a required status check.
Controls:          Change management; Secure SDLC Integration; Segregation of duties
Policies:          Change & Release Management; Secure Software Development Lifecycle
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 39ca38eb997ecb43.
```

Example fix:

```
on: pull_request
permissions: { contents: read }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>
      - run: npm ci && npm run lint && npm test
```

### F-033 · High · CC8.1 · Terraform uses local state

```
Finding ID:        F-033
Criterion:         CC8.1
Severity:          High
Title:             Terraform uses local state
Location:          repository
Observed:          No backend or cloud block was found in 1 Terraform file(s) (detected by threesock's lightweight Terraform scanner), so state is local to whoever runs apply.
Expected:          Terraform state lives in a remote, locked, access-controlled backend, and state files are never committed.
Risk:              State files contain secrets in plain text, and unlocked or local state lets concurrent applies corrupt infrastructure.
Recommendation:    Configure a remote backend with locking, remove committed state from git (and rotate any secrets it held), and gitignore *.tfstate.
Controls:          Change management; Secure SDLC Integration; Segregation of duties
Policies:          Change & Release Management; Secure Software Development Lifecycle
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 2a1bb17d45e5f72a.
```

Example fix:

```
terraform {
  backend "s3" {
    bucket       = "acme-terraform-state"
    key          = "prod/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
```

### F-034 · High · A1.2 · No reliable backups for aws_db_instance.main

```
Finding ID:        F-034
Criterion:         A1.2
Severity:          High
Title:             No reliable backups for aws_db_instance.main
Location:          infra/main.tf:12
Observed:          aws_db_instance.main sets backup_retention_period = 0 (detected by threesock's lightweight Terraform scanner).
Expected:          Every database has automated backups with a retention policy, and point-in-time recovery where supported.
Risk:              A bad migration, deletion or ransomware event with no backup is permanent data loss.
Recommendation:    Enable automated backups with explicit retention (and PITR), or cover the stores with an AWS Backup plan.
Controls:          Disaster Recovery Planning; Physical Access Control
Policies:          Backup, Business Continuity & Disaster Recovery; Physical Security & Environmental
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is ccf9494442fb333a.
```

Example fix:

```
resource "aws_db_instance" "main" {
  backup_retention_period = 14
}
resource "aws_dynamodb_table" "events" {
  point_in_time_recovery { enabled = true }
}
```

### F-035 · High · C1.1 · Unencrypted data store: aws_db_instance.main

```
Finding ID:        F-035
Criterion:         C1.1
Severity:          High
Title:             Unencrypted data store: aws_db_instance.main
Location:          infra/main.tf:12
Observed:          aws_db_instance.main does not set storage_encrypted = true (detected by threesock's lightweight Terraform scanner).
Expected:          Every database, volume, file system and cache is encrypted at rest, preferably with managed KMS keys.
Risk:              Unencrypted storage exposes data through snapshots, decommissioned disks and backup copies.
Recommendation:    Enable encryption at rest on every data store (it usually requires a replacement for existing RDS instances: snapshot, copy encrypted, restore).
Controls:          Information Classification; Encrypted Data at Rest; Encryption Key Management; Access Rights
Policies:          Data Classification & Handling; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 8c477cd12be1c9a3.
```

Example fix:

```
resource "aws_db_instance" "main" {
  storage_encrypted = true
  kms_key_id        = aws_kms_key.data.arn
}
```

### F-036 · High · P2.1 · Trackers load without a consent check

```
Finding ID:        F-036
Criterion:         P2.1
Severity:          High
Title:             Trackers load without a consent check
Location:          package.json:11
Observed:          Mixpanel is loaded, but no consent manager or consent check was found.
Expected:          Non-essential trackers (analytics, advertising, session recording) are gated on recorded consent, and Global Privacy Control is respected where required.
Risk:              Trackers firing before consent breach ePrivacy and GDPR rules and the privacy notice, and are a rubric red flag.
Recommendation:    Load trackers only after the visitor opts in (a consent manager or your own gate), default to opted-out, and honour navigator.globalPrivacyControl.
Controls:          Data Privacy
Policies:          Privacy & Data-Subject Rights
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is a558be091df652c6.
```

Example fix:

```
posthog.init(KEY, { opt_out_capturing_by_default: true });
if (consent.analytics && !navigator.globalPrivacyControl) posthog.opt_in_capturing();
```

### F-037 · Medium · CC1.3 · No CODEOWNERS file

```
Finding ID:        F-037
Criterion:         CC1.3
Severity:          Medium
Title:             No CODEOWNERS file
Location:          repository
Observed:          No CODEOWNERS file found in .github/, the root or docs/.
Expected:          A CODEOWNERS file assigns an owner to every directory, with named teams on security-sensitive paths.
Risk:              Changes to unowned code can merge without review from anyone accountable for it.
Recommendation:    Add .github/CODEOWNERS with a catch-all owner and named teams for sensitive paths, then require code owner review in branch protection.
Controls:          Organization Structure & Reporting Lines; Security Governance Roles; Segregation of duties
Policies:          Information Security & Privacy Governance; Access Control & Least Privilege
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 3c1304ef0ce0a8d3.
```

Example fix:

```
# .github/CODEOWNERS
*                 @your-org/engineering
/src/auth/        @your-org/security
/infra/           @your-org/platform
```

### F-038 · Medium · CC2.3 · No vulnerability disclosure policy

```
Finding ID:        F-038
Criterion:         CC2.3
Severity:          Medium
Title:             No vulnerability disclosure policy
Location:          repository
Observed:          No SECURITY.md or security.txt found (looked in SECURITY.md, .github/SECURITY.md, docs/SECURITY.md, .well-known/security.txt, public/.well-known/security.txt, static/.well-known/security.txt).
Expected:          A SECURITY.md (or /.well-known/security.txt) tells external researchers how to report a vulnerability and what response to expect.
Risk:              Without a published channel, vulnerabilities get reported publicly, to the wrong person, or not at all.
Recommendation:    Add SECURITY.md at the repository root with a private reporting channel, supported versions and expected response time.
Controls:          Regulatory Liaison; Security Incident Management; Data Privacy; Supplier Security
Policies:          Incident Response & Breach Notification; Privacy & Data-Subject Rights; Vendor & Third-Party Risk
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 9f8fe6464cbd7a34.
```

Example fix:

```
# Security policy

## Reporting a vulnerability
Email security@example.com or use GitHub private vulnerability reporting.
We acknowledge reports within 2 business days and aim to fix Critical issues within 7 days.
```

### F-039 · Medium · CC3.2 · No risk register

```
Finding ID:        F-039
Criterion:         CC3.2
Severity:          Medium
Title:             No risk register
Location:          repository
Observed:          No risk register was found in the repository's documentation.
Expected:          Risks are recorded with likelihood, impact, an owner and a treatment decision, and link to tracking issues.
Risk:              Unrecorded risks have no owner, so they are neither fixed nor consciously accepted.
Recommendation:    Keep a risk register (a Markdown table is fine) and review it at least quarterly.
Controls:          Risk Management; Vulnerability Management
Policies:          Risk Management; Vulnerability & Patch Management
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 77e4d97527a22b7e.
```

Example fix:

```
| Risk | Likelihood | Impact | Owner | Treatment |
|---|---|---|---|---|
| Leaked deploy key | Low | High | @platform | Mitigate: OIDC, no stored keys |
```

### F-040 · Medium · CC3.2 · No threat model

```
Finding ID:        F-040
Criterion:         CC3.2
Severity:          Medium
Title:             No threat model
Location:          repository
Observed:          No threat model was found in the repository's documentation.
Expected:          A threat model names the assets, trust boundaries, threats and mitigations for the system, and is updated with major changes.
Risk:              Without one, security work follows whatever is noticed rather than what matters most, and design flaws ship unexamined.
Recommendation:    Write a short threat model (docs/security/threat-model.md): what you protect, where untrusted input enters, what could go wrong (STRIDE works), and what stops it.
Controls:          Risk Management; Vulnerability Management
Policies:          Risk Management; Vulnerability & Patch Management
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 6ae91c3bc21beb3a.
```

Example fix:

```
# Threat model
## Assets
Customer PII in Postgres; API keys for payment providers.
## Trust boundaries
Public API, admin console, webhook endpoint.
## Threats and mitigations
| Threat | Mitigation |
|---|---|
| Forged webhook | Signature verification |
```

### F-041 · Medium · CC4.1 · Infrastructure code is not scanned

```
Finding ID:        F-041
Criterion:         CC4.1
Severity:          Medium
Title:             Infrastructure code is not scanned
Location:          repository
Observed:          The repository defines infrastructure, but no IaC scanner (Checkov, Trivy config, tfsec, KICS, hadolint, kube-linter, ...) runs in CI.
Expected:          Terraform, Kubernetes, CloudFormation and Dockerfiles are scanned for misconfigurations (Checkov, Trivy config, tfsec, hadolint, ...) on every change.
Risk:              Misconfigurations such as public buckets or open ports are the leading cause of cloud breaches, and are cheap to catch before apply.
Recommendation:    Run Checkov or Trivy in config mode on pull requests that touch infrastructure.
Controls:          Vulnerability Management; Security Monitoring & Detection; Policy Compliance; Access Rights
Policies:          Vulnerability & Patch Management; Compliance & Regulatory Monitoring
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 8b2c446528141102.
```

Example fix:

```
- run: trivy config --exit-code 1 --severity HIGH,CRITICAL .
```

### F-042 · Medium · CC4.1 · No static analysis in CI

```
Finding ID:        F-042
Criterion:         CC4.1
Severity:          Medium
Title:             No static analysis in CI
Location:          repository
Observed:          No SAST tool (CodeQL, Semgrep, Bandit, gosec, SonarQube, ...) runs in CI. GitHub CodeQL default setup is not visible from the repository; if it is enabled, add an exception that says so.
Expected:          A SAST tool (CodeQL, Semgrep, Bandit, gosec, ...) runs on every pull request.
Risk:              Injection and other code-level flaws reach production without automated review.
Recommendation:    Enable CodeQL (GitHub default setup or a workflow) or run Semgrep on pull requests.
Controls:          Vulnerability Management; Security Monitoring & Detection; Policy Compliance; Access Rights
Policies:          Vulnerability & Patch Management; Compliance & Regulatory Monitoring
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is e0d61d296e682e2d.
```

Example fix:

```
- uses: github/codeql-action/init@<sha>  # pin to a commit SHA
  with: { languages: javascript-typescript }
- uses: github/codeql-action/analyze@<sha>
```

### F-043 · Medium · CC4.2 · Non-blocking security scan in .github/workflows/ci.yml

```
Finding ID:        F-043
Criterion:         CC4.2
Severity:          Medium
Title:             Non-blocking security scan in .github/workflows/ci.yml
Location:          .github/workflows/ci.yml:15
Observed:          The scan at line 15 of .github/workflows/ci.yml is configured not to fail the pipeline.
Expected:          Security scan steps fail the pipeline on Critical/High findings instead of reporting and carrying on.
Risk:              Non-blocking scanners produce reports nobody reads; known issues merge anyway.
Recommendation:    Remove continue-on-error / "|| true" from scan steps and set the scanner to fail on Critical and High.
Controls:          Vulnerability Management; Policy Compliance
Policies:          Vulnerability & Patch Management; Policy Management & Exception Handling
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 1a04e51ee5fb35fd.
```

Example fix:

```
- run: trivy fs --exit-code 1 --severity CRITICAL,HIGH .
```

### F-044 · Medium · CC4.2 · No vulnerability remediation policy

```
Finding ID:        F-044
Criterion:         CC4.2
Severity:          Medium
Title:             No vulnerability remediation policy
Location:          repository
Observed:          No vulnerability remediation policy was found in the repository's documentation.
Expected:          Remediation deadlines are defined per severity (e.g. Critical 7 days, High 30) and overdue findings are escalated.
Risk:              Without deadlines, known vulnerabilities age indefinitely, and auditors flag aged Critical/High findings as a control failure.
Recommendation:    Publish remediation SLAs per severity and an escalation path for overdue findings, and configure the same values in threesock.yaml.
Controls:          Vulnerability Management; Policy Compliance
Policies:          Vulnerability & Patch Management; Policy Management & Exception Handling
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 851e178537973934.
```

Example fix:

```
| Severity | Fix within |
|---|---|
| Critical | 7 days |
| High | 30 days |
Overdue findings are escalated to the engineering lead; exceptions need an approver and expiry.
```

### F-045 · Medium · CC4.2 · Unexplained entries in .trivyignore

```
Finding ID:        F-045
Criterion:         CC4.2
Severity:          Medium
Title:             Unexplained entries in .trivyignore
Location:          .trivyignore:1
Observed:          1 entry in .trivyignore have no comment explaining why.
Expected:          Every suppression of a security finding says why (and ideally who approved it and until when).
Risk:              Unexplained suppressions hide real vulnerabilities and cannot be reviewed; auditors treat blanket suppressions as a red flag.
Recommendation:    Add the rule id and a reason to each suppression, or move it into threesock.yaml exceptions with an approver and expiry.
Controls:          Vulnerability Management; Policy Compliance
Policies:          Vulnerability & Patch Management; Policy Management & Exception Handling
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 1ccc5bcdef082ee4.
```

Example fix:

```
subprocess.run(cmd, shell=True)  # nosec B602: cmd is a fixed literal, no user input (SEC-41)
```

### F-046 · Medium · CC4.2 · 1 unexplained security suppression in infra/main.tf

```
Finding ID:        F-046
Criterion:         CC4.2
Severity:          Medium
Title:             1 unexplained security suppression in infra/main.tf
Location:          infra/main.tf:16
Observed:          IaC scanner skip without a reason at line 16.
Expected:          Every suppression of a security finding says why (and ideally who approved it and until when).
Risk:              Unexplained suppressions hide real vulnerabilities and cannot be reviewed; auditors treat blanket suppressions as a red flag.
Recommendation:    Add the rule id and a reason to each suppression, or move it into threesock.yaml exceptions with an approver and expiry.
Controls:          Vulnerability Management; Policy Compliance
Policies:          Vulnerability & Patch Management; Policy Management & Exception Handling
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 17afa8e513c40558.
```

Example fix:

```
subprocess.run(cmd, shell=True)  # nosec B602: cmd is a fixed literal, no user input (SEC-41)
```

### F-047 · Medium · CC5.2 · 3 actions not pinned to a SHA in .github/workflows/ci.yml

```
Finding ID:        F-047
Criterion:         CC5.2
Severity:          Medium
Title:             3 actions not pinned to a SHA in .github/workflows/ci.yml
Location:          .github/workflows/ci.yml:8
Observed:          Unpinned: actions/checkout@v4 (line 8), some-org/setup-deploy@main (line 19), aws-actions/configure-aws-credentials@v4 (line 20).
Expected:          Every third-party action is pinned to a full 40-character commit SHA (with the version in a comment), so a moved tag cannot change what runs.
Risk:              Tags can be moved. A compromised action tag (as in the tj-actions/changed-files incident) runs attacker code with your workflow's secrets.
Recommendation:    Pin each action to the commit SHA of the release you reviewed, keep the version as a comment, and let Dependabot update the pins.
Controls:          Configuration & Patch Management; Secure SDLC Integration; Credential Management; Endpoint Security; Endpoint Protection
Policies:          Secure Configuration & Hardening; Secure Software Development Lifecycle; Authentication & Password
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is b286c79acb36cf93.
```

Example fix:

```
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```

### F-048 · Medium · CC5.2 · Deploy job without an environment: deploy

```
Finding ID:        F-048
Criterion:         CC5.2
Severity:          Medium
Title:             Deploy job without an environment: deploy
Location:          .github/workflows/ci.yml:16
Observed:          Job deploy in .github/workflows/ci.yml deploys or publishes without an environment, so no reviewer or branch gate applies.
Expected:          Jobs that deploy or publish run in a GitHub environment, so required reviewers, branch restrictions and environment-scoped secrets apply.
Risk:              Without an environment gate, anyone who can push to a triggering branch can deploy to production.
Recommendation:    Add `environment: production` to deploy jobs and configure required reviewers and deployment branch rules on that environment.
Controls:          Configuration & Patch Management; Secure SDLC Integration; Credential Management; Endpoint Security; Endpoint Protection
Policies:          Secure Configuration & Hardening; Secure Software Development Lifecycle; Authentication & Password
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 9b80fea4d7c398f9.
```

Example fix:

```
jobs:
  deploy:
    environment: production
    runs-on: ubuntu-latest
```

### F-049 · Medium · CC5.3 · No documented procedure for onboarding, offboarding, deployment, rollback, incident response, key rotation, access reviews

```
Finding ID:        F-049
Criterion:         CC5.3
Severity:          Medium
Title:             No documented procedure for onboarding, offboarding, deployment, rollback, incident response, key rotation, access reviews
Location:          repository
Observed:          Procedures found for 0 of 7 core processes (by heading); missing: onboarding, offboarding, deployment, rollback, incident response, key rotation, access reviews.
Expected:          Runbooks cover onboarding, offboarding, deployment, rollback, incident response, key rotation and access reviews.
Risk:              Undocumented procedures are performed inconsistently and cannot be shown to an auditor.
Recommendation:    Add a section (heading) for each missing procedure to your runbooks.
Controls:          Standard Operating Procedures (SOPs); Policy Compliance
Policies:          Policy Management & Exception Handling
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is f4fd96f0ec240f17.
```

Example fix:

```
docs/runbooks/
  access.md     # onboarding, offboarding, access reviews
  release.md    # deployment and rollback
  incidents.md  # incident response
  secrets.md    # key rotation
```

### F-050 · Medium · CC6.1 · Session cookie is readable from JavaScript (HttpOnly disabled)

```
Finding ID:        F-050
Criterion:         CC6.1
Severity:          Medium
Title:             Session cookie is readable from JavaScript (HttpOnly disabled)
Location:          src/server.js:16
Observed:          Session cookie is readable from JavaScript (HttpOnly disabled) in src/server.js at line 16.
Expected:          Session and auth cookies set HttpOnly, Secure and SameSite.
Risk:              Without HttpOnly an XSS bug can steal sessions; without Secure the cookie can leak over plain HTTP.
Recommendation:    Set httpOnly, secure and sameSite on every session or auth cookie. Use an environment check only to relax Secure for local HTTP development.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 867f41806c1540c5.
```

Example fix:

```
app.use(session({
  cookie: { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 },
}));
```

### F-051 · Medium · CC6.1 · JWT decoded without verifying its signature

```
Finding ID:        F-051
Criterion:         CC6.1
Severity:          Medium
Title:             JWT decoded without verifying its signature
Location:          src/server.js:32
Observed:          JWT decoded without verifying its signature in src/server.js at line 32.
Expected:          JWTs are signed with strong algorithms and validated (alg, exp, aud, iss) on every request.
Risk:              An unverified or "none"-algorithm token lets anyone forge a session for any user.
Recommendation:    Always verify tokens with an explicit algorithm allow-list, and check exp, aud and iss. Use decode only for logging-free inspection of already-verified tokens.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is f62b4c3dcce53a1e.
```

Example fix:

```
const claims = jwt.verify(token, publicKey, {
  algorithms: ['RS256'], audience: 'api.example.com', issuer: 'https://auth.example.com/',
});
```

### F-052 · Medium · CC6.1 · No automated secret scanning

```
Finding ID:        F-052
Criterion:         CC6.1
Severity:          Medium
Title:             No automated secret scanning
Location:          repository
Observed:          No Gitleaks, TruffleHog, detect-secrets or similar scanner is configured in CI, pre-commit or the repository. Platform-level push protection is checked with --github.
Expected:          A secret scanner runs on every push or pull request (and ideally as a pre-commit hook), with push protection enabled on the hosting platform.
Risk:              Without automated scanning, a committed credential is found by an attacker before it is found by you.
Recommendation:    Add Gitleaks (or TruffleHog) to CI and to pre-commit, and enable GitHub secret scanning with push protection.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 690d9982717aee72.
```

Example fix:

```
# .github/workflows/secrets.yml
on: [push, pull_request]
permissions: { contents: read }
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>  # pin to a commit SHA
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@<sha>
```

### F-053 · Medium · CC6.3 · No offboarding procedure

```
Finding ID:        F-053
Criterion:         CC6.3
Severity:          Medium
Title:             No offboarding procedure
Location:          repository
Observed:          No offboarding procedure was found in the repository's documentation.
Expected:          Offboarding revokes SSO, source control, cloud, CI/CD and vendor access within a set deadline (≤ 24h).
Risk:              Departed staff and contractors keep working credentials, a common source of incidents and an audit finding.
Recommendation:    Document an offboarding checklist covering every system with access, and the deadline for completing it.
Controls:          Access Rights; Personnel Security; Credential Management
Policies:          Access Control & Least Privilege; Background Screening & On/Off-boarding
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 8d143efb3eb76cc7.
```

Example fix:

```
## Offboarding (within 24 hours)
- [ ] Disable SSO account (cascades to apps via SCIM)
- [ ] Remove from GitHub org and npm org
- [ ] Revoke personal cloud credentials and tokens
```

### F-054 · Medium · CC6.3 · Token issued without an expiry

```
Finding ID:        F-054
Criterion:         CC6.3
Severity:          Medium
Title:             Token issued without an expiry
Location:          src/auth.js:12
Observed:          A token is signed in src/auth.js at line 12 with no expiry nearby.
Expected:          Every token the application issues has an expiry, so access ends even if revocation fails.
Risk:              A token without expiry stays valid forever; one leak is permanent access.
Recommendation:    Set a short expiry on every issued token and use refresh tokens that can be revoked.
Controls:          Access Rights; Personnel Security; Credential Management
Policies:          Access Control & Least Privilege; Background Screening & On/Off-boarding
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 8418b171847a6f9f.
```

Example fix:

```
jwt.sign(claims, key, { algorithm: 'RS256', expiresIn: '15m' });
```

### F-055 · Medium · CC6.6 · No HTTP security headers configured

```
Finding ID:        F-055
Criterion:         CC6.6
Severity:          Medium
Title:             No HTTP security headers configured
Location:          package.json
Observed:          HTTP server or web framework detected in package.json, but no security-headers middleware or CSP/HSTS configuration was found in code or config. They may be set at a CDN; if so, add an exception that says where.
Expected:          Responses set CSP, HSTS, X-Content-Type-Options and frame protections, in code or at the edge (CDN, proxy, platform config).
Risk:              Missing headers remove browser-side defences against XSS, clickjacking and protocol downgrade.
Recommendation:    Add a security-headers middleware (helmet, Talisman, SecurityMiddleware) or set the headers in your proxy or platform configuration.
Controls:          Network Security; Vulnerability Management; Remote-Work Security
Policies:          Secure Configuration & Hardening; Remote Access & BYOD
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is b1b961b9dd42774a.
```

Example fix:

```
import helmet from 'helmet';
app.use(helmet({ hsts: { maxAge: 31536000, includeSubDomains: true } }));
```

### F-056 · Medium · CC6.6 · DOM innerHTML/outerHTML assigned without visible sanitization

```
Finding ID:        F-056
Criterion:         CC6.6
Severity:          Medium
Title:             DOM innerHTML/outerHTML assigned without visible sanitization
Location:          src/public/app.js:2
Observed:          DOM innerHTML/outerHTML assigned without visible sanitization in src/public/app.js at line 2.
Expected:          HTML output is escaped by the framework; raw-HTML sinks are avoided or fed only sanitized content.
Risk:              Rendering raw HTML that contains user input enables cross-site scripting: session theft and actions on the victim's behalf.
Recommendation:    Render text through the framework's escaping. Where raw HTML is unavoidable, sanitize it with DOMPurify (or bleach) on the same line so the intent is visible.
Controls:          Network Security; Vulnerability Management; Remote-Work Security
Policies:          Secure Configuration & Hardening; Remote Access & BYOD
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 252663a1cc6ca858.
```

Example fix:

```
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```

### F-057 · Medium · CC6.7 · Plain HTTP URL to api.partner-service.com

```
Finding ID:        F-057
Criterion:         CC6.7
Severity:          Medium
Title:             Plain HTTP URL to api.partner-service.com
Location:          src/server.js:37
Observed:          http://api.partner-service.com is used in src/server.js at line 37.
Expected:          Every external and internal service URL uses https://. Plain HTTP is limited to localhost and documentation examples.
Risk:              Requests over plain HTTP can be read and modified in transit, including tokens and personal data.
Recommendation:    Switch the URL to https:// and make sure the target service redirects HTTP to HTTPS with HSTS.
Controls:          Secure Data Transfer; Network Security
Policies:          Encryption & Crypto Controls; Information Sharing & Transfer
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 058f7cfbcedb5e93.
```

Example fix:

```
const API_URL = process.env.API_URL ?? 'https://api.example.com';
```

### F-058 · Medium · CC6.8 · Unpinned base image node:latest

```
Finding ID:        F-058
Criterion:         CC6.8
Severity:          Medium
Title:             Unpinned base image node:latest
Location:          Dockerfile:1
Observed:          node:latest in Dockerfile at line 1 has no version tag or uses :latest.
Expected:          Base images use an explicit version tag, ideally pinned by digest, from a trusted registry.
Risk:              An untagged or :latest base image changes underneath you, so builds are not reproducible and a compromised upstream image flows straight in.
Recommendation:    Pin base images to a version and digest, and let Dependabot or Renovate propose updates.
Controls:          Configuration & Patch Management; Endpoint Protection; Secure SDLC Integration; Supplier Security
Policies:          Vulnerability & Patch Management; Secure Software Development Lifecycle; Vendor & Third-Party Risk
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is a190bb6b318d0b0c.
```

Example fix:

```
FROM node:22.11.0-bookworm-slim@sha256:<digest>
```

### F-059 · Medium · CC6.8 · Container images are not scanned

```
Finding ID:        F-059
Criterion:         CC6.8
Severity:          Medium
Title:             Container images are not scanned
Location:          repository
Observed:          The repository builds container images but no image scanner (Trivy, Grype, Snyk, Docker Scout) runs in CI.
Expected:          Images built from this repository are scanned (Trivy, Grype, Snyk, Docker Scout) before they are pushed or deployed.
Risk:              Base images and OS packages carry their own vulnerabilities that dependency scanning of your code does not see.
Recommendation:    Scan each built image in CI and fail on Critical/High vulnerabilities with a fix available.
Controls:          Configuration & Patch Management; Endpoint Protection; Secure SDLC Integration; Supplier Security
Policies:          Vulnerability & Patch Management; Secure Software Development Lifecycle; Vendor & Third-Party Risk
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 1f84927c8fe3b5df.
```

Example fix:

```
- uses: aquasecurity/trivy-action@<sha>  # pin to a commit SHA
  with: { image-ref: 'app:${{ github.sha }}', severity: 'CRITICAL,HIGH', exit-code: '1', ignore-unfixed: true }
```

### F-060 · Medium · CC6.8 · `npm install` used in a build

```
Finding ID:        F-060
Criterion:         CC6.8
Severity:          Medium
Title:             `npm install` used in a build
Location:          Dockerfile:4
Observed:          Dockerfile runs npm install at line 4; use npm ci to install from the lockfile.
Expected:          Builds install exactly what the lockfile says (npm ci, pnpm install --frozen-lockfile, pip --require-hashes).
Risk:              `npm install` in CI can rewrite the lockfile and pull versions nobody reviewed.
Recommendation:    Use the lockfile-respecting install command in CI and Dockerfiles.
Controls:          Configuration & Patch Management; Endpoint Protection; Secure SDLC Integration; Supplier Security
Policies:          Vulnerability & Patch Management; Secure Software Development Lifecycle; Vendor & Third-Party Risk
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 64cedb67b78b3910.
```

Example fix:

```
RUN npm ci --omit=dev
# or
RUN pnpm install --frozen-lockfile --prod
```

### F-061 · Medium · CC7.1 · Container runs as root: Dockerfile

```
Finding ID:        F-061
Criterion:         CC7.1
Severity:          Medium
Title:             Container runs as root: Dockerfile
Location:          Dockerfile:1
Observed:          Dockerfile never sets a non-root USER in its final stage.
Expected:          The final stage of each Dockerfile switches to a non-root USER.
Risk:              A process running as root turns any code execution bug into full control of the container and an easier escape to the host.
Recommendation:    Create or use an unprivileged user and switch to it in the final stage.
Controls:          Vulnerability Management; Configuration & Patch Management; Security Logging
Policies:          Vulnerability & Patch Management; Secure Configuration & Hardening; Logging, Monitoring & Audit
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 12cd005a083794da.
```

Example fix:

```
RUN addgroup --system app && adduser --system --ingroup app app
USER app
```

### F-062 · Medium · CC7.1 · No continuous vulnerability monitoring

```
Finding ID:        F-062
Criterion:         CC7.1
Severity:          Medium
Title:             No continuous vulnerability monitoring
Location:          repository
Observed:          Neither Dependabot/Renovate nor a scheduled dependency scan is configured.
Expected:          New vulnerabilities in existing dependencies are detected continuously (Dependabot/Renovate alerts or a scheduled scan).
Risk:              Code that does not change still becomes vulnerable as CVEs are published; without monitoring nobody finds out.
Recommendation:    Enable Dependabot (with security updates) or Renovate, or run a dependency scan on a weekly schedule.
Controls:          Vulnerability Management; Configuration & Patch Management; Security Logging
Policies:          Vulnerability & Patch Management; Secure Configuration & Hardening; Logging, Monitoring & Audit
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 031b1135912c21cc.
```

Example fix:

```
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
```

### F-063 · Medium · CC7.2 · No alert rules defined in code

```
Finding ID:        F-063
Criterion:         CC7.2
Severity:          Medium
Title:             No alert rules defined in code
Location:          repository
Observed:          No alert definitions (Prometheus rules, CloudWatch alarms, Datadog monitors, ...) were found.
Expected:          Alerts for auth-failure spikes, error rates and infrastructure anomalies are defined as code and routed to on-call.
Risk:              Attacks and outages that nobody is alerted to run for hours or days.
Recommendation:    Define alert rules in code (Prometheus, CloudWatch, Datadog, Grafana) with routing to an on-call channel.
Controls:          Security Monitoring & Detection; Security Logging
Policies:          Logging, Monitoring & Audit
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is a79d3b3ef70c6b25.
```

Example fix:

```
- alert: LoginFailureSpike
  expr: sum(rate(auth_login_failures_total[5m])) > 20
  labels: { severity: page }
```

### F-064 · Medium · CC7.2 · Personal data field passed to a logger

```
Finding ID:        F-064
Criterion:         CC7.2
Severity:          Medium
Title:             Personal data field passed to a logger
Location:          public/tracking.js:12
Observed:          Personal data field passed to a logger in public/tracking.js at line 12.
Expected:          Logs identify people by internal id, never by email, phone, address, date of birth or IP-linked profile data.
Risk:              Personal data in logs is copied to log platforms and backups with long retention, outside deletion and access-request processes.
Recommendation:    Log a pseudonymous user id instead, and configure logger redaction for personal fields.
Controls:          Security Monitoring & Detection; Security Logging
Policies:          Logging, Monitoring & Audit
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is e6921935753ad03a.
```

Example fix:

```
log.info({ userId: user.id }, 'signup complete');
```

### F-065 · Medium · CC7.3 · No severity and triage criteria

```
Finding ID:        F-065
Criterion:         CC7.3
Severity:          Medium
Title:             No severity and triage criteria
Location:          repository
Observed:          No severity and triage criteria was found in the repository's documentation.
Expected:          Documented criteria say how a security event is classified, at what severity it becomes an incident, and how the triage outcome is recorded.
Risk:              Without shared criteria, the same alert is ignored by one person and escalated by another, and real incidents are missed.
Recommendation:    Document severity levels with examples, the threshold for declaring an incident, and where triage outcomes (true/false positive) are recorded.
Controls:          Security Incident Management; Security Monitoring & Detection
Policies:          Incident Response & Breach Notification
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 3dc942ce851cbe84.
```

Example fix:

```
| Severity | Criteria | Example |
|---|---|---|
| Critical | Confirmed data exposure or active exploitation | Leaked production key used by a third party |
Triage outcome (true/false positive, incident yes/no) is recorded on the ticket.
```

### F-066 · Medium · CC7.4 · No runbook for credential leak, data exposure, compromised dependency, outage or DDoS

```
Finding ID:        F-066
Criterion:         CC7.4
Severity:          Medium
Title:             No runbook for credential leak, data exposure, compromised dependency, outage or DDoS
Location:          repository
Observed:          Runbooks found for 0 of 4 common scenarios; missing: credential leak, data exposure, compromised dependency, outage or DDoS.
Expected:          Runbooks cover credential leaks, data exposure, compromised dependencies and outages/DDoS.
Risk:              Improvising the first steps of a credential leak or supply-chain incident costs the hours that matter most.
Recommendation:    Add a short runbook per scenario: how to detect it, contain it, eradicate it and who to tell.
Controls:          Security Incident Management
Policies:          Incident Response & Breach Notification
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 2ed0b4d82201c82c.
```

Example fix:

```
## Credential leak
1. Revoke the credential at the provider.
2. Search logs for use since the leak.
3. Rotate dependent secrets and record the incident.
```

### F-067 · Medium · CC7.5 · No key rotation procedure

```
Finding ID:        F-067
Criterion:         CC7.5
Severity:          Medium
Title:             No key rotation procedure
Location:          repository
Observed:          No key rotation procedure was found in the repository's documentation.
Expected:          A procedure says which secrets and keys are rotated, how, on what schedule, and on exposure or personnel change.
Risk:              Unrotated credentials stay valid long after they leak or their holder leaves.
Recommendation:    Document each secret, where it lives, how to rotate it, and when (≤ 90 days, or on exposure or departure).
Controls:          Security Incident Management; Disaster Recovery Planning; Credential Management
Policies:          Incident Response & Breach Notification; Backup, Business Continuity & Disaster Recovery
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 1cd4f93fec683e49.
```

Example fix:

```
## Rotating secrets
| Secret | Where | How | When |
|---|---|---|---|
| Database password | AWS Secrets Manager | Automatic rotation Lambda | Every 30 days |
```

### F-068 · Medium · CC8.1 · Sensitive paths have no code owners

```
Finding ID:        F-068
Criterion:         CC8.1
Severity:          Medium
Title:             Sensitive paths have no code owners
Location:          repository
Observed:          5 sensitive files exist but there is no CODEOWNERS file.
Expected:          Security-sensitive paths (auth, IAM, crypto, payments, infrastructure, workflows, migrations, lockfiles) have a specific CODEOWNERS entry, not just the catch-all.
Risk:              Changes to the riskiest code can be approved by any reviewer instead of the people accountable for it.
Recommendation:    Add explicit CODEOWNERS entries for sensitive paths and require code owner review. Adjust what counts as sensitive with sensitivePaths in threesock.yaml.
Controls:          Change management; Secure SDLC Integration; Segregation of duties
Policies:          Change & Release Management; Secure Software Development Lifecycle
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 96725e2faf218099.
```

Example fix:

```
/src/auth/            @your-org/security
/infra/               @your-org/platform
/.github/workflows/   @your-org/platform
```

### F-069 · Medium · CC8.1 · Migration without a down step

```
Finding ID:        F-069
Criterion:         CC8.1
Severity:          Medium
Title:             Migration without a down step
Location:          migrations/001_init.up.sql
Observed:          migrations/001_init.up.sql has no matching 001_init.down.sql.
Expected:          Each migration has a down/downgrade step, or the repository documents how schema changes are rolled back.
Risk:              A bad migration without a way back turns a deploy rollback into a data-recovery incident.
Recommendation:    Write a down migration for each change, or document the expand/contract and restore procedure used instead.
Controls:          Change management; Secure SDLC Integration; Segregation of duties
Policies:          Change & Release Management; Secure Software Development Lifecycle
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 65588b3df01f4147.
```

Example fix:

```
-- 20261022_add_status.down.sql
ALTER TABLE orders DROP COLUMN status;
```

### F-070 · Medium · CC8.1 · Migration without a down step

```
Finding ID:        F-070
Criterion:         CC8.1
Severity:          Medium
Title:             Migration without a down step
Location:          migrations/002_customers.up.sql
Observed:          migrations/002_customers.up.sql has no matching 002_customers.down.sql.
Expected:          Each migration has a down/downgrade step, or the repository documents how schema changes are rolled back.
Risk:              A bad migration without a way back turns a deploy rollback into a data-recovery incident.
Recommendation:    Write a down migration for each change, or document the expand/contract and restore procedure used instead.
Controls:          Change management; Secure SDLC Integration; Segregation of duties
Policies:          Change & Release Management; Secure Software Development Lifecycle
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 50a45a9a3823771f.
```

Example fix:

```
-- 20261022_add_status.down.sql
ALTER TABLE orders DROP COLUMN status;
```

### F-071 · Medium · CC9.1 · No business continuity / disaster recovery plan

```
Finding ID:        F-071
Criterion:         CC9.1
Severity:          Medium
Title:             No business continuity / disaster recovery plan
Location:          repository
Observed:          No business continuity / disaster recovery plan was found in the repository's documentation.
Expected:          A BC/DR plan lists critical dependencies and their fallbacks, how the system is recovered, and what happens in a provider or regional outage.
Risk:              A provider outage or loss of a key component turns into an improvised, extended outage.
Recommendation:    Write a short continuity plan: critical dependencies, what degrades gracefully, recovery steps, and who decides.
Controls:          Disaster Recovery Planning; Risk Management; Resource Capacity Management
Policies:          Backup, Business Continuity & Disaster Recovery; Risk Management
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 07d989501a867971.
```

Example fix:

```
## Critical dependencies
| Dependency | If unavailable |
|---|---|
| Auth provider | Existing sessions continue; new logins fail with a status banner |
## Recovery
Rebuild from IaC in the secondary region; restore the latest snapshot.
```

### F-072 · Medium · CC9.2 · Missing a third-party services inventory and an SBOM

```
Finding ID:        F-072
Criterion:         CC9.2
Severity:          Medium
Title:             Missing a third-party services inventory and an SBOM
Location:          repository
Observed:          No a third-party services inventory and an SBOM was found.
Expected:          An inventory lists third-party services and integrations (with the data they receive), and an SBOM covers open-source dependencies.
Risk:              Unknown vendors and SDKs receive data nobody approved, and a vendor breach cannot be assessed quickly.
Recommendation:    Keep a third-party inventory (service, purpose, data shared, owner) and generate an SBOM in CI.
Controls:          Supplier Security; Asset Inventory
Policies:          Vendor & Third-Party Risk
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is d4dbc3c2328936e8.
```

Example fix:

```
| Service | Purpose | Data shared | Owner |
|---|---|---|---|
| Stripe | Payments | Name, email, card token | @billing |
```

### F-073 · Medium · A1.1 · Containers without resource limits in k8s/deployment.yaml

```
Finding ID:        F-073
Criterion:         A1.1
Severity:          Medium
Title:             Containers without resource limits in k8s/deployment.yaml
Location:          k8s/deployment.yaml
Observed:          No resources.limits for: api.
Expected:          Every container and task declares CPU and memory limits (and requests where the scheduler uses them).
Risk:              One runaway workload can starve its neighbours and take down unrelated services.
Recommendation:    Set requests and limits on every container, and memory/CPU on every task definition or compose service.
Controls:          Resource Capacity Management; Security Monitoring & Detection
Policies:          Backup, Business Continuity & Disaster Recovery; Logging, Monitoring & Audit
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 8148fd6d6bd46101.
```

Example fix:

```
resources:
  requests: { cpu: 100m, memory: 128Mi }
  limits:   { cpu: 500m, memory: 512Mi }
```

### F-074 · Medium · A1.2 · No deletion protection on aws_db_instance.main

```
Finding ID:        F-074
Criterion:         A1.2
Severity:          Medium
Title:             No deletion protection on aws_db_instance.main
Location:          infra/main.tf:12
Observed:          aws_db_instance.main does not set deletion_protection (detected by threesock's lightweight Terraform scanner).
Expected:          Production databases enable deletion protection so a mistaken apply or console click cannot drop them.
Risk:              One bad `terraform apply` or a compromised credential deletes the database outright.
Recommendation:    Enable deletion protection on databases (and turn it off deliberately when decommissioning).
Controls:          Disaster Recovery Planning; Physical Access Control
Policies:          Backup, Business Continuity & Disaster Recovery; Physical Security & Environmental
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is bec52221fd33da0d.
```

Example fix:

```
resource "aws_db_instance" "main" {
  deletion_protection = true
}
```

### F-075 · Medium · A1.2 · No probes in k8s/deployment.yaml

```
Finding ID:        F-075
Criterion:         A1.2
Severity:          Medium
Title:             No probes in k8s/deployment.yaml
Location:          k8s/deployment.yaml
Observed:          k8s/deployment.yaml defines a workload without readiness or liveness probes.
Expected:          Every workload declares liveness/readiness probes (or a HEALTHCHECK / load balancer health check) so failures are detected and replaced automatically.
Risk:              A hung process keeps receiving traffic and is never restarted.
Recommendation:    Add readiness and liveness probes to containers (or HEALTHCHECK / target group health checks).
Controls:          Disaster Recovery Planning; Physical Access Control
Policies:          Backup, Business Continuity & Disaster Recovery; Physical Security & Environmental
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 5555ec23a1e53ab8.
```

Example fix:

```
readinessProbe: { httpGet: { path: /healthz, port: 8080 }, periodSeconds: 10 }
livenessProbe:  { httpGet: { path: /healthz, port: 8080 }, initialDelaySeconds: 15 }
```

### F-076 · Medium · A1.2 · Single-zone data store: aws_db_instance.main

```
Finding ID:        F-076
Criterion:         A1.2
Severity:          Medium
Title:             Single-zone data store: aws_db_instance.main
Location:          infra/main.tf:12
Observed:          aws_db_instance.main is not configured for multi-AZ failover (detected by threesock's lightweight Terraform scanner).
Expected:          Databases and caches run in more than one availability zone with automatic failover.
Risk:              A single-zone failure takes the database down until the zone recovers.
Recommendation:    Enable Multi-AZ (RDS), automatic failover (ElastiCache) or regional availability (Cloud SQL).
Controls:          Disaster Recovery Planning; Physical Access Control
Policies:          Backup, Business Continuity & Disaster Recovery; Physical Security & Environmental
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is ab5e59a7b452607b.
```

Example fix:

```
resource "aws_db_instance" "main" {
  multi_az = true
}
```

### F-077 · Medium · A1.3 · No record of restore or DR tests

```
Finding ID:        F-077
Criterion:         A1.3
Severity:          Medium
Title:             No record of restore or DR tests
Location:          repository
Observed:          No documentation of backup restore tests or DR exercises was found.
Expected:          Backup restores are tested on a schedule (quarterly for critical systems), with dated results kept.
Risk:              Untested backups routinely fail when needed: wrong scope, missing keys, or restores slower than the RTO.
Recommendation:    Run and record a restore test each quarter: date, what was restored, time taken, and issues found.
Controls:          Disaster Recovery Planning
Policies:          Backup, Business Continuity & Disaster Recovery
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 60dd5b2951849fe6.
```

Example fix:

```
## Restore test log
| Date | System | Result | Time | Follow-up |
|---|---|---|---|---|
| 2026-09-30 | Postgres | Pass | 42 min | none |
```

### F-078 · Medium · A1.3 · No recovery objectives (RTO/RPO)

```
Finding ID:        F-078
Criterion:         A1.3
Severity:          Medium
Title:             No recovery objectives (RTO/RPO)
Location:          repository
Observed:          No recovery objectives (RTO/RPO) was found in the repository's documentation.
Expected:          Recovery time and recovery point objectives are defined for each system.
Risk:              Without objectives, nobody can tell whether backups and failover are adequate until it is too late.
Recommendation:    Set RTO and RPO per system in the DR plan and design backups and failover to meet them.
Controls:          Disaster Recovery Planning
Policies:          Backup, Business Continuity & Disaster Recovery
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 6098614b792829db.
```

Example fix:

```
| System | RTO | RPO |
|---|---|---|
| API | 1 hour | 15 minutes |
```

### F-079 · Medium · PI1.2 · No schema validation library

```
Finding ID:        F-079
Criterion:         PI1.2
Severity:          Medium
Title:             No schema validation library
Location:          package.json
Observed:          HTTP server or web framework detected in package.json, but no schema validation library (Zod, Joi, Pydantic, validator, ...) is used.
Expected:          Request bodies, query parameters and webhook payloads are validated server-side with a schema library.
Risk:              Unvalidated input causes silent data corruption, crashes and injection, and lets clients send totals or IDs the server should compute.
Recommendation:    Validate every request with a schema (Zod, Pydantic, Joi, validator) and reject what does not match.
Controls:          Secure SDLC Integration
Policies:          Secure Software Development Lifecycle
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is ad6f9b2c6e653388.
```

Example fix:

```
const Order = z.object({ sku: z.string().min(1), quantity: z.number().int().positive().max(100) });
const order = Order.parse(req.body);
```

### F-080 · Medium · PI1.3 · Jobs have no retry limits or dead-letter queue

```
Finding ID:        F-080
Criterion:         PI1.3
Severity:          Medium
Title:             Jobs have no retry limits or dead-letter queue
Location:          repository
Observed:          Job queues are used, but no retry limits, backoff or dead-letter configuration was found.
Expected:          Jobs and consumers set retry limits with backoff, and failed work lands in a dead-letter queue that is monitored.
Risk:              Failed jobs are dropped silently or retried forever, losing or duplicating work.
Recommendation:    Configure attempts and backoff on every queue, and route exhausted messages to a dead-letter queue.
Controls:          Secure SDLC Integration; Security Monitoring & Detection
Policies:          Secure Software Development Lifecycle
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is ee49649f32de1b4d.
```

Example fix:

```
await queue.add('send-invoice', data, { attempts: 5, backoff: { type: 'exponential', delay: 1000 } });
```

### F-081 · Medium · PI1.5 · Schemas declare no integrity constraints

```
Finding ID:        F-081
Criterion:         PI1.5
Severity:          Medium
Title:             Schemas declare no integrity constraints
Location:          migrations/001_init.up.sql
Observed:          2 schema or migration file(s) contain no NOT NULL, UNIQUE, foreign key or check constraints.
Expected:          Schemas declare NOT NULL, UNIQUE, foreign key and check constraints, so the database rejects invalid data even when application code misses it.
Risk:              Without constraints, a single bug writes orphaned or duplicate records that corrupt reports and billing.
Recommendation:    Declare constraints in the schema for required fields, uniqueness and relationships.
Controls:          Data Retention & Destruction; Security Logging; Disaster Recovery Planning
Policies:          Backup, Business Continuity & Disaster Recovery; Data Classification & Handling
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 97da2166fc43d3c7.
```

Example fix:

```
CREATE TABLE orders (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id),
  total_cents integer NOT NULL CHECK (total_cents >= 0)
);
```

### F-082 · Medium · C1.1 · No data classification scheme

```
Finding ID:        F-082
Criterion:         C1.1
Severity:          Medium
Title:             No data classification scheme
Location:          repository
Observed:          No data classification scheme was found in the repository's documentation.
Expected:          A classification scheme (e.g. public / internal / confidential / restricted) is defined with handling rules, and applied to data stores and fields.
Risk:              Without classification, confidential data is handled like everything else: logged, copied to lower environments and shared with vendors.
Recommendation:    Define classification levels and their handling rules, then tag data stores and sensitive fields.
Controls:          Information Classification; Encrypted Data at Rest; Encryption Key Management; Access Rights
Policies:          Data Classification & Handling; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is d88ba9bf23694c7f.
```

Example fix:

```
| Level | Examples | Handling |
|---|---|---|
| Restricted | Card data, credentials | Encrypted fields, no logs, no lower environments |
| Confidential | Customer PII | Encrypted at rest, access logged |
```

### F-083 · Medium · C1.1 · Possible real personal data in seeds/customers.json

```
Finding ID:        F-083
Criterion:         C1.1
Severity:          Medium
Title:             Possible real personal data in seeds/customers.json
Location:          seeds/customers.json
Observed:          seeds/customers.json contains 1 valid card number, 1 SSN-shaped value, 1 address at consumer email providers (gmail). Values are not shown.
Expected:          Seeds, fixtures and sample data are synthetic: test card numbers, reserved example domains, generated identifiers.
Risk:              Real customer data in the repository is a breach of its own, copied to every clone, CI runner and laptop.
Recommendation:    Replace real-looking data with synthetic values (example.com addresses, provider test cards) or generate it with Faker; purge any real data from history.
Controls:          Information Classification; Encrypted Data at Rest; Encryption Key Management; Access Rights
Policies:          Data Classification & Handling; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 64db513299b3c82f.
```

Example fix:

```
{ "email": "ada@example.com", "card": "4242424242424242", "ssn": "000-00-0000" }
```

### F-084 · Medium · C1.2 · No data retention schedule

```
Finding ID:        F-084
Criterion:         C1.2
Severity:          Medium
Title:             No data retention schedule
Location:          repository
Observed:          No data retention schedule was found in the repository's documentation.
Expected:          Retention periods are defined per data class, and say how data is deleted at the end of them.
Risk:              Data kept forever is breach exposure without business value, and violates privacy commitments.
Recommendation:    Document a retention schedule per data class and implement it with TTLs, lifecycle rules or purge jobs.
Controls:          Data Retention & Destruction
Policies:          Retention & Secure Disposal
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 838be99c20f0bf44.
```

Example fix:

```
| Data | Retention | Deletion |
|---|---|---|
| Application logs | 90 days hot, 12 months archive | Bucket lifecycle rule |
| Closed accounts | 30 days | Nightly purge job |
```

### F-085 · Medium · P1.1 · No privacy notice in the product

```
Finding ID:        F-085
Criterion:         P1.1
Severity:          Medium
Title:             No privacy notice in the product
Location:          repository
Observed:          The application stores personal data (e.g. migrations/001_init.up.sql:1), but no privacy notice page or link was found.
Expected:          A privacy notice is reachable from the product (signup, footer, settings) and describes collection, use, retention, disclosure and disposal.
Risk:              Collecting personal data without an accessible notice breaches transparency obligations and the SOC 2 privacy commitments.
Recommendation:    Publish a privacy notice and link it from signup and the site footer; keep prior versions.
Controls:          Data Privacy; Regulatory Liaison
Policies:          Privacy & Data-Subject Rights
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is c53dc39cf01453ce.
```

Example fix:

```
<footer><a href="/privacy">Privacy notice</a></footer>
```

### F-086 · Medium · P3.1 · No personal data map

```
Finding ID:        F-086
Criterion:         P3.1
Severity:          Medium
Title:             No personal data map
Location:          repository
Observed:          No personal data map was found in the repository's documentation.
Expected:          A data map lists the personal data collected, where it is stored, why (purpose or legal basis) and for how long.
Risk:              Without a data map, collection drifts from the privacy notice and access or deletion requests miss data.
Recommendation:    Keep a data map: each personal data field or category, its purpose, where it is stored, who receives it and its retention.
Controls:          Data Privacy; Information Classification
Policies:          Privacy & Data-Subject Rights; Data Classification & Handling
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 8f2f1bdc5e5cbc2d.
```

Example fix:

```
| Data | Purpose | Stored in | Retention |
|---|---|---|---|
| Email | Login, receipts | Postgres users | Account lifetime + 30 days |
```

### F-087 · Medium · P3.2 · Sensitive personal data without field-level protection

```
Finding ID:        F-087
Criterion:         P3.2
Severity:          Medium
Title:             Sensitive personal data without field-level protection
Location:          migrations/002_customers.up.sql:4
Observed:          migrations/002_customers.up.sql defines a sensitive field at line 4, and no field-level encryption or tokenization was found.
Expected:          Sensitive categories (government IDs, health, biometrics, precise location, date of birth, ...) are encrypted at field level or tokenized, beyond disk encryption.
Risk:              Sensitive data in plain columns is exposed to every query, backup, replica and analyst with database access.
Recommendation:    Encrypt sensitive fields at the application layer (envelope encryption with KMS) or tokenize them, and restrict access to the decrypting service.
Controls:          Data Privacy; Information Classification; Encrypted Data at Rest
Policies:          Privacy & Data-Subject Rights; Data Classification & Handling
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is f416644c628934e3.
```

Example fix:

```
ALTER TABLE patients ADD COLUMN ssn_encrypted bytea;  -- pgp_sym_encrypt with a KMS-managed key
```

### F-088 · Medium · P4.2 · No retention purge job or TTL

```
Finding ID:        F-088
Criterion:         P4.2
Severity:          Medium
Title:             No retention purge job or TTL
Location:          repository
Observed:          The application stores personal data (e.g. migrations/001_init.up.sql:1), but no retention purge job or TTL was found in the code.
Expected:          Personal data past its retention period is removed automatically by scheduled purge jobs, TTL indexes or lifecycle rules.
Risk:              Without automated deletion, personal data accumulates past its purpose, breaching the privacy notice and enlarging every breach.
Recommendation:    Add a scheduled job (or TTL index) that deletes or anonymizes personal data once its retention period ends, and alert if it fails.
Controls:          Data Retention & Destruction; Data Privacy
Policies:          Retention & Secure Disposal; Privacy & Data-Subject Rights
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 5772dc7a995648b7.
```

Example fix:

```
// nightly
await db.query("DELETE FROM sessions WHERE created_at < now() - interval '90 days'");
```

### F-089 · Medium · P4.3 · No personal data deletion path

```
Finding ID:        F-089
Criterion:         P4.3
Severity:          Medium
Title:             No personal data deletion path
Location:          repository
Observed:          The application stores personal data (e.g. migrations/001_init.up.sql:1), but no account deletion, erasure or anonymization code was found.
Expected:          An account or data deletion path exists (self-service or request-based), and records that are soft-deleted are purged after their retention period.
Risk:              Without a deletion path, erasure requests cannot be honoured on time; soft deletes that are never purged keep personal data forever.
Recommendation:    Implement deletion (or irreversible anonymization) for a data subject across all stores, and a scheduled job that purges soft-deleted rows.
Controls:          Data Retention & Destruction
Policies:          Retention & Secure Disposal
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 17d3f247aa79af47.
```

Example fix:

```
app.delete('/me', requireAuth, async (req, res) => {
  await accounts.eraseSubject(req.user.id); // primary DB, search index, analytics, vendors
  res.sendStatus(204);
});
```

### F-090 · Medium · P4.3 · Soft-deleted records are never purged

```
Finding ID:        F-090
Criterion:         P4.3
Severity:          Medium
Title:             Soft-deleted records are never purged
Location:          migrations/002_customers.up.sql:5
Observed:          Soft deletion is used (migrations/002_customers.up.sql:5), but no job purges soft-deleted rows.
Expected:          An account or data deletion path exists (self-service or request-based), and records that are soft-deleted are purged after their retention period.
Risk:              Without a deletion path, erasure requests cannot be honoured on time; soft deletes that are never purged keep personal data forever.
Recommendation:    Implement deletion (or irreversible anonymization) for a data subject across all stores, and a scheduled job that purges soft-deleted rows.
Controls:          Data Retention & Destruction
Policies:          Retention & Secure Disposal
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is cfabe99581a819ea.
```

Example fix:

```
app.delete('/me', requireAuth, async (req, res) => {
  await accounts.eraseSubject(req.user.id); // primary DB, search index, analytics, vendors
  res.sendStatus(204);
});
```

### F-091 · Medium · P5.1 · No personal data export path

```
Finding ID:        F-091
Criterion:         P5.1
Severity:          Medium
Title:             No personal data export path
Location:          repository
Observed:          The application stores personal data (e.g. migrations/001_init.up.sql:1), but no personal data export path was found in the code.
Expected:          An authenticated export (self-service or support-driven) returns a subject's personal data in a machine-readable format.
Risk:              Access requests cannot be answered within the legal deadline (often 30 days) without tooling to gather the data.
Recommendation:    Add an authenticated export that gathers the subject's data from every store into JSON, and track requests with a response deadline.
Controls:          Data Privacy; Access Rights
Policies:          Privacy & Data-Subject Rights
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 94c229a993c65b11.
```

Example fix:

```
app.get('/me/export', requireAuth, async (req, res) => res.json(await dsar.export(req.user.id)));
```

### F-092 · Medium · P6.1 · Undocumented third-party SDKs: Mixpanel

```
Finding ID:        F-092
Criterion:         P6.1
Severity:          Medium
Title:             Undocumented third-party SDKs: Mixpanel
Location:          repository
Observed:          Mixpanel is used but not named in any third-party or privacy document.
Expected:          Every analytics, advertising, support or session-recording SDK is listed in the third-party or subprocessor inventory, with the data it receives.
Risk:              Unlisted SDKs collect personal data nobody approved, which the privacy notice then misdescribes.
Recommendation:    Add each SDK vendor to the third-party inventory (vendor, purpose, data shared), or remove the SDK.
Controls:          Data Privacy; Supplier Security; Secure Data Transfer
Policies:          Information Sharing & Transfer; Vendor & Third-Party Risk; Privacy & Data-Subject Rights
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is d51f823da457bee5.
```

Example fix:

```
| Vendor | Purpose | Data shared |
|---|---|---|
| PostHog | Product analytics | Pseudonymous user id, page views |
```

### F-093 · Medium · P6.1 · Whole user object sent to a third-party SDK

```
Finding ID:        F-093
Criterion:         P6.1
Severity:          Medium
Title:             Whole user object sent to a third-party SDK
Location:          public/tracking.js:8
Observed:          Whole user object sent to a third-party SDK in public/tracking.js at line 8.
Expected:          Calls to analytics, error-tracking and support SDKs send a pseudonymous id and only the fields the purpose needs, never whole user objects.
Risk:              Whole user objects leak every field (email, address, flags) to vendors, a rubric red flag and usually a breach of the privacy notice.
Recommendation:    Send a pseudonymous id and an explicit allow-list of properties.
Controls:          Data Privacy; Supplier Security; Secure Data Transfer
Policies:          Information Sharing & Transfer; Vendor & Third-Party Risk; Privacy & Data-Subject Rights
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 9db84cfdce522dd3.
```

Example fix:

```
analytics.identify(user.id, { plan: user.plan });
Sentry.setUser({ id: user.id });
```

### F-094 · Medium · P6.3 · No incident and disclosure register

```
Finding ID:        F-094
Criterion:         P6.3
Severity:          Medium
Title:             No incident and disclosure register
Location:          repository
Observed:          No incident and disclosure register was found in the repository's documentation.
Expected:          Every detected or reported unauthorized disclosure is recorded with scope, affected subjects, root cause and remediation, and linked to incident response.
Risk:              Without a register you cannot show regulators or auditors what happened, to whom, and what was fixed.
Recommendation:    Keep an incident register (a table is enough) and fill it in for every suspected disclosure, even ones that turn out minor.
Controls:          Security Incident Management; Data Privacy
Policies:          Incident Response & Breach Notification
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is fb64822078295023.
```

Example fix:

```
| Date | Scope | Affected subjects | Root cause | Remediation |
|---|---|---|---|---|
```

### F-095 · Medium · P6.6 · No breach notification procedure

```
Finding ID:        F-095
Criterion:         P6.6
Severity:          Medium
Title:             No breach notification procedure
Location:          repository
Observed:          No breach notification procedure was found in the repository's documentation.
Expected:          A breach procedure sets notification deadlines (e.g. 72 hours to regulators), who is notified (regulators, customers, data subjects), and keeps message templates.
Risk:              Missing a statutory notification deadline turns an incident into a regulatory violation.
Recommendation:    Document breach notification deadlines per jurisdiction and contract, who decides, and ready-to-use templates.
Controls:          Security Incident Management; Regulatory Liaison
Policies:          Incident Response & Breach Notification
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 03fb6e367246cbed.
```

Example fix:

```
## Breach notification
Regulators: within 72 hours of awareness (GDPR Art. 33). Customers: per contract, within 48 hours.
Templates: docs/security/templates/breach-customer.md
```

### F-096 · Medium · P8.1 · No privacy contact published

```
Finding ID:        F-096
Criterion:         P8.1
Severity:          Medium
Title:             No privacy contact published
Location:          repository
Observed:          No privacy contact (privacy@ address, DPO or privacy request channel) was found in the docs or the product.
Expected:          A privacy contact (email or form) is published, and new features handling personal data get a privacy review (the PR template asks about personal data).
Risk:              Data subjects cannot raise requests or complaints, and features that change data collection ship without review.
Recommendation:    Publish a privacy contact in the privacy notice and README, and add a personal-data question to the PR template.
Controls:          Data Privacy; Regulatory Liaison
Policies:          Privacy & Data-Subject Rights; Compliance & Regulatory Monitoring
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 2c1bf025ffa933b1.
```

Example fix:

```
Privacy questions and requests: privacy@example.com (answered within 30 days).
```

### F-097 · Low · CC2.1 · No monitoring defined in code

```
Finding ID:        F-097
Criterion:         CC2.1
Severity:          Low
Title:             No monitoring defined in code
Location:          repository
Observed:          No error tracking, metrics or dashboard configuration was found in code or IaC.
Expected:          Error tracking, metrics and dashboards are configured in code (Sentry, OpenTelemetry, Prometheus, Grafana, Datadog, CloudWatch, ...).
Risk:              Without instrumentation, security-relevant failures and abuse are invisible until users report them.
Recommendation:    Instrument the service (error tracking and metrics) and keep dashboards and monitors in code.
Controls:          Asset Inventory; Security Monitoring & Detection; Vulnerability Management
Policies:          Logging, Monitoring & Audit; Vulnerability & Patch Management
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 2572b71906218fe6.
```

Example fix:

```
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
```

### F-098 · Low · CC2.1 · No SBOM generated

```
Finding ID:        F-098
Criterion:         CC2.1
Severity:          Low
Title:             No SBOM generated
Location:          repository
Observed:          No SBOM tool (Syft, CycloneDX, SPDX, npm sbom) runs in CI.
Expected:          CI produces an SBOM (CycloneDX or SPDX) for each release or build.
Risk:              Without an SBOM you cannot answer "are we affected?" quickly when a new vulnerability lands.
Recommendation:    Generate an SBOM in CI with Syft or a CycloneDX tool and keep it with the release artifacts.
Controls:          Asset Inventory; Security Monitoring & Detection; Vulnerability Management
Policies:          Logging, Monitoring & Audit; Vulnerability & Patch Management
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 83f7ff6461ca3144.
```

Example fix:

```
- uses: anchore/sbom-action@<sha>  # pin to a commit SHA
  with: { format: cyclonedx-json, output-file: sbom.cdx.json }
```

### F-099 · Low · CC2.2 · No pull request template

```
Finding ID:        F-099
Criterion:         CC2.2
Severity:          Low
Title:             No pull request template
Location:          repository
Observed:          No pull request (or merge request) template was found.
Expected:          The PR template asks authors to state the security impact of each change.
Risk:              Without a prompt, security-relevant changes (new endpoints, data flows, dependencies) go through review unflagged.
Recommendation:    Add a security section with a short checklist to .github/pull_request_template.md.
Controls:          Standard Operating Procedures (SOPs); Policy Compliance; Security Incident Management
Policies:          Policy Management & Exception Handling; Security & Privacy Awareness Training
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is d0279ff1b06f9a97.
```

Example fix:

```
## Security impact
- [ ] Touches auth, permissions, secrets or personal data
- [ ] Adds a dependency or third-party service
- [ ] Changes infrastructure, network or IAM
```

### F-100 · Low · CC2.2 · README does not link security documentation

```
Finding ID:        F-100
Criterion:         CC2.2
Severity:          Low
Title:             README does not link security documentation
Location:          README.md
Observed:          README.md has no link to SECURITY.md or security documentation.
Expected:          The README links to the security policy and the security documentation, so people can find them.
Risk:              Documentation nobody can find is not followed.
Recommendation:    Add a Security section to the README linking SECURITY.md and your security docs folder.
Controls:          Standard Operating Procedures (SOPs); Policy Compliance; Security Incident Management
Policies:          Policy Management & Exception Handling; Security & Privacy Awareness Training
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is c5a9d1a2bcd044ac.
```

Example fix:

```
## Security
See [SECURITY.md](SECURITY.md) to report a vulnerability, and [docs/security](docs/security) for policies and runbooks.
```

### F-101 · Low · CC3.2 · No architecture decision records

```
Finding ID:        F-101
Criterion:         CC3.2
Severity:          Low
Title:             No architecture decision records
Location:          repository
Observed:          No ADR directory (docs/adr, decisions/) with decision records was found.
Expected:          Significant architectural decisions are recorded as ADRs, and ADRs discuss their security considerations.
Risk:              Without recorded decisions, the security reasoning behind an architecture is lost and gets undone by later changes.
Recommendation:    Record decisions in docs/adr/NNNN-title.md with a "Security considerations" section.
Controls:          Risk Management; Vulnerability Management
Policies:          Risk Management; Vulnerability & Patch Management
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 3fc01bac0142f0ab.
```

Example fix:

```
# 0003. Use OIDC for CI cloud access
## Status
Accepted
## Decision
CI assumes a deploy role through OIDC.
## Security considerations
No long-lived keys in CI; role scoped to the deploy bucket.
```

### F-102 · Low · CC3.4 · Dependency and infrastructure changes have no specific reviewer

```
Finding ID:        F-102
Criterion:         CC3.4
Severity:          Low
Title:             Dependency and infrastructure changes have no specific reviewer
Location:          repository
Observed:          4 manifest or IaC file(s) rely on the catch-all owner or none, e.g. Dockerfile, infra/main.tf, legacy/requirements.txt, package.json.
Expected:          Dependency manifests, Dockerfiles and IaC have specific CODEOWNERS, so adding a dependency, service or datastore is reviewed by someone accountable.
Risk:              New SDKs and services slip in through routine reviews, bringing data flows and vulnerabilities nobody assessed.
Recommendation:    Give manifests, Dockerfiles and infrastructure directories specific CODEOWNERS and require code owner review.
Controls:          Change management; Risk Management; Supplier Security
Policies:          Change & Release Management; Risk Management
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 22c479d23700fd83.
```

Example fix:

```
/package.json   @your-org/platform
/infra/         @your-org/platform
```

### F-103 · Low · CC4.1 · No scheduled security scans

```
Finding ID:        F-103
Criterion:         CC4.1
Severity:          Low
Title:             No scheduled security scans
Location:          repository
Observed:          No workflow both runs a security scanner and has a schedule trigger.
Expected:          Security scans run on a schedule against the default branch, not only on pull requests, so new vulnerabilities in unchanged code are found.
Risk:              A repository nobody touches is never rescanned, while new CVEs land against its dependencies every week.
Recommendation:    Add a schedule trigger to the workflow that runs your scanners.
Controls:          Vulnerability Management; Security Monitoring & Detection; Policy Compliance; Access Rights
Policies:          Vulnerability & Patch Management; Compliance & Regulatory Monitoring
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 3a02c1fb6200cd9a.
```

Example fix:

```
on:
  pull_request:
  schedule:
    - cron: '17 6 * * 1'  # weekly
```

### F-104 · Low · CC5.1 · No risk-to-control mapping

```
Finding ID:        F-104
Criterion:         CC5.1
Severity:          Low
Title:             No risk-to-control mapping
Location:          repository
Observed:          No risk-to-control mapping was found in the repository's documentation.
Expected:          A control matrix (or a risk register with a controls column) maps each identified risk to the controls that address it.
Risk:              Controls that are not tied to risks drift into box-ticking, and uncovered risks go unnoticed.
Recommendation:    Add a controls column to the risk register, or keep a separate control matrix table.
Controls:          Risk Management; Policy Compliance
Policies:          Risk Management; Information Security & Privacy Governance
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 7a0903a4b8ad240f.
```

Example fix:

```
| Risk | Controls |
|---|---|
| Malicious dependency | Lockfiles, minimumReleaseAge, dependency review |
```

### F-105 · Low · CC5.3 · Policy review metadata incomplete: docs/security/old-policy.md

```
Finding ID:        F-105
Criterion:         CC5.3
Severity:          Low
Title:             Policy review metadata incomplete: docs/security/old-policy.md
Location:          docs/security/old-policy.md
Observed:          docs/security/old-policy.md: no review date; no owner.
Expected:          Each policy states its owner and the date it was last reviewed, and is reviewed at least annually.
Risk:              Stale or ownerless policies describe controls that no longer operate, which auditors test against.
Recommendation:    Add an owner and a "Last reviewed: YYYY-MM-DD" line to each policy, and review them yearly.
Controls:          Standard Operating Procedures (SOPs); Policy Compliance
Policies:          Policy Management & Exception Handling
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 5ef979bfa230d62f.
```

Example fix:

```
Owner: @security-lead
Last reviewed: 2026-10-01
```

### F-106 · Low · CC6.1 · .gitignore does not exclude .env files

```
Finding ID:        F-106
Criterion:         CC6.1
Severity:          Low
Title:             .gitignore does not exclude .env files
Location:          .gitignore
Observed:          .gitignore has no entry matching .env files.
Expected:          Environment files with real values stay out of version control. Only templates such as .env.example are committed, and .gitignore excludes .env files.
Risk:              A committed .env file usually holds live credentials, which are then exposed to everyone with repository access and remain in git history.
Recommendation:    Rotate any credentials the file contains, remove it from git with `git rm --cached`, add `.env*` to .gitignore, and commit a .env.example with empty values instead.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is c3119a20058b5edf.
```

Example fix:

```
# .gitignore
.env
.env.*
!.env.example
```

### F-107 · Low · CC6.1 · Possible literal credential: smtpPassword

```
Finding ID:        F-107
Criterion:         CC6.1
Severity:          Low
Title:             Possible literal credential: smtpPassword
Location:          src/server.js:20
Observed:          `smtpPassword` is assigned a literal value (Hun********) in src/server.js at line 20. The value is redacted.
Expected:          Credential-like settings read their values from the environment or a secrets manager, never from string literals.
Risk:              A literal credential in code is shared with everyone who can read the repository and is hard to rotate. This check is heuristic, so confirm each match.
Recommendation:    Replace the literal with a value loaded at runtime. If it is not a credential, add an exception with a justification.
Controls:          Access Rights; Credential Management; Encryption Key Management; Network Security
Policies:          Access Control & Least Privilege; Authentication & Password; Encryption & Crypto Controls
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is fe0aa376e16bf539.
```

Example fix:

```
// After
const client = new Client({ password: process.env.SMTP_PASSWORD });
```

### F-108 · Low · CC6.5 · No customer-managed key for aws_db_instance.main

```
Finding ID:        F-108
Criterion:         CC6.5
Severity:          Low
Title:             No customer-managed key for aws_db_instance.main
Location:          infra/main.tf:12
Observed:          aws_db_instance.main does not set kms_key_id (detected by threesock's lightweight Terraform scanner).
Expected:          Data stores are encrypted with customer-managed KMS keys (with a deletion window), so destroying the key renders all copies, including snapshots, unrecoverable.
Risk:              With provider-owned keys, decommissioned data and stray snapshots stay readable; disposal relies on finding every copy.
Recommendation:    Encrypt data stores with a dedicated customer-managed KMS key with rotation enabled.
Controls:          Data Retention & Destruction; Asset Inventory; Encryption Key Management
Policies:          Retention & Secure Disposal
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 6cfd9e32872f265f.
```

Example fix:

```
resource "aws_kms_key" "data" {
  enable_key_rotation     = true
  deletion_window_in_days = 30
}
resource "aws_db_instance" "main" {
  kms_key_id = aws_kms_key.data.arn
}
```

### F-109 · Low · CC6.8 · Missing automated dependency updates (Dependabot or Renovate)

```
Finding ID:        F-109
Criterion:         CC6.8
Severity:          Low
Title:             Missing automated dependency updates (Dependabot or Renovate)
Location:          repository
Observed:          No automated dependency updates (Dependabot or Renovate) is configured.
Expected:          Dependabot or Renovate keeps dependencies current, and a vulnerability scan (dependency review, OSV-Scanner, npm audit, pip-audit, govulncheck) runs in CI.
Risk:              Known-vulnerable dependencies are the most common way attackers get in, and they are only fixed if someone notices.
Recommendation:    Enable Dependabot (or Renovate) and add a dependency scan to pull-request CI.
Controls:          Configuration & Patch Management; Endpoint Protection; Secure SDLC Integration; Supplier Security
Policies:          Vulnerability & Patch Management; Secure Software Development Lifecycle; Vendor & Third-Party Risk
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 2953e1da21b438da.
```

Example fix:

```
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
```

### F-110 · Low · CC6.8 · Python requirements not hash-pinned in legacy/requirements.txt

```
Finding ID:        F-110
Criterion:         CC6.8
Severity:          Low
Title:             Python requirements not hash-pinned in legacy/requirements.txt
Location:          legacy/requirements.txt
Observed:          legacy/requirements.txt pins versions but not hashes, so a replaced package would install silently.
Expected:          Every dependency manifest has a committed lockfile (or hash-pinned requirements) so installs are reproducible.
Risk:              Without a lockfile, each install can pull different, possibly compromised, versions, and a build cannot be reproduced.
Recommendation:    Generate the lockfile with your package manager, commit it, and install with the frozen/ci mode in CI.
Controls:          Configuration & Patch Management; Endpoint Protection; Secure SDLC Integration; Supplier Security
Policies:          Vulnerability & Patch Management; Secure Software Development Lifecycle; Vendor & Third-Party Risk
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is de36fac6296f0bde.
```

Example fix:

```
pnpm install && git add pnpm-lock.yaml       # Node
uv lock && git add uv.lock                    # Python
pip-compile --generate-hashes requirements.in # pip
```

### F-111 · Low · CC7.1 · No infrastructure drift detection

```
Finding ID:        F-111
Criterion:         CC7.1
Severity:          Low
Title:             No infrastructure drift detection
Location:          repository
Observed:          Terraform is used, but no scheduled plan or drift detection was found.
Expected:          A scheduled `terraform plan` (or a drift detection service) reports changes made outside of code.
Risk:              Manual console changes silently reopen gaps that code review closed, and are invisible until something breaks.
Recommendation:    Run `terraform plan -detailed-exitcode` on a schedule and alert when it reports changes.
Controls:          Vulnerability Management; Configuration & Patch Management; Security Logging
Policies:          Vulnerability & Patch Management; Secure Configuration & Hardening; Logging, Monitoring & Audit
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is a9d8df233ec64892.
```

Example fix:

```
on: { schedule: [{ cron: '0 6 * * *' }] }
...
      - run: terraform plan -detailed-exitcode -lock=false
```

### F-112 · Low · CC8.1 · No documented emergency change process

```
Finding ID:        F-112
Criterion:         CC8.1
Severity:          Low
Title:             No documented emergency change process
Location:          repository
Observed:          No document describes an emergency, hotfix or break-glass change process.
Expected:          An emergency (hotfix / break-glass) change process is documented, including who may use it and the retroactive review it requires.
Risk:              Without a defined path, urgent fixes bypass review informally and leave no audit trail, which auditors treat as a control failure.
Recommendation:    Document the emergency change path: who can invoke it, what is skipped, and the retroactive review required within a set time.
Controls:          Change management; Secure SDLC Integration; Segregation of duties
Policies:          Change & Release Management; Secure Software Development Lifecycle
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is add910b5218ba2ce.
```

Example fix:

```
## Emergency changes
Use only for active incidents. An on-call engineer may merge with one approval from the incident commander.
A retroactive review PR is opened within 2 business days and linked from the incident ticket.
```

### F-113 · Low · CC8.1 · No documented rollback procedure

```
Finding ID:        F-113
Criterion:         CC8.1
Severity:          Low
Title:             No documented rollback procedure
Location:          repository
Observed:          No runbook or document describing how to roll back a deployment was found.
Expected:          A runbook explains how to roll back a bad release, who can do it, and how to verify it worked.
Risk:              Under incident pressure, an undocumented rollback is slow, inconsistent and easy to get wrong.
Recommendation:    Add a rollback section to your deployment runbook (docs/runbooks/rollback.md) and rehearse it.
Controls:          Change management; Secure SDLC Integration; Segregation of duties
Policies:          Change & Release Management; Secure Software Development Lifecycle
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is d97d88987bf8548d.
```

Example fix:

```
## Rolling back a release
1. Find the last good deployment in the Deployments tab.
2. Promote it: `vercel promote <deployment-url>` (or re-run the deploy workflow for the previous tag).
3. Confirm health checks and error rates recover; post in #incidents.
```

### F-114 · Low · A1.1 · No autoscaling or capacity plan

```
Finding ID:        F-114
Criterion:         A1.1
Severity:          Low
Title:             No autoscaling or capacity plan
Location:          repository
Observed:          No autoscaling configuration and no documented capacity plan were found.
Expected:          Workloads autoscale on load, or a documented capacity plan sets headroom targets.
Risk:              Traffic spikes (or abuse) exhaust fixed capacity and cause an outage.
Recommendation:    Add a HorizontalPodAutoscaler or cloud autoscaling policy, or document a capacity plan with headroom targets.
Controls:          Resource Capacity Management; Security Monitoring & Detection
Policies:          Backup, Business Continuity & Disaster Recovery; Logging, Monitoring & Audit
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 3704b993535764be.
```

Example fix:

```
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec: { minReplicas: 2, maxReplicas: 10, metrics: [{ type: Resource, resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } } }] }
```

### F-115 · Low · A1.1 · No load tests

```
Finding ID:        F-115
Criterion:         A1.1
Severity:          Low
Title:             No load tests
Location:          repository
Observed:          The repository serves HTTP but has no load or performance tests.
Expected:          Load tests (k6, Artillery, Locust, Gatling, ...) exist and run before major releases.
Risk:              Capacity limits are discovered in production, during the busiest hour.
Recommendation:    Add a load test for the critical paths and run it before major releases.
Controls:          Resource Capacity Management; Security Monitoring & Detection
Policies:          Backup, Business Continuity & Disaster Recovery; Logging, Monitoring & Audit
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 6b97411e28ba84a2.
```

Example fix:

```
import http from 'k6/http';
export const options = { vus: 50, duration: '2m' };
export default () => http.get(`${__ENV.BASE_URL}/health`);
```

### F-116 · Low · PI1.1 · No API contract

```
Finding ID:        F-116
Criterion:         PI1.1
Severity:          Low
Title:             No API contract
Location:          repository
Observed:          The repository serves an API but has no OpenAPI, GraphQL or protobuf contract.
Expected:          The API has a machine-readable contract (OpenAPI, GraphQL schema, protobuf) kept in the repository or generated from code.
Risk:              Without a contract, clients and the service disagree about inputs and outputs, and breaking changes go unnoticed.
Recommendation:    Commit an OpenAPI document (or GraphQL schema / .proto files), or generate one from code, and version it.
Controls:          Secure SDLC Integration; Change management
Policies:          Secure Software Development Lifecycle; Change & Release Management
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 403ea7999f4ef693.
```

Example fix:

```
openapi: 3.1.0
info: { title: Orders API, version: 2.3.0 }
paths: { /v2/orders: { get: { ... } } }
```

### F-117 · Low · PI1.1 · No changelog

```
Finding ID:        F-117
Criterion:         PI1.1
Severity:          Low
Title:             No changelog
Location:          repository
Observed:          No CHANGELOG, CHANGES, HISTORY or release notes file at the repository root.
Expected:          A changelog or release notes record each version, including breaking changes.
Risk:              Users and downstream systems are surprised by breaking changes, causing processing errors.
Recommendation:    Keep a CHANGELOG.md (Keep a Changelog format) and call out breaking changes explicitly.
Controls:          Secure SDLC Integration; Change management
Policies:          Secure Software Development Lifecycle; Change & Release Management
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is d11928f11f6871b8.
```

Example fix:

```
## 2.0.0
### Breaking
- `/v1/orders` removed; use `/v2/orders`.
```

### F-118 · Low · C1.2 · No lifecycle rule for aws_s3_bucket.exports

```
Finding ID:        F-118
Criterion:         C1.2
Severity:          Low
Title:             No lifecycle rule for aws_s3_bucket.exports
Location:          infra/main.tf:19
Observed:          aws_s3_bucket.exports has no lifecycle configuration, so objects are kept forever (detected by threesock's lightweight Terraform scanner).
Expected:          Buckets have lifecycle expiration, log groups have a retention period, and ephemeral tables use TTLs.
Risk:              Without automated deletion, data (and logs full of it) accumulates forever, enlarging every breach.
Recommendation:    Add lifecycle expiration to buckets and retention_in_days to log groups, matching your retention schedule.
Controls:          Data Retention & Destruction
Policies:          Retention & Secure Disposal
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is ff79c698e87e8c4a.
```

Example fix:

```
resource "aws_s3_bucket_lifecycle_configuration" "exports" {
  bucket = aws_s3_bucket.exports.id
  rule {
    id     = "expire-exports"
    status = "Enabled"
    expiration { days = 30 }
  }
}
```

### F-119 · Low · P5.2 · No profile or account update path

```
Finding ID:        F-119
Criterion:         P5.2
Severity:          Low
Title:             No profile or account update path
Location:          repository
Observed:          The application stores personal data (e.g. migrations/001_init.up.sql:1), but no profile or account update path was found in the code.
Expected:          Users can update their own personal data (profile or account settings), or request correction through support tooling.
Risk:              Inaccurate personal data cannot be corrected on request, and errors propagate to downstream systems.
Recommendation:    Provide an authenticated profile update (with validation and an audit trail) and propagate changes to downstream systems.
Controls:          Data Privacy
Policies:          Privacy & Data-Subject Rights
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is f7e245fd36e790bf.
```

Example fix:

```
app.patch('/me', requireAuth, async (req, res) => res.json(await users.update(req.user.id, ProfileSchema.parse(req.body))));
```

### F-120 · Low · P6.5 · No intake for vendor breach notices

```
Finding ID:        F-120
Criterion:         P6.5
Severity:          Low
Title:             No intake for vendor breach notices
Location:          repository
Observed:          No document describes how breach or incident notices from vendors and subprocessors are received and handled.
Expected:          There is a documented intake for breach or incident notices from vendors and subprocessors, routed into incident response.
Risk:              A vendor's breach notice sent to an unmonitored inbox starts your own notification clock without anyone knowing.
Recommendation:    Name the address vendors must notify, who monitors it, and that notices open an incident.
Controls:          Supplier Security; Security Incident Management
Policies:          Vendor & Third-Party Risk; Incident Response & Breach Notification
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is f3028acecc4dcb7f.
```

Example fix:

```
## Vendor incident notices
Subprocessors notify security@example.com within 48 hours (per the DPA). Each notice opens an incident and is triaged as SEV2 or higher.
```

### F-121 · Low · P7.1 · No validation of personal data fields

```
Finding ID:        F-121
Criterion:         P7.1
Severity:          Low
Title:             No validation of personal data fields
Location:          repository
Observed:          The application stores personal data (e.g. migrations/001_init.up.sql:1), but no validation of personal data fields was found in the code.
Expected:          Personal data fields are validated for format and completeness (e.g. email and phone formats) when collected.
Risk:              Malformed contact data makes notification, access and deletion requests fail to reach or match the right person.
Recommendation:    Validate personal data at the boundary with a schema (email, phone, dates) and normalize before storing.
Controls:          Data Privacy
Policies:          Privacy & Data-Subject Rights
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is a2fb940f3204ca77.
```

Example fix:

```
const Signup = z.object({ email: z.string().email(), name: z.string().min(1).max(200) });
```

### F-122 · Low · P8.1 · No privacy review in the change process

```
Finding ID:        F-122
Criterion:         P8.1
Severity:          Low
Title:             No privacy review in the change process
Location:          repository
Observed:          Neither the PR template nor a PIA/DPIA process asks about personal data.
Expected:          A privacy contact (email or form) is published, and new features handling personal data get a privacy review (the PR template asks about personal data).
Risk:              Data subjects cannot raise requests or complaints, and features that change data collection ship without review.
Recommendation:    Publish a privacy contact in the privacy notice and README, and add a personal-data question to the PR template.
Controls:          Data Privacy; Regulatory Liaison
Policies:          Privacy & Data-Subject Rights; Compliance & Regulatory Monitoring
Owner:             Unassigned
Due date:          2026-07-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 13c65c68f8e402d4.
```

Example fix:

```
Privacy questions and requests: privacy@example.com (answered within 30 days).
```

## Controls and policies affected

Mapping: threesock default catalogue (mappings/controls.yaml).

| Control | Open findings | Criteria |
|---|---|---|
| Network Security | F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-009, F-016, F-017, F-018, F-020, F-021, F-022, F-023, F-024, F-025, F-026, F-027, F-050, F-051, F-052, F-055, F-056, F-057, F-106, F-107 | CC6.1, CC6.6, CC6.7 |
| Access Rights | F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-016, F-017, F-018, F-019, F-035, F-041, F-042, F-050, F-051, F-052, F-053, F-054, F-082, F-083, F-091, F-103, F-106, F-107 | CC6.1, CC6.2, C1.1, CC4.1, CC6.3, P5.1 |
| Credential Management | F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-012, F-013, F-014, F-015, F-016, F-017, F-018, F-047, F-048, F-050, F-051, F-052, F-053, F-054, F-067, F-106, F-107 | CC5.2, CC6.1, CC6.3, CC7.5 |
| Secure SDLC Integration | F-001, F-012, F-013, F-014, F-015, F-028, F-029, F-032, F-033, F-047, F-048, F-058, F-059, F-060, F-068, F-069, F-070, F-079, F-080, F-109, F-110, F-112, F-113, F-116, F-117 | CC5.2, CC6.8, CC8.1, PI1.2, PI1.3, PI1.1 |
| Vulnerability Management | F-009, F-020, F-021, F-022, F-023, F-024, F-039, F-040, F-041, F-042, F-043, F-044, F-045, F-046, F-055, F-056, F-061, F-062, F-097, F-098, F-101, F-103, F-111 | CC6.6, CC3.2, CC4.1, CC4.2, CC7.1, CC2.1 |
| Encryption Key Management | F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-016, F-017, F-018, F-035, F-050, F-051, F-052, F-082, F-083, F-106, F-107, F-108 | CC6.1, C1.1, CC6.5 |
| Configuration & Patch Management | F-001, F-012, F-013, F-014, F-015, F-028, F-029, F-047, F-048, F-058, F-059, F-060, F-061, F-062, F-109, F-110, F-111 | CC5.2, CC6.8, CC7.1 |
| Data Privacy | F-036, F-038, F-085, F-086, F-087, F-088, F-091, F-092, F-093, F-094, F-096, F-119, F-121, F-122 | P2.1, CC2.3, P1.1, P3.1, P3.2, P4.2, P5.1, P6.1, P6.3, P8.1, P5.2, P7.1 |
| Endpoint Protection | F-001, F-012, F-013, F-014, F-015, F-028, F-029, F-047, F-048, F-058, F-059, F-060, F-109, F-110 | CC5.2, CC6.8 |
| Security Monitoring & Detection | F-030, F-041, F-042, F-063, F-064, F-065, F-073, F-080, F-097, F-098, F-103, F-114, F-115 | CC7.2, CC4.1, CC7.3, A1.1, PI1.3, CC2.1 |
| Supplier Security | F-028, F-029, F-038, F-058, F-059, F-060, F-072, F-092, F-093, F-102, F-109, F-110, F-120 | CC6.8, CC2.3, CC9.2, P6.1, CC3.4, P6.5 |
| Policy Compliance | F-041, F-042, F-043, F-044, F-045, F-046, F-049, F-099, F-100, F-103, F-104, F-105 | CC4.1, CC4.2, CC5.3, CC2.2, CC5.1 |
| Change management | F-032, F-033, F-068, F-069, F-070, F-102, F-112, F-113, F-116, F-117 | CC8.1, CC3.4, PI1.1 |
| Security Incident Management | F-031, F-038, F-065, F-066, F-067, F-094, F-095, F-099, F-100, F-120 | CC7.4, CC2.3, CC7.3, CC7.5, P6.3, P6.6, CC2.2, P6.5 |
| Segregation of duties | F-010, F-011, F-032, F-033, F-037, F-068, F-069, F-070, F-112, F-113 | CC3.3, CC8.1, CC1.3 |
| Disaster Recovery Planning | F-034, F-067, F-071, F-074, F-075, F-076, F-077, F-078, F-081 | A1.2, CC7.5, CC9.1, A1.3, PI1.5 |
| Security Logging | F-010, F-011, F-030, F-061, F-062, F-063, F-064, F-081, F-111 | CC3.3, CC7.2, CC7.1, PI1.5 |
| Remote-Work Security | F-009, F-020, F-021, F-022, F-023, F-024, F-055, F-056 | CC6.6 |
| Risk Management | F-010, F-011, F-039, F-040, F-071, F-101, F-102, F-104 | CC3.3, CC3.2, CC9.1, CC3.4, CC5.1 |
| Data Retention & Destruction | F-081, F-084, F-088, F-089, F-090, F-108, F-118 | PI1.5, C1.2, P4.2, P4.3, CC6.5 |
| Endpoint Security | F-001, F-012, F-013, F-014, F-015, F-047, F-048 | CC5.2 |
| Secure Data Transfer | F-025, F-026, F-027, F-057, F-092, F-093 | CC6.7, P6.1 |
| Information Classification | F-035, F-082, F-083, F-086, F-087 | C1.1, P3.1, P3.2 |
| Regulatory Liaison | F-038, F-085, F-095, F-096, F-122 | CC2.3, P1.1, P6.6, P8.1 |
| Asset Inventory | F-072, F-097, F-098, F-108 | CC9.2, CC2.1, CC6.5 |
| Encrypted Data at Rest | F-035, F-082, F-083, F-087 | C1.1, P3.2 |
| Physical Access Control | F-034, F-074, F-075, F-076 | A1.2 |
| Resource Capacity Management | F-071, F-073, F-114, F-115 | CC9.1, A1.1 |
| Standard Operating Procedures (SOPs) | F-049, F-099, F-100, F-105 | CC5.3, CC2.2 |
| Personnel Security | F-019, F-053, F-054 | CC6.2, CC6.3 |
| Organization Structure & Reporting Lines | F-037 | CC1.3 |
| Security Governance Roles | F-037 | CC1.3 |

| Policy | Open findings | Criteria |
|---|---|---|
| Secure Software Development Lifecycle | F-001, F-012, F-013, F-014, F-015, F-028, F-029, F-032, F-033, F-047, F-048, F-058, F-059, F-060, F-068, F-069, F-070, F-079, F-080, F-109, F-110, F-112, F-113, F-116, F-117 | CC5.2, CC6.8, CC8.1, PI1.2, PI1.3, PI1.1 |
| Authentication & Password | F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-012, F-013, F-014, F-015, F-016, F-017, F-018, F-047, F-048, F-050, F-051, F-052, F-106, F-107 | CC5.2, CC6.1 |
| Encryption & Crypto Controls | F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-016, F-017, F-018, F-025, F-026, F-027, F-035, F-050, F-051, F-052, F-057, F-082, F-083, F-106, F-107 | CC6.1, CC6.7, C1.1 |
| Vulnerability & Patch Management | F-028, F-029, F-039, F-040, F-041, F-042, F-043, F-044, F-045, F-046, F-058, F-059, F-060, F-061, F-062, F-097, F-098, F-101, F-103, F-109, F-110, F-111 | CC6.8, CC3.2, CC4.1, CC4.2, CC7.1, CC2.1 |
| Access Control & Least Privilege | F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-010, F-011, F-016, F-017, F-018, F-019, F-037, F-050, F-051, F-052, F-053, F-054, F-106, F-107 | CC6.1, CC3.3, CC6.2, CC1.3, CC6.3 |
| Secure Configuration & Hardening | F-001, F-009, F-012, F-013, F-014, F-015, F-020, F-021, F-022, F-023, F-024, F-047, F-048, F-055, F-056, F-061, F-062, F-111 | CC5.2, CC6.6, CC7.1 |
| Logging, Monitoring & Audit | F-010, F-011, F-030, F-061, F-062, F-063, F-064, F-073, F-097, F-098, F-111, F-114, F-115 | CC3.3, CC7.2, CC7.1, A1.1, CC2.1 |
| Privacy & Data-Subject Rights | F-036, F-038, F-085, F-086, F-087, F-088, F-091, F-092, F-093, F-096, F-119, F-121, F-122 | P2.1, CC2.3, P1.1, P3.1, P3.2, P4.2, P5.1, P6.1, P8.1, P5.2, P7.1 |
| Backup, Business Continuity & Disaster Recovery | F-034, F-067, F-071, F-073, F-074, F-075, F-076, F-077, F-078, F-081, F-114, F-115 | A1.2, CC7.5, CC9.1, A1.1, A1.3, PI1.5 |
| Vendor & Third-Party Risk | F-028, F-029, F-038, F-058, F-059, F-060, F-072, F-092, F-093, F-109, F-110, F-120 | CC6.8, CC2.3, CC9.2, P6.1, P6.5 |
| Change & Release Management | F-032, F-033, F-068, F-069, F-070, F-102, F-112, F-113, F-116, F-117 | CC8.1, CC3.4, PI1.1 |
| Incident Response & Breach Notification | F-031, F-038, F-065, F-066, F-067, F-094, F-095, F-120 | CC7.4, CC2.3, CC7.3, CC7.5, P6.3, P6.6, P6.5 |
| Policy Management & Exception Handling | F-043, F-044, F-045, F-046, F-049, F-099, F-100, F-105 | CC4.2, CC5.3, CC2.2 |
| Remote Access & BYOD | F-009, F-020, F-021, F-022, F-023, F-024, F-055, F-056 | CC6.6 |
| Risk Management | F-010, F-011, F-039, F-040, F-071, F-101, F-102, F-104 | CC3.3, CC3.2, CC9.1, CC3.4, CC5.1 |
| Data Classification & Handling | F-035, F-081, F-082, F-083, F-086, F-087 | C1.1, PI1.5, P3.1, P3.2 |
| Information Sharing & Transfer | F-025, F-026, F-027, F-057, F-092, F-093 | CC6.7, P6.1 |
| Retention & Secure Disposal | F-084, F-088, F-089, F-090, F-108, F-118 | C1.2, P4.2, P4.3, CC6.5 |
| Compliance & Regulatory Monitoring | F-041, F-042, F-096, F-103, F-122 | CC4.1, P8.1 |
| Physical Security & Environmental | F-034, F-074, F-075, F-076 | A1.2 |
| Background Screening & On/Off-boarding | F-019, F-053, F-054 | CC6.2, CC6.3 |
| Information Security & Privacy Governance | F-037, F-104 | CC1.3, CC5.1 |
| Security & Privacy Awareness Training | F-099, F-100 | CC2.2 |

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

**CC1.3 · Organizational structure** (scored 0 (Not Met))

- [ ] Service ownership recorded (service catalog, `catalog-info.yaml`, README owner section)
- [ ] Segregation of duties enforced: PR authors cannot approve their own changes; production deploy permission is distinct from write access
- [ ] Org chart, RACI, and job descriptions exist

**CC2.1 · Relevant, quality information** (scored 0 (Not Met))

- [ ] System/asset inventory maintained (services, datastores, third-party integrations)
- [ ] Vulnerability scan output retained and queryable
- [ ] Security metrics available (open vulns by severity, MTTR, patch age, coverage of MFA)

**CC2.2 · Internal communication** (scored 0 (Not Met))

- [ ] Alert routing (Slack/PagerDuty/email) defined as code or documented
- [ ] Security advisories/alerts (e.g., Dependabot, code scanning) route to the responsible team

**CC2.3 · External communication** (scored 0 (Not Met))

- [ ] Public privacy/security notices are current and linked in the product
- [ ] Incident notification templates for customers exist
- [ ] Status page configured; API documentation states auth and security requirements
- [ ] Vendor security requirements communicated

**CC3.2 · Risk identification and analysis** (scored 0 (Not Met))

- [ ] Vulnerability findings (SAST/SCA/IaC) are scored with a defined method (e.g., CVSS + exploitability + exposure)

**CC3.3 · Fraud risk** (scored 0 (Not Met))

- [ ] Privileged and financial actions require multi-party approval or step-up authentication
- [ ] Admin/impersonation actions are audit-logged with actor, target, and reason
- [ ] Management override is detectable (admins cannot bypass branch protection silently; bypass events are logged)
- [ ] Rate limiting and anomaly detection on credential-abuse and account-takeover vectors

**CC3.4 · Significant changes** (scored 0 (Not Met))

- [ ] Design review or ADR required for major architectural changes
- [ ] Major dependency/runtime upgrades are reviewed for security impact
- [ ] IaC changes to networking, IAM, or encryption require elevated review

**CC4.1 · Ongoing/separate evaluations** (scored 0 (Not Met))

- [ ] Container image scanning on build and on a schedule
- [ ] DAST or penetration test performed at least annually, and reports are retained
- [ ] Access reviews performed on a defined cadence (repo, cloud, prod data)
- [ ] Compliance-as-code checks (OPA/Conftest, Checkov, cloud config rules) run automatically

**CC4.2 · Deficiency communication and remediation** (scored 0 (Not Met))

- [ ] Findings automatically create tracked issues with owner and due date
- [ ] Escalation path exists for overdue findings

**CC5.1 · Control selection and design** (scored 0 (Not Met))

- [ ] Preventive controls exist as CI gates and policy-as-code, not only documented intent
- [ ] Compensating controls documented where a primary control is not feasible

**CC5.2 · Technology general controls** (scored 0 (Not Met))

- [ ] Centralized logging in place (see CC7)
- [ ] Encryption in transit and at rest configured (see CC6.7, C1.1)
- [ ] Endpoint management/EDR policy for developer machines

**CC5.3 · Policies and procedures** (scored 0 (Not Met))

- [ ] Policies are version-controlled with review history and effective dates
- [ ] Employee acknowledgments tracked

**CC6.1 · Logical access security** (scored 0 (Not Met))

- [ ] **Authentication:** SSO/OIDC/SAML supported for workforce and enterprise customers; MFA available and enforced for admins/privileged roles
- [ ] **Authorization:** Server-side RBAC/ABAC enforced on **every** endpoint and object access (no IDOR); deny by default; tenant isolation enforced in queries

**CC6.2 · Registration and authorization before access** (scored 0 (Not Met))

- [ ] Workforce access is provisioned through IdP/SCIM or an approved request workflow
- [ ] IAM/permission changes made via IaC with PR review and approval
- [ ] No default or shared credentials; service accounts have documented owners and purpose
- [ ] Role definitions documented and mapped to job function

**CC6.3 · Access removal and modification** (scored 0 (Not Met))

- [ ] SCIM/IdP deprovisioning propagates to the application
- [ ] Role changes take effect promptly (no long-lived cached elevated claims)
- [ ] Periodic access reviews identify and remove stale accounts, keys, and contractor access
- [ ] Machine credentials rotate on schedule and on personnel change

**CC6.5 · Secure disposal of assets** (scored 0 (Not Met))

- [ ] Decommissioned cloud resources (volumes, snapshots, buckets, DBs) are deleted via IaC/lifecycle rules
- [ ] Data-bearing resources have documented decommission steps and verification
- [ ] Device wipe/destruction records exist for endpoints and media

**CC6.6 · Protection against external threats** (scored 0 (Not Met))

- [ ] WAF or equivalent protection for public endpoints; DDoS protections available
- [ ] Admin access via VPN/bastion/zero-trust proxy, not the public internet

**CC6.7 · Protection of data in transmission** (scored 0 (Not Met))

- [ ] Secrets, tokens, and PII are never placed in URLs/query strings or logs
- [ ] Data exports/transfers use encrypted channels (SFTP, presigned URLs with short expiry)
- [ ] Controls exist to prevent unauthorized bulk export/exfiltration (e.g., egress rules, export permissions)

**CC6.8 · Malicious/unauthorized software** (scored 0 (Not Met))

- [ ] Build artifacts are signed or attested; provenance available (e.g., SLSA, Sigstore)
- [ ] Only approved GitHub Actions/CI plugins are allowed (allowlist or SHA-pinning)
- [ ] File-upload paths scan or sandbox untrusted files
- [ ] Endpoint protection/EDR on developer and production hosts

**CC7.1 · Detection of vulnerabilities and configuration changes** (scored 0 (Not Met))

- [ ] Security-relevant events are logged: authentication, authorization failures, privilege changes, admin actions, data export, config changes
- [ ] Logs are centralized and tamper-resistant

**CC7.2 · Monitoring for anomalies** (scored 0 (Not Met))

- [ ] Alerts route to an on-call owner with defined response expectations
- [ ] Logs are structured and include timestamp, actor, action, resource, outcome, and correlation ID
- [ ] Log retention meets policy (see 1.4); access to logs is restricted and audited

**CC7.3 · Security event evaluation** (scored 0 (Not Met))

- [ ] Alert-to-ticket automation exists
- [ ] Event evaluation outcomes are recorded (true/false positive, incident yes/no)

**CC7.4 · Incident response** (scored 0 (Not Met))

- [ ] Emergency capability: revoke keys, disable accounts, kill switches/feature flags, isolate services
- [ ] Incident tickets with timelines exist; postmortems completed with tracked corrective actions
- [ ] Response plan tested (tabletop or simulation) at least annually

**CC7.5 · Recovery from incidents** (scored 0 (Not Met))

- [ ] Infrastructure can be rebuilt from IaC; clean-room redeploy procedure documented
- [ ] Backup restore procedures documented (see A1.2, A1.3)
- [ ] Post-incident remediation is tracked to completion

**CC8.1 · Authorized, tested, approved changes** (scored 0 (Not Met))

- [ ] Production deploys occur only via the pipeline, with protected environment approvals; no manual production changes outside emergency procedure
- [ ] Changes are traceable: commit → PR → ticket → build → deployment, with logs retained
- [ ] Production credentials are not available on developer laptops or standing dev access; test and prod are separated
- [ ] Production data is not used in lower environments unless masked

**CC9.1 · Business disruption risk** (scored 0 (Not Met))

- [ ] Single points of failure identified and mitigated (multi-AZ, redundant components)
- [ ] Critical dependencies (cloud region, DNS, auth provider, payment provider) have documented fallback or degradation behavior
- [ ] Runbooks exist for regional/provider outages

**CC9.2 · Vendor and third-party risk** (scored 0 (Not Met))

- [ ] New dependencies and vendors require review before adoption
- [ ] Third-party credentials are least-privilege and scoped per vendor; rotation supported
- [ ] Data shared with each vendor is documented and minimized; data-flow diagrams cover vendors
- [ ] Webhook/callback authenticity verified; vendor SDKs pinned and scanned
- [ ] Vendor SOC reports, DPAs, security questionnaires, and annual reviews tracked

**A1.1 · Capacity management** (scored 0 (Not Met))

- [ ] Monitoring and alerting on CPU, memory, disk, network, queue depth, DB connections, and storage growth
- [ ] Back-pressure, timeouts, connection-pool limits, and rate limiting protect from overload
- [ ] Capacity reviews occur on a defined cadence

**A1.2 · Environmental protection, backup, and recovery infrastructure** (scored 0 (Not Met))

- [ ] Availability objectives (SLOs/SLAs) defined and monitored, with alerting on breach
- [ ] Environment is reproducible from IaC
- [ ] Physical/environmental controls inherited from provider with reports reviewed

**A1.3 · Recovery plan testing** (scored 0 (Not Met))

- [ ] DR/failover exercises performed, with results documented
- [ ] Failures during tests generate remediation tickets tracked to closure

**PI1.1 · Processing objectives and specifications** (scored 0 (Not Met))

- [ ] Data definitions/dictionary exist for key entities and calculations
- [ ] Service specifications and SLAs/SLOs documented and communicated to users

**PI1.2 · Input completeness and accuracy** (scored 0 (Not Met))

- [ ] Server-side validation (never client-only)
- [ ] Invalid input is rejected or quarantined with clear error handling; malformed records are not silently dropped
- [ ] Parameterized queries; safe file-upload validation (type, size, content)

**PI1.3 · Processing completeness, accuracy, timeliness, authorization** (scored 0 (Not Met))

- [ ] Idempotent handlers; safe retry with deduplication; concurrency control (optimistic locking/versioning)
- [ ] Authorization is re-checked at processing time, not only at intake
- [ ] Business-rule and calculation logic covered by automated tests, including edge cases (rounding, currency, time zones)
- [ ] Job/pipeline monitoring alerts on failure, lag, and stuck work

**PI1.5 · Storage completeness and accuracy** (scored 0 (Not Met))

- [ ] Audit trails/history for critical records; append-only or tamper-evident logs where required
- [ ] Checksums or hashes for stored files/artifacts where integrity matters
- [ ] Data retention rules implemented, including soft-delete semantics where needed
- [ ] Safe, tested migrations; backups verified (see A1)
- [ ] Data-integrity tests or reconciliation queries run on a schedule

**C1.1 · Identify and protect confidential information** (scored 0 (Not Met))

- [ ] Inventory/data map of confidential data locations, including logs, caches, analytics, backups, and vendors
- [ ] Field-level encryption or tokenization for the most sensitive fields
- [ ] Access to confidential data is least-privilege and audit-logged
- [ ] Protection against accidental deletion (versioning, deletion protection, backups)
- [ ] Confidentiality agreements with staff and vendors

**C1.2 · Dispose of confidential information** (scored 0 (Not Met))

- [ ] Deletion propagates to replicas, search indexes, caches, analytics stores, data warehouses, and vendors
- [ ] Backups age out per policy; cryptographic erasure used where feasible
- [ ] Deletion is verified and logged (job outputs, audit records)
- [ ] Media/device disposal records exist

**P1.1 · Privacy notice** (scored 0 (Not Met))

- [ ] Notice is current, versioned, and describes collection, use, retention, disclosure, and disposal
- [ ] Changes are communicated to affected users; prior versions are retained
- [ ] Notice matches actual behavior (compare against schema, analytics events, and third-party SDKs)

**P2.1 · Choice and consent** (scored 0 (Not Met))

- [ ] Consent captured with timestamp, policy/notice version, purpose, and channel
- [ ] Opt-in/opt-out and withdrawal mechanisms exist and are honored in code (analytics, marketing, sharing gates check consent state before executing)
- [ ] Re-consent triggered for new purposes or material changes
- [ ] Explicit consent for sensitive data and cross-border transfers where required

**P3.1 · Collection consistent with objectives** (scored 0 (Not Met))

- [ ] Data minimization: each collected field has a documented purpose
- [ ] Collected data matches what the notice says
- [ ] Third-party SDKs and analytics events reviewed for unintended PII collection
- [ ] Legal basis/purpose recorded where applicable

**P3.2 · Sensitive information** (scored 0 (Not Met))

- [ ] Sensitive categories identified (health, biometric, government ID, financial, precise location, children's data, etc.)
- [ ] Explicit consent obtained before collection
- [ ] Age-gating/parental-consent logic where minors' data is possible

**P4.2 · Retention of personal information** (scored 0 (Not Met))

- [ ] Retention schedule defined per data type
- [ ] Backup and log retention aligned with schedule
- [ ] Legal-hold process exists and is honored by purge jobs

**P4.3 · Disposal of personal information** (scored 0 (Not Met))

- [ ] Deletion cascades to all stores (primary, replicas, caches, search, warehouse, vendors, backups on expiry)
- [ ] Deletion is verified and audit-logged
- [ ] P4.1–P4.3 operate as one connected data-lifecycle control (use → retain → dispose)

**P5.1 · Data subject access** (scored 0 (Not Met))

- [ ] Requester identity is authenticated before disclosure; export is scoped to that subject only
- [ ] Machine-readable export format
- [ ] Export covers all stores holding the subject's data, including vendors
- [ ] Requests are tracked with response-time SLA and audit logs
- [ ] Endpoint is rate-limited and abuse-resistant

**P5.2 · Correction and amendment** (scored 0 (Not Met))

- [ ] Corrections propagate to downstream systems and relevant third parties
- [ ] Change history/audit trail retained; denials documented with rationale

**P6.1 · Authorized disclosure to third parties** (scored 0 (Not Met))

- [ ] Consent/authorization checked in code before sending PI to third parties
- [ ] Cross-border transfer mechanisms documented where applicable

**P6.3 · Records of unauthorized disclosures** (scored 0 (Not Met))

- [ ] Detection exists for likely exposure paths (public buckets, misdirected exports, log leakage, DLP)
- [ ] Records link to the incident-response process (CC7.3–CC7.4)

**P6.5 · Third-party notification of unauthorized disclosure** (scored 0 (Not Met))

- [ ] Contracts specify notification timelines

**P6.6 · Breach notification** (scored 0 (Not Met))

- [ ] Affected data subjects can be identified quickly through queries and tooling
- [ ] Contact data and notification tooling available for affected populations
- [ ] Notification decisions recorded

**P7.1 · Data quality** (scored 0 (Not Met))

- [ ] Users can review and update their own data
- [ ] Data-quality checks or stale-data flagging run on a schedule
- [ ] Irrelevant or unnecessary fields are removed

**P8.1 · Privacy inquiries, complaints, and disputes** (scored 0 (Not Met))

- [ ] Ticketed workflow with SLAs, investigation, resolution, and communication back to the requester
- [ ] Privacy reviews (PIA/DPIA) are part of the SDLC for new features handling PI
- [ ] Periodic privacy compliance monitoring; deficiencies feed corrective actions (CC4.2)

---

Generated by threesock 0.1.0 on 2026-01-15 · JSON schema 1.4.0
