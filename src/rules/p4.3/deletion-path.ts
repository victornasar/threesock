import type { Rule } from '../../engine/types.js';
import { isProductionSource } from '../lib/languages.js';
import { NO_PERSONAL_DATA, personalData } from '../lib/pii.js';
import { findAny } from '../util.js';

const DELETION =
  /delete_?account|deleteAccount|delete_?user|deleteUser|deleteMe|erase(?:User|_user|Account)|forget(?:User|Me)|anonymi[sz]e(?:User|_user)?|right[_ ]to[_ ]be[_ ]forgotten|\.delete\(\s*['"`]\/(?:api\/)?(?:v\d\/)?(?:me|account|users\/:\w+)['"`]|@(?:app|router)\.delete\(\s*['"]\/(?:me|account|users)/i;
const SOFT_DELETE = /\bdeleted_?at\b|\bis_?deleted\b|\bsoft_?delete|\bparanoid\s*:\s*true/i;
const PURGE =
  /purge|hard_?delete|hardDelete|destroy_?soft_?deleted|forceDelete|DELETE FROM\b[^;\n]*\b(?:deleted_?at|is_?deleted)\b|deleteMany\([^)]*deletedAt/i;

export const deletionPath: Rule = {
  id: 'p4.3/deletion-path',
  criterion: 'P4.3',
  title: 'Personal data can be deleted, and soft-deleted data is purged',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['Secure deletion or irreversible anonymization implemented'],
  expected:
    'An account or data deletion path exists (self-service or request-based), and records that are soft-deleted are purged after their retention period.',
  risk: 'Without a deletion path, erasure requests cannot be honoured on time; soft deletes that are never purged keep personal data forever.',
  remediation: {
    summary:
      'Implement deletion (or irreversible anonymization) for a data subject across all stores, and a scheduled job that purges soft-deleted rows.',
    example: `app.delete('/me', requireAuth, async (req, res) => {
  await accounts.eraseSubject(req.user.id); // primary DB, search index, analytics, vendors
  res.sendStatus(204);
});`,
  },
  detect(ctx) {
    const pd = personalData(ctx.files);
    if (!pd) return { status: 'not_applicable', justification: NO_PERSONAL_DATA };
    const source = ctx.files.files.filter(
      (f) => isProductionSource(f) || /\.sql$|\.prisma$/.test(f.path),
    );
    const deletion = findAny(ctx.files, source, DELETION);
    const soft = findAny(ctx.files, source, SOFT_DELETE);
    const purge = soft ? findAny(ctx.files, source, PURGE) : undefined;
    const findings = [];
    if (!deletion)
      findings.push({
        title: 'No personal data deletion path',
        observed: `The application stores personal data (e.g. ${pd.path}:${pd.line}), but no account deletion, erasure or anonymization code was found.`,
        key: 'no-deletion',
      });
    if (soft && !purge)
      findings.push({
        path: soft.path,
        line: soft.line,
        redFlag: true,
        title: 'Soft-deleted records are never purged',
        observed: `Soft deletion is used (${soft.path}:${soft.line}), but no job purges soft-deleted rows.`,
        key: 'soft-delete',
      });
    if (findings.length) return { status: 'fail', findings };
    const evidence = [
      {
        kind: 'file' as const,
        ...(deletion as { path: string; line: number }),
        description: 'A deletion or anonymization path exists.',
      },
    ];
    if (purge)
      evidence.push({ kind: 'file', ...purge, description: 'Soft-deleted rows are purged.' });
    return { status: 'pass', evidence };
  },
};
