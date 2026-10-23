# Third parties

Owner: @victornasar
Last reviewed: 2026-10-22

threesock sends no user data to any third party. This inventory covers the services and code the project itself depends on. Open-source dependencies are also listed in the CycloneDX SBOM that CI generates on every run.

| Service or component | Purpose | Data shared | Access scope |
|---|---|---|---|
| GitHub | Source hosting, CI, security advisories | Source code (public) | Organization owner: @victornasar |
| npm registry | Package distribution | Published package (public) | Trusted publishing from CI only |
| `yaml` (npm) | Parsing threesock.yaml and IaC files | None (runs locally) | Runtime dependency |
| GitHub Actions: checkout, setup-node, pnpm/action-setup | CI | Repository contents within CI | Pinned by commit SHA |
| TruffleHog, CodeQL, dependency-review, anchore/sbom-action | Security scanning in CI | Repository contents within CI | Pinned by commit SHA; read-only token |
| Dependabot | Dependency update PRs | Manifest and lockfile (GitHub-internal) | GitHub-managed |

New services or runtime dependencies require a pull request that updates this table; CODEOWNERS routes `package.json` and workflow changes to the maintainers.
