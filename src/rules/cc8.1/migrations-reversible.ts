import type { Evidence, RawFinding, Rule } from '../../engine/types.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { findDoc } from '../lib/docs.js';

const MIGRATION_DIR =
  /(?:^|\/)(?:migrations?|db\/migrate|alembic\/versions|prisma\/migrations|drizzle)\//;

export const migrationsReversible: Rule = {
  id: 'cc8.1/migrations-reversible',
  criterion: 'CC8.1',
  title: 'Database migrations are reversible or have a rollback plan',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['Database migrations are reviewed, tested, and reversible'],
  expected:
    'Each migration has a down/downgrade step, or the repository documents how schema changes are rolled back.',
  risk: 'A bad migration without a way back turns a deploy rollback into a data-recovery incident.',
  remediation: {
    summary:
      'Write a down migration for each change, or document the expand/contract and restore procedure used instead.',
    example: `-- 20261022_add_status.down.sql
ALTER TABLE orders DROP COLUMN status;`,
  },
  detect(ctx) {
    const files = ctx.files.files.filter(
      (f) => MIGRATION_DIR.test(f.path) && !isTestPath(f.path) && !isVendored(f.path),
    );
    if (files.length === 0)
      return { status: 'not_applicable', justification: 'No database migrations found.' };
    const findings: RawFinding[] = [];
    const evidence: Evidence[] = [];
    const ups = files.filter((f) => /\.up\.sql$/.test(f.path));
    for (const up of ups) {
      const down = up.path.replace(/\.up\.sql$/, '.down.sql');
      if (!ctx.files.has(down))
        findings.push({
          path: up.path,
          title: 'Migration without a down step',
          observed: `${up.path} has no matching ${down.split('/').pop()}.`,
          key: up.path,
        });
    }
    if (ups.length && findings.length === 0)
      evidence.push({
        kind: 'file',
        path: ups[0]?.path as string,
        description: `All ${ups.length} up migrations have down migrations.`,
      });
    for (const f of files.filter((f) => /\.(?:[cm]?[jt]s|py)$/.test(f.path))) {
      const text = ctx.files.read(f.path) ?? '';
      if (f.path.endsWith('.py')) {
        if (/def downgrade\(\)[^:]*:\s*(?:"""[\s\S]*?"""\s*)?pass\b/.test(text))
          findings.push({
            path: f.path,
            title: 'Alembic downgrade is empty',
            observed: `${f.path} defines downgrade() as pass.`,
            key: f.path,
          });
        else if (/RunPython\((?![^)]*reverse_code)/.test(text))
          findings.push({
            path: f.path,
            severity: 'low',
            title: 'Django data migration is irreversible',
            observed: `${f.path} calls RunPython without reverse_code.`,
            key: f.path,
          });
      } else if (
        /\bup\b\s*[:=(]|async up\s*\(|\bup\s*\(/.test(text) &&
        !/\bdown\b\s*[:=(]|async down\s*\(|\bdown\s*\(/.test(text)
      ) {
        findings.push({
          path: f.path,
          title: 'Migration without a down step',
          observed: `${f.path} defines up but no down.`,
          key: f.path,
        });
      }
    }
    if (findings.length) return { status: 'fail', findings, evidence };
    if (evidence.length) return { status: 'pass', evidence };
    // Forward-only tools (Prisma, Drizzle, plain SQL): accept a documented rollback plan.
    const plan = findDoc(
      ctx.files,
      /(?:roll ?back|revert)[^\n]{0,80}(?:migration|schema)|(?:migration|schema)[^\n]{0,80}(?:roll ?back|revert)|expand[/ -]contract/i,
    );
    if (plan)
      return {
        status: 'pass',
        evidence: [
          { kind: 'file', ...plan, description: 'Schema rollback procedure is documented.' },
        ],
      };
    return {
      status: 'unknown',
      reason: 'Migrations are forward-only and no schema rollback procedure was found in the docs.',
    };
  },
};
