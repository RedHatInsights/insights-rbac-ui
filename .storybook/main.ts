import { createMainConfig } from '@redhat-cloud-services/hcc-storybook-hub/config';
import remarkGfm from 'remark-gfm';

const config = createMainConfig({
  stories: ['../src/docs/*.mdx', '../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../static'],
  remarkPlugins: [remarkGfm],
  a11y: false,
  extraWebpackRules: [
    // Add raw loader for YAML files with ?raw query
    {
      resourceQuery: /raw/,
      type: 'asset/source',
    },
  ],
});

// rbac-ui uses a portal container for modals in Storybook
config.previewBody = () => '<div id="chrome-app-render-root"></div><div id="storybook-modals"></div>';

export default config;
