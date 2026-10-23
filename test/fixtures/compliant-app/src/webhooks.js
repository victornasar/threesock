import Stripe from 'stripe';
import { z } from 'zod';
import { db } from './db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const Order = z.object({ sku: z.string().min(1), quantity: z.number().int().positive() });

export function register(app) {
  app.post('/webhooks/stripe', async (req, res) => {
    const event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
    const client = await db.connect();
    await client.query('BEGIN');
    const fresh = await client.query('INSERT INTO processed_events (id) VALUES ($1) ON CONFLICT DO NOTHING', [event.id]);
    await client.query('COMMIT');
    res.sendStatus(fresh.rowCount ? 200 : 208);
  });
  app.post('/orders', async (req, res) => {
    const order = Order.parse(req.body);
    const intent = await stripe.paymentIntents.create({ amount: 1000, currency: 'usd' }, { idempotencyKey: order.sku });
    res.json({ id: intent.id });
  });
}
