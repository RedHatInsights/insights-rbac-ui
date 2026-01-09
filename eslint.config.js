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
    ignores: ['src/test/**'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'react/prop-types': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/no-explicit-any': 1,
      // Enforce appendTo={getModalContainer()} on Modal components to ensure proper portal rendering
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXOpeningElement[name.name="Modal"]:not(:has(JSXAttribute[name.name="appendTo"][value.type="JSXExpressionContainer"][value.expression.type="CallExpression"][value.expression.callee.name="getModalContainer"]))',
          message: 'Modal must have appendTo={getModalContainer()} prop for proper portal rendering in Storybook and production.',
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
    },
  },
  storybook.configs['flat/recommended'],
);
