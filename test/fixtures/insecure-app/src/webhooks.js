// Fixture: unsigned webhook handling and unbounded jobs.
import { Queue } from 'bullmq';

const emails = new Queue('emails');

export function register(app) {
  app.post('/webhooks/stripe', async (req, res) => {
    await emails.add('receipt', req.body);
    res.sendStatus(200);
  });
}
