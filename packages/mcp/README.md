# threesock-mcp

Read-only [MCP](https://modelcontextprotocol.io) server for [threesock](https://github.com/threesock/threesock), the SOC 2 codebase readiness scanner. It lets AI coding agents scan a repository, read findings, get example fixes and re-scan.

```sh
# Claude Code
claude mcp add threesock -- npx -y threesock-mcp@0.1.0
```

Tools: `scan`, `list_findings`, `suggest_fix`, `explain_criterion`, `get_report`.

The server never writes files and never uses the network, and it only scans paths under its working directory (`--allow-path <dir>` adds more). Secret values are never returned. It is a separate package so that `npx threesock` stays small: the MCP SDK and its dependencies are installed only here.

threesock is a readiness aid, not an audit. See the [agent guide](https://github.com/threesock/threesock/blob/main/docs/site/agents.md).
