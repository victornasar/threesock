# GitHub checks (opt-in)

`--github` adds read-only checks against the GitHub API. It is off by default because it is the one part of threesock that needs the network.

```sh
GITHUB_TOKEN=$(gh auth token) npx threesock scan --github
```

| Criterion | Checks |
|---|---|
| CC8.1 | Branch protection and rulesets on the default branch: pull requests, approvals against your threshold, stale-approval dismissal, status checks, conversation resolution, force-push and deletion blocked, admin bypass; code owner review |
| CC1.5 | Signed commits required |
| CC6.1 | Secret scanning and push protection |
| CC7.1 | Dependabot alerts enabled |
| CC4.2 | Dependabot and code scanning alerts older than `vulnerabilitySlaDays` (aged Critical/High alerts are rubric red flags) |
| CC5.2 | Production environments require reviewers; organization 2FA and base permission |

Direct pushes found in git history become High when the API confirms the branch is unprotected.

A fine-grained, read-only token is enough: Metadata, Administration, Dependabot alerts, Code scanning alerts and Environments (read). Organization settings need an organization owner. Anything the token cannot read is reported as inconclusive with the missing permission named; it never fails the scan. Set `GITHUB_API_URL` for GitHub Enterprise Server and `--github-repo owner/name` when the `origin` remote is not on GitHub.
