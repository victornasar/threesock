# Getting started

Node.js 22 or later.

```sh
npx threesock                 # scan the current directory (Security scope)
```

You get a readiness bar per category, finding counts by severity, the top five fixes and the number of criteria that need manual evidence.

## Next steps

```sh
npx threesock init                                  # create threesock.yaml: scope, owners, thresholds
npx threesock scan --scope security,availability    # add the categories your report covers
npx threesock explain CC8.1                         # what a criterion requires and how threesock checks it
npx threesock report --format html                  # full scorecard as a single offline HTML file
```

## Reading the result

- **Met (2)** means every automated check for the criterion passed and cited evidence. **Partial (1)** means some did. **Not Met (0)** means none did, or a rubric red flag is present.
- **MANUAL** criteria cannot be judged from code. The report lists the evidence to collect for each.
- Readiness is points earned over points possible for the criteria threesock could assess, which is why the assessed count is always shown next to it. 90% and above is audit-ready from a codebase perspective.
- Any open **Critical** finding caps its category at "significant gaps" until it is fixed.

## In CI

Use the [GitHub Action](../github-action.md), or run `npx threesock@<version> scan --fail-on high --format sarif --out threesock.sarif` in any pipeline. Exit code 1 means a gate failed; 2 means a usage or configuration error.
