import { Queue } from 'bullmq';

export const invoices = new Queue('invoices');

export function sendInvoice(data) {
  return invoices.add('send', data, { attempts: 5, backoff: { type: 'exponential', delay: 1000 } });
}
