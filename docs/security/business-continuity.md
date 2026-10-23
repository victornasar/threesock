# Business continuity

Owner: @victornasar
Last reviewed: 2026-10-22

threesock has no hosted service: it runs on users' machines and CI. Continuity is about being able to keep shipping fixes.

## Critical dependencies and fallbacks

| Dependency | If unavailable |
|---|---|
| npm registry | Existing installs keep working; releases wait. Users can install from a GitHub release tarball. |
| GitHub | Development and CI pause; the full git history exists in every clone and can be pushed to another host. |
| The single maintainer | The project is public and Apache-2.0, so it can be forked; finding a second maintainer before 1.0 is tracked as risk R5. |

## Recovery

The repository is rebuilt from any clone (`git push` to a new remote). A release is rebuilt from its tag by the release workflow. There is no data to restore.

## Provider outages

During a GitHub or npm outage no action is taken beyond pausing releases. Security fixes that cannot wait are published as a patch file in a GitHub advisory once GitHub is back, or announced on the project's other channels.
