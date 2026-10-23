import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, guardPath } from '../packages/mcp/src/server.js';
import { FIXED_NOW, materialize, type Materialized } from './helpers/fixtures.js';

let repo: Materialized;
let client: Client;
let outside: string;

beforeAll(async () => {
  repo = materialize('insecure-app');
  outside = mkdtempSync(join(tmpdir(), 'threesock-outside-'));
  const server = createServer({ roots: [repo.dir], now: () => FIXED_NOW });
  const [a, b] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: 'test-agent', version: '1.0.0' });
  await Promise.all([server.connect(a), client.connect(b)]);
});
afterAll(async () => {
  await client.close();
  rmSync(repo.dir, { recursive: true, force: true });
  rmSync(outside, { recursive: true, force: true });
});

const call = async (name: string, args: Record<string, unknown> = {}) => {
  const res = (await client.callTool({ name, arguments: args })) as {
    isError?: boolean;
    content: { type: string; text: string }[];
  };
  return { isError: Boolean(res.isError), text: res.content.map((c) => c.text).join('') };
};

describe('MCP server', () => {
  it('exposes read-only tools', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      'explain_criterion',
      'get_report',
      'list_findings',
      'scan',
      'suggest_fix',
    ]);
    for (const t of tools)
      expect(t.annotations).toMatchObject({ readOnlyHint: true, openWorldHint: false });
  });

  it('scan → list_findings → suggest_fix, the loop an agent runs', async () => {
    const scan = JSON.parse((await call('scan')).text);
    expect(scan.disclaimer).toContain('not an audit');
    expect(scan.severityCounts.critical).toBeGreaterThan(0);
    const list = JSON.parse((await call('list_findings', { minSeverity: 'critical' })).text);
    expect(list.findings.every((f: { severity: string }) => f.severity === 'critical')).toBe(true);
    const fix = JSON.parse((await call('suggest_fix', { finding: list.findings[0].id })).text);
    expect(fix).toMatchObject({ id: list.findings[0].id });
    expect(fix.expected.length).toBeGreaterThan(10);
    expect(fix.howToAccept).toContain('threesock baseline');
  });

  it('never returns secret values', async () => {
    const outputs = [
      await call('scan'),
      await call('list_findings', { limit: 500 }),
      await call('get_report'),
      await call('get_report', { format: 'json' }),
    ];
    for (const o of outputs) for (const s of repo.secrets) expect(o.text).not.toContain(s);
  });

  it('explains criteria', async () => {
    const res = JSON.parse((await call('explain_criterion', { id: 'cc8.1' })).text);
    expect(res.id).toBe('CC8.1');
    expect(res.automatedRules.length).toBeGreaterThan(3);
    expect((await call('explain_criterion', { id: 'XX1.1' })).isError).toBe(true);
  });

  it('refuses paths outside its roots, including through symlinks', async () => {
    expect((await call('scan', { path: outside })).isError).toBe(true);
    expect((await call('scan', { path: '..' })).text).toMatch(/outside the allowed roots/);
    symlinkSync(outside, join(repo.dir, 'escape'));
    expect((await call('scan', { path: 'escape' })).text).toMatch(/outside the allowed roots/);
    expect(guardPath([repo.dir, outside], outside)).toBeTruthy(); // --allow-path widens it
  });
});
