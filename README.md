<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/threesock-lockup-white.svg">
  <img alt="threesock" src="assets/brand/threesock-lockup.svg" width="320">
</picture>

**One extra layer of confidence before your SOC 2 audit.**

threesock scans a software repository, scores it against all 61 SOC 2 Trust Services Criteria using an open [rubric](docs/rubric/SOC2_CODEBASE_RUBRIC.md), and gives you an evidence-backed gap report before your real audit. The name comes from bringing a third sock for good measure: it's the extra layer, not the audit itself.

> **threesock is a readiness aid, not an audit.** SOC 2 is attested by a licensed CPA firm against your organization's system description and commitments. A codebase can only show part of the criteria; the rest (board oversight, HR, vendor contracts, physical security) has to be evidenced outside the repo. threesock never says a repository "is SOC 2 compliant."

## What it is

- **Evidence or nothing.** A check is `Met` only when threesock can cite a file, line, config value or API result. Otherwise it's `Partial`, `Not Met` or `MANUAL`.
- **Honest about limits.** Criteria that live outside the repo come back as `MANUAL`, with what a human needs to gather and who usually owns it.
- **Local and private.** No telemetry and no network calls. Your code never leaves the machine unless you turn on an integration.
- **Never leaks secrets.** Detected secrets are reported by file, line and type, with at most the first 4 characters shown.
- **Fast and deterministic.** Same repo and config, same result, typically in well under a second.

## What it isn't

- Not a SOC 2 report, attestation, or substitute for an auditor.
- Not a GRC platform. It finds gaps in a repository; tracking policies, people and vendors is out of scope.
- Not a full SAST, SCA or secret scanner. It runs Gitleaks, Semgrep, OSV-Scanner and friends if you have them installed, and falls back to built-in, high-confidence checks if you don't.

## Quick start

```sh
npx threesock                       # scan the current directory (Security scope)
npx threesock scan . --scope security,availability --format json --out report.json
npx threesock explain CC8.1         # what a criterion requires and how to fix it
npx threesock init                  # create threesock.yaml
```

Exit codes: `0` ok · `1` findings at or above `--fail-on` · `2` usage or configuration error.

## Sample output

```text
threesock 0.1.0 · SOC 2 readiness scan
Readiness aid, not an audit. A clean scan does not mean SOC 2 compliant.

Readiness
  Overall               ░░░░░░░░░░░░░░░░░░░░    0.0%  Not ready · 3/33 criteria assessed, capped by open Critical
  Security              ░░░░░░░░░░░░░░░░░░░░    0.0%  Not ready · 3/33 criteria assessed, capped by open Critical

Findings    5 critical · 1 high · 2 medium · 1 low

Top fixes
  1. CRITICAL CC6.1  Hard-coded Stripe live key (+4 more)
     Revoke and rotate the credential first, then remove it from the code and load it from a
     secrets manager or environment variable. Rewriting git history does not un-leak a pushed secret.
```

## How scoring works

Exactly as rubric section 1.1 specifies:

| Score | Label | Meaning |
|---|---|---|
| 2 | Met | Every automated check passed, with evidence |
| 1 | Partial | Some checks passed |
| 0 | Not Met | Nothing passed, or a red flag is present |
| N/A | Not Applicable | Out of scope, or declared N/A in `threesock.yaml` with a justification |
| MANUAL | Manual Evidence | Can't be assessed from the repository |

Category readiness = points earned ÷ (2 × assessable criteria), excluding N/A and MANUAL. 90%+ is audit-ready, 75–89% minor gaps, 50–74% significant gaps, under 50% not ready. Any open **Critical** finding scores its criterion 0 and caps the category at "significant gaps." Because the percentage only covers assessable criteria, threesock always shows how many criteria were assessed next to it.

## Configuration

`threesock init` writes a commented `threesock.yaml`: scope, thresholds (rubric 1.4), owners, ignored paths, N/A declarations and exceptions. Every exception needs an approver, a justification and an expiry date, and expired exceptions turn back into open findings.

## Status

threesock is pre-1.0. Phase 1 (engine, scoring, config, CLI, JSON and text output) is done, with seed rules for secrets, `.env` files, `SECURITY.md` and `CODEOWNERS`. Built-in coverage of CC6, CC8.1 and CC5.2 comes next, followed by the remaining categories, the SARIF, Markdown and HTML reports, the GitHub API checks, the GitHub Action and the MCP server. See [CHANGELOG.md](CHANGELOG.md) and [docs/design.md](docs/design.md).

## Repository setup

Set `assets/brand/social-preview.png` as this repository's social preview under **Settings → General → Social preview** on GitHub.

## License

[Apache-2.0](LICENSE)
