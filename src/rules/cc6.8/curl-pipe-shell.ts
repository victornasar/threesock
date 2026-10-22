import type { Rule } from '../../engine/types.js';
import { scanLines } from '../lib/code-patterns.js';
import { buildFiles } from '../lib/build-files.js';
import { absence, plural } from '../util.js';

export const curlPipeShell: Rule = {
  id: 'cc6.8/curl-pipe-shell',
  criterion: 'CC6.8',
  title: 'No unverified remote scripts piped to a shell',
  tags: ['CONFIG'],
  severity: 'high',
  redFlag: false,
  checks: ['No unverified `curl | bash`'],
  expected:
    'Downloaded tools and scripts are verified with a checksum or signature before they run.',
  risk: 'Piping a remote script to a shell runs whatever the server (or anyone who compromises it) sends, inside your build.',
  remediation: {
    summary:
      'Download to a file, verify its checksum or signature, then run it, or install from a package manager.',
    example: `curl -fsSLo install.sh https://example.com/install.sh
echo "<sha256>  install.sh" | sha256sum -c -
sh install.sh`,
  },
  detect(ctx) {
    const files = buildFiles(ctx.files);
    if (files.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No CI configs, Dockerfiles or build scripts found.',
      };
    const findings = scanLines(ctx, files, [
      {
        languages: [],
        re: /\b(?:curl|wget)\b[^|\n]*\|\s*(?:sudo\s+)?(?:-E\s+)?(?:ba|z|da|k)?sh\b|\b(?:curl|wget)\b[^|\n]*\|\s*(?:sudo\s+)?python3?\b|\b(?:ba)?sh\s+<\(\s*(?:curl|wget)\b/,
        label: 'Remote script piped straight into a shell',
      },
    ]);
    if (findings.length) return { status: 'fail', findings };
    return absence(
      `Checked ${plural(files.length, 'build file')}; no remote scripts piped to a shell.`,
    );
  },
};
