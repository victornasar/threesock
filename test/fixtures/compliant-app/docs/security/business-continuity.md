# Business continuity and disaster recovery

Owner: @compliant-org/platform
Last reviewed: 2025-11-01

## Critical dependencies
| Dependency | If unavailable |
|---|---|
| Stripe | Orders queue for retry; checkout shows a banner |
| AWS us-east-1 | Fail over to us-west-2 |

## Recovery
Rebuild from Terraform in the secondary region and restore the latest snapshot.

## Regional or provider outage
The incident commander decides on failover after 30 minutes of provider outage.

## Objectives
RTO: 1 hour. RPO: 15 minutes.

## Restore test log
| Date | System | Result |
|---|---|---|
| 2025-12-15 | Postgres | Restore test passed in 38 minutes |
