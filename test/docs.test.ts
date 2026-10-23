import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { renderRulesReference } from '../src/docs/rules-reference.js';

it('docs/site/rules.md matches the rule registry (run `pnpm gen:docs`)', () => {
  expect(readFileSync('docs/site/rules.md', 'utf8')).toBe(renderRulesReference());
});
