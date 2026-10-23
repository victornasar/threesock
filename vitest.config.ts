import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Tests import threesock-mcp's source, which imports `threesock`: use the source, not dist.
  resolve: { alias: { threesock: fileURLToPath(new URL('./src/index.ts', import.meta.url)) } },
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 20000,
  },
});
