# Deploying

Deploys run from the `deploy` workflow on merge to main, through the protected `production` environment.

## Rolling back a release

1. Re-run the deploy workflow for the previous release tag.
2. Confirm health checks and error rates recover, then post in #incidents.

## Emergency changes

Use only during an active incident. The incident commander may approve a hotfix alone;
a retroactive review is opened within 2 business days.
