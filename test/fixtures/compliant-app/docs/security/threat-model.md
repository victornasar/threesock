# Threat model

Owner: @compliant-org/security
Last reviewed: 2025-11-01

## Assets
Customer PII (email, name) in Postgres; payment tokens from Stripe; session secrets.

## Trust boundaries and entry points
Public HTTPS API, Stripe webhook endpoint, admin console behind SSO.

## Threats and mitigations
| Threat | Mitigation |
|---|---|
| Forged webhook | Stripe signature verification |
| Credential stuffing | Rate limiting on /auth, argon2id hashing |
