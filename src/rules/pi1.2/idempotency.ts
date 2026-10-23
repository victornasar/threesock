import type { Rule } from '../../engine/types.js';
import { isProductionSource } from '../lib/languages.js';
import { findAny } from '../util.js';

const SENSITIVE =
  /\bstripe\b|paypal|braintree|adyen|checkout\.com|\bcharge\b|payment|webhook|\bpayout\b/i;
const IDEMPOTENT =
  /idempoten|Idempotency-Key|dedup(?:e|lication)?|ON CONFLICT DO NOTHING|already processed|processed_events/i;

export const idempotency: Rule = {
  id: 'pi1.2/idempotency',
  criterion: 'PI1.2',
  title: 'Payment and event ingestion is idempotent',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['Duplicate detection and idempotency keys'],
  expected:
    'Create, payment and message-ingest operations use idempotency keys or deduplication, so retries never double-apply.',
  risk: 'Retried webhooks and requests charge customers twice or create duplicate records.',
  remediation: {
    summary:
      'Send idempotency keys to payment providers and record processed event IDs before acting on webhooks.',
    example: `await stripe.paymentIntents.create(params, { idempotencyKey: order.id });
// Webhooks: INSERT INTO processed_events(id) VALUES ($1) ON CONFLICT DO NOTHING`,
  },
  detect(ctx) {
    const source = ctx.files.files.filter((f) => isProductionSource(f));
    const sensitive = findAny(ctx.files, source, SENSITIVE);
    if (!sensitive)
      return { status: 'not_applicable', justification: 'No payment or webhook processing found.' };
    const hit = findAny(ctx.files, source, IDEMPOTENT);
    if (hit)
      return {
        status: 'pass',
        evidence: [
          { kind: 'file', ...hit, description: 'Idempotency or deduplication is implemented.' },
        ],
      };
    return {
      status: 'unknown',
      reason: `Payment or webhook code found (${sensitive.path}:${sensitive.line}) but no idempotency keys or deduplication were recognised. Confirm retries cannot double-apply.`,
    };
  },
};
