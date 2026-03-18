// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
const storybook = require('eslint-plugin-storybook');

/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path');
const { includeIgnoreFile } = require('@eslint/compat');
const { defineConfig } = require('eslint/config');
const fecPlugin = require('@redhat-cloud-services/eslint-config-redhat-cloud-services');
const tsParser = require('@typescript-eslint/parser');
const tseslint = require('@typescript-eslint/eslint-plugin');
const testingLibrary = require('eslint-plugin-testing-library');
const requireUseTableState = require('./eslint-rules/require-use-table-state');
const noDirectGetUser = require('./eslint-rules/no-direct-get-user');
const noCrossVersionImports = require('./eslint-rules/no-cross-version-imports');
const noDirectUserType = require('./eslint-rules/no-direct-user-type');
const enforceStoryPatterns = require('./eslint-rules/enforce-story-patterns');

module.exports = defineConfig(
  fecPlugin,
  // Respect .gitignore patterns (e.g. dist, test-results, playwright-report, etc.)
  includeIgnoreFile(path.resolve(__dirname, '.gitignore')),
  // Additional ignores not covered by .gitignore
  {
    ignores: ['e2e/_TEMPLATE.spec.ts'],
  },
  {
    languageOptions: {
      globals: {
        insights: 'readonly',
      },
    },
    rules: {
      requireConfigFile: 'off',
      // Disable prettier/prettier from fecPlugin - it runs the entire Prettier engine
      // per file inside ESLint, taking ~73% of total lint time. Run Prettier separately instead.
      'prettier/prettier': 'off',
      'sort-imports': [
        'error',
        {
          ignoreDeclarationSort: true,
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/test/**'],
    plugins: {
      'rbac-local': {
        rules: {
          'require-use-table-state': requireUseTableState,
          'no-direct-get-user': noDirectGetUser,
          'no-cross-version-imports': noCrossVersionImports,
          'no-direct-user-type': noDirectUserType,
          'enforce-story-patterns': enforceStoryPatterns,
        },
      },
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/test/**', 'src/**/*.stories.tsx', 'src/user-journeys/**', 'src/cli/**'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'react/prop-types': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 1,
      // Ban TableView used without useTableState to prevent hand-rolled state bugs
      'rbac-local/require-use-table-state': 'error',
      'rbac-local/no-direct-get-user': 'error',
      'rbac-local/no-cross-version-imports': 'error',
      // Ban direct use of Link from react-router-dom - use AppLink or ExternalLink instead
      // Ban direct use of platform hooks - use semantic wrappers instead
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-router-dom',
              importNames: ['Link', 'useNavigate'],
              message:
                'Import AppLink from src/components/navigation/AppLink for links. Use useAppNavigate from src/shared/hooks/useAppNavigate for programmatic navigation.',
            },
            {
              name: '@redhat-cloud-services/frontend-components/useChrome',
              message: 'Use usePlatformEnvironment, usePlatformAuth, or usePlatformTracking from src/hooks/ instead.',
            },
            {
              name: '@redhat-cloud-services/frontend-components-utilities/RBACHook',
              message: 'Use useAccessPermissions from src/hooks/ instead.',
            },
          ],
          patterns: [
            {
              group: [
                '@redhat-cloud-services/rbac-client',
                '@redhat-cloud-services/rbac-client/*',
                '@redhat-cloud-services/javascript-clients-shared',
                '@redhat-cloud-services/javascript-clients-shared/*',
                '@redhat-cloud-services/host-inventory-client',
                '@redhat-cloud-services/host-inventory-client/*',
              ],
              message:
                'Import API clients and types from the data layer (src/*/data/api/) instead of directly from @redhat-cloud-services client packages.',
            },
          ],
        },
      ],
      // Enforce appendTo={getModalContainer()} on Modal components to ensure proper portal rendering
      // Also enforce use of pathnames.ts for navigation links
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXOpeningElement[name.name="Modal"]:not(:has(JSXAttribute[name.name="appendTo"][value.type="JSXExpressionContainer"][value.expression.type="CallExpression"][value.expression.callee.name="getModalContainer"]))',
          message: 'Modal must have appendTo={getModalContainer()} prop for proper portal rendering in Storybook and production.',
        },
        {
          // Detect hardcoded paths in JSX `to` prop: to="/..." or to='/...'
          // Excludes ExternalLink component which is meant for external paths
          selector: 'JSXOpeningElement[name.name!="ExternalLink"] > JSXAttribute[name.name="to"][value.type="Literal"][value.value=/^\\/(?!http)/]',
          message:
            'Hardcoded paths are not allowed. Use pathnames from src/utilities/pathnames.ts instead (e.g., pathnames.users.link()). For external paths, use <ExternalLink>.',
        },
        {
          // Detect hardcoded paths in JSX `to` prop using template literals: to={`/...`}
          // Excludes ExternalLink component which is meant for external paths
          selector: 'JSXOpeningElement[name.name!="ExternalLink"] > JSXAttribute[name.name="to"] > JSXExpressionContainer > TemplateLiteral',
          message:
            'Hardcoded paths (template literals) are not allowed. Use pathnames from src/utilities/pathnames.ts instead (e.g., pathnames["user-detail"].link(id)). For external paths, use <ExternalLink>.',
        },
        {
          // Detect hardcoded paths in navigate() calls: navigate("/...") or navigate('/...')
          // Uses descendant selector (space) to catch paths nested in expressions like: navigate(x || "/path")
          selector: 'CallExpression[callee.name="navigate"] Literal[value=/^\\/(?!http)/]',
          message:
            'Hardcoded paths in navigate() are not allowed. Use pathnames from src/utilities/pathnames.ts instead. For external paths, use useExternalLink hook.',
        },
        {
          // Detect hardcoded paths in navigate() calls using template literals: navigate(`/...`)
          // Uses descendant selector (space) to catch paths nested in expressions like: navigate(x || `/path/${id}`)
          selector: 'CallExpression[callee.name="navigate"] TemplateLiteral',
          message:
            'Hardcoded paths (template literals) in navigate() are not allowed. Use pathnames from src/utilities/pathnames.ts instead. For external paths, use useExternalLink hook.',
        },
        {
          // Forbid <a> tags with relative paths - use <AppLink> or <ExternalLink> instead
          // Allow <a> tags for external URLs (http/https)
          selector: 'JSXOpeningElement[name.name="a"]:not(:has(JSXAttribute[name.name="href"][value.value=/^https?:/]))',
          message:
            'Do not use <a> tags for internal paths. Use <AppLink> for internal links or <ExternalLink> for external platform paths. Only <a> is allowed for external URLs (https://).',
        },
        {
          // Forbid window.location.href assignments
          selector: 'AssignmentExpression[left.object.object.name="window"][left.object.property.name="location"][left.property.name="href"]',
          message: 'Do not use window.location.href. Use useExternalLink().navigate() for external navigation.',
        },
      ],
    },
  },
  // V1: ban imports from V2
  {
    files: ['src/v1/**/*.ts', 'src/v1/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-router-dom',
              importNames: ['Link', 'useNavigate'],
              message:
                'Import AppLink from src/components/navigation/AppLink for links. Use useAppNavigate from src/shared/hooks/useAppNavigate for programmatic navigation.',
            },
            {
              name: '@redhat-cloud-services/frontend-components/useChrome',
              message: 'Use usePlatformEnvironment, usePlatformAuth, or usePlatformTracking from src/hooks/ instead.',
            },
            {
              name: '@redhat-cloud-services/frontend-components-utilities/RBACHook',
              message: 'Use useAccessPermissions from src/hooks/ instead.',
            },
          ],
          patterns: [
            {
              group: ['**/v2/**'],
              message: 'V1 code cannot import from V2. Move shared code to src/shared/.',
            },
            {
              group: [
                '@redhat-cloud-services/rbac-client',
                '@redhat-cloud-services/rbac-client/*',
                '@redhat-cloud-services/javascript-clients-shared',
                '@redhat-cloud-services/javascript-clients-shared/*',
                '@redhat-cloud-services/host-inventory-client',
                '@redhat-cloud-services/host-inventory-client/*',
              ],
              message:
                'Import API clients and types from the data layer (src/*/data/api/) instead of directly from @redhat-cloud-services client packages.',
            },
          ],
        },
      ],
    },
  },
  // V2: ban imports from V1 (except V2 data wrappers in src/v2/data/queries/)
  {
    files: ['src/v2/**/*.ts', 'src/v2/**/*.tsx'],
    ignores: ['src/v2/data/queries/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-router-dom',
              importNames: ['Link', 'useNavigate'],
              message:
                'Import AppLink from src/components/navigation/AppLink for links. Use useAppNavigate from src/shared/hooks/useAppNavigate for programmatic navigation.',
            },
            {
              name: '@redhat-cloud-services/frontend-components/useChrome',
              message: 'Use usePlatformEnvironment, usePlatformAuth, or usePlatformTracking from src/hooks/ instead.',
            },
            {
              name: '@redhat-cloud-services/frontend-components-utilities/RBACHook',
              message: 'Use useAccessPermissions from src/hooks/ instead.',
            },
          ],
          patterns: [
            {
              group: ['**/v1/**'],
              message: 'V2 code cannot import from V1. Use V2 data wrappers in src/v2/data/queries/ instead.',
            },
            {
              group: [
                '@redhat-cloud-services/rbac-client',
                '@redhat-cloud-services/rbac-client/*',
                '@redhat-cloud-services/javascript-clients-shared',
                '@redhat-cloud-services/javascript-clients-shared/*',
                '@redhat-cloud-services/host-inventory-client',
                '@redhat-cloud-services/host-inventory-client/*',
              ],
              message:
                'Import API clients and types from the data layer (src/*/data/api/) instead of directly from @redhat-cloud-services client packages.',
            },
          ],
        },
      ],
    },
  },
  {
    // Allow direct platform imports in wrapper components and semantic hooks
    files: [
      'src/shared/components/navigation/AppLink.tsx',
      'src/shared/components/navigation/AppTabs.tsx',
      'src/shared/components/navigation/ExternalLink.tsx',
      'src/shared/hooks/useAppNavigate.ts',
      'src/shared/hooks/useExternalLink.ts',
      'src/shared/hooks/usePlatformEnvironment.ts',
      'src/shared/hooks/usePlatformAuth.ts',
      'src/shared/hooks/usePlatformTracking.ts',
      'src/v1/hooks/useAccessPermissions.ts',
      // Hooks that read identity directly from Chrome
      'src/v2/hooks/useOrganizationData.ts',
      // QuickStarts files need direct chrome access
      'src/shared/utilities/quickstartsTestButtons.tsx',
      'src/v1/features/quickstarts/QuickstartsTest.tsx',
      // Data layer API files are the ONLY place that may import from @redhat-cloud-services client packages
      'src/**/data/api/**',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // Story files need TypeScript parser but don't need the strict navigation rules
    files: ['src/**/*.stories.tsx'],
    ignores: ['src/user-journeys/**'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'react/prop-types': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 1,
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'msw',
              importNames: ['http'],
              message:
                'Do not define inline MSW handlers in stories. Import handler factories from src/*/data/mocks/ instead. See AGENTS.md rule 15.',
            },
            {
              name: 'msw',
              importNames: ['delay'],
              message:
                'Do not import delay from msw in feature stories. Use findBy* queries or waitFor with assertions instead. See AGENTS.md rule 19.',
            },
          ],
          patterns: [
            {
              group: [
                '@redhat-cloud-services/rbac-client',
                '@redhat-cloud-services/rbac-client/*',
                '@redhat-cloud-services/javascript-clients-shared',
                '@redhat-cloud-services/javascript-clients-shared/*',
                '@redhat-cloud-services/host-inventory-client',
                '@redhat-cloud-services/host-inventory-client/*',
              ],
              message:
                'Import API clients and types from the data layer (src/*/data/api/) instead of directly from @redhat-cloud-services client packages.',
            },
          ],
        },
      ],
      // Enforce play function patterns from AGENTS.md rules 19, 22
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.object.name="document"][callee.property.name="querySelector"]',
          message:
            'document.querySelector is banned in play functions. Use within() + role/text queries, or extract a shared interaction helper. See AGENTS.md rule 19.',
        },
        {
          selector: 'CallExpression[callee.object.name="document"][callee.property.name="querySelectorAll"]',
          message:
            'document.querySelectorAll is banned in play functions. Use within() + role/text queries, or extract a shared interaction helper. See AGENTS.md rule 19.',
        },
        {
          selector: 'CallExpression[callee.object.name="document"][callee.property.name="getElementById"]',
          message:
            'document.getElementById is banned in play functions. Use within() + role/text queries, or extract a shared interaction helper. See AGENTS.md rule 19.',
        },
        {
          selector: 'CallExpression[callee.object.object.name="document"][callee.object.property.name="body"][callee.property.name="querySelector"]',
          message:
            'document.body.querySelector is banned in play functions. Use within(document.body) + role/text queries, or extract a shared interaction helper. See AGENTS.md rule 19.',
        },
        {
          selector:
            'CallExpression[callee.object.object.name="document"][callee.object.property.name="body"][callee.property.name="querySelectorAll"]',
          message:
            'document.body.querySelectorAll is banned in play functions. Use within(document.body) + role/text queries, or extract a shared interaction helper. See AGENTS.md rule 19.',
        },
        {
          selector: 'CallExpression[callee.name="delay"]',
          message:
            'delay() is banned in play functions (except inside resetStoryState). Use findBy* queries or waitFor with assertions instead. See AGENTS.md rule 19.',
        },
      ],
    },
  },
  {
    // User journey shared helpers/handlers (.ts) - ban magic timeouts only
    files: ['src/user-journeys/**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 1,
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@redhat-cloud-services/rbac-client',
                '@redhat-cloud-services/rbac-client/*',
                '@redhat-cloud-services/javascript-clients-shared',
                '@redhat-cloud-services/javascript-clients-shared/*',
                '@redhat-cloud-services/host-inventory-client',
                '@redhat-cloud-services/host-inventory-client/*',
              ],
              message:
                'Import API clients and types from the data layer (src/*/data/api/) instead of directly from @redhat-cloud-services client packages.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Property[key.name="timeout"][value.type="Literal"][value.raw=/^\\d+$/]',
          message:
            'Magic numbers in timeout are not allowed. Use TEST_TIMEOUTS constants from src/user-journeys/_shared/helpers/testUtils.ts instead.',
        },
        {
          selector: 'CallExpression[callee.property.name="waitForTimeout"] > Literal[raw=/^\\d+$/]',
          message:
            'Magic numbers in waitForTimeout are not allowed. Use TEST_TIMEOUTS constants from src/user-journeys/_shared/helpers/testUtils.ts instead.',
        },
      ],
    },
  },
  {
    // User journey story files (.tsx) - ban magic timeouts + play function patterns
    files: ['src/user-journeys/**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'react/prop-types': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 1,
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@redhat-cloud-services/rbac-client',
                '@redhat-cloud-services/rbac-client/*',
                '@redhat-cloud-services/javascript-clients-shared',
                '@redhat-cloud-services/javascript-clients-shared/*',
                '@redhat-cloud-services/host-inventory-client',
                '@redhat-cloud-services/host-inventory-client/*',
              ],
              message:
                'Import API clients and types from the data layer (src/*/data/api/) instead of directly from @redhat-cloud-services client packages.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Property[key.name="timeout"][value.type="Literal"][value.raw=/^\\d+$/]',
          message:
            'Magic numbers in timeout are not allowed. Use TEST_TIMEOUTS constants from src/user-journeys/_shared/helpers/testUtils.ts instead.',
        },
        {
          selector: 'CallExpression[callee.property.name="waitForTimeout"] > Literal[raw=/^\\d+$/]',
          message:
            'Magic numbers in waitForTimeout are not allowed. Use TEST_TIMEOUTS constants from src/user-journeys/_shared/helpers/testUtils.ts instead.',
        },
        {
          selector: 'CallExpression[callee.object.name="document"][callee.property.name="querySelector"]',
          message:
            'document.querySelector is banned in play functions. Use within() + role/text queries, or extract a shared interaction helper. See AGENTS.md rule 19.',
        },
        {
          selector: 'CallExpression[callee.object.name="document"][callee.property.name="querySelectorAll"]',
          message:
            'document.querySelectorAll is banned in play functions. Use within() + role/text queries, or extract a shared interaction helper. See AGENTS.md rule 19.',
        },
        {
          selector: 'CallExpression[callee.object.name="document"][callee.property.name="getElementById"]',
          message:
            'document.getElementById is banned in play functions. Use within() + role/text queries, or extract a shared interaction helper. See AGENTS.md rule 19.',
        },
        {
          selector: 'CallExpression[callee.object.object.name="document"][callee.object.property.name="body"][callee.property.name="querySelector"]',
          message:
            'document.body.querySelector is banned in play functions. Use within(document.body) + role/text queries, or extract a shared interaction helper. See AGENTS.md rule 19.',
        },
        {
          selector:
            'CallExpression[callee.object.object.name="document"][callee.object.property.name="body"][callee.property.name="querySelectorAll"]',
          message:
            'document.body.querySelectorAll is banned in play functions. Use within(document.body) + role/text queries, or extract a shared interaction helper. See AGENTS.md rule 19.',
        },
        // delay() is NOT banned here — user-journey stories legitimately use delay() from msw
        // inside inline handlers (permitted per AGENTS.md rule 15 exception for stateful journeys).
        // Feature stories ban the import itself via no-restricted-imports.
      ],
    },
  },
  {
    // Config, CLI, and Storybook TypeScript files
    files: ['config/**/*.ts', 'src/cli/**/*.ts', 'src/cli/**/*.tsx', '.storybook/**/*.ts', '.storybook/**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 1,
    },
  },
  {
    // E2E test files - ban magic numbers in timeouts
    files: ['e2e/**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 1,
      // Ban magic numbers in timeouts - use E2E_TIMEOUTS constants instead
      'no-restricted-syntax': [
        'error',
        {
          // Catches: { timeout: 5000 }
          selector: 'Property[key.name="timeout"][value.type="Literal"][value.raw=/^\\d+$/]',
          message: 'Magic numbers in timeout are not allowed. Use E2E_TIMEOUTS constants from e2e/utils/timeouts.ts instead.',
        },
        {
          // Catches: waitForTimeout(5000)
          selector: 'CallExpression[callee.property.name="waitForTimeout"] > Literal[raw=/^\\d+$/]',
          message: 'Magic numbers in waitForTimeout are not allowed. Use E2E_TIMEOUTS constants from e2e/utils/timeouts.ts instead.',
        },
      ],
    },
  },
  {
    // Inside your .eslintignore file
    ignores: ['!.storybook'],
  },
  {
    files: ['**/*.stories.@(js|jsx|ts|tsx)', '**/__tests__/**/*.@(js|jsx|ts|tsx)'],
    plugins: {
      'testing-library': testingLibrary,
    },
    rules: {
      'testing-library/prefer-find-by': 'error',
      // Ban findBy*/findAllBy* inside waitFor — creates double-retry where each
      // inner findBy failure logs a TestingLibraryElementError to console.error,
      // which failOnConsole catches = flake. Use queryBy* + expect instead.
      'testing-library/no-wait-for-side-effects': 'error',
      // Ban console.log/warn/error in play functions — failOnConsole can be
      // triggered by error-like content in logs, and debug noise has no CI value.
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  {
    // Ban direct user.type() in stories and test helpers — use clearAndType instead
    files: ['**/*.stories.@(js|jsx|ts|tsx)', 'src/**/*.helpers.@(ts|tsx)', 'src/test-utils/**/*.@(ts|tsx)'],
    rules: {
      'rbac-local/no-direct-user-type': 'error',
    },
  },
  {
    // Discouraged patterns in play functions — canvasElement.querySelector, getBy* inside waitFor
    files: ['**/*.stories.@(js|jsx|ts|tsx)'],
    rules: {
      'rbac-local/enforce-story-patterns': 'error',
    },
  },
  storybook.configs['flat/recommended'],
);
