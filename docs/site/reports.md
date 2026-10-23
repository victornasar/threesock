# Reports

| Format | Use |
|---|---|
| `text` (default) | Terminal summary: readiness bars, severity counts, top fixes. Color only for severity; respects `NO_COLOR`. |
| `json` | Stable, versioned (`schemaVersion`) model of everything below, for CI and agents. |
| `markdown` | The rubric's Appendix A scorecard, Appendix B findings, the controls and policies affected, a MANUAL evidence checklist and the checks threesock did not verify. |
| `html` | The same content as one offline file: no JavaScript, no network requests, light and dark. |
| `sarif` | SARIF 2.1.0 for GitHub code scanning, with criterion tags, `security-severity`, stable fingerprints and suppressions for accepted findings. |

`--out <file>` writes the main format to a file; `--output <format>=<file>` (repeatable) writes more formats from the same scan. `threesock report` is shorthand for a Markdown (or `--format html`) report file.

Every finding carries: ID, criterion, severity, title, location, what was observed, what is expected, the risk, a recommendation with an example fix, a due date from your SLA, the internal controls and policies it affects, and a fingerprint for exceptions and baselines.
