# Releasing threesock

Releases are published to npm only by the release workflow, from a `v*` tag, using npm trusted publishing with provenance. Nobody publishes from a laptop.

## First release (one time)

npm trusted publishing is configured per package, so the first publish of `threesock` and `threesock-mcp` uses a short-lived token:

1. On npmjs.com: Access Tokens → Generate New Token → Granular, permission "Read and write (stage only)", all packages, expiry of 7 days or less.
2. In the repository: Settings → Environments → `npm` (create it, with yourself as a required reviewer) → add the secret `NPM_TOKEN`.
3. Tag `v0.1.0` and push the tag; approve the `npm` environment when the release job asks. The job stages both packages; approve each on npmjs.com (or `npm stage list`, then `npm stage approve <id>`) with your 2FA to publish them.
4. On npmjs.com, for both packages: Settings → Trusted publishing → GitHub Actions, repository `victornasar/threesock`, workflow `release.yml`, environment `npm`.
5. Delete the `NPM_TOKEN` secret and revoke the token. Later releases publish through OIDC with no token.

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
