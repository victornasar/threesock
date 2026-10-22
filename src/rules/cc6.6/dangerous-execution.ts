import { codePatternRule } from '../lib/code-patterns.js';

export const dangerousExecution = codePatternRule({
  id: 'cc6.6/dangerous-execution',
  criterion: 'CC6.6',
  title: 'No dynamic code execution or shell injection sinks',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['Defenses against common web flaws'],
  expected:
    'Code never evaluates strings as code, never builds shell commands from strings, and never deserializes untrusted data with unsafe loaders.',
  risk: 'If any part of the evaluated string or command can be influenced by a user, the result is remote code execution.',
  remediation: {
    summary:
      'Replace dynamic evaluation with explicit logic, pass command arguments as an array without a shell, and use safe loaders (json, yaml.safe_load).',
    example: `# Python: argument list, no shell
subprocess.run(["convert", src, dst], check=True)

// Node: execFile with arguments, no shell
execFile('convert', [src, dst]);`,
  },
  clean: 'no dynamic code execution, shell-string commands or unsafe deserialization',
  patterns: [
    {
      languages: ['js', 'python'],
      re: /(?<![.\w$])eval\s*\(/,
      label: 'Dynamic evaluation of a string as code',
      severity: 'high',
    },
    {
      languages: ['js'],
      re: /\bnew\s+Function\s*\(/,
      label: 'Function constructor builds code from a string',
      severity: 'high',
    },
    {
      languages: ['js'],
      re: /\bexec(?:Sync)?\s*\(\s*`[^`]*\$\{/,
      label: 'Shell command built with string interpolation',
      severity: 'high',
    },
    {
      languages: ['js'],
      re: /\b(?:spawn|spawnSync|execFile)\s*\([^)]*shell\s*:\s*true/,
      label: 'Child process started through a shell',
    },
    {
      languages: ['python'],
      re: /(?<![.\w])exec\s*\(/,
      label: 'Dynamic execution of a string as code',
      severity: 'high',
    },
    {
      languages: ['python'],
      re: /\bsubprocess\.\w+\([^)]*shell\s*=\s*True/,
      label: 'Subprocess started through a shell',
    },
    {
      languages: ['python'],
      re: /\bos\.(?:system|popen)\s*\(/,
      label: 'Shell command run through os.system or os.popen',
    },
    {
      languages: ['python'],
      re: /\b(?:pickle|cPickle|marshal|dill)\.loads?\s*\(/,
      label: 'Unsafe deserialization with pickle or marshal',
      severity: 'high',
    },
    {
      languages: ['python'],
      re: /\byaml\.load\s*\((?![^)]*Loader\s*=\s*(?:yaml\.)?(?:Safe|CSafe)Loader)/,
      label: 'YAML loaded without a safe loader',
    },
    {
      languages: ['go'],
      re: /exec\.Command(?:Context)?\([^)]*"(?:sh|bash|cmd(?:\.exe)?)"\s*,\s*"(?:-c|\/c)"/,
      label: 'Shell command run through sh -c',
    },
  ],
});
