import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Resolves to the package root from both src/ (tests) and dist/ (published build).
const pkg = require('../package.json') as { version: string };

export const VERSION: string = pkg.version;
