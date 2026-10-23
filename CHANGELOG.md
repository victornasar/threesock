# Changelog

All notable changes to threesock are recorded here. The JSON report has its own `schemaVersion`; changes to it are called out explicitly.

## 0.1.0 - 2026-10-23

### Added
- GitHub Action (`action/action.yml`): composite action that uploads SARIF, writes a job summary and gates on `fail-on`; inputs reach the shell only through environment variables.
- MCP server, published separately as `threesock-mcp` so `npx threesock` stays at two packages (3 MB): read-only `scan`, `list_findings`, `suggest_fix`, `explain_criterion` and `get_report` tools; scans only under its working directory (`--allow-path` to widen).
- `--output <format>=<file>` writes extra formats from one scan.
- Release workflow: npm trusted publishing (OIDC, provenance) from `v*` tags in a protected environment.
- Docs site content in `docs/site`, including a generated rule reference.

### Fixed
- Rules meant to mirror rubric red flags (public buckets, open admin ports, string-built SQL, unencrypted storage, and others) did not zero their criterion, because the engine defaults to "not a red flag". Every rule now declares it explicitly, and a test enforces that.
- Direct pushes to the default branch are now a rubric red flag, as the rubric lists.
- Privacy rules (P1.1, P2.1, P3.1, P3.2, P4.2, P4.3, P5.1, P5.2, P6.1, P6.3, P6.5, P6.6, P7.1, P8.1): consent before trackers, third-party SDK inventory, whole user objects sent to vendors, field-level protection of sensitive data, retention purge jobs, deletion paths and soft-delete purging, data export and correction, personal data validation, privacy notice, data map, breach notification, incident register, vendor breach intake and privacy contact. Code-path rules are not applicable when no personal data is handled.
- `cc7.2/pii-in-logs`: personal data fields passed to loggers.
- External scanners: Gitleaks (full history), zizmor, Checkov and Semgrep (local rules) run automatically when installed; OSV-Scanner, Trivy and Semgrep registry rules need `--network`. `--tools`, `--no-tools`, `THREESOCK_TOOLS`; 60-second timeout per tool; findings de-duplicated against built-in rules ("also found by"); Checkov/Trivy misconfigurations mapped to criteria by topic. JSON schema 1.4.0 (`findings[].source`, `alsoFoundBy`, tool versions in `coverage.externalTools`).
- `tools.yml` CI job running the adapters against pinned, checksum-verified scanner versions.
- Control and policy mapping (`mappings/controls.yaml`): 35 controls and 25 policies mapped to all 61 criteria; findings and reports list what each gap affects; replaceable with `mappings:` in `threesock.yaml`.
- `--github`: read-only GitHub API checks for branch protection and rulesets (CC8.1), code owner review, required signed commits (CC1.5), secret scanning and push protection (CC6.1), Dependabot alerts (CC7.1), alerts past the vulnerability SLA (CC4.2), production environment reviewers and organization 2FA/base permission (CC5.2). Direct pushes escalate to High when the branch is confirmed unprotected.
- `thresholds.vulnerabilitySlaDays` (rubric 1.4) for alert age; `--github-repo`; `GITHUB_API_URL` support.
- `pnpm gen:rules` regenerates the rule registry.
- JSON schema 1.3.0: `findings[].controls` and `policies`, `criteria[].controls` and `policies`, `mapping`, `coverage.github`.
- SARIF 2.1.0 output (`--format sarif`): severity levels and `security-severity`, criterion tags, stable `partialFingerprints`, accepted findings as suppressions, repository-level findings anchored to an existing file.
- Single-file HTML report (`--format html`, `threesock report --format html`): no JavaScript, no network requests, inline logo and favicons, light and dark.
- `threesock baseline`: writes `threesock-baseline.yaml`; `--all` accepts Medium and Low findings, `--fingerprint` accepts one finding of any severity, `--prune` removes stale entries.
- Exception expiry caps (`thresholds.maxExceptionDays`, default Critical 7 days, High 90 days); exceptions that run longer are not applied.
- JSON schema 1.2.0: `findings[].rejectedException`, `summary.staleExceptions`.
- 57 more rules (98 total) covering CC1.5, CC2–CC4, CC5.1, CC5.3, CC6.2, CC6.3, CC6.5, CC7, CC9, Availability (A1.1–A1.3), Processing Integrity (PI1.1–PI1.3, PI1.5) and Confidentiality (C1.1–C1.2). Documentation checks require the sections the rubric names, not just a file.
- Git-history rules (last 200 commits): commit attribution and direct pushes to the default branch. Reports show counts and short SHAs only.
- `evidenceLinks` in `threesock.yaml` for evidence kept outside the repository; linked checks are reported, never counted as Met.
- `--min-readiness` and `--min-assessed` gates.
- JSON schema 1.1.0: `criteria[].evidenceLinks`.
- threesock's own threat model, risk register, incident response plan, vulnerability management, access management, continuity and third-party documents, and ADRs; CodeQL and SBOM generation in CI.
- pnpm with supply-chain hardening (`minimumReleaseAge`, pinned `packageManager`); Node 22 minimum.
- Criteria catalogue generated from `docs/rubric/SOC2_CODEBASE_RUBRIC.md` (all 61 criteria), with a drift check.
- Scoring engine implementing rubric 1.1: Met/Partial/Not Met/N/A/MANUAL, category readiness, bands, red flags and the Critical cap.
- `threesock.yaml` loading and validation: scope, thresholds, owners, ignore, N/A justifications and exceptions with approver, justification and expiry.
- Git-aware file index.
- `scan`, `init` and `explain` commands; text and JSON output (`schemaVersion` 1.0.0); `--fail-on` exit codes.
- 37 built-in rules for CC5.2 (CI hardening), CC6.1, CC6.6, CC6.7, CC6.8 (access, secrets, network, TLS, supply chain) and the file-based parts of CC8.1, covering JS/TS, Python and Go source, Terraform, CloudFormation, GitHub Actions and Dockerfiles.
- Markdown report (`--format markdown`, `threesock report`): Appendix A scorecard, Appendix B findings, MANUAL evidence checklist and unverified checks.
- `sensitivePaths` in `threesock.yaml` (replaces the default list).
- The full disclaimer is shown once per machine on the first interactive run.
- Generated files (`DO NOT EDIT`, `@generated`) are skipped by code-pattern rules.
- CI for this repository: tests on Node 22 and 24, lint, type-check, self-scan, TruffleHog, dependency audit and review; Dependabot.
- CONTRIBUTING.md, CODE_OF_CONDUCT.md (Contributor Covenant 2.1), PR template, release and rollback runbook.
- Seed rules: `cc6.1/hardcoded-secrets`, `cc6.1/env-files`, `cc2.3/security-policy`, `cc1.3/codeowners`.
