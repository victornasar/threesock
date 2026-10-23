# GitHub Action

Runs threesock on pull requests and on a schedule, uploads results to GitHub code scanning, writes a job summary, and fails the job on findings at or above `fail-on`.

```yaml
# .github/workflows/threesock.yml
name: threesock
on:
  pull_request:
  schedule:
    - cron: '23 5 * * 1'
permissions:
  contents: read
  security-events: write # SARIF upload
jobs:
  readiness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha> # pin to a commit SHA
        with:
          fetch-depth: 0 # full history for the git-history checks
          persist-credentials: false
      - uses: threesock/threesock/action@<sha> # pin to a release commit SHA
        with:
          scope: security,availability
          fail-on: high
```

| Input | Default | Meaning |
|---|---|---|
| `path` | `.` | Repository path to scan |
| `scope` | `security` | Categories to score |
| `fail-on` | `high` | Fail on open findings at or above this severity (`none` to never fail) |
| `min-readiness` / `min-assessed` | empty | Optional readiness and coverage gates |
| `upload-sarif` | `true` | Upload to code scanning (needs `security-events: write`) |
| `github-checks` | `false` | Read-only GitHub API checks with the workflow token. Some checks need a token with Administration read; anything unreadable is reported as inconclusive. |
| `tools` | `auto` | External scanners to run if installed on the runner |
| `network` | `false` | Allow tools that need the network |
| `version` | this release | threesock version from npm, pinned |

Outputs: `sarif-file`, `report-file` (Markdown scorecard) and `exit-code`.

The action passes every input to the shell through environment variables, pins the actions it uses by commit SHA, and runs threesock at an exact version. Upload the Markdown report as an artifact if you want to keep it:

```yaml
      - uses: actions/upload-artifact@<sha>
        if: always()
        with:
          name: threesock-report
          path: ${{ runner.temp }}/threesock/threesock-report.md
```
