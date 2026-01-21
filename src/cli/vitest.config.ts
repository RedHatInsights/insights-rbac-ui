import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use happy-dom for better ESM compatibility
    environment: 'happy-dom',

    // ONLY include CLI tests - be very specific
    include: ['src/cli/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Root directory - project root
    root: path.resolve(__dirname, '../..'),

    // Setup files relative to project root
    setupFiles: ['src/cli/setupTests.ts'],

    // Global APIs
    globals: true,

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 30000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: 'coverage/cli',
      // Only measure coverage for CLI source files
      include: ['src/cli/**/*.{ts,tsx}'],
      exclude: [
        'src/cli/**/__tests__/**',
        'src/cli/**/*.test.{ts,tsx}',
        'src/cli/setupTests.ts',
        'src/cli/test-utils.tsx',
        'src/cli/mocks/**',
        'src/cli/vitest.config.ts',
      ],
    },

    // Server configuration for dependency handling
    server: {
      deps: {
        // Inline these ESM packages
        inline: ['msw', 'ink', 'ink-testing-library', 'yoga-wasm-web'],
      },
    },
  },
  resolve: {
    alias: {
      // Resolve .js extensions to their actual source files
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
  },
});
