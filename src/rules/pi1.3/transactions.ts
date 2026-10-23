import type { Rule } from '../../engine/types.js';
import { isProductionSource } from '../lib/languages.js';
import { usesAny } from '../lib/deps.js';
import { findAny } from '../util.js';

const DB =
  /"(?:pg|postgres|mysql2?|prisma|@prisma\/client|sequelize|typeorm|knex|drizzle-orm|mongoose|kysely|better-sqlite3)"|\bsqlalchemy\b|\bdjango\b|\bpsycopg|\basyncpg\b|\bpeewee\b|database\/sql|gorm\.io|\bsqlx\b|pgx/i;
const TX =
  /\.transaction\s*\(|\$transaction\s*\(|\bBEGIN\b|transaction\.atomic|@transaction\.atomic|session\.begin\(|with_transaction|\.Begin(?:Tx)?\s*\(|startTransaction|withTransaction|\.tx\s*\(/;

export const transactions: Rule = {
  id: 'pi1.3/transactions',
  criterion: 'PI1.3',
  title: 'Multi-step writes use transactions',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['Multi-step operations are transactional/atomic'],
  expected:
    'Operations that write several records do so atomically (database transactions) or with compensation (sagas).',
  risk: 'A failure halfway through leaves records inconsistent: an order without its payment, or a transfer debited but not credited.',
  remediation: {
    summary: 'Wrap related writes in a transaction.',
    example: `await prisma.$transaction([
  prisma.account.update({ where: { id: from }, data: { balance: { decrement: amount } } }),
  prisma.account.update({ where: { id: to }, data: { balance: { increment: amount } } }),
]);`,
  },
  detect(ctx) {
    if (!usesAny(ctx.files, DB))
      return { status: 'not_applicable', justification: 'No database client found.' };
    const hit = findAny(
      ctx.files,
      ctx.files.files.filter((f) => isProductionSource(f)),
      TX,
    );
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'Database transactions are used.' }],
      };
    return {
      status: 'unknown',
      reason:
        'A database client is used but no transactions were found. Single-statement writes may be fine; confirm multi-step operations are atomic.',
    };
  },
};
