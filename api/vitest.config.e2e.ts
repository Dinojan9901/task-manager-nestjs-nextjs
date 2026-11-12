import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Booting the Nest app can be slow on the first run (cold start).
    hookTimeout: 30_000,
  },
});
