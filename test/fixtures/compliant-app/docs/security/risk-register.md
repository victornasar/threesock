# Risk register

Owner: @compliant-org/security
Last reviewed: 2025-11-01

| Risk | Likelihood | Impact | Owner | Treatment | Controls |
|---|---|---|---|---|---|
| Leaked deploy credentials | Low | High | @platform | Mitigate | OIDC role assumption, no stored keys |
| Malicious dependency | Medium | High | @platform | Mitigate | Lockfile, dependency review, Dependabot |
