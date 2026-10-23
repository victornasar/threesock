#!/usr/bin/env node
// threesock-mcp: stdio MCP server. Scans only the working directory, plus any --allow-path.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { startStdio } from './server.js';

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'allow-path': { type: 'string', multiple: true, default: [] },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (values.help) {
  process.stdout.write(`threesock-mcp: read-only MCP server for threesock (stdio).

Usage
  threesock-mcp [--allow-path <dir> ...]

Scans only the working directory, plus any --allow-path directories. Never writes files or uses the network.
Claude Code: claude mcp add threesock -- npx -y threesock-mcp@<version>
`);
  process.exit(0);
}

const roots = [process.cwd(), ...(values['allow-path'] as string[]).map((p) => resolve(p))];
const missing = roots.find((r) => !existsSync(r));
if (missing) {
  process.stderr.write(`threesock-mcp: --allow-path ${missing} does not exist.\n`);
  process.exit(2);
}
await startStdio({ roots });
