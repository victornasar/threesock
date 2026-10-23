#!/usr/bin/env node
// Writes docs/site/rules.md from the built rule registry. Run via `pnpm gen:docs`.
import { writeFileSync } from 'node:fs';
const { renderRulesReference } = await import('../dist/docs/rules-reference.js');
writeFileSync(new URL('../docs/site/rules.md', import.meta.url), renderRulesReference());
console.log('Wrote docs/site/rules.md');
