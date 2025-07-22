import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    "../src/docs/*.mdx",
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-docs",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {}
  },
  docs: {
    defaultName: 'Documentation',
  },
  staticDirs: ['../static'],
  webpackFinal: async (config) => {
    // Mock hooks for Storybook - replace real implementations with our context-aware versions
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '@redhat-cloud-services/frontend-components/useChrome': path.resolve(process.cwd(), 'src/test/storybook-hooks/useChrome'),
        '@unleash/proxy-client-react': path.resolve(process.cwd(), 'src/test/storybook-hooks/unleash'),
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
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
};

module.exports = config;