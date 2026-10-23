import type { Rule } from '../../engine/types.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { personalDataFiles } from '../lib/pii.js';
import { findAny } from '../util.js';

// Field definitions only (schema columns, model fields, object keys), not prose in strings.
const SENSITIVE =
  /\b(?:ssn|social_security(?:_number)?|passport(?:_number)?|drivers?_licen[cs]e|tax_id|national_id|date_of_birth|birth_?date|dob|diagnos[ie]s|medical_[a-z]+|health_[a-z]+|biometric_?\w*|fingerprint_(?:template|image|scan)|face_?(?:template|embedding)|religion|ethnicity|sexual_orientation|precise_location|latitude|longitude)(?:_\w+)?\b\s*(?:[:=(]|\??\s*:|\s(?:varchar|text|bytea|integer|int|numeric|date|timestamptz?|String|Int|DateTime|Float|Bytes|Column|Field))/i;
// Field-level markers only: a generic encrypt() helper elsewhere is not evidence for these fields.
const PROTECTED =
  /pgcrypto|pgp_sym_encrypt|\w+_encrypted\b|\bencrypted_\w+|@Encrypted\b|EncryptedField|EncryptedType|encrypted:\s*true|kms_key|tokeni[sz](?:ed|ation)|\bvault_?ref/i;

export const sensitiveFields: Rule = {
  id: 'p3.2/sensitive-fields',
  criterion: 'P3.2',
  title: 'Sensitive personal data has field-level protection',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['Enhanced protections'],
  expected:
    'Sensitive categories (government IDs, health, biometrics, precise location, date of birth, ...) are encrypted at field level or tokenized, beyond disk encryption.',
  risk: 'Sensitive data in plain columns is exposed to every query, backup, replica and analyst with database access.',
  remediation: {
    summary:
      'Encrypt sensitive fields at the application layer (envelope encryption with KMS) or tokenize them, and restrict access to the decrypting service.',
    example: `ALTER TABLE patients ADD COLUMN ssn_encrypted bytea;  -- pgp_sym_encrypt with a KMS-managed key`,
  },
  detect(ctx) {
    const files = personalDataFiles(ctx.files).filter(
      (f) => !isTestPath(f.path) && !isVendored(f.path),
    );
    const hit = findAny(ctx.files, files, SENSITIVE);
    if (!hit)
      return {
        status: 'not_applicable',
        justification: 'No sensitive personal-data categories were found in schemas or source.',
      };
    const protectedHit = findAny(ctx.files, files, PROTECTED);
    if (protectedHit)
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'file',
            ...protectedHit,
            description: 'Field-level encryption or tokenization is used for sensitive data.',
          },
        ],
      };
    return {
      status: 'fail',
      findings: [
        {
          path: hit.path,
          line: hit.line,
          title: 'Sensitive personal data without field-level protection',
          observed: `${hit.path} defines a sensitive field at line ${hit.line}, and no field-level encryption or tokenization was found.`,
          key: hit.path,
        },
      ],
    };
  },
};
