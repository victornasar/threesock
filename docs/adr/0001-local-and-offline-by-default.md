# 0001. Local and offline by default

Date: 2026-10-22
Status: Accepted

## Context

threesock reads entire repositories, including any secrets they contain. Users need to run it on private code without legal or security review.

## Decision

threesock makes no network calls and sends no telemetry. Integrations that need the network (the GitHub API) are opt-in per run (`--github`) and use only the token the user provides.

## Security considerations

Removing the network removes the largest data-exfiltration path. The trade-off is that checks needing platform state (branch protection, push protection) are inconclusive by default, which threesock reports honestly instead of guessing.
