# Releasing threesock

Releases are published to npm only by the release workflow, from a `v*` tag, using npm trusted publishing with provenance. Nobody publishes from a laptop.

## Normal release

1. Update `CHANGELOG.md` under a new version heading.
2. `npm version <patch|minor|major>` (creates the commit and the `v*` tag).
3. Push the commit and the tag. The release workflow runs the full check suite, then publishes.
4. Confirm the provenance badge on the npm package page.

## Rolling back a release

npm versions cannot be overwritten, so a rollback is a forward move:

1. Deprecate the bad version: `npm deprecate threesock@<bad> "<reason>; use <good>"`.
2. Point `latest` at the last good version: `npm dist-tag add threesock@<good> latest`.
3. Fix forward in a new patch release through the normal process.
4. If the bad version leaked data or ran unexpected code, follow `SECURITY.md` and publish an advisory.

## Emergency changes

For an actively exploited vulnerability or a release that breaks users, a maintainer may merge a hotfix with a single approval (or none while threesock has one maintainer). A retroactive review is opened within 2 business days, linked from the advisory or issue, and recorded in the changelog.
