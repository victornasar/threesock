# Configuration

threesock reads `threesock.yaml` (or `threesock.yml`, `.threesock.yaml`) from the scanned directory. `threesock init` writes a commented template. Every key is optional.

```yaml
version: 1
scope: [security, availability, privacy]       # security is always included

thresholds:                                    # rubric 1.3 and 1.4 defaults
  requiredApprovals: 1
  sensitivePathApprovals: 2
  minTlsVersion: "1.2"
  slaDays: { critical: 1, high: 30, medium: 90, low: 180 }             # finding due dates
  vulnerabilitySlaDays: { critical: 7, high: 30, medium: 90, low: 180 } # GitHub alert age
  maxExceptionDays: { critical: 7, high: 90 }                           # longest an exception may run

owners:
  "src/auth/**": "@acme/security"    # finding owner by path (last match wins)
  "CC1.2": "CEO"                     # owner for a MANUAL criterion

ignore: ["vendor/**"]

sensitivePaths: ["src/auth/**", "infra/**"]   # replaces the default list

notApplicable:
  CC6.4: "No facilities; production runs on AWS, covered by its SOC 2 report."

evidenceLinks:                       # evidence kept outside the repo; never counted as Met
  CC7.4: "https://notion.so/acme/incident-response"

mappings: ./compliance/controls.yaml # your own control and policy catalogue

exceptions:
  - rule: cc8.1/terraform-state
    path: "legacy/**"
    approver: "cto@acme.com"
    justification: "Legacy stack is being decommissioned in Q1 (INFRA-88)."
    expires: 2026-12-31
```

Exceptions need an approver, a justification and an expiry date. Expired exceptions turn back into open findings; exceptions longer than `maxExceptionDays` for the finding's severity are not applied. See [exceptions and baselines](exceptions-and-baselines.md).
