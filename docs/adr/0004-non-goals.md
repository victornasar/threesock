# 0004. Non-goals: threesock is not a GRC platform

Date: 2026-10-22
Status: Accepted

## Context

Compliance platforms (Vanta, Drata, Secureframe, Comp AI) compete on breadth: questionnaires, trust centers, vendor risk, HR and device monitoring, auditor networks. threesock's value is depth on the repository: evidence at file and line, honest coverage, local and private by default, and an interface agents can drive.

## Decision

threesock will not build:

- Security questionnaire answering
- Trust centers or public security pages
- Vendor risk management portals
- HR, onboarding or laptop/device (MDM) monitoring
- Auditor marketplaces or audit services

Where a team uses a GRC platform, threesock feeds it (evidence bundles and exports) instead of replacing it.

## Security considerations

Each excluded area would require hosting customer data or broad third-party credentials, which contradicts ADR 0001 (local and offline by default). Keeping scope narrow also keeps the dependency tree and the attack surface small (ADR 0002).
