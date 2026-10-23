import type { Rule } from '../../engine/types.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { findAny } from '../util.js';

const SCHEMA =
  /(?:^|\/)(?:migrations?|db|schema|sql)\/.*\.sql$|\.sql$|schema\.prisma$|(?:^|\/)models\.py$|(?:^|\/)models\/[^/]+\.py$/;
const CONSTRAINTS =
  /\bNOT NULL\b|\bUNIQUE\b|\bREFERENCES\b|\bFOREIGN KEY\b|\bCHECK\s*\(|@unique|@id\b|@relation|unique=True|null=False|nullable=False|ForeignKey\(|UniqueConstraint|CheckConstraint/;

export const dbConstraints: Rule = {
  id: 'pi1.5/db-constraints',
  criterion: 'PI1.5',
  title: 'Database schemas enforce integrity constraints',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['Database constraints enforce integrity'],
  expected:
    'Schemas declare NOT NULL, UNIQUE, foreign key and check constraints, so the database rejects invalid data even when application code misses it.',
  risk: 'Without constraints, a single bug writes orphaned or duplicate records that corrupt reports and billing.',
  remediation: {
    summary: 'Declare constraints in the schema for required fields, uniqueness and relationships.',
    example: `CREATE TABLE orders (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id),
  total_cents integer NOT NULL CHECK (total_cents >= 0)
);`,
  },
  detect(ctx) {
    const schemas = ctx.files.files.filter(
      (f) => SCHEMA.test(f.path) && !isTestPath(f.path) && !isVendored(f.path),
    );
    if (schemas.length === 0)
      return {
        status: 'not_applicable',
        justification: 'No database schema or migration files found.',
      };
    const hit = findAny(ctx.files, schemas, CONSTRAINTS);
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'Schemas declare integrity constraints.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          path: schemas[0]?.path,
          title: 'Schemas declare no integrity constraints',
          observed: `${schemas.length} schema or migration file(s) contain no NOT NULL, UNIQUE, foreign key or check constraints.`,
          key: 'missing',
        },
      ],
    };
  },
};
