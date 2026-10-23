import { codePatternRule } from '../lib/code-patterns.js';

// Matched with string literals blanked (code: true), so log messages that merely
// mention "password" in prose are not flagged.
export const sensitiveLogging = codePatternRule({
  id: 'cc7.2/sensitive-logging',
  criterion: 'CC7.2',
  title: 'Credentials and request bodies are not logged',
  tags: ['CODE'],
  severity: 'high',
  redFlag: true,
  checks: ['No secrets, credentials, full card numbers, or unnecessary PII in logs'],
  expected:
    'Logs never contain passwords, tokens, authorization headers, full request bodies or card numbers.',
  risk: 'Logs are copied widely (log platforms, support tools, laptops). Credentials in them become a breach with a long tail.',
  remediation: {
    summary:
      'Log identifiers and outcomes, not payloads. Use a logger with redaction paths for anything sensitive.',
    example: `const log = pino({ redact: ['req.headers.authorization', 'req.body.password'] });
log.info({ userId, outcome: 'login_failed' });`,
  },
  clean: 'no credentials, auth headers or request bodies passed to loggers',
  patterns: [
    {
      languages: ['js'],
      code: true,
      re: /\b(?:console|logger|log|winston|pino|bunyan)\.(?:log|info|warn|error|debug|trace)\s*\([^)]*\b(?:req|request)\.(?:body|headers)\b(?!\.(?:id|requestId|['"]?x-request-id))/,
      label: 'Request body or headers passed to a logger',
    },
    {
      languages: ['js'],
      code: true,
      re: /\b(?:console|logger|log|winston|pino|bunyan)\.(?:log|info|warn|error|debug|trace)\s*\([^)]*\b(?:password|passwd|secret|token|accessToken|refreshToken|apiKey|api_key|authorization|cardNumber|card_number|ssn)\b/i,
      label: 'Credential or sensitive value passed to a logger',
    },
    {
      languages: ['python'],
      code: true,
      re: /\b(?:logging|logger|log)\.(?:info|warning|warn|error|debug|exception|critical)\s*\([^)]*\b(?:request\.(?:json|data|form|headers|body)|password|secret|token|authorization|api_key|card_number|ssn)\b/i,
      label: 'Request data or credential passed to a logger',
    },
    {
      languages: ['go'],
      code: true,
      re: /\b(?:log|logger|slog|zap\.\w+|logrus)\.\w+\s*\([^)]*\b(?:r\.Body|r\.Header|password|token|secret|apiKey|authorization)\b/i,
      label: 'Request data or credential passed to a logger',
    },
  ],
});
