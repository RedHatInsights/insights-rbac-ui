import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use happy-dom for better ESM compatibility
    environment: 'happy-dom',

    // Test patterns - exclude CLI tests (they use their own config)
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', 'src/cli/**'],

    // Root directory
    root: '.',

    // Setup files
    setupFiles: ['./config/setupTests.ts'],

    // Global APIs (describe, test, expect, vi, etc.)
    globals: true,

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 30000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/test/**',
        'src/entry*.{ts,tsx,js}',
        'src/logout.{ts,tsx,js}',
        'src/cli/setupTests.ts',
        'src/cli/test-utils.tsx',
        'src/cli/mocks/**',
      ],
    },

    // Server configuration for dependency handling
    server: {
      deps: {
        // Inline ESM packages that cause issues
        inline: ['msw', 'ink', 'ink-testing-library', 'yoga-wasm-web', '@patternfly/react-core', '@patternfly/react-table'],
      },
    },
  },
  resolve: {
    alias: {
      // Handle .js extensions in imports (ESM)
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
  },
  css: {
    // Handle CSS/SCSS modules
    modules: {
      localsConvention: 'camelCase',
    },
  },
});
