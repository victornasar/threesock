# Exceptions and baselines

Some findings are accepted rather than fixed. threesock lets you record that properly: who approved it, why, and until when.

## Exceptions in threesock.yaml

Hand-written, by rule (optionally limited to a path) or by fingerprint. See [configuration](configuration.md).

## Baselines

`threesock baseline` writes `threesock-baseline.yaml`, matched by finding fingerprint. Use it to adopt threesock on an existing codebase without accepting anything serious in bulk:

```sh
# accept today's Medium and Low findings for one quarter
npx threesock baseline --all --approver "cto@acme.com" --reason "Q1 backlog, tracked in ENG-412" --expires 2026-03-31

# accept one High finding by fingerprint (from --format json)
npx threesock baseline --fingerprint 3f9c0a1b2c3d4e5f --approver "cto@acme.com" --reason "Vendor fix due 2026-02-10" --expires 2026-02-15

# remove entries for findings that are gone
npx threesock baseline --prune
```

Rules that keep this honest:

- Approver, reason and expiry are always required.
- `--all` never accepts Critical or High findings.
- Exceptions may run at most 7 days for Critical and 90 days for High (configurable with `thresholds.maxExceptionDays`).
- Expired entries become open findings again, and reports list entries that no longer match anything.
- Commit the baseline file so every acceptance is reviewed like code.
