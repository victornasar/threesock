import { codePatternRule } from '../lib/code-patterns.js';

export const authBypass = codePatternRule({
  id: 'cc3.3/auth-bypass',
  criterion: 'CC3.3',
  title: 'No authentication bypass flags or hard-coded privileged users',
  tags: ['CODE'],
  severity: 'high',
  redFlag: true,
  checks: ['No backdoor accounts'],
  expected:
    'Authentication cannot be switched off by a flag or environment variable, and no code grants privileges to a hard-coded username.',
  risk: 'A bypass meant for debugging reaches production sooner or later, giving anyone who finds it full access.',
  remediation: {
    summary:
      'Remove the bypass. For local development, use a seeded test user against the real auth path, and authorize by role, never by username.',
    example: `if (!session.user.roles.includes('admin')) return res.sendStatus(403);`,
  },
  clean: 'no auth-bypass flags or hard-coded privileged usernames',
  patterns: [
    {
      languages: ['js', 'python', 'go'],
      re: /\b(?:skip|bypass|disable|no)_?auth(?:entication|orization|z|n)?\b\s*[:=]\s*(?:true|True|1\b|['"](?:true|1)['"])/i,
      label: 'Authentication can be switched off by a flag',
    },
    {
      languages: ['js', 'python', 'go'],
      re: /\b(?:process\.env|os\.environ|os\.getenv|os\.Getenv)[.[(]\s*['"]?(?:SKIP|BYPASS|DISABLE|NO)_AUTH/,
      label: 'Authentication can be switched off by an environment variable',
    },
    {
      languages: ['js', 'python', 'go'],
      re: /\b(?:username|user(?:name)?\.name|user|email|login)\s*(?:===?|==)\s*['"](?:admin|root|superuser|backdoor|god|test)['"]/i,
      label: 'Privileges granted by comparing to a hard-coded username',
    },
  ],
});
