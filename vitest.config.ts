import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * One test run for every package. `@pleasenobugs/core` is pointed at its
 * source rather than its build, so the server's tests never run against a
 * stale `dist/` from before the change being tested.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@pleasenobugs/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts'],
    environment: 'node',
  },
});
