#!/usr/bin/env bash
# Installs pinned, checksum-verified external scanners for threesock's tool smoke test
# (decision 43). Linux x86_64 only; used by .github/workflows/tools.yml.
# Binaries are verified against SHA-256 digests recorded here (cross-checked with each
# project's published checksums). Python-based tools run from container images pinned
# by digest, which gives the same guarantee without hash-pinning a dependency tree.
set -euo pipefail

BIN="${1:-$HOME/.local/bin}"
mkdir -p "$BIN"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

fetch() { # url sha256 output
  curl -fsSL --retry 3 -o "$3" "$1"
  echo "$2  $3" | sha256sum -c --quiet -
}

fetch https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz \
  551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb "$WORK/gitleaks.tgz"
tar -xzf "$WORK/gitleaks.tgz" -C "$BIN" gitleaks

fetch https://github.com/aquasecurity/trivy/releases/download/v0.75.0/trivy_0.75.0_Linux-64bit.tar.gz \
  c6e65abddb348e25f10549df887045629cf28cc72453cd1c63acb717316b3f3f "$WORK/trivy.tgz"
tar -xzf "$WORK/trivy.tgz" -C "$BIN" trivy

fetch https://github.com/google/osv-scanner/releases/download/v2.7.0/osv-scanner_linux_amd64 \
  160c6253e2922e9e0a6a9771c5c4c40a4b3c6090b34a3cdd5e80c96cc2e4218b "$BIN/osv-scanner"
chmod +x "$BIN/osv-scanner"

fetch https://github.com/zizmorcore/zizmor/releases/download/v1.31.1/zizmor-x86_64-unknown-linux-gnu.tar.gz \
  d185f726bdaf92df78273217dfdd24ebcd6b0ef48cf3ce776ff5762b6e138c99 "$WORK/zizmor.tgz"
tar -xzf "$WORK/zizmor.tgz" -C "$WORK"
install -m 0755 "$(find "$WORK" -type f -name zizmor | head -1)" "$BIN/zizmor"

# Container-backed tools: images pinned by digest; the shims mount the temp dir and workspace.
shim() { # name image@digest
  cat > "$BIN/$1" <<SHIM
#!/usr/bin/env bash
exec docker run --rm -v /tmp:/tmp -v "\${GITHUB_WORKSPACE:-\$PWD}:\${GITHUB_WORKSPACE:-\$PWD}" -w "\$PWD" --entrypoint $1 $2 "\$@"
SHIM
  chmod +x "$BIN/$1"
}
shim checkov bridgecrew/checkov@sha256:8e63f217cb084f1c1a067326a9cf6e37d54bdc82e5822210d50ca4e2f647dd93 # 3.3.26
shim semgrep semgrep/semgrep@sha256:529ee8a277ec8adc5b534d7c74eea0a47e9de21d62852b6ba7ac6ba9566845c3 # 1.180.0

echo "Installed scanners into $BIN"
