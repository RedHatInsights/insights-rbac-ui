// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
const storybook = require('eslint-plugin-storybook');

/* eslint-disable @typescript-eslint/no-require-imports */
const { defineConfig } = require('eslint/config');
const fecPlugin = require('@redhat-cloud-services/eslint-config-redhat-cloud-services');
const tsParser = require('@typescript-eslint/parser');
const tseslint = require('@typescript-eslint/eslint-plugin');
const testingLibrary = require('eslint-plugin-testing-library');

module.exports = defineConfig(
  fecPlugin,
  {
    languageOptions: {
      globals: {
        insights: 'readonly',
      },
    },
    ignores: ['node_modules/*', 'dist/*', 'src/test/**'],
    rules: {
      requireConfigFile: 'off',
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
    ignores: ['src/test/**', 'src/**/*.stories.tsx', 'src/user-journeys/**', 'src/features/myUserAccess/useBundleApps.ts', 'src/cli/**'],
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
      // Ban direct use of Link from react-router-dom - use AppLink or ExternalLink instead
      // Ban direct use of platform hooks - use semantic wrappers instead
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-router-dom',
              importNames: ['Link'],
              message: 'Import AppLink from src/components/navigation/AppLink or ExternalLink from src/components/navigation/ExternalLink instead.',
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
  {
    // Allow direct platform imports in wrapper components and semantic hooks
    files: [
      'src/components/navigation/AppLink.tsx',
      'src/components/navigation/ExternalLink.tsx',
      'src/hooks/usePlatformEnvironment.ts',
      'src/hooks/usePlatformAuth.ts',
      'src/hooks/usePlatformTracking.ts',
      'src/hooks/useAccessPermissions.ts',
      // QuickStarts files need direct chrome access
      'src/utilities/quickstartsTestButtons.tsx',
      'src/features/quickstarts/QuickstartsTest.tsx',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // Routing.tsx: Forbid hardcoded permissions - must use p() helper from route-definitions.ts
    files: ['src/Routing.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Property[key.name="permissions"][value.type="ArrayExpression"]',
          message:
            'Do not hardcode permissions in Routing.tsx. Use ...p(path) spread from route-definitions.ts to get permissions from the single source of truth.',
        },
      ],
    },
  },
  {
    // Story files need TypeScript parser but don't need the strict navigation rules
    files: ['src/**/*.stories.tsx', 'src/user-journeys/**/*.tsx', 'src/user-journeys/**/*.ts'],
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
    },
  },
  {
    // Config, E2E, CLI, and Storybook TypeScript files
    files: ['config/**/*.ts', 'e2e/**/*.ts', 'src/cli/**/*.ts', 'src/cli/**/*.tsx', '.storybook/**/*.ts', '.storybook/**/*.tsx'],
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
    },
  },
  storybook.configs['flat/recommended'],
);
