# Risk register

Owner: @victornasar
Last reviewed: 2026-10-22
Reviewed quarterly and after any security incident.

| ID | Risk | Likelihood | Impact | Owner | Treatment | Controls |
|---|---|---|---|---|---|---|
| R1 | Secret value leaks into a threesock report or log | Low | High | @victornasar | Mitigate | Redaction at detection, output scrubbing, leak tests across all formats |
| R2 | Malicious dependency or compromised action in the supply chain | Medium | High | @victornasar | Mitigate | Single runtime dependency, minimumReleaseAge, SHA-pinned actions, dependency review, TruffleHog, CodeQL |
| R3 | False "Met" leads a company into an audit with a real gap | Medium | High | @victornasar | Mitigate | Evidence-required scoring, fixture and golden tests, honest coverage reporting, rubric drift test |
| R4 | Maintainer account takeover publishes a malicious version | Low | High | @victornasar | Mitigate | Two-factor authentication (hardware key or authenticator app), trusted publishing with provenance, no npm tokens, every release staged and approved with the maintainer's 2FA |
| R5 | Single maintainer becomes unavailable (bus factor) | Medium | Medium | @victornasar | Accept, with mitigation | Public repository and documentation; Apache-2.0 allows forks; second maintainer sought before 1.0 |
| R6 | Changes merge without independent review | High | Medium | @victornasar | Accept until 2027-01-20 | CI gates on every change; recorded exception in threesock.yaml; second reviewer sought |
