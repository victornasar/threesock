import { Queue } from 'bullmq';

export const invoices = new Queue('invoices');

export function sendInvoice(data) {
  return invoices.add('send', data, { attempts: 5, backoff: { type: 'exponential', delay: 1000 } });
}

// Nightly retention: sessions are kept for 90 days.
export function purgeExpiredSessions(db) {
  return db.query("DELETE FROM sessions WHERE created_at < now() - interval '90 days'");
}
