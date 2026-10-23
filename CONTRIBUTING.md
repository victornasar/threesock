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
4. **Read-only and offline.** Rules read files through `ctx.files` and history through `ctx.git()`. No network, no writes, no child processes.
5. **Deterministic.** Same input, same output. No dates, randomness or environment lookups.

## Adding a rule

### 1. Pick the criterion and check

Find the check in `docs/rubric/SOC2_CODEBASE_RUBRIC.md`, e.g. CC6.7 → "Secrets, tokens, and PII are never placed in URLs/query strings or logs". `threesock explain CC6.7` shows what's already automated.

### 2. Write the rule

Create `src/rules/cc6.7/tokens-in-urls.ts`:

```ts
import { codePatternRule } from '../lib/code-patterns.js';

export const tokensInUrls = codePatternRule({
  id: 'cc6.7/tokens-in-urls',          // "<criterion lowercased>/<slug>"
  criterion: 'CC6.7',
  title: 'Tokens are not sent in URLs',  // the passing condition
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,                       // true only for rubric red flags
  checks: ['never placed in URLs/query strings'], // must match exactly one rubric check
  expected: 'Credentials travel in headers or request bodies, never in URLs, which end up in logs and browser history.',
  risk: 'Query strings are logged by proxies, CDNs and analytics, so a token in a URL leaks widely.',
  remediation: {
    summary: 'Send the token in an Authorization header instead.',
    example: `fetch(url, { headers: { Authorization: \`Bearer \${token}\` } });`,
  },
  clean: 'no credentials placed in query strings', // completes "Checked N files; ..."
  patterns: [
    {
      languages: ['js', 'python', 'go'],
      re: /[?&](?:access_token|api_?key|token|password)=/i,
      label: 'Credential passed in a URL query string', // the gap: becomes the finding title
    },
  ],
});
```

Most "look for risky lines" rules fit `codePatternRule`, which handles languages, tests, generated files, comments and evidence for you. For anything else, write a full `Rule` with a `detect(ctx)` function returning `pass` (with evidence), `fail` (with findings), `unknown` (with a reason) or `not_applicable` (with a justification); `src/rules/cc2.2/pr-template-security.ts` is a short example. Documentation checks use `docRule` (see `src/rules/cc7.4/incident-response-plan.ts`).

Helpers you'll want:

| Helper | For |
|---|---|
| `lib/code-patterns.ts` | `codePatternRule` for line patterns in source |
| `lib/doc-rule.ts` | `docRule` for documents that must cover named sections |
| `lib/languages.ts` | `isProductionSource`, `isTestPath`, language detection (JS/TS, Python, Go) |
| `lib/workflows.ts` | GitHub Actions workflows: parsed YAML plus line lookup |
| `lib/terraform.ts` | Lightweight Terraform scanner: resources, nested blocks, attributes |
| `lib/build-files.ts` | Dockerfiles, CI configs and build scripts |
| `lib/docs.ts` | Finding runbooks and policies in Markdown |
| `lib/web.ts` | Whether the repo serves HTTP at all |
| `lib/infra.ts`, `lib/datastores.ts` | Kubernetes, compose, CloudFormation and Terraform data stores |
| `ctx.git()` | The last 200 commits (rules never run git themselves) |
| `util.ts` | `grep`, `findAny`, `absence`, `lineAt`, `plural` |

### 3. Register it

Run `pnpm gen:rules` to regenerate `src/rules/index.ts`. A test fails if a rule file is not registered.

### 4. Test it

Two kinds of test, both required:

- **Fixtures.** Add something to `test/fixtures/compliant-app` that makes the rule pass, and something to `test/fixtures/insecure-app` that makes it fail. `test/rules.test.ts` checks every registered rule against both automatically. Secret-shaped values go in as `{{PLACEHOLDER}}` tokens (see `test/helpers/fixtures.ts`), and `.env` files are stored as `dot.env`.
- **Focused cases** in `test/languages.test.ts` (or a new file) using the in-memory repo helper, especially for each language you support and for false positives you deliberately ignore:

```ts
import { run } from './helpers/memory.js';
const out = await run(tokensInUrls, { 'src/api.ts': "fetch(`${base}/users?access_token=${token}`)" });
expect(out.status).toBe('fail');
```

Then regenerate the rule reference (`pnpm gen:docs`), refresh the golden report and snapshots, and review the diff:

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
