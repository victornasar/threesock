import type { Rule } from '../../engine/types.js';
import { isProductionSource } from '../lib/languages.js';
import { findAny } from '../util.js';

const HANDLER =
  /['"`]\/(?:api\/)?(?:v\d\/)?(?:webhooks?|hooks)(?:\/|['"`])|@(?:app|router)\.(?:post|route)\(\s*['"]\/(?:api\/)?webhooks?|\bhandleWebhook\b|\bwebhook_handler\b/i;
const VERIFIED =
  /constructEvent|verifySignature|verify_signature|verifyWebhook|validateRequest|timingSafeEqual|compare_digest|hmac\.Equal|@octokit\/webhooks|\bsvix\b|standardwebhooks|x-hub-signature|stripe-signature|x-slack-signature|svix-signature/i;

export const webhookSignatures: Rule = {
  id: 'cc6.7/webhook-signatures',
  criterion: 'CC6.7',
  title: 'Incoming webhooks verify their signatures',
  tags: ['CODE'],
  severity: 'high',
  redFlag: false,
  checks: ['Webhooks and callbacks are signed and verified'],
  expected:
    'Every webhook handler verifies the sender signature over the raw body, with a constant-time comparison, before acting.',
  risk: 'Unsigned webhooks let anyone forge events such as "payment succeeded" or "user verified".',
  remediation: {
    summary:
      'Verify the provider signature with its SDK (or an HMAC over the raw body with timingSafeEqual) before processing.',
    example: `const event = stripe.webhooks.constructEvent(rawBody, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);`,
  },
  detect(ctx) {
    const source = ctx.files.files.filter((f) => isProductionSource(f));
    const handler = findAny(ctx.files, source, HANDLER);
    if (!handler) return { status: 'not_applicable', justification: 'No webhook handlers found.' };
    const verified = findAny(ctx.files, source, VERIFIED);
    if (verified)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...verified, description: 'Webhook signatures are verified.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          path: handler.path,
          line: handler.line,
          title: 'Webhook handler without signature verification',
          observed: `${handler.path} handles webhooks at line ${handler.line}, but no signature verification was found.`,
          key: handler.path,
        },
      ],
    };
  },
};
