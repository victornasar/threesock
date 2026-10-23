import { codePathRule } from '../lib/code-path.js';

export const piiValidation = codePathRule({
  id: 'p7.1/pii-validation',
  criterion: 'P7.1',
  title: 'Personal data fields are validated',
  tags: ['CODE'],
  severity: 'low',
  redFlag: false,
  checks: ['Validation on PI fields'],
  expected:
    'Personal data fields are validated for format and completeness (e.g. email and phone formats) when collected.',
  risk: 'Malformed contact data makes notification, access and deletion requests fail to reach or match the right person.',
  remediation: {
    summary:
      'Validate personal data at the boundary with a schema (email, phone, dates) and normalize before storing.',
    example: `const Signup = z.object({ email: z.string().email(), name: z.string().min(1).max(200) });`,
  },
  present:
    /\.email\(\)|EmailStr|EmailField|isEmail\(|email_validator|validate_email|IsEmail\(|type:\s*['"]email['"]|format:\s*['"]email['"]|phonenumbers|libphonenumber|isMobilePhone/,
  found: 'Personal data fields are validated',
  missing: 'No validation of personal data fields',
});
