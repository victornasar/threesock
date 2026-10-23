# Access management

Owner: @victornasar
Last reviewed: 2026-10-22

Systems with privileged access: the `threesock` GitHub organization and the `threesock` npm package.

## Onboarding

New maintainers are added to the `@threesock/maintainers` team after an approval recorded in an issue, must use hardware-key or app-based two-factor authentication, and are added to the npm package as maintainers. No shared accounts exist.

## Offboarding

Within 24 hours of a maintainer stepping down: remove them from the GitHub organization and the npm package, revoke any personal access tokens they created for the project, and review the GitHub audit log for the previous 30 days.

## Access reviews

Quarterly, the owner reviews GitHub organization members, team membership, outside collaborators, installed GitHub Apps, and npm package maintainers, and records the date in this file.

| Date | Reviewer | Result |
|---|---|---|
| 2026-10-22 | @victornasar | One maintainer; no apps; no tokens |

## Key rotation

Releases use npm trusted publishing, so no npm token exists to rotate. CI uses the short-lived `GITHUB_TOKEN`. Any personal access token used for the project is fine-grained, expires within 90 days, and is revoked immediately on exposure or personnel change.
