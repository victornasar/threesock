# Data classification and handling

Owner: @compliant-org/security
Last reviewed: 2025-11-01

| Level | Examples | Handling |
|---|---|---|
| Public | Marketing pages | No restrictions |
| Internal | Runbooks | Employees only |
| Confidential | Customer PII | Encrypted at rest, access logged |
| Restricted | Payment tokens, credentials | Never logged, never in lower environments |

## Retention
Application logs are kept for 90 days, then deleted by lifecycle rules. Closed accounts are purged after 30 days.

## Third parties
| Service | Purpose | Data shared |
|---|---|---|
| Stripe | Payments | Email, card token |
| Sentry | Error tracking | Stack traces, no PII |
