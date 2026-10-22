# Security policy

threesock scans repositories that may contain secrets, so we take its own security seriously.

## Reporting a vulnerability

Please report vulnerabilities privately through
[GitHub private vulnerability reporting](https://github.com/threesock/threesock/security/advisories/new).
Do not open a public issue.

We aim to acknowledge reports within 2 business days, share an assessment within 7 days,
and release a fix for Critical issues within 7 days of confirmation.

## Supported versions

Only the latest minor release receives security fixes while threesock is pre-1.0.

## What counts

Especially in scope:

- Any path where a detected secret value (beyond its first 4 characters) reaches a report, log or stdout.
- Any network call made without the user explicitly enabling an integration.
- Code execution triggered by scanning an untrusted repository.
- Scores or "Met" results that can be produced without evidence.
