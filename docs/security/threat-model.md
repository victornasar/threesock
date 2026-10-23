# Threat model

Owner: @victornasar
Last reviewed: 2026-10-22

threesock is a command-line tool, GitHub Action and MCP server that reads a repository and writes reports. It has no server, no accounts and no stored user data.

## Assets

- **Secrets in scanned repositories.** threesock reads every file it scans, including committed credentials.
- **Integrity of results.** People make audit-preparation decisions from threesock's scores; a wrong "Met" is a security failure.
- **The npm package and GitHub Action.** Everyone who runs `npx threesock` executes whatever is published.
- **Users' machines and CI runners**, where threesock runs with the user's permissions.

## Trust boundaries and entry points

1. **The scanned repository** is untrusted input: file contents, file names, symlinks, git history and `threesock.yaml`.
2. **The npm registry and GitHub** deliver threesock and its dependencies to users.
3. **MCP clients** (AI agents) send tool calls with paths and arguments.
4. **The GitHub API**, when the user enables `--github`, returns data threesock trusts for scoring.

## Threats and mitigations

| Threat | Mitigation |
|---|---|
| A detected secret is printed in a report, log or CI output | Values are redacted to 4 characters at detection, all output is scrubbed against every detected value, and a test asserts no 6-character window of a planted secret appears in any format |
| A crafted repository makes threesock run code (path tricks, symlinks, YAML tags) | threesock never executes repository content; symlinks are not followed; YAML is parsed without custom tags; files over 1 MB or binary are not read; only `git` is spawned, with fixed arguments |
| A crafted repository makes threesock report "Met" falsely | A pass without evidence is downgraded to inconclusive; documentation checks require named sections; percentages always show how many criteria were assessed |
| A malicious or compromised dependency ships in threesock | One runtime dependency; pnpm `minimumReleaseAge` of one day; lockfile with frozen installs; dependency review and audit in CI; Dependabot |
| A compromised maintainer account or token publishes a malicious release | npm trusted publishing (no npm token exists); releases only from tagged CI runs with provenance; two-factor authentication on GitHub and npm |
| A compromised GitHub Action in threesock's CI | Every action pinned to a commit SHA; read-only default token; no `pull_request_target` |
| An AI agent uses the MCP server to read files outside the project | The MCP server only scans paths under its working directory unless `--allow-path` is given, and never writes files |
| Report data leaks over the network | No telemetry and no network calls unless the user enables an integration |
