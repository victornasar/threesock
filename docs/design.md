# threesock design notes

## Source of truth

`docs/rubric/SOC2_CODEBASE_RUBRIC.md` defines criteria, checks, red flags, scoring, severities and thresholds. `scripts/gen-criteria.mjs` parses it into `src/engine/criteria.generated.ts`; `npm run gen:criteria -- --check` (run by the test suite) fails if the two drift apart.

## Pipeline

```
threesock.yaml ─┐
                ├─► config ─► file index (git-aware) ─► rules ─► findings ─► scoring ─► report model ─► text | json | ...
rubric ─► criteria catalogue ─────────────────────────────────────────┘
```

- **File index** (`src/engine/files.ts`): uses `git ls-files --cached --others --exclude-standard` when available, so gitignored files are skipped and each file knows whether it is tracked. Otherwise it walks the tree, skipping `node_modules` and similar directories. Files over 1 MB and binary files are not read.
- **Rules** (`src/rules/<criterion>/`): one module per rubric check. See `src/engine/types.ts` for the `Rule` interface.
- **Findings** are sorted deterministically (severity, criterion, rule, path, line) and numbered `F-001…`. Each has a `fingerprint` (a hash of the rule, path and a rule-supplied key) that stays stable across runs and line shifts, for use in exceptions and baselines.
- **Secrets**: rules pass every detected value through `ctx.secrets.register()`, which returns the redacted form (at most the first 4 characters). The CLI also scrubs all output against the registered values, as a second line of defence.

## Rule interface

```ts
interface Rule {
  id: string;            // "cc6.1/hardcoded-secrets"
  criterion: string;     // "CC6.1"
  title: string;         // the check, phrased as the passing condition
  tags: Tag[];           // CODE | CONFIG | DOCS | ORG
  severity: Severity;    // default severity of findings
  redFlag?: boolean;     // findings are rubric red flags by default
  checks?: string[];     // fragments identifying the rubric checks this rule covers
  expected: string;      // Appendix B "Expected"
  risk: string;          // Appendix B "Risk"
  remediation: { summary: string; example?: string };
  detect(ctx): RuleOutcome | Promise<RuleOutcome>;
}

type RuleOutcome =
  | { status: 'pass'; evidence: Evidence[] }    // a pass with no evidence becomes 'unknown'
  | { status: 'fail'; findings: RawFinding[]; evidence?: Evidence[] }
  | { status: 'unknown'; reason: string }
  | { status: 'not_applicable'; justification: string };
```

## JSON schema

`ScanReport` in `src/engine/model.ts`, versioned by `schemaVersion` (currently `1.0.0`). Additive changes bump the minor version; removals or renames bump the major. Top-level keys: `schemaVersion`, `tool`, `disclaimer`, `generatedAt`, `repository`, `config`, `summary`, `criteria` (always all 61), `findings`, `coverage`.

For reproducible output, set `THREESOCK_NOW` (ISO timestamp) or `SOURCE_DATE_EPOCH`; due dates and `generatedAt` derive from it.

## Decisions on rubric ambiguities

1. **SLA conflict.** Section 1.3 gives finding remediation targets (Critical ≤ 24h, Low "next planning cycle"); section 1.4 gives vulnerability SLAs (Critical 7d, Low 180d). Finding due dates use 1.3: critical 1, high 30, medium 90, low 180 days. Override them with `thresholds.slaDays`.
2. **"Met = all checks satisfied."** threesock can automate only some of the checks under most criteria. A criterion is Met when every automated check that applies passed with evidence. The checks no rule covers are listed per criterion as `manualFollowUps`, and `coverage` shows automated rules vs. rubric checks.
3. **Mixed-tag criteria marked "Default: MANUAL".** CC1.1, CC1.4 and CC3.1 are tagged DOCS+ORG, but the rubric says they default to MANUAL. They stay MANUAL, and repo signals are attached as supporting evidence only.
4. **Critical cap.** The cap applies to the band (at most "significant gaps"). The raw percentage is kept, and `capped: true` is set.
5. **Nothing to assess.** If a criterion has no rules yet, every rule is not applicable, or every result is inconclusive, it is MANUAL with a reason, not Not Met (which would penalize threesock's own blind spots) and not N/A (which needs a written justification). A criterion is N/A only when its category is out of scope or `threesock.yaml` declares it N/A with a justification.
6. **Red flags.** A rubric red flag scores the criterion 0. Red flags are tracked per finding, so a hygiene sub-finding of a red-flag rule (e.g. "`.gitignore` lacks `.env`") does not zero the criterion.
7. **Overall readiness.** The rubric doesn't define one. threesock pools points across in-scope categories using the same formula.
8. **Percentages need context.** Readiness covers assessable criteria only, so the text report always prints "N/M criteria assessed" next to it.
9. **"Risk Management"** appears in both the controls and policies lists of `COMPLIANCE_QUESTIONS.txt`; both are kept.

## Project decisions (2026-10-22)

Agreed with the maintainer before Phase 2. Change them deliberately, not by drift.

**Repo and release**

1. Home is `threesock/threesock` (GitHub org); `@threesock/maintainers` currently has one member.
2. Public from the first push. The solo-maintainer gap ("approval by someone other than the author") is recorded as a `threesock.yaml` exception with approver and expiry once the branch-protection rule exists.
3. npm package `threesock` (unscoped), published only from a GitHub Actions workflow on `v*` tags via npm trusted publishing with provenance.
4. Manual versioning: hand-written CHANGELOG, `npm version`, tag. Revisit when outside contributors arrive.
5. Node `>=22` (Node 20 is end-of-life); CI tests 22 and 24.
6. pnpm, pinned via `packageManager`, with `minimumReleaseAge: 1440` and install scripts blocked unless allow-listed. CI uses `pnpm install --frozen-lockfile`.
7. One commit per phase on `main`; a PR per phase once the remote exists.

**Scoring**

8. Met = every applicable automated check passed with evidence (see ambiguity decision 2).
9. A criterion with no automated checks is MANUAL, not Not Met.
10. Due dates use rubric 1.3 SLAs (1/30/90/180 days).
11. Dogfood gate: Security ≥ 90% **and** ≥ 20 of 33 Security criteria assessed (enforced from the end of Phase 3).

**Detection**

12. Git-history secret scanning only via Gitleaks when installed; otherwise the check is inconclusive and coverage is reported as reduced.
13. Generic `password = "..."` matches are a scored Low, non-red-flag rule limited to non-test source, with placeholder filtering.
14. External tools are discovered on `PATH`, never installed. Their findings merge with built-in ones, de-duplicated by path and line; each tool's version is recorded.
15. Dangerous-code rules cover JS/TS, Python and Go first; other languages report not applicable, never pass.
16. YAML and JSON infrastructure files are parsed properly; Terraform uses a lightweight block-aware scanner (no HCL dependency), and its evidence says so.
17. A default `sensitivePaths` list (auth, iam, crypto, security, payments/billing, infra/terraform, workflows, migrations, lockfiles); `sensitivePaths` in `threesock.yaml` replaces it.

**Privacy and interfaces**

18. `--github` reads `GITHUB_TOKEN` only; the docs list the read-only permissions needed.
19. The full disclaimer shows once per machine via a marker in `$XDG_CONFIG_HOME/threesock/` (or `~/.config/threesock/`); nothing is written in CI or non-TTY runs. The one-line disclaimer is always shown.
20. HTML reports use system fonts only; brand fonts appear only on the docs site.
21. The MCP server uses the official `@modelcontextprotocol/sdk`, scans only paths under its working directory unless `--allow-path` is given, and never writes files.

## Phase 3 decisions (2026-10-22)

**Rules and evidence (3a)**

22. Documentation checks require the content the rubric names (e.g. an incident response plan covers roles, severity, escalation, communication). Evidence says "structure checked, quality not judged". Placeholder files do not pass.
23. `evidenceLinks` in `threesock.yaml`, keyed by criterion or rule id (rule wins), mark DOCS checks as "not applicable: documented externally" and appear in reports. They never count as Met.
24. SBOMs: threesock checks that CI produces one; it does not generate them.
25. Git-history rules read the last 200 commits (fixed count, not a time window, for determinism); shallow clones are inconclusive. Findings show counts and short SHAs only, never author names or emails.
26. Commit attribution (CC1.5): unattributable identities fail; ≥ 90% signed passes; otherwise inconclusive, because SSO-linked identities may satisfy the check (`--github` can resolve it later).
27. Direct pushes to the default branch (CC8.1) are Medium, rising to High when `--github` confirms there is no branch protection. threesock's own direct-push history is an exception approved by @victornasar, expiring 2027-01-20.
28. The dogfood gate counts scored criteria only (Met/Partial/Not Met): Security ≥ 90% and ≥ 20/33 scored. threesock keeps real, small-project-sized process documents in `docs/security/` and `docs/adr/`.

**Reports and baselines (3b)**

29. SARIF: critical/high → error, medium → warning, low → note, with `security-severity` 9.5/8.0/5.5/3.0. Accepted findings become suppressions carrying approver and justification. Repository-level findings anchor to the most relevant existing file at line 1.
30. HTML: one offline file, no JavaScript, `<details>` sections, inline logo, system fonts, automatic light/dark.
31. `threesock baseline` writes `threesock-baseline.yaml` (same schema as `exceptions`); approver, reason and expiry are required. `--all` accepts only Medium and Low; Critical and High are accepted one fingerprint at a time. `--prune` removes stale entries, and reports count them.
32. Exception expiry caps: Critical ≤ 7 days, High ≤ 90 days (configurable).

## Phase 4 decisions (2026-10-22)

**4a: mapping and GitHub**

33. `mappings/controls.yaml` is self-contained: a neutral default catalogue (the 35 controls and 25 policies from `docs/rubric/COMPLIANCE_QUESTIONS.txt`, without the original company name) and a mapping of all 61 criteria. Tests check every name and every criterion. A `mappings:` file in `threesock.yaml` replaces it. Findings list the controls and policies they affect (schema 1.3.0).
34. `--github` uses Node's built-in `fetch` (no SDK) and `GITHUB_TOKEN` only. The repository comes from the `origin` remote or `--github-repo`; `GITHUB_API_URL` is honoured for GitHub Enterprise Server.
35. GitHub checks: branch protection and rulesets (CC8.1), required signed commits (CC1.5), secret scanning and push protection (CC6.1), Dependabot alerts enabled (CC7.1), aged Critical/High alerts (CC4.2), environment reviewers and organization 2FA/default permission (CC5.2; not applicable on personal repositories).
36. Alert age is measured against `thresholds.vulnerabilitySlaDays` (rubric 1.4: 7/30/90/180), not the finding SLAs.
37. API failures (permissions, rate limits, offline) make the affected checks inconclusive with the missing permission named; they never fail the scan.
38. Tests use recorded API responses. Live verification runs only against threesock's own repository. `victornasar/colloquialify` and the `tagsclinic-dev` organization are never touched.

**4b: external scanners**

39. Offline-capable tools run automatically when installed (Gitleaks with full history, zizmor offline, Checkov, Semgrep only with repository-local rules). Network-needing tools (OSV-Scanner, Trivy vulnerability DB, Semgrep registry rules) need `--network`. 60-second timeout per tool; `--no-tools` and `--tools a,b`.
40. Each tool is its own check under the matching criterion, present only when it ran. Findings are de-duplicated against built-in findings by path and line (built-in wins, "also found by" noted), and record the tool name and version.
41. Checkov and Trivy misconfigurations map to criteria by topic (network CC6.6, encryption at rest C1.1, in transit CC6.7, IAM CC6.1, logging CC7.2, backup A1.2), falling back to CC7.1.
42. Secrets found only in git history are High, show the commit SHA, and are redacted.
43. Adapters are tested with recorded tool output; a separate CI job installs pinned, checksum-verified tools and runs them for real.

**5: privacy**

44. Privacy rules that inspect code (deletion, export, correction, retention, validation, notice) are not applicable unless the repository defines personal-data fields; sensitive-category detection matches field definitions only, not prose.

## Release decisions (2026-10-22)

45. The MCP server is a separate package, `threesock-mcp` (pnpm workspace, `packages/mcp`), so `npx threesock` installs 2 packages (3 MB) instead of 97 (29 MB). `threesock mcp` only prints how to run it; it never installs anything.
46. `threesock` and `threesock-mcp` share one version and publish together from one `v*` tag; `pnpm pack` rewrites the workspace dependency, then `npm publish <tarball>` uses trusted publishing.
47. The `main` ruleset requires pull requests with 0 approvals while there is one maintainer, required checks, no force pushes or deletion, signed commits and no bypass. The resulting finding is an exception (by fingerprint) expiring 2027-01-20.
48. Commits are signed with the maintainer's SSH key.
49. v0.1 ships the control mapping as a labelled starting point and the docs in the repository; a hosted docs site comes later.
