# 0002. Minimal dependencies and pnpm with a release-age delay

Date: 2026-10-22
Status: Accepted

## Context

Everyone who runs `npx threesock` executes threesock's dependency tree with their own permissions, often in CI with secrets present.

## Decision

Keep runtime dependencies to a minimum (currently one: `yaml`). Use pnpm with `minimumReleaseAge: 1440`, a pinned `packageManager`, blocked install scripts and frozen lockfile installs. Pin every GitHub Action to a commit SHA.

## Security considerations

Most npm supply-chain attacks are detected within hours of publication; a one-day delay avoids nearly all of them at almost no cost. A small dependency tree is also reviewable by a single maintainer.
