# Incident response

Owner: @victornasar
Last reviewed: 2026-10-22

## Roles

threesock has one maintainer, who acts as incident lead and communications lead. If a second maintainer joins, the first responder leads and the other handles communication.

## Severity levels

| Severity | Criteria | Examples |
|---|---|---|
| SEV1 (Critical) | Users are actively harmed or a release is malicious | Malicious version published; secret values leaked by threesock output |
| SEV2 (High) | Exploitable vulnerability with no known exploitation | Path traversal in the MCP server; a crafted repo crashes or misleads the scanner |
| SEV3 (Medium/Low) | Hardening gap or low-impact bug | Unpinned action; noisy false positive in a security rule |

Every report or alert is triaged within 2 business days. The outcome (true or false positive, and whether it is an incident) is recorded on the private advisory or issue.

## Escalation

SEV1: work stops on everything else; contact npm support and GitHub security if accounts or packages are involved. SEV2: fix scheduled per the vulnerability management deadlines.

## Communication

Reporters get an acknowledgement within 2 business days. For SEV1 and SEV2, a GitHub security advisory (with a CVE where appropriate) is published with the fix, and the CHANGELOG links to it.

## Runbooks

### Credential leak or compromised account

1. Revoke the credential or sign out all sessions; rotate 2FA if the account itself is affected.
2. Review the npm package's recent versions and the GitHub audit log for actions taken with it.
3. If a malicious version was published, follow "Compromised dependency" below for threesock itself.

### Data exposure (threesock output revealed secrets)

1. Reproduce with the reporter's case and identify which output path skipped redaction.
2. Ship a fix and a regression test in the leak test suite; publish an advisory telling users which reports to delete and which secrets to rotate.

### Compromised dependency or release

1. Deprecate the affected version and move the `latest` tag to the last good version (see [releasing.md](../releasing.md)).
2. Pin or remove the dependency, rebuild, and publish a patch release.
3. Publish an advisory naming the affected versions.

### Outage (npm registry or GitHub unavailable)

threesock runs locally, so an outage only blocks installs and releases. Users with a cached copy keep working; releases wait until the services recover. No action beyond a status note is needed.
