import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  root: import.meta.dirname,
  // Unit tests must never read from or write to the production Supabase project.
  define: {
    'import.meta.env.VITE_ENABLE_DEMO_MODE': JSON.stringify('true'),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'supabase/functions/_shared/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Measure the application, not just pure helpers. Scoping this to src/utils
      // reported ~86% coverage of roughly 2% of the codebase while src/ sat at ~40%.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.*', 'src/test/**', 'src/vite-env.d.ts'],
      // Floors sit just under the measured baseline (lines 40.4 / statements 38.9 /
      // functions 30.4 / branches 31.4) so the gate locks in current coverage and
      // fails on regressions, rather than failing on the first run.
      thresholds: {
        lines: 38,
        functions: 29,
        statements: 37,
        branches: 30,
      },
    },
  },
});
