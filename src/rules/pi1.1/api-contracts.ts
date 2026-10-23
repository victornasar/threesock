import type { Rule } from '../../engine/types.js';
import { isTestPath, isVendored } from '../lib/languages.js';
import { usesAny } from '../lib/deps.js';
import { detectWebApp } from '../lib/web.js';

const CODE_FIRST =
  /@nestjs\/swagger|fastapi|drf-spectacular|drf-yasg|flask-smorest|apispec|zod-openapi|@asteasolutions\/zod-to-openapi|tsoa|swaggo|huma|@hono\/zod-openapi|graphql|@trpc\/server|connectrpc|grpc/i;

export const apiContracts: Rule = {
  id: 'pi1.1/api-contracts',
  criterion: 'PI1.1',
  title: 'API contracts are published and versioned',
  tags: ['CODE', 'DOCS'],
  severity: 'low',
  redFlag: false,
  checks: ['API contracts published and versioned'],
  expected:
    'The API has a machine-readable contract (OpenAPI, GraphQL schema, protobuf) kept in the repository or generated from code.',
  risk: 'Without a contract, clients and the service disagree about inputs and outputs, and breaking changes go unnoticed.',
  remediation: {
    summary:
      'Commit an OpenAPI document (or GraphQL schema / .proto files), or generate one from code, and version it.',
    example: `openapi: 3.1.0
info: { title: Orders API, version: 2.3.0 }
paths: { /v2/orders: { get: { ... } } }`,
  },
  detect(ctx) {
    if (!detectWebApp(ctx.files))
      return { status: 'not_applicable', justification: 'No HTTP service found.' };
    const files = ctx.files.files.filter((f) => !isTestPath(f.path) && !isVendored(f.path));
    const spec = files.find(
      (f) =>
        /\.(?:graphqls?|gql|proto)$/.test(f.path) ||
        /(?:openapi|swagger)[^/]*\.(?:ya?ml|json)$/i.test(f.path),
    );
    if (spec)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', path: spec.path, description: 'API contract file.' }],
      };
    const code = usesAny(ctx.files, CODE_FIRST);
    if (code)
      return {
        status: 'pass',
        evidence: [{ kind: 'file', ...code, description: 'API contract generated from code.' }],
      };
    return {
      status: 'fail',
      findings: [
        {
          title: 'No API contract',
          observed:
            'The repository serves an API but has no OpenAPI, GraphQL or protobuf contract.',
          key: 'missing',
        },
      ],
    };
  },
};
