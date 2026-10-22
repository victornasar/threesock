# Changelog

All notable changes to threesock are recorded here. The JSON report has its own `schemaVersion`; changes to it are called out explicitly.

## Unreleased

### Added
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
