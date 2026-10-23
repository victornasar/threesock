import type { Rule } from '../../engine/types.js';
import { isProductionSource } from '../lib/languages.js';
import { scanLines } from '../lib/code-patterns.js';
import { findAny } from '../util.js';

const STRONG =
  /\b(?:bcrypt|bcryptjs|argon2|argon2id|scrypt|@node-rs\/argon2|@node-rs\/bcrypt|passlib|golang\.org\/x\/crypto\/(?:bcrypt|argon2|scrypt)|hashpw|PasswordHasher)\b/;
const MANIFESTS = ['package.json', 'requirements.txt', 'pyproject.toml', 'Pipfile', 'go.mod'];

export const passwordHashing: Rule = {
  id: 'cc6.1/password-hashing',
  criterion: 'CC6.1',
  title: 'Passwords hashed with Argon2id, bcrypt or scrypt',
  tags: ['CODE'],
  severity: 'high',
  redFlag: false, // set per finding
  checks: ['**Credentials:**'],
  expected:
    'Passwords are hashed with Argon2id, bcrypt or scrypt (rubric 1.4). Fast hashes such as MD5, SHA-1 or SHA-256 are never used for passwords.',
  risk: 'Fast hashes can be brute-forced at billions of guesses per second, so a database leak becomes a credential leak.',
  remediation: {
    summary:
      'Hash passwords with Argon2id (preferred), bcrypt or scrypt through a maintained library, and rehash on next login when migrating.',
    example: `import argon2 from 'argon2';
const hash = await argon2.hash(password, { type: argon2.argon2id });
const ok = await argon2.verify(hash, candidate);`,
  },
  detect(ctx) {
    const source = ctx.files.files.filter((f) => isProductionSource(f));
    const weak = scanLines(ctx, source, [
      {
        languages: ['js', 'python', 'go'],
        re: /(?:md5|sha1|sha256|sha512|createHash\(\s*['"](?:md5|sha1|sha256|sha512)['"]\s*\))[^\n]{0,80}\bpass(?:word|wd)\b|\bpass(?:word|wd)\b[^\n]{0,80}(?:\bmd5\b|\bsha1\b|hashlib\.sha|createHash\(\s*['"](?:md5|sha1|sha256))/i,
        label: 'Password hashed with a fast, general-purpose hash function',
        redFlag: true,
      },
    ]);
    if (weak.length) return { status: 'fail', findings: weak };

    const manifests = ctx.files.files.filter((f) =>
      MANIFESTS.some((m) => f.path === m || f.path.endsWith(`/${m}`)),
    );
    const strong = findAny(ctx.files, [...manifests, ...source], STRONG);
    if (strong) {
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'file',
            ...strong,
            description: `A recommended password hashing library is used (${strong.path}).`,
          },
        ],
      };
    }
    const handlesPasswords = findAny(
      ctx.files,
      source,
      /\b(?:hash|verify|compare|check)_?[Pp]assword\b|\bpassword_?hash\b|\bpasswordHash\b/,
    );
    if (!handlesPasswords) {
      return {
        status: 'not_applicable',
        justification:
          'No password hashing or verification code found; authentication may be delegated to an identity provider.',
      };
    }
    return {
      status: 'unknown',
      reason: `Password handling found (${handlesPasswords.path}:${handlesPasswords.line}) but no recognised Argon2id, bcrypt or scrypt library. Confirm the algorithm manually.`,
    };
  },
};
