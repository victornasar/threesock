// Detects whether a repository serves HTTP, so web-only checks can report
// not applicable for libraries and CLIs instead of failing them.
import type { FileIndex } from '../../engine/types.js';
import { isTestPath, isVendored } from './languages.js';
import { findAny } from '../util.js';

const JS_FRAMEWORKS =
  /"(?:express|fastify|koa|hono|next|nuxt|@nestjs\/core|@sveltejs\/kit|@remix-run\/\w+|astro|@hapi\/hapi|restify|h3|elysia)"\s*:/;
const PY_FRAMEWORKS =
  /^\s*["']?(?:flask|django|fastapi|starlette|sanic|aiohttp|tornado|falcon|quart|litestar)\b/im;
const GO_SERVER =
  /http\.ListenAndServe|gin\.Default\(\)|echo\.New\(\)|fiber\.New\(|chi\.NewRouter\(\)|mux\.NewRouter\(\)/;

export interface WebApp {
  path: string;
  line: number;
  description: string;
}

const cache = new WeakMap<FileIndex, WebApp | null>();

export function detectWebApp(files: FileIndex): WebApp | undefined {
  if (cache.has(files)) return cache.get(files) ?? undefined;
  const prod = files.files.filter((f) => !isTestPath(f.path) && !isVendored(f.path));
  const js = findAny(
    files,
    prod.filter((f) => /(?:^|\/)package\.json$/.test(f.path)),
    JS_FRAMEWORKS,
  );
  const py = findAny(
    files,
    prod.filter((f) => /(?:^|\/)(?:requirements[^/]*\.txt|pyproject\.toml|Pipfile)$/.test(f.path)),
    PY_FRAMEWORKS,
  );
  const go = findAny(
    files,
    prod.filter((f) => f.path.endsWith('.go')),
    GO_SERVER,
  );
  const hit = js ?? py ?? go;
  const app = hit
    ? { ...hit, description: `HTTP server or web framework detected in ${hit.path}` }
    : undefined;
  cache.set(files, app ?? null);
  return app;
}
