import type { Rule } from '../../engine/types.js';
import { usesAny } from '../lib/deps.js';
import { detectWebApp } from '../lib/web.js';

const VALIDATORS =
  /\bzod\b|\bjoi\b|\byup\b|class-validator|\bajv\b|valibot|superstruct|@sinclair\/typebox|express-validator|celebrate|@vinejs\/vine|\bpydantic\b|fastapi|marshmallow|cerberus|wtforms|rest_framework|voluptuous|go-playground\/validator|ozzo-validation/i;

export const inputValidation: Rule = {
  id: 'pi1.2/input-validation',
  criterion: 'PI1.2',
  title: 'Inputs are validated against schemas at the trust boundary',
  tags: ['CODE'],
  severity: 'medium',
  redFlag: false,
  checks: ['Schema validation at every trust boundary'],
  expected:
    'Request bodies, query parameters and webhook payloads are validated server-side with a schema library.',
  risk: 'Unvalidated input causes silent data corruption, crashes and injection, and lets clients send totals or IDs the server should compute.',
  remediation: {
    summary:
      'Validate every request with a schema (Zod, Pydantic, Joi, validator) and reject what does not match.',
    example: `const Order = z.object({ sku: z.string().min(1), quantity: z.number().int().positive().max(100) });
const order = Order.parse(req.body);`,
  },
  detect(ctx) {
    const app = detectWebApp(ctx.files);
    if (!app) return { status: 'not_applicable', justification: 'No HTTP service found.' };
    const hit = usesAny(ctx.files, VALIDATORS);
    if (hit)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...hit, description: 'A schema validation library is used.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          path: app.path,
          title: 'No schema validation library',
          observed: `${app.description}, but no schema validation library (Zod, Joi, Pydantic, validator, ...) is used.`,
          key: 'missing',
        },
      ],
    };
  },
};
