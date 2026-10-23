# threesock

**One extra layer of confidence before your SOC 2 audit.**

threesock scans a repository, scores it against the 61 SOC 2 Trust Services Criteria using an open [rubric](../rubric/SOC2_CODEBASE_RUBRIC.md), and gives you an evidence-backed list of gaps to close before your auditor finds them.

## What it is

- **A readiness aid.** It tells you where a codebase stands against the criteria a repository can evidence, with file-and-line evidence for every pass.
- **Honest about limits.** Criteria that live outside the repo (board oversight, HR, physical security) come back as MANUAL, with the evidence a human needs to gather and who usually owns it. Every percentage shows how many criteria it actually covers.
- **Local and private.** No telemetry; no network unless you turn on `--github` or `--network`. Detected secrets never appear in output beyond their first four characters.
- **Built for people and agents.** A CLI, a GitHub Action, stable JSON and SARIF, and an MCP server so coding agents can scan, fix and re-scan.

## What it isn't

- **Not an audit, and not a SOC 2 report.** Only a licensed CPA firm can attest. A clean threesock scan never means "SOC 2 compliant".
- **Not a GRC platform.** It does not track policies, people or vendors; it finds gaps in a repository.
- **Not a full SAST or SCA product.** Its built-in rules are high-confidence checks. It runs Gitleaks, Semgrep, OSV-Scanner, Trivy, Checkov and zizmor when you have them installed.

The name comes from bringing a third sock for good measure: it is the extra layer, not the audit itself.
