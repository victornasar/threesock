import { describe, expect, it } from 'vitest';
import { consentGating } from '../src/rules/p2.1/consent-gating.js';
import { deletionPath } from '../src/rules/p4.3/deletion-path.js';
import { dataExport } from '../src/rules/p5.1/data-export.js';
import { sdkInventory } from '../src/rules/p6.1/sdk-inventory.js';
import { userObjectsToThirdParties } from '../src/rules/p6.1/user-objects-to-third-parties.js';
import { sensitiveFields } from '../src/rules/p3.2/sensitive-fields.js';
import { piiInLogs } from '../src/rules/cc7.2/pii-in-logs.js';
import { run } from './helpers/memory.js';

const USERS = {
  'db/schema.prisma': 'model User {\n  id    Int    @id\n  email String @unique\n}\n',
};

describe('privacy rules only apply when personal data is handled', () => {
  it('code-path rules are not applicable without personal-data fields', async () => {
    for (const rule of [deletionPath, dataExport]) {
      expect(
        (await run(rule, { 'src/math.ts': 'export const add = (a: number, b: number) => a + b;' }))
          .status,
        rule.id,
      ).toBe('not_applicable');
    }
  });
  it('a Python FastAPI export endpoint counts', async () => {
    const out = await run(dataExport, {
      ...USERS,
      'app/api.py':
        '@router.get("/me/export")\ndef export_user_data(user=Depends(current_user)):\n    ...\n',
    });
    expect(out.status).toBe('pass');
  });
});

describe('deletion and soft deletes', () => {
  it('soft deletes with a purge job pass; without one they are a red flag', async () => {
    const base = {
      ...USERS,
      'src/account.ts': "app.delete('/me', deleteAccount);\n",
      'migrations/1.sql': 'ALTER TABLE users ADD COLUMN deleted_at timestamptz;\n',
    };
    expect(
      (
        await run(deletionPath, {
          ...base,
          'src/jobs.ts':
            "db.query('DELETE FROM users WHERE deleted_at < now() - interval \\'30 days\\'')\n",
        })
      ).status,
    ).toBe('pass');
    const bad = await run(deletionPath, base);
    expect(bad.status === 'fail' && bad.findings.map((f) => [f.title, f.redFlag])).toEqual([
      ['Soft-deleted records are never purged', true],
    ]);
  });
});

describe('consent and third parties', () => {
  it('a consent manager in package.json gates trackers', async () => {
    const files = {
      'package.json': '{ "dependencies": { "posthog-js": "1", "vanilla-cookieconsent": "3" } }',
    };
    expect((await run(consentGating, files)).status).toBe('pass');
  });
  it('trackers are not applicable when none are used', async () => {
    expect(
      (await run(consentGating, { 'package.json': '{ "dependencies": { "express": "4" } }' }))
        .status,
    ).toBe('not_applicable');
  });
  it('SDK inventory passes when the vendor is named in the docs', async () => {
    const files = { 'package.json': '{ "dependencies": { "@amplitude/analytics-browser": "2" } }' };
    expect((await run(sdkInventory, files)).status).toBe('fail');
    expect(
      (
        await run(sdkInventory, {
          ...files,
          'docs/vendors.md': '# Vendors\n| Amplitude | analytics | user id |\n',
        })
      ).status,
    ).toBe('pass');
  });
  it('sending an id with an allow-list is fine; whole user objects are not', async () => {
    expect(
      (
        await run(userObjectsToThirdParties, {
          'src/a.ts': 'analytics.identify(user.id, { plan: user.plan });\n',
        })
      ).status,
    ).toBe('pass');
    expect(
      (await run(userObjectsToThirdParties, { 'src/a.ts': 'Sentry.setUser(currentUser);\n' }))
        .status,
    ).toBe('fail');
  });
});

describe('false-positive guards', () => {
  it('prose that mentions email in a log message is not personal data', async () => {
    const out = await run(piiInLogs, {
      'src/a.ts':
        "logger.info('verification email sent', { userId });\nlogger.info({ email }, 'signup');\n",
    });
    expect(out.status === 'fail' && out.findings.map((f) => f.line)).toEqual([2]);
  });
  it('prose such as "attestation fingerprint" is not sensitive personal data', async () => {
    const out = await run(sensitiveFields, {
      'tool/cli.py':
        'parser.add_argument("--force", help="Do not fail when attestation fingerprint differs")\n',
    });
    expect(out.status).toBe('not_applicable');
  });
  it('a generic encrypt() helper is not field-level protection', async () => {
    const out = await run(sensitiveFields, {
      'migrations/1.sql': 'CREATE TABLE p (ssn text);\n',
      'src/crypto.ts': 'export function encrypt(x) {}\n',
    });
    expect(out.status).toBe('fail');
  });
});
