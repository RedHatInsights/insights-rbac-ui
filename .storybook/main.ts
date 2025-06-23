import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-docs"
  ],
  "framework": {
    "name": "@storybook/react-webpack5",
    "options": {}
  },
  webpackFinal: async (config) => {
    // Mock hooks for Storybook - replace real implementations with our context-aware versions
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '@redhat-cloud-services/frontend-components/useChrome': path.resolve(__dirname, '../src/test/storybook-hooks/useChrome'),
        '@unleash/proxy-client-react': path.resolve(__dirname, '../src/test/storybook-hooks/unleash'),
      },
    };

    // Add SCSS support
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Add SCSS rule
    config.module.rules.push({
      test: /\.s[ac]ss$/i,
      use: [
        'style-loader',
        'css-loader',
        'sass-loader',
      ],
    });

    return config;
  },
};
export default config;