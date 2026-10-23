# 0003. Redact secrets at detection and scrub all output

Date: 2026-10-22
Status: Accepted

## Context

A scanner that finds secrets must report them without becoming a new place they leak (CI logs, SARIF uploaded to GitHub, shared HTML reports).

## Decision

Rules pass every detected value through `ctx.secrets.register()`, which returns a form showing at most the first 4 characters. Findings describe constructs instead of quoting source lines. Before anything is written, the CLI scrubs the output against every registered value.

## Security considerations

Two independent layers: a rule that forgets to redact is still caught by the scrubber. Tests plant fake secrets and assert that no 6-character window of them appears in any output format.
