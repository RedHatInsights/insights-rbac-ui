import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
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
  test: {
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
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          // Use happy-dom for better ESM compatibility
          environment: 'happy-dom',
          // Test patterns - exclude CLI tests (they use their own config)
          // .storybook tests cover storybook tooling (e.g. ICU validation of the pseudo-localization catalog)
          include: ['src/**/*.test.{ts,tsx}', '.storybook/**/*.test.{ts,tsx}'],
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
          // Server configuration for dependency handling
          server: {
            deps: {
              // Inline ESM packages that cause issues
              inline: ['msw', 'ink', 'ink-testing-library', 'yoga-wasm-web', '@patternfly/react-core', '@patternfly/react-table'],
            },
          },
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            // Parity with the retired test-runner's --excludeTags skip-test
            tags: { exclude: ['skip-test'] },
          }),
        ],
        test: {
          name: 'storybook',
          // The console guard ports the retired test-runner error policy.
          setupFiles: ['./.storybook/vitest.setup.ts'],
          testTimeout: 60_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            // Same viewport the retired runner forced for Chromatic parity.
            viewport: { width: 1200, height: 500 },
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
        },
      },
    ],
  },
});
