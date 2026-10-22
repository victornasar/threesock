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
- Seed rules: `cc6.1/hardcoded-secrets`, `cc6.1/env-files`, `cc2.3/security-policy`, `cc1.3/codeowners`.
