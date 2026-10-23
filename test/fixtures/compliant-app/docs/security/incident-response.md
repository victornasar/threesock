# Incident response

Owner: @compliant-org/security
Last reviewed: 2025-11-01

## Roles
Incident commander: the on-call engineer. Communications lead: head of support.

## Severity levels
| Severity | Criteria | Example |
|---|---|---|
| SEV1 | Confirmed data exposure or full outage | Customer data readable by others |
| SEV2 | Partial outage or contained security event | Admin account compromised, no data accessed |
| SEV3 | Minor issue | Single failed deploy |

Every alert is triaged; the outcome (true positive or false positive, and whether it is an incident) is recorded on the ticket.

## Escalation
SEV1 pages the CTO within 15 minutes.

## Communication
Status page within 30 minutes; customers notified within 72 hours of a confirmed breach.

## Runbooks
### Credential leak
Revoke the key at the provider, rotate dependents, search logs for use.
### Data exposure
Contain access, preserve logs, assess affected subjects, notify per the breach policy.
### Compromised dependency
Pin to the last good version, rebuild, rotate any secrets the build could read.
### Outage or DDoS
Enable the WAF rate rules, scale out, update the status page.
