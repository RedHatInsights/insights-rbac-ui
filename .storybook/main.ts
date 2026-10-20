import { createMainConfig } from '@redhat-cloud-services/hcc-storybook-hub/config';
import remarkGfm from 'remark-gfm';

// Hub 0.3+ defaults to the Vite framework, registers @storybook/addon-vitest,
// and applies the Chrome/RBACHook/Unleash/Kessel mock aliases via viteFinal —
// no local framework/alias overrides needed anymore.
const config = createMainConfig({
  stories: ['../src/docs/*.mdx', '../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../static'],
  remarkPlugins: [remarkGfm],
  a11y: false,
});

// rbac-ui uses a portal container for modals in Storybook (the hub's previewBody
// only provides #chrome-app-render-root)
config.previewBody = () => '<div id="chrome-app-render-root"></div><div id="storybook-modals"></div>';

export default config;
