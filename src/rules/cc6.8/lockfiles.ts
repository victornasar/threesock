import type { RawFinding, Rule } from '../../engine/types.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { plural } from '../util.js';

interface Ecosystem {
  manifest: RegExp;
  locks: string[];
  name: string;
  /** Lockfile may live in an ancestor directory (workspaces). */
  inherit: boolean;
  hasDeps?: (text: string) => boolean;
}

const ECOSYSTEMS: Ecosystem[] = [
  {
    manifest: /(?:^|\/)package\.json$/,
    name: 'npm',
    inherit: true,
    locks: [
      'package-lock.json',
      'npm-shrinkwrap.json',
      'pnpm-lock.yaml',
      'yarn.lock',
      'bun.lock',
      'bun.lockb',
    ],
    hasDeps: (t) => /"(?:dependencies|devDependencies|optionalDependencies)"\s*:\s*\{\s*"/.test(t),
  },
  {
    manifest: /(?:^|\/)pyproject\.toml$/,
    name: 'Python',
    inherit: false,
    locks: ['poetry.lock', 'uv.lock', 'pdm.lock', 'Pipfile.lock', 'requirements.lock'],
    hasDeps: (t) =>
      /(?:^\s*dependencies\s*=\s*\[\s*["'])|(?:\[tool\.poetry\.dependencies\])/m.test(t),
  },
  { manifest: /(?:^|\/)Pipfile$/, name: 'Pipenv', inherit: false, locks: ['Pipfile.lock'] },
  {
    manifest: /(?:^|\/)go\.mod$/,
    name: 'Go',
    inherit: false,
    locks: ['go.sum'],
    hasDeps: (t) => /^require\b/m.test(t),
  },
  { manifest: /(?:^|\/)Gemfile$/, name: 'Ruby', inherit: false, locks: ['Gemfile.lock'] },
  {
    manifest: /(?:^|\/)composer\.json$/,
    name: 'Composer',
    inherit: false,
    locks: ['composer.lock'],
  },
];

function dir(path: string): string {
  return path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
}

export const lockfiles: Rule = {
  id: 'cc6.8/lockfiles',
  criterion: 'CC6.8',
  title: 'Dependency lockfiles are committed',
  tags: ['CONFIG'],
  severity: 'high',
  redFlag: false,
  checks: ['Lockfiles committed'],
  expected:
    'Every dependency manifest has a committed lockfile (or hash-pinned requirements) so installs are reproducible.',
  risk: 'Without a lockfile, each install can pull different, possibly compromised, versions, and a build cannot be reproduced.',
  remediation: {
    summary:
      'Generate the lockfile with your package manager, commit it, and install with the frozen/ci mode in CI.',
    example: `pnpm install && git add pnpm-lock.yaml       # Node
uv lock && git add uv.lock                    # Python
pip-compile --generate-hashes requirements.in # pip`,
  },
  detect(ctx) {
    const prod = ctx.files.files.filter((f) => !isTestPath(f.path) && !isVendored(f.path));
    const findings: RawFinding[] = [];
    let manifests = 0;
    const evidence = [];
    for (const eco of ECOSYSTEMS) {
      for (const m of prod.filter((f) => eco.manifest.test(f.path))) {
        if (eco.hasDeps && !eco.hasDeps(ctx.files.read(m.path) ?? '')) continue;
        manifests++;
        let d = dir(m.path);
        let lock: string | undefined;
        for (;;) {
          lock = eco.locks.map((l) => (d ? `${d}/${l}` : l)).find((l) => ctx.files.has(l));
          if (lock || !eco.inherit || d === '') break;
          d = dir(d);
        }
        if (lock)
          evidence.push({
            kind: 'file' as const,
            path: lock,
            description: `${eco.name} lockfile for ${m.path}.`,
          });
        else
          findings.push({
            path: m.path,
            title: `No lockfile for ${m.path}`,
            observed: `${m.path} declares ${eco.name} dependencies but no lockfile (${eco.locks.join(', ')}) is committed.`,
            key: m.path,
          });
      }
    }
    for (const r of prod.filter((f) => /(?:^|\/)requirements[^/]*\.txt$/.test(f.path))) {
      const lines = (ctx.files.read(r.path) ?? '')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#') && !l.startsWith('-'));
      if (lines.length === 0) continue;
      manifests++;
      const unpinned = lines.filter((l) => !/==/.test(l) && !l.startsWith('--hash'));
      const hashed = /--hash=/.test(ctx.files.read(r.path) ?? '');
      if (unpinned.length)
        findings.push({
          path: r.path,
          severity: 'medium',
          title: `Unpinned Python requirements in ${r.path}`,
          observed: `${plural(unpinned.length, 'requirement')} in ${r.path} are not pinned with ==, e.g. ${unpinned[0]}.`,
          key: `${r.path}:unpinned`,
        });
      else if (!hashed)
        findings.push({
          path: r.path,
          severity: 'low',
          title: `Python requirements not hash-pinned in ${r.path}`,
          observed: `${r.path} pins versions but not hashes, so a replaced package would install silently.`,
          key: `${r.path}:hashes`,
        });
      else
        evidence.push({
          kind: 'file' as const,
          path: r.path,
          description: `${r.path} is hash-pinned.`,
        });
    }
    if (manifests === 0)
      return {
        status: 'not_applicable',
        justification: 'No dependency manifests with dependencies were found.',
      };
    if (findings.length) return { status: 'fail', findings, evidence };
    return { status: 'pass', evidence };
  },
};
