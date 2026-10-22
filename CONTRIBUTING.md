# Contributing to threesock

Thanks for helping. The most useful contribution is a new rule: one file, one test, about 30 minutes.

## Setup

threesock uses [pnpm](https://pnpm.io) (pinned in `package.json`) and Node 22+.

```sh
npm install -g pnpm@12.15.0   # Node no longer ships Corepack
pnpm install
pnpm run check                 # type-check, lint, format, tests, self-scan
```

`pnpm-workspace.yaml` sets `minimumReleaseAge`, so pnpm refuses package versions published less than a day ago. Don't lower it to get a fresh release in; wait a day.

## Ground rules for rules

1. **Evidence or nothing.** A `pass` must cite evidence: a file and line, a config value, or (for red-flag searches) a description of what was checked. The engine turns an evidence-free pass into `unknown`.
2. **Can't tell? Say so.** Return `unknown` with a reason, or `not_applicable` with a justification. Never `pass` by default.
3. **Never print secrets.** Pass every secret value through `ctx.secrets.register(value)` and use the redacted string it returns. Don't quote matched source lines in findings; describe the construct instead.
4. **Read-only and offline.** Rules read files through `ctx.files`. No network, no writes, no child processes.
5. **Deterministic.** Same input, same output. No dates, randomness or environment lookups.

## Adding a rule

### 1. Pick the criterion and check

Find the check in `docs/rubric/SOC2_CODEBASE_RUBRIC.md`, e.g. CC6.7 → "Webhooks and callbacks are signed and verified". `threesock explain CC6.7` shows what's already automated.

### 2. Write the rule

Create `src/rules/cc6.7/webhook-signatures.ts`:

```ts
import type { Rule } from '../../engine/types.js';
import { isProductionSource } from '../lib/languages.js';
import { findAny } from '../util.js';

export const webhookSignatures: Rule = {
  id: 'cc6.7/webhook-signatures',      // "<criterion lowercased>/<slug>"
  criterion: 'CC6.7',
  title: 'Incoming webhooks verify signatures', // the passing condition
  tags: ['CODE'],
  severity: 'high',
  redFlag: false,                       // true only for rubric red flags
  checks: ['Webhooks and callbacks are signed'], // must match exactly one rubric check
  expected: 'Every webhook handler verifies the sender signature before acting on the payload.',
  risk: 'Unsigned webhooks let anyone forge events such as "payment succeeded".',
  remediation: {
    summary: 'Verify the provider signature with its SDK, using the raw request body.',
    example: `const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);`,
  },
  detect(ctx) {
    const source = ctx.files.files.filter((f) => isProductionSource(f));
    const handler = findAny(ctx.files, source, /\/webhooks?\b/);
    if (!handler) return { status: 'not_applicable', justification: 'No webhook handlers found.' };
    const verified = findAny(ctx.files, source, /constructEvent|verifySignature|timingSafeEqual/);
    if (verified) {
      return { status: 'pass', evidence: [{ kind: 'file', ...verified, description: 'Webhook signatures are verified.' }] };
    }
    return {
      status: 'fail',
      findings: [{
        path: handler.path,
        line: handler.line,
        title: 'Webhook handler without signature verification', // the gap, not the passing condition
        observed: `${handler.path} handles webhooks but no signature verification was found.`,
        key: handler.path,                // stable across runs; used for the fingerprint
      }],
    };
  },
};
```

For "look for dangerous lines in source" rules, use `codePatternRule` from `src/rules/lib/code-patterns.ts` (see `cc6.7/tls-verification.ts`). Helpers you'll want:

| Helper | For |
|---|---|
| `lib/languages.ts` | `isProductionSource`, `isTestPath`, language detection (JS/TS, Python, Go) |
| `lib/workflows.ts` | GitHub Actions workflows: parsed YAML plus line lookup |
| `lib/terraform.ts` | Lightweight Terraform scanner: resources, nested blocks, attributes |
| `lib/build-files.ts` | Dockerfiles, CI configs and build scripts |
| `lib/docs.ts` | Finding runbooks and policies in Markdown |
| `lib/web.ts` | Whether the repo serves HTTP at all |
| `util.ts` | `grep`, `findAny`, `absence`, `lineAt`, `plural` |

### 3. Register it

Add it to `src/rules/index.ts`.

### 4. Test it

Two kinds of test, both required:

- **Fixtures.** Add something to `test/fixtures/compliant-app` that makes the rule pass, and something to `test/fixtures/insecure-app` that makes it fail. `test/rules.test.ts` checks every registered rule against both automatically. Secret-shaped values go in as `{{PLACEHOLDER}}` tokens (see `test/helpers/fixtures.ts`), and `.env` files are stored as `dot.env`.
- **Focused cases** in `test/languages.test.ts` (or a new file) using the in-memory repo helper, especially for each language you support and for false positives you deliberately ignore:

```ts
import { run } from './helpers/memory.js';
const out = await run(webhookSignatures, { 'src/hooks.ts': "app.post('/webhooks/stripe', handler)" });
expect(out.status).toBe('fail');
```

Then refresh the golden report and snapshots, and review the diff:

```sh
UPDATE_GOLDEN=1 pnpm exec vitest run -u
git diff test/
```

### 5. Check it against threesock itself

`pnpm run selfscan`. Rule files contain the very patterns they detect, so word labels and examples so they don't match themselves (e.g. "certificate rejection turned off", not the literal option).

## Pull requests

- Keep each PR focused on one rule or one change.
- Fill in the security section of the PR template.
- Add a line to `CHANGELOG.md` under "Unreleased". Changes to the JSON report shape also bump `SCHEMA_VERSION` in `src/engine/model.ts`.
- By contributing you agree your work is licensed under Apache-2.0 and that you follow the [Code of Conduct](CODE_OF_CONDUCT.md).
