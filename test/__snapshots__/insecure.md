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
| Security | 8 | 0 | 16 | 0.0% | Not ready (capped: open Critical) | 25 |
| Availability | — | — | — | not in scope | — | — |
| Processing Integrity | — | — | — | not in scope | — | — |
| Confidentiality | — | — | — | not in scope | — | — |
| Privacy | — | — | — | not in scope | — | — |

Open findings: 9 critical · 18 high · 16 medium · 4 low

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
| CC1.3 | Organizational structure | 0 (Not Met) |  | F-028 |  | No automated check passed. |
| CC1.4 | Competence | MANUAL |  |  | Leadership and People Ops | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC1.5 | Accountability | MANUAL |  |  | Leadership and People Ops | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC2.1 | Relevant, quality information | MANUAL |  |  | Security lead | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC2.2 | Internal communication | MANUAL |  |  | Security lead | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC2.3 | External communication | 0 (Not Met) |  | F-029 |  | No automated check passed. |
| CC3.1 | Suitable objectives | MANUAL |  |  | Security and risk owner | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC3.2 | Risk identification and analysis | MANUAL |  |  | Security and risk owner | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC3.3 | Fraud risk | MANUAL |  |  | Security and risk owner | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC3.4 | Significant changes | MANUAL |  |  | Security and risk owner | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC4.1 | Ongoing/separate evaluations | MANUAL |  |  | Security lead | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC4.2 | Deficiency communication and remediation | MANUAL |  |  | Security lead | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC5.1 | Control selection and design | MANUAL |  |  | Security / GRC | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC5.2 | Technology general controls | 0 (Not Met) |  | F-001, F-010, F-011, F-012, F-013, F-030, F-031 |  | An open Critical finding caps this criterion at 0 until it is resolved. |
| CC5.3 | Policies and procedures | MANUAL |  |  | Security / GRC | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC6.1 | Logical access security | 0 (Not Met) |  | F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-014, F-015, F-016, F-032, F-033, F-034, F-044, F-045 |  | An open Critical finding caps this criterion at 0 until it is resolved. |
| CC6.2 | Registration and authorization before access | MANUAL |  |  | Security and platform engineering | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC6.3 | Access removal and modification | MANUAL |  |  | Security and platform engineering | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC6.4 | Physical access | MANUAL |  |  | IT and facilities (inherit from cloud provider SOC 2 report) | The rubric marks this criterion as manual evidence; any repository signals are supporting evidence only. |
| CC6.5 | Secure disposal of assets | MANUAL |  |  | Security and platform engineering | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC6.6 | Protection against external threats | 0 (Not Met) |  | F-009, F-017, F-018, F-019, F-020, F-021, F-035, F-036 |  | An open Critical finding caps this criterion at 0 until it is resolved. |
| CC6.7 | Protection of data in transmission | 0 (Not Met) |  | F-022, F-023, F-037 |  | Red flag present: Node TLS client with certificate rejection turned off (F-022). |
| CC6.8 | Malicious/unauthorized software | 0 (Not Met) |  | F-024, F-025, F-038, F-039, F-040, F-041 |  | No automated check passed. |
| CC7.1 | Detection of vulnerabilities and configuration changes | MANUAL |  |  | SRE / security operations | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC7.2 | Monitoring for anomalies | MANUAL |  |  | SRE / security operations | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC7.3 | Security event evaluation | MANUAL |  |  | SRE / security operations | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC7.4 | Incident response | MANUAL |  |  | SRE / security operations | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC7.5 | Recovery from incidents | MANUAL |  |  | SRE / security operations | threesock has no automated checks for this criterion yet. Gather evidence manually. |
| CC8.1 | Authorized, tested, approved changes | 0 (Not Met) |  | F-026, F-027, F-042, F-043, F-046, F-047 |  | No automated check passed. |
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
Location:          infra/main.tf:17
Observed:          aws_s3_bucket.exports sets acl = "public-read" (detected by threesock's lightweight Terraform scanner).
Expected:          Object storage is private by default, with public access blocks enabled; public content is served through a CDN with origin access control.
Risk:              Public buckets are one of the most common causes of large data exposures and are discovered by automated scanners.
Recommendation:    Remove public ACLs and allUsers bindings, enable the public access block, and serve intentionally public assets through a CDN with origin access control.
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

### F-010 · High · CC5.2 · Long-lived cloud credentials in .github/workflows/ci.yml

```
Finding ID:        F-010
Criterion:         CC5.2
Severity:          High
Title:             Long-lived cloud credentials in .github/workflows/ci.yml
Location:          .github/workflows/ci.yml:21
Observed:          .github/workflows/ci.yml passes stored cloud keys to the workflow (line 21) instead of using OIDC.
Expected:          Workflows assume cloud roles through OIDC federation (id-token: write), so no long-lived cloud keys are stored as CI secrets.
Risk:              Long-lived cloud keys in CI leak through logs, forks and compromised actions, and stay valid until someone remembers to rotate them.
Recommendation:    Configure an OIDC trust between GitHub and your cloud, assume a scoped role in the workflow, and delete the stored keys.
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

### F-011 · High · CC5.2 · Script injection risk in .github/workflows/ci.yml

```
Finding ID:        F-011
Criterion:         CC5.2
Severity:          High
Title:             Script injection risk in .github/workflows/ci.yml
Location:          .github/workflows/ci.yml:12
Observed:          A run step in .github/workflows/ci.yml interpolates attacker-controllable event data at line 12.
Expected:          run: steps pass attacker-controllable values (issue titles, PR bodies, branch names) through environment variables, never `${{ }}` interpolation.
Risk:              A crafted issue title or branch name becomes shell code running in your workflow, with its token and secrets.
Recommendation:    Move the value into an environment variable and reference it as a quoted shell variable.
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

### F-012 · High · CC5.2 · Secret printed in .github/workflows/ci.yml

```
Finding ID:        F-012
Criterion:         CC5.2
Severity:          High
Title:             Secret printed in .github/workflows/ci.yml
Location:          .github/workflows/ci.yml:14
Observed:          A run step prints a secret in .github/workflows/ci.yml at line 14.
Expected:          Workflows never print secrets; they pass them to tools through environment variables or files.
Risk:              Masking is best-effort: transformed or partial values slip through, and logs are readable by everyone with repository read access.
Recommendation:    Remove the echo. Pass the secret through env and let the tool read it, or write it to a file with restricted permissions.
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

### F-013 · High · CC5.2 · write-all token permissions in .github/workflows/ci.yml

```
Finding ID:        F-013
Criterion:         CC5.2
Severity:          High
Title:             write-all token permissions in .github/workflows/ci.yml
Location:          .github/workflows/ci.yml:3
Observed:          .github/workflows/ci.yml grants permissions: write-all at line 3.
Expected:          Each workflow declares `permissions:` (read-only by default) and grants write scopes only to the jobs that need them. Nothing uses write-all.
Risk:              A broad GITHUB_TOKEN lets any compromised step push code, create releases or change repository settings.
Recommendation:    Set a read-only default at the top of each workflow and grant specific write scopes per job.
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

### F-014 · High · CC6.1 · Hard-coded database URL with password

```
Finding ID:        F-014
Criterion:         CC6.1
Severity:          High
Title:             Hard-coded database URL with password
Location:          .env:2
Observed:          A database URL with password (Vq8********) is present in .env at line 2. The value is redacted.
Expected:          No secrets in source, config files, images or history. Secrets are loaded at runtime from a secrets manager or environment.
Risk:              Anyone with read access to the repository, its forks or its history can use the credential. Leaked keys are routinely harvested within minutes of a public push.
Recommendation:    Revoke and rotate the credential first, then remove it from the code and load it from a secrets manager or environment variable. Rewriting git history does not un-leak a pushed secret.
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

### F-015 · High · CC6.1 · IAM policy allows every action ("*")

```
Finding ID:        F-015
Criterion:         CC6.1
Severity:          High
Title:             IAM policy allows every action ("*")
Location:          infra/main.tf:25
Observed:          IAM policy allows every action ("*") in infra/main.tf at line 25.
Expected:          IAM roles and policies grant specific actions on specific resources; no "*" actions and no primitive owner/editor roles.
Risk:              A wildcard policy turns any compromise of that identity into full control of the account.
Recommendation:    Replace wildcards with the specific actions the workload needs. IAM Access Analyzer or CloudTrail-based policy generation can produce a least-privilege policy from real usage.
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

### F-016 · High · CC6.1 · Password hashed with a fast, general-purpose hash function

```
Finding ID:        F-016
Criterion:         CC6.1
Severity:          High
Title:             Password hashed with a fast, general-purpose hash function
Location:          src/server.js:27
Observed:          Password hashed with a fast, general-purpose hash function in src/server.js at line 27.
Expected:          Passwords are hashed with Argon2id, bcrypt or scrypt (rubric 1.4). Fast hashes such as MD5, SHA-1 or SHA-256 are never used for passwords.
Risk:              Fast hashes can be brute-forced at billions of guesses per second, so a database leak becomes a credential leak.
Recommendation:    Hash passwords with Argon2id (preferred), bcrypt or scrypt through a maintained library, and rehash on next login when migrating.
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

### F-017 · High · CC6.6 · CORS allows any origin with credentials

```
Finding ID:        F-017
Criterion:         CC6.6
Severity:          High
Title:             CORS allows any origin with credentials
Location:          src/server.js:12
Observed:          src/server.js allows any (or reflected) origin at line 12 and also enables credentials.
Expected:          Credentialed CORS is limited to an explicit allow-list of origins; wildcard or reflected origins are only used for public, credential-less APIs.
Risk:              Any website a user visits can make authenticated requests to the API and read the responses.
Recommendation:    Replace the wildcard or reflected origin with an explicit list of trusted origins, or drop credentials for truly public endpoints.
Owner:             Unassigned
Due date:          2026-02-14
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is bded86cd02c319b9.
```

Example fix:

```
app.use(cors({ origin: ['https://app.example.com'], credentials: true }));
```

### F-018 · High · CC6.6 · Dynamic evaluation of a string as code

```
Finding ID:        F-018
Criterion:         CC6.6
Severity:          High
Title:             Dynamic evaluation of a string as code
Location:          src/server.js:22
Observed:          Dynamic evaluation of a string as code in src/server.js at line 22.
Expected:          Code never evaluates strings as code, never builds shell commands from strings, and never deserializes untrusted data with unsafe loaders.
Risk:              If any part of the evaluated string or command can be influenced by a user, the result is remote code execution.
Recommendation:    Replace dynamic evaluation with explicit logic, pass command arguments as an array without a shell, and use safe loaders (json, yaml.safe_load).
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

### F-019 · High · CC6.6 · Shell command built with string interpolation

```
Finding ID:        F-019
Criterion:         CC6.6
Severity:          High
Title:             Shell command built with string interpolation
Location:          src/server.js:23
Observed:          Shell command built with string interpolation in src/server.js at line 23.
Expected:          Code never evaluates strings as code, never builds shell commands from strings, and never deserializes untrusted data with unsafe loaders.
Risk:              If any part of the evaluated string or command can be influenced by a user, the result is remote code execution.
Recommendation:    Replace dynamic evaluation with explicit logic, pass command arguments as an array without a shell, and use safe loaders (json, yaml.safe_load).
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

### F-020 · High · CC6.6 · SSH (22) open to the internet in aws_security_group.bastion

```
Finding ID:        F-020
Criterion:         CC6.6
Severity:          High
Title:             SSH (22) open to the internet in aws_security_group.bastion
Location:          infra/main.tf:4
Observed:          aws_security_group.bastion allows ingress from 0.0.0.0/0 to SSH (22) (detected by threesock's lightweight Terraform scanner).
Expected:          Firewall rules never allow 0.0.0.0/0 or ::/0 to admin ports (SSH, RDP) or data ports (PostgreSQL, MySQL, Redis, MongoDB, ...).
Risk:              Internet-exposed admin and database ports are scanned constantly and are a leading entry point for breaches and ransomware.
Recommendation:    Restrict ingress to known CIDRs or security groups, and reach admin interfaces through a VPN, bastion, SSM Session Manager or an identity-aware proxy.
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

### F-021 · High · CC6.6 · SQL built from strings

```
Finding ID:        F-021
Criterion:         CC6.6
Severity:          High
Title:             SQL built from strings
Location:          src/server.js:24
Observed:          SQL query built with template literal interpolation in src/server.js at line 24.
Expected:          Queries use bound parameters or a query builder; user input is never concatenated or interpolated into SQL.
Risk:              String-built SQL is the classic injection flaw: one unescaped value can read, change or delete the whole database.
Recommendation:    Pass values as bound parameters (placeholders) or use a tagged template or query builder that parameterizes for you.
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

### F-022 · High · CC6.7 · Node TLS client with certificate rejection turned off

```
Finding ID:        F-022
Criterion:         CC6.7
Severity:          High
Title:             Node TLS client with certificate rejection turned off
Location:          src/server.js:36
Observed:          Node TLS client with certificate rejection turned off in src/server.js at line 36.
Expected:          Every TLS client validates certificates and hostnames. Private CAs are trusted explicitly instead of turning validation off.
Risk:              With validation off, anyone on the network path can impersonate the server and read or alter traffic, including credentials.
Recommendation:    Remove the override. For internal or self-signed services, trust the specific CA bundle instead.
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

### F-023 · High · CC6.7 · Weak cipher (DES, 3DES, RC4, Blowfish or ECB mode)

```
Finding ID:        F-023
Criterion:         CC6.7
Severity:          High
Title:             Weak cipher (DES, 3DES, RC4, Blowfish or ECB mode)
Location:          src/server.js:41
Observed:          Weak cipher (DES, 3DES, RC4, Blowfish or ECB mode) in src/server.js at line 41.
Expected:          TLS endpoints and clients require at least the configured minimum version (default 1.2), and code uses modern ciphers (AES-GCM, ChaCha20-Poly1305).
Risk:              Legacy protocols and ciphers have practical attacks that expose traffic or encrypted data.
Recommendation:    Raise the minimum TLS version to 1.2 or 1.3 and replace legacy ciphers with an authenticated cipher such as AES-256-GCM.
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

### F-024 · High · CC6.8 · Remote script piped straight into a shell

```
Finding ID:        F-024
Criterion:         CC6.8
Severity:          High
Title:             Remote script piped straight into a shell
Location:          Dockerfile:5
Observed:          Remote script piped straight into a shell in Dockerfile at line 5.
Expected:          Downloaded tools and scripts are verified with a checksum or signature before they run.
Risk:              Piping a remote script to a shell runs whatever the server (or anyone who compromises it) sends, inside your build.
Recommendation:    Download to a file, verify its checksum or signature, then run it, or install from a package manager.
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

### F-025 · High · CC6.8 · No lockfile for package.json

```
Finding ID:        F-025
Criterion:         CC6.8
Severity:          High
Title:             No lockfile for package.json
Location:          package.json
Observed:          package.json declares npm dependencies but no lockfile (package-lock.json, npm-shrinkwrap.json, pnpm-lock.yaml, yarn.lock, bun.lock, bun.lockb) is committed.
Expected:          Every dependency manifest has a committed lockfile (or hash-pinned requirements) so installs are reproducible.
Risk:              Without a lockfile, each install can pull different, possibly compromised, versions, and a build cannot be reproduced.
Recommendation:    Generate the lockfile with your package manager, commit it, and install with the frozen/ci mode in CI.
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

### F-026 · High · CC8.1 · Tests do not run on pull requests

```
Finding ID:        F-026
Criterion:         CC8.1
Severity:          High
Title:             Tests do not run on pull requests
Location:          repository
Observed:          No workflow is triggered by pull_request.
Expected:          A CI pipeline runs automated tests and lint on every pull request, and branch protection requires it to pass before merge.
Risk:              Without a test gate, broken or unreviewed behaviour reaches the default branch and production.
Recommendation:    Add a pull-request workflow that runs tests and lint, then make it a required status check.
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

### F-027 · High · CC8.1 · Terraform uses local state

```
Finding ID:        F-027
Criterion:         CC8.1
Severity:          High
Title:             Terraform uses local state
Location:          repository
Observed:          No backend or cloud block was found in 1 Terraform file(s) (detected by threesock's lightweight Terraform scanner), so state is local to whoever runs apply.
Expected:          Terraform state lives in a remote, locked, access-controlled backend, and state files are never committed.
Risk:              State files contain secrets in plain text, and unlocked or local state lets concurrent applies corrupt infrastructure.
Recommendation:    Configure a remote backend with locking, remove committed state from git (and rotate any secrets it held), and gitignore *.tfstate.
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

### F-028 · Medium · CC1.3 · No CODEOWNERS file

```
Finding ID:        F-028
Criterion:         CC1.3
Severity:          Medium
Title:             No CODEOWNERS file
Location:          repository
Observed:          No CODEOWNERS file found in .github/, the root or docs/.
Expected:          A CODEOWNERS file assigns an owner to every directory, with named teams on security-sensitive paths.
Risk:              Changes to unowned code can merge without review from anyone accountable for it.
Recommendation:    Add .github/CODEOWNERS with a catch-all owner and named teams for sensitive paths, then require code owner review in branch protection.
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

### F-029 · Medium · CC2.3 · No vulnerability disclosure policy

```
Finding ID:        F-029
Criterion:         CC2.3
Severity:          Medium
Title:             No vulnerability disclosure policy
Location:          repository
Observed:          No SECURITY.md or security.txt found (looked in SECURITY.md, .github/SECURITY.md, docs/SECURITY.md, .well-known/security.txt, public/.well-known/security.txt, static/.well-known/security.txt).
Expected:          A SECURITY.md (or /.well-known/security.txt) tells external researchers how to report a vulnerability and what response to expect.
Risk:              Without a published channel, vulnerabilities get reported publicly, to the wrong person, or not at all.
Recommendation:    Add SECURITY.md at the repository root with a private reporting channel, supported versions and expected response time.
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

### F-030 · Medium · CC5.2 · 3 actions not pinned to a SHA in .github/workflows/ci.yml

```
Finding ID:        F-030
Criterion:         CC5.2
Severity:          Medium
Title:             3 actions not pinned to a SHA in .github/workflows/ci.yml
Location:          .github/workflows/ci.yml:8
Observed:          Unpinned: actions/checkout@v4 (line 8), some-org/setup-deploy@main (line 18), aws-actions/configure-aws-credentials@v4 (line 19).
Expected:          Every third-party action is pinned to a full 40-character commit SHA (with the version in a comment), so a moved tag cannot change what runs.
Risk:              Tags can be moved. A compromised action tag (as in the tj-actions/changed-files incident) runs attacker code with your workflow's secrets.
Recommendation:    Pin each action to the commit SHA of the release you reviewed, keep the version as a comment, and let Dependabot update the pins.
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is b286c79acb36cf93.
```

Example fix:

```
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```

### F-031 · Medium · CC5.2 · Deploy job without an environment: deploy

```
Finding ID:        F-031
Criterion:         CC5.2
Severity:          Medium
Title:             Deploy job without an environment: deploy
Location:          .github/workflows/ci.yml:15
Observed:          Job deploy in .github/workflows/ci.yml deploys or publishes without an environment, so no reviewer or branch gate applies.
Expected:          Jobs that deploy or publish run in a GitHub environment, so required reviewers, branch restrictions and environment-scoped secrets apply.
Risk:              Without an environment gate, anyone who can push to a triggering branch can deploy to production.
Recommendation:    Add `environment: production` to deploy jobs and configure required reviewers and deployment branch rules on that environment.
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

### F-032 · Medium · CC6.1 · Session cookie is readable from JavaScript (HttpOnly disabled)

```
Finding ID:        F-032
Criterion:         CC6.1
Severity:          Medium
Title:             Session cookie is readable from JavaScript (HttpOnly disabled)
Location:          src/server.js:16
Observed:          Session cookie is readable from JavaScript (HttpOnly disabled) in src/server.js at line 16.
Expected:          Session and auth cookies set HttpOnly, Secure and SameSite.
Risk:              Without HttpOnly an XSS bug can steal sessions; without Secure the cookie can leak over plain HTTP.
Recommendation:    Set httpOnly, secure and sameSite on every session or auth cookie. Use an environment check only to relax Secure for local HTTP development.
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

### F-033 · Medium · CC6.1 · JWT decoded without verifying its signature

```
Finding ID:        F-033
Criterion:         CC6.1
Severity:          Medium
Title:             JWT decoded without verifying its signature
Location:          src/server.js:32
Observed:          JWT decoded without verifying its signature in src/server.js at line 32.
Expected:          JWTs are signed with strong algorithms and validated (alg, exp, aud, iss) on every request.
Risk:              An unverified or "none"-algorithm token lets anyone forge a session for any user.
Recommendation:    Always verify tokens with an explicit algorithm allow-list, and check exp, aud and iss. Use decode only for logging-free inspection of already-verified tokens.
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

### F-034 · Medium · CC6.1 · No automated secret scanning

```
Finding ID:        F-034
Criterion:         CC6.1
Severity:          Medium
Title:             No automated secret scanning
Location:          repository
Observed:          No Gitleaks, TruffleHog, detect-secrets or similar scanner is configured in CI, pre-commit or the repository. Platform-level push protection is checked with --github.
Expected:          A secret scanner runs on every push or pull request (and ideally as a pre-commit hook), with push protection enabled on the hosting platform.
Risk:              Without automated scanning, a committed credential is found by an attacker before it is found by you.
Recommendation:    Add Gitleaks (or TruffleHog) to CI and to pre-commit, and enable GitHub secret scanning with push protection.
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

### F-035 · Medium · CC6.6 · No HTTP security headers configured

```
Finding ID:        F-035
Criterion:         CC6.6
Severity:          Medium
Title:             No HTTP security headers configured
Location:          package.json
Observed:          HTTP server or web framework detected in package.json, but no security-headers middleware or CSP/HSTS configuration was found in code or config. They may be set at a CDN; if so, add an exception that says where.
Expected:          Responses set CSP, HSTS, X-Content-Type-Options and frame protections, in code or at the edge (CDN, proxy, platform config).
Risk:              Missing headers remove browser-side defences against XSS, clickjacking and protocol downgrade.
Recommendation:    Add a security-headers middleware (helmet, Talisman, SecurityMiddleware) or set the headers in your proxy or platform configuration.
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

### F-036 · Medium · CC6.6 · DOM innerHTML/outerHTML assigned without visible sanitization

```
Finding ID:        F-036
Criterion:         CC6.6
Severity:          Medium
Title:             DOM innerHTML/outerHTML assigned without visible sanitization
Location:          src/public/app.js:2
Observed:          DOM innerHTML/outerHTML assigned without visible sanitization in src/public/app.js at line 2.
Expected:          HTML output is escaped by the framework; raw-HTML sinks are avoided or fed only sanitized content.
Risk:              Rendering raw HTML that contains user input enables cross-site scripting: session theft and actions on the victim's behalf.
Recommendation:    Render text through the framework's escaping. Where raw HTML is unavoidable, sanitize it with DOMPurify (or bleach) on the same line so the intent is visible.
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 252663a1cc6ca858.
```

Example fix:

```
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```

### F-037 · Medium · CC6.7 · Plain HTTP URL to api.partner-service.com

```
Finding ID:        F-037
Criterion:         CC6.7
Severity:          Medium
Title:             Plain HTTP URL to api.partner-service.com
Location:          src/server.js:37
Observed:          http://api.partner-service.com is used in src/server.js at line 37.
Expected:          Every external and internal service URL uses https://. Plain HTTP is limited to localhost and documentation examples.
Risk:              Requests over plain HTTP can be read and modified in transit, including tokens and personal data.
Recommendation:    Switch the URL to https:// and make sure the target service redirects HTTP to HTTPS with HSTS.
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 058f7cfbcedb5e93.
```

Example fix:

```
const API_URL = process.env.API_URL ?? 'https://api.example.com';
```

### F-038 · Medium · CC6.8 · Unpinned base image node:latest

```
Finding ID:        F-038
Criterion:         CC6.8
Severity:          Medium
Title:             Unpinned base image node:latest
Location:          Dockerfile:1
Observed:          node:latest in Dockerfile at line 1 has no version tag or uses :latest.
Expected:          Base images use an explicit version tag, ideally pinned by digest, from a trusted registry.
Risk:              An untagged or :latest base image changes underneath you, so builds are not reproducible and a compromised upstream image flows straight in.
Recommendation:    Pin base images to a version and digest, and let Dependabot or Renovate propose updates.
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is a190bb6b318d0b0c.
```

Example fix:

```
FROM node:22.11.0-bookworm-slim@sha256:<digest>
```

### F-039 · Medium · CC6.8 · Container images are not scanned

```
Finding ID:        F-039
Criterion:         CC6.8
Severity:          Medium
Title:             Container images are not scanned
Location:          repository
Observed:          The repository builds container images but no image scanner (Trivy, Grype, Snyk, Docker Scout) runs in CI.
Expected:          Images built from this repository are scanned (Trivy, Grype, Snyk, Docker Scout) before they are pushed or deployed.
Risk:              Base images and OS packages carry their own vulnerabilities that dependency scanning of your code does not see.
Recommendation:    Scan each built image in CI and fail on Critical/High vulnerabilities with a fix available.
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

### F-040 · Medium · CC6.8 · Missing automated dependency updates (Dependabot or Renovate) and a dependency vulnerability scan in CI

```
Finding ID:        F-040
Criterion:         CC6.8
Severity:          Medium
Title:             Missing automated dependency updates (Dependabot or Renovate) and a dependency vulnerability scan in CI
Location:          repository
Observed:          No automated dependency updates (Dependabot or Renovate) and a dependency vulnerability scan in CI is configured.
Expected:          Dependabot or Renovate keeps dependencies current, and a vulnerability scan (dependency review, OSV-Scanner, npm audit, pip-audit, govulncheck) runs in CI.
Risk:              Known-vulnerable dependencies are the most common way attackers get in, and they are only fixed if someone notices.
Recommendation:    Enable Dependabot (or Renovate) and add a dependency scan to pull-request CI.
Owner:             Unassigned
Due date:          2026-04-15
Status:            Open
Verification:      Re-run threesock; this finding's fingerprint is 8c1d00f27d428537.
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

### F-041 · Medium · CC6.8 · `npm install` used in a build

```
Finding ID:        F-041
Criterion:         CC6.8
Severity:          Medium
Title:             `npm install` used in a build
Location:          Dockerfile:4
Observed:          Dockerfile runs npm install at line 4; use npm ci to install from the lockfile.
Expected:          Builds install exactly what the lockfile says (npm ci, pnpm install --frozen-lockfile, pip --require-hashes).
Risk:              `npm install` in CI can rewrite the lockfile and pull versions nobody reviewed.
Recommendation:    Use the lockfile-respecting install command in CI and Dockerfiles.
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

### F-042 · Medium · CC8.1 · Sensitive paths have no code owners

```
Finding ID:        F-042
Criterion:         CC8.1
Severity:          Medium
Title:             Sensitive paths have no code owners
Location:          repository
Observed:          3 sensitive files exist but there is no CODEOWNERS file.
Expected:          Security-sensitive paths (auth, IAM, crypto, payments, infrastructure, workflows, migrations, lockfiles) have a specific CODEOWNERS entry, not just the catch-all.
Risk:              Changes to the riskiest code can be approved by any reviewer instead of the people accountable for it.
Recommendation:    Add explicit CODEOWNERS entries for sensitive paths and require code owner review. Adjust what counts as sensitive with sensitivePaths in threesock.yaml.
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

### F-043 · Medium · CC8.1 · Migration without a down step

```
Finding ID:        F-043
Criterion:         CC8.1
Severity:          Medium
Title:             Migration without a down step
Location:          migrations/001_init.up.sql
Observed:          migrations/001_init.up.sql has no matching 001_init.down.sql.
Expected:          Each migration has a down/downgrade step, or the repository documents how schema changes are rolled back.
Risk:              A bad migration without a way back turns a deploy rollback into a data-recovery incident.
Recommendation:    Write a down migration for each change, or document the expand/contract and restore procedure used instead.
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

### F-044 · Low · CC6.1 · .gitignore does not exclude .env files

```
Finding ID:        F-044
Criterion:         CC6.1
Severity:          Low
Title:             .gitignore does not exclude .env files
Location:          .gitignore
Observed:          .gitignore has no entry matching .env files.
Expected:          Environment files with real values stay out of version control. Only templates such as .env.example are committed, and .gitignore excludes .env files.
Risk:              A committed .env file usually holds live credentials, which are then exposed to everyone with repository access and remain in git history.
Recommendation:    Rotate any credentials the file contains, remove it from git with `git rm --cached`, add `.env*` to .gitignore, and commit a .env.example with empty values instead.
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

### F-045 · Low · CC6.1 · Possible literal credential: smtpPassword

```
Finding ID:        F-045
Criterion:         CC6.1
Severity:          Low
Title:             Possible literal credential: smtpPassword
Location:          src/server.js:20
Observed:          `smtpPassword` is assigned a literal value (Hun********) in src/server.js at line 20. The value is redacted.
Expected:          Credential-like settings read their values from the environment or a secrets manager, never from string literals.
Risk:              A literal credential in code is shared with everyone who can read the repository and is hard to rotate. This check is heuristic, so confirm each match.
Recommendation:    Replace the literal with a value loaded at runtime. If it is not a credential, add an exception with a justification.
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

### F-046 · Low · CC8.1 · No documented emergency change process

```
Finding ID:        F-046
Criterion:         CC8.1
Severity:          Low
Title:             No documented emergency change process
Location:          repository
Observed:          No document describes an emergency, hotfix or break-glass change process.
Expected:          An emergency (hotfix / break-glass) change process is documented, including who may use it and the retroactive review it requires.
Risk:              Without a defined path, urgent fixes bypass review informally and leave no audit trail, which auditors treat as a control failure.
Recommendation:    Document the emergency change path: who can invoke it, what is skipped, and the retroactive review required within a set time.
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

### F-047 · Low · CC8.1 · No documented rollback procedure

```
Finding ID:        F-047
Criterion:         CC8.1
Severity:          Low
Title:             No documented rollback procedure
Location:          repository
Observed:          No runbook or document describing how to roll back a deployment was found.
Expected:          A runbook explains how to roll back a bad release, who can do it, and how to verify it worked.
Risk:              Under incident pressure, an undocumented rollback is slow, inconsistent and easy to get wrong.
Recommendation:    Add a rollback section to your deployment runbook (docs/runbooks/rollback.md) and rehearse it.
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

**CC1.3 · Organizational structure** (scored 0 (Not Met))

- [ ] Service ownership recorded (service catalog, `catalog-info.yaml`, README owner section)
- [ ] Segregation of duties enforced: PR authors cannot approve their own changes; production deploy permission is distinct from write access
- [ ] Org chart, RACI, and job descriptions exist

**CC2.3 · External communication** (scored 0 (Not Met))

- [ ] Public privacy/security notices are current and linked in the product
- [ ] Incident notification templates for customers exist
- [ ] Status page configured; API documentation states auth and security requirements
- [ ] Vendor security requirements communicated

**CC5.2 · Technology general controls** (scored 0 (Not Met))

- [ ] SSO/MFA enforced on source control, cloud console, CI/CD, and production tooling
- [ ] Centralized logging in place (see CC7)
- [ ] Encryption in transit and at rest configured (see CC6.7, C1.1)
- [ ] Endpoint management/EDR policy for developer machines

**CC6.1 · Logical access security** (scored 0 (Not Met))

- [ ] **Authentication:** SSO/OIDC/SAML supported for workforce and enterprise customers; MFA available and enforced for admins/privileged roles
- [ ] **Authorization:** Server-side RBAC/ABAC enforced on **every** endpoint and object access (no IDOR); deny by default; tenant isolation enforced in queries

**CC6.6 · Protection against external threats** (scored 0 (Not Met))

- [ ] WAF or equivalent protection for public endpoints; DDoS protections available
- [ ] Admin access via VPN/bastion/zero-trust proxy, not the public internet

**CC6.7 · Protection of data in transmission** (scored 0 (Not Met))

- [ ] Webhooks and callbacks are signed and verified
- [ ] Secrets, tokens, and PII are never placed in URLs/query strings or logs
- [ ] Data exports/transfers use encrypted channels (SFTP, presigned URLs with short expiry)
- [ ] Controls exist to prevent unauthorized bulk export/exfiltration (e.g., egress rules, export permissions)

**CC6.8 · Malicious/unauthorized software** (scored 0 (Not Met))

- [ ] Build artifacts are signed or attested; provenance available (e.g., SLSA, Sigstore)
- [ ] Only approved GitHub Actions/CI plugins are allowed (allowlist or SHA-pinning)
- [ ] File-upload paths scan or sandbox untrusted files
- [ ] Endpoint protection/EDR on developer and production hosts

**CC8.1 · Authorized, tested, approved changes** (scored 0 (Not Met))

- [ ] **Branch protection** on default and release branches: PR required; ≥ 1 approving review from someone other than the author; stale approvals dismissed; required status checks; conversation resolution; force-push and deletion disabled
- [ ] **Admins are not exempt** from protection, or bypass is logged and reviewed
- [ ] Production deploys occur only via the pipeline, with protected environment approvals; no manual production changes outside emergency procedure
- [ ] Changes are traceable: commit → PR → ticket → build → deployment, with logs retained
- [ ] Production credentials are not available on developer laptops or standing dev access; test and prod are separated
- [ ] Production data is not used in lower environments unless masked

---

Generated by threesock 0.1.0 on 2026-01-15 · JSON schema 1.0.0
