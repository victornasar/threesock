import type { Rule } from '../../engine/types.js';
import { isProductionSource } from '../lib/languages.js';
import { usesAny } from '../lib/deps.js';
import { findAny } from '../util.js';

const QUEUES =
  /"(?:bullmq|bull|bee-queue|agenda|@aws-sdk\/client-sqs|kafkajs|amqplib|@temporalio\/client|pg-boss|graphile-worker|inngest|@trigger\.dev\/sdk)"|\bcelery\b|\brq\b|\bdramatiq\b|\barq\b|asynq|machinery|aws_sqs_queue/i;
const RETRY =
  /attempts\s*:|backoff|retries|retry(?:Policy|_policy|Limit)?|max_retries|maxRetries|autoretry_for|deadLetter|dead_letter|redrive_policy|DLQ/i;

export const jobRetries: Rule = {
  id: 'pi1.3/job-retries',
  criterion: 'PI1.3',
  title: 'Background jobs have bounded retries and a dead-letter path',
  tags: ['CODE', 'CONFIG'],
  severity: 'medium',
  redFlag: false,
  checks: ['Explicit timeouts, retry limits, and dead-letter queues'],
  expected:
    'Jobs and consumers set retry limits with backoff, and failed work lands in a dead-letter queue that is monitored.',
  risk: 'Failed jobs are dropped silently or retried forever, losing or duplicating work.',
  remediation: {
    summary:
      'Configure attempts and backoff on every queue, and route exhausted messages to a dead-letter queue.',
    example: `await queue.add('send-invoice', data, { attempts: 5, backoff: { type: 'exponential', delay: 1000 } });`,
  },
  detect(ctx) {
    const queue =
      usesAny(ctx.files, QUEUES) ??
      (ctx.files.glob('**/*.tf').some((f) => /aws_sqs_queue/.test(ctx.files.read(f.path) ?? ''))
        ? { path: 'terraform', line: 0 }
        : undefined);
    if (!queue)
      return {
        status: 'not_applicable',
        justification: 'No job queues or message consumers found.',
      };
    const hit = findAny(
      ctx.files,
      ctx.files.files.filter((f) => isProductionSource(f) || f.path.endsWith('.tf')),
      RETRY,
    );
    if (hit)
      return {
        status: 'pass',
        evidence: [
          {
            kind: 'file',
            ...hit,
            description: 'Retry limits or dead-letter handling are configured.',
          },
        ],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'Jobs have no retry limits or dead-letter queue',
          observed:
            'Job queues are used, but no retry limits, backoff or dead-letter configuration was found.',
          key: 'missing',
        },
      ],
    };
  },
};
