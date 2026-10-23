import { codePatternRule } from '../lib/code-patterns.js';

// Matched with string literals blanked, so messages that mention "email" in prose are fine.
export const piiInLogs = codePatternRule({
  id: 'cc7.2/pii-in-logs',
  criterion: 'CC7.2',
  title: 'Personal data is not written to logs',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['No secrets, credentials, full card numbers, or unnecessary PII in logs'],
  expected:
    'Logs identify people by internal id, never by email, phone, address, date of birth or IP-linked profile data.',
  risk: 'Personal data in logs is copied to log platforms and backups with long retention, outside deletion and access-request processes.',
  remediation: {
    summary:
      'Log a pseudonymous user id instead, and configure logger redaction for personal fields.',
    example: `log.info({ userId: user.id }, 'signup complete');`,
  },
  clean: 'no personal data fields passed to loggers',
  patterns: [
    {
      languages: ['js'],
      code: true,
      re: /\b(?:console|logger|log|winston|pino|bunyan)\.(?:log|info|warn|error|debug|trace)\s*\([^)]*\b(?:email|phone(?:Number)?|address|dateOfBirth|dob|ssn|firstName|lastName|fullName|ipAddress)\b/,
      label: 'Personal data field passed to a logger',
    },
    {
      languages: ['python'],
      code: true,
      re: /\b(?:logging|logger|log)\.(?:info|warning|warn|error|debug|exception|critical)\s*\([^)]*\b(?:email|phone(?:_number)?|address|date_of_birth|dob|ssn|first_name|last_name|full_name|ip_address)\b/,
      label: 'Personal data field passed to a logger',
    },
    {
      languages: ['go'],
      code: true,
      re: /\b(?:log|logger|slog|logrus)\.\w+\s*\([^)]*\b(?:Email|Phone|Address|DateOfBirth|SSN|FirstName|LastName)\b/,
      label: 'Personal data field passed to a logger',
    },
  ],
});
