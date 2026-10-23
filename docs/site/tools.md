# External scanners

threesock's built-in rules need nothing installed. When these tools are on your `PATH`, threesock also runs them and merges their results. It never installs them.

| Tool | Runs | Adds |
|---|---|---|
| Gitleaks | automatically (offline) | Secrets anywhere in git history (CC6.1, High; values redacted) |
| zizmor | automatically (offline mode) | GitHub Actions weaknesses (CC5.2) |
| Checkov | automatically (offline) | IaC misconfigurations, mapped to criteria by topic |
| Semgrep | automatically with a repository rules file; registry rules need `--network` | Code findings (CC6.6) |
| OSV-Scanner | with `--network` | Known-vulnerable dependencies (CC6.8) |
| Trivy | with `--network` | Vulnerable dependencies and misconfigurations |

- `--tools gitleaks,zizmor` picks tools; `--no-tools` (or `THREESOCK_TOOLS=none`) turns them off.
- Each tool has a 60-second budget. A tool that times out, crashes or prints something unreadable is reported as reduced coverage, never as a failure.
- A tool finding at the same file and line as a built-in finding is merged into it ("also found by").
- Reports record each tool's version so results can be reproduced.
