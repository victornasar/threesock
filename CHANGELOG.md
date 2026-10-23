# Changelog

All notable changes to threesock are recorded here. The JSON report has its own `schemaVersion`; changes to it are called out explicitly.

## Unreleased

### Added
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
