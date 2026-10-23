# AI coding agents

threesock includes an MCP server so agents can run the scan, fix, re-scan loop themselves.

```sh
# Claude Code
claude mcp add threesock -- npx -y threesock@0.1.0 mcp
```

Other MCP clients: run `npx -y threesock@0.1.0 mcp` as a stdio server in the repository directory.

| Tool | Does |
|---|---|
| `scan` | Scans (default: the server's directory) and returns readiness, counts and top fixes |
| `list_findings` | Findings, filterable by minimum severity and criterion |
| `suggest_fix` | What the control expects, the risk and an example fix for one finding |
| `explain_criterion` | The rubric requirement, checks and red flags for a criterion |
| `get_report` | The full Markdown or JSON report |

Safety: every tool is read-only. The server never writes files, never uses the network, and only scans paths under its working directory (add more with `--allow-path <dir>`; symlinks cannot escape). Secret values are never returned. Accepting a risk instead of fixing it stays a human decision: `suggest_fix` points to `threesock baseline`, which requires an approver.

For scripted loops without MCP, `threesock scan --format json` gives the same data with a stable `schemaVersion`.
