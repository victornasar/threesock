// External scanner adapters, driven by recorded tool output (decision 43).
// No real tool runs here; test/tools-smoke.test.ts runs them in CI.
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ScanReport } from '../src/engine/model.js';
import { scan } from '../src/engine/scan.js';
import type { Category } from '../src/engine/types.js';
import type { ToolRunner, ToolRunResult } from '../src/integrations/tools/types.js';
import { topicCriterion } from '../src/integrations/tools/topics.js';
import { renderJson } from '../src/reports/json.js';
import { renderMarkdown } from '../src/reports/markdown.js';
import { RULES } from '../src/rules/index.js';
import { FAKE_SECRETS, FIXED_NOW, materialize, type Materialized } from './helpers/fixtures.js';

const ok = (stdout = '', code = 0): ToolRunResult => ({
  code,
  stdout,
  stderr: '',
  timedOut: false,
  missing: false,
});
const MISSING: ToolRunResult = {
  code: null,
  stdout: '',
  stderr: '',
  timedOut: false,
  missing: true,
};

interface Recorded {
  version: string;
  /** stdout, or a function that writes report files and returns stdout. */
  output?: string | ((args: string[]) => string);
  code?: number;
  result?: ToolRunResult;
}

function fakeRunner(tools: Record<string, Recorded>): { runner: ToolRunner; calls: string[][] } {
  const calls: string[][] = [];
  const runner: ToolRunner = async (binary, args) => {
    calls.push([binary, ...args]);
    const t = tools[binary];
    if (!t) return MISSING;
    if (args.includes('--version') || args[0] === 'version') return ok(t.version);
    if (t.result) return t.result;
    return ok(typeof t.output === 'function' ? t.output(args) : (t.output ?? ''), t.code ?? 0);
  };
  return { runner, calls };
}

let repo: Materialized;
beforeAll(() => {
  repo = materialize('insecure-app');
});
afterAll(() => rmSync(repo.dir, { recursive: true, force: true }));

async function scanWith(
  tools: Record<string, Recorded>,
  opts: { network?: boolean; mode?: 'auto' | string[]; scope?: Category[] } = {},
) {
  const { runner, calls } = fakeRunner(tools);
  const out = await scan({
    root: repo.dir,
    rules: RULES,
    now: FIXED_NOW,
    tools: { mode: opts.mode ?? 'auto', network: opts.network ?? false, runner },
    ...(opts.scope ? { scope: opts.scope } : {}),
  });
  return { ...out, calls };
}

const fromTool = (r: ScanReport, tool: string) => r.findings.filter((f) => f.source?.tool === tool);

const AWS = FAKE_SECRETS.AWS_KEY as string;
const gitleaksOutput =
  (secret = 'REDACTED') =>
  (args: string[]) => {
    writeFileSync(
      args[args.indexOf('--report-path') + 1] as string,
      JSON.stringify([
        // Same place as the built-in finding: de-duplicated.
        {
          RuleID: 'aws-access-token',
          Description: 'AWS Access Key',
          File: 'src/config.js',
          StartLine: 3,
          Commit: 'aaaaaaa1111',
          Secret: secret,
          Match: secret,
          Author: 'Jane Doe',
          Email: 'jane@corp.example',
        },
        // Only in history.
        {
          RuleID: 'slack-bot-token',
          Description: 'Slack Bot token',
          File: 'scripts/old-notify.sh',
          StartLine: 4,
          Commit: 'bbbbbbb2222',
          Secret: secret,
          Match: `TOKEN=${secret}`,
          Author: 'Jane Doe',
          Email: 'jane@corp.example',
        },
      ]),
    );
    return '';
  };

describe('tool discovery', () => {
  it('reports missing tools, network-only tools, and never runs what it should not', async () => {
    const { report, calls } = await scanWith({
      trivy: { version: 'Version: 0.58.1', output: '{}' },
      'osv-scanner': { version: 'osv-scanner version: 2.0.0' },
    });
    const byName = Object.fromEntries(report.coverage.externalTools.map((t) => [t.name, t]));
    expect(byName.gitleaks).toMatchObject({ available: false, used: false, note: 'not installed' });
    expect(byName.trivy).toMatchObject({
      available: true,
      used: false,
      version: '0.58.1',
      note: 'needs --network',
    });
    expect(byName['osv-scanner']).toMatchObject({ used: false, note: 'needs --network' });
    // Only version probes ran for the network tools.
    expect(calls.filter(([b]) => b === 'trivy').map((c) => c[1])).toEqual(['--version']);
  });

  it('--network allows network tools; --tools limits the set; none runs nothing', async () => {
    const recorded = {
      trivy: { version: '0.58.1', output: JSON.stringify({ Results: [] }) },
      zizmor: { version: 'zizmor 1.5.2', output: '[]' },
    };
    const net = await scanWith(recorded, { network: true });
    expect(net.report.coverage.externalTools.filter((t) => t.used).map((t) => t.name)).toEqual([
      'zizmor',
      'trivy',
    ]);
    const only = await scanWith(recorded, { network: true, mode: ['zizmor'] });
    expect(only.report.coverage.externalTools.map((t) => t.name)).toEqual(['zizmor']);
    const none = await scan({ root: repo.dir, rules: RULES, now: FIXED_NOW });
    expect(none.report.coverage.externalTools).toEqual([]);
  });

  it('runs Semgrep offline only with repository-local rules', async () => {
    const recorded = {
      semgrep: {
        version: '1.99.0',
        output: JSON.stringify({ results: [], paths: { scanned: ['src/server.js'] } }),
      },
    };
    const semgrepStatus = (r: ScanReport) =>
      r.coverage.externalTools.find((t) => t.name === 'semgrep');
    rmSync(join(repo.dir, '.semgrep.yml')); // the fixture ships local rules; start without them
    expect(semgrepStatus((await scanWith(recorded)).report)).toMatchObject({
      used: false,
      note: 'needs --network',
    });
    writeFileSync(join(repo.dir, '.semgrep.yml'), 'rules: []\n');
    const { report, calls } = await scanWith(recorded);
    expect(semgrepStatus(report)).toMatchObject({ used: true });
    expect(calls.find(([b, a]) => b === 'semgrep' && a === 'scan')).toContain('.semgrep.yml');
  });
});

describe('gitleaks', () => {
  it('reports history-only secrets as High with the commit, never the author or the value', async () => {
    const { report, scrub } = await scanWith({
      gitleaks: { version: 'v8.21.2', output: gitleaksOutput(AWS) },
    });
    const [hist] = fromTool(report, 'gitleaks');
    expect(hist).toMatchObject({
      severity: 'high',
      criterion: 'CC6.1',
      title: 'Secret in git history: Slack Bot token',
      location: { path: 'scripts/old-notify.sh', line: 4 },
    });
    expect(hist?.observed).toContain('bbbbbbb');
    expect(hist?.source).toEqual({
      tool: 'gitleaks',
      version: '8.21.2',
      checkId: 'slack-bot-token',
    });
    for (const out of [renderJson(report), renderMarkdown(report)].map(scrub)) {
      expect(out).not.toContain(AWS);
      expect(out).not.toContain('jane@corp.example');
      expect(out).not.toContain('Jane Doe');
    }
  });

  it('de-duplicates against the built-in finding at the same location', async () => {
    const { report } = await scanWith({
      gitleaks: { version: 'v8.21.2', output: gitleaksOutput() },
    });
    expect(fromTool(report, 'gitleaks').map((f) => f.location.path)).toEqual([
      'scripts/old-notify.sh',
    ]);
    const builtin = report.findings.find(
      (f) => f.ruleId === 'cc6.1/hardcoded-secrets' && f.location.description === 'src/config.js:3',
    );
    expect(builtin?.alsoFoundBy).toEqual(['gitleaks 8.21.2']);
  });
});

describe('zizmor, Checkov, OSV-Scanner, Trivy', () => {
  it('maps zizmor results to CC5.2 with locations', async () => {
    const zizmorOut = JSON.stringify([
      {
        ident: 'dangerous-triggers',
        desc: 'use of fundamentally insecure workflow trigger',
        determinations: { severity: 'High', confidence: 'Medium' },
        locations: [
          {
            symbolic: { key: { Local: { given_path: '.github/workflows/ci.yml' } } },
            concrete: { location: { start_point: { row: 1, column: 0 } } },
          },
        ],
      },
    ]);
    const { report } = await scanWith({
      zizmor: { version: 'zizmor 1.5.2', output: zizmorOut, code: 13 },
    });
    expect(fromTool(report, 'zizmor')).toEqual([
      expect.objectContaining({
        criterion: 'CC5.2',
        severity: 'high',
        location: expect.objectContaining({ path: '.github/workflows/ci.yml', line: 2 }),
      }),
    ]);
  });

  it('maps Checkov checks by topic, and keeps out-of-scope topics visible under CC7.1', async () => {
    const checkovOut = JSON.stringify({
      check_type: 'terraform',
      summary: { passed: 4, failed: 2 },
      results: {
        failed_checks: [
          {
            check_id: 'CKV_AWS_24',
            check_name: 'Ensure no security groups allow ingress from 0.0.0.0:0 to port 22',
            file_path: '/infra/main.tf',
            file_line_range: [1, 9],
            resource: 'aws_security_group.bastion',
            severity: null,
          },
          {
            check_id: 'CKV_AWS_16',
            check_name: 'Ensure all data stored in the RDS is securely encrypted at rest',
            file_path: '/infra/main.tf',
            file_line_range: [11, 16],
            resource: 'aws_db_instance.main',
            severity: null,
          },
        ],
      },
    });
    const security = await scanWith({
      checkov: { version: '3.2.300', output: checkovOut, code: 1 },
    });
    expect(
      fromTool(security.report, 'checkov').map((f) => [f.source?.checkId, f.criterion]),
    ).toEqual([
      ['CKV_AWS_24', 'CC6.6'],
      ['CKV_AWS_16', 'CC7.1'],
    ]);
    const conf = await scanWith(
      { checkov: { version: '3.2.300', output: checkovOut, code: 1 } },
      { scope: ['security', 'confidentiality'] },
    );
    expect(
      fromTool(conf.report, 'checkov').find((f) => f.source?.checkId === 'CKV_AWS_16')?.criterion,
    ).toBe('C1.1');
  });

  it('parses OSV-Scanner and Trivy vulnerability output, grouped per package', async () => {
    const osvOut = JSON.stringify({
      results: [
        {
          source: { path: `${repo.dir}/legacy/requirements.txt`, type: 'lockfile' },
          packages: [
            {
              package: { name: 'django', version: '2.2.0', ecosystem: 'PyPI' },
              vulnerabilities: [{ id: 'GHSA-aaaa' }, { id: 'GHSA-bbbb' }],
              groups: [{ ids: ['GHSA-aaaa'], max_severity: '9.8' }],
            },
          ],
        },
      ],
    });
    const trivyOut = JSON.stringify({
      Results: [
        {
          Target: 'legacy/requirements.txt',
          Class: 'lang-pkgs',
          Vulnerabilities: [
            {
              VulnerabilityID: 'CVE-2019-1',
              PkgName: 'django',
              InstalledVersion: '2.2.0',
              Severity: 'HIGH',
            },
            {
              VulnerabilityID: 'CVE-2019-2',
              PkgName: 'django',
              InstalledVersion: '2.2.0',
              Severity: 'CRITICAL',
            },
          ],
        },
      ],
    });
    const { report } = await scanWith(
      {
        'osv-scanner': { version: '2.0.0', output: osvOut, code: 1 },
        trivy: { version: '0.58.1', output: trivyOut },
      },
      { network: true },
    );
    expect(fromTool(report, 'osv-scanner')).toEqual([
      expect.objectContaining({
        criterion: 'CC6.8',
        severity: 'critical',
        title: 'Vulnerable dependency django@2.2.0',
        location: expect.objectContaining({ path: 'legacy/requirements.txt' }),
      }),
    ]);
    expect(fromTool(report, 'trivy')).toEqual([
      expect.objectContaining({
        severity: 'critical',
        observed: expect.stringContaining('CVE-2019-1, CVE-2019-2'),
      }),
    ]);
  });
});

describe('tool failures are reduced coverage, never errors', () => {
  it('timeouts, crashes and unparseable output become inconclusive checks', async () => {
    const { report } = await scanWith({
      zizmor: {
        version: '1.5.2',
        result: { code: null, stdout: '', stderr: '', timedOut: true, missing: false },
      },
      checkov: { version: '3.2.300', output: 'Traceback (most recent call last)', code: 2 },
      gitleaks: { version: '8.21.2', output: () => '' },
    });
    const notes = Object.fromEntries(
      report.criteria
        .flatMap((c) => c.checks)
        .filter((c) => c.ruleId.includes('/'))
        .map((c) => [c.ruleId, `${c.status}: ${c.note ?? ''}`]),
    );
    expect(notes['cc5.2/zizmor']).toMatch(/^unknown: zizmor 1.5.2 timed out after 60s/);
    expect(notes['cc6.6/checkov']).toMatch(/^unknown: Checkov 3.2.300 exited with code 2/);
    // Gitleaks ran but wrote no report: a clean result.
    expect(notes['cc6.1/gitleaks']).toMatch(/^pass/);
  });

  it('a tool that scanned nothing is not applicable', async () => {
    const { report } = await scanWith({
      checkov: {
        version: '3.2.300',
        output: JSON.stringify({
          summary: { passed: 0, failed: 0 },
          results: { failed_checks: [] },
        }),
      },
    });
    const check = report.criteria
      .flatMap((c) => c.checks)
      .find((c) => c.ruleId === 'cc6.6/checkov');
    expect(check?.status).toBe('not_applicable');
  });
});

describe('topic mapping (decision 41)', () => {
  it.each([
    ['Ensure TLS 1.2 is enforced on the load balancer listener', 'CC6.7'],
    ['Ensure S3 bucket has server-side encryption with KMS', 'C1.1'],
    ['Ensure the bucket is not public', 'CC6.6'],
    ['Ensure IAM policies do not allow full admin privileges', 'CC6.1'],
    ['Ensure CloudTrail logging is enabled', 'CC7.2'],
    ['Ensure RDS has backup retention configured', 'A1.2'],
    ['Ensure container runs with a read-only root filesystem', 'CC7.1'],
  ])('%s → %s', (title, criterion) => expect(topicCriterion(title)).toBe(criterion));
});
