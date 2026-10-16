import { createMainConfig } from '@redhat-cloud-services/hcc-storybook-hub/config';
import { createRequire } from 'module';
import path from 'path';
import remarkGfm from 'remark-gfm';

const require = createRequire(import.meta.url);
const hubMocksDir = path.join(path.dirname(require.resolve('@redhat-cloud-services/hcc-storybook-hub/config')), 'mocks');

const config = createMainConfig({
  stories: ['../src/docs/*.mdx', '../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../static'],
  remarkPlugins: [remarkGfm],
  a11y: false,
  addons: ['@storybook/addon-vitest'],
});

// Vite framework (migrated from @storybook/react-webpack5 — see the Vitest addon
// requirements). The hub's createMainConfig still defaults to webpack5, so we
// override the framework pieces here until it grows a Vite option.
config.framework = { name: '@storybook/react-vite', options: {} };
// The SWC compiler addon is webpack-only; Vite compiles through its own pipeline.
config.addons = (config.addons as Array<string | { name: string }>).filter((addon) => addon !== '@storybook/addon-webpack5-compiler-swc');

// The hub mocks Chrome/RBACHook/Unleash/Kessel via webpack aliases. Vite needs
// the same mapping through resolve.alias (prefix-exact: no trailing regex needed,
// Vite matches these as exact-import aliases for bare specifiers).
config.viteFinal = async (viteConfig: { resolve?: { alias?: unknown[] } }) => {
  viteConfig.resolve = viteConfig.resolve ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viteConfig.resolve.alias = [
    ...(Array.isArray(viteConfig.resolve.alias) ? viteConfig.resolve.alias : []),
    { find: /^@redhat-cloud-services\/frontend-components\/useChrome$/, replacement: path.join(hubMocksDir, 'useChrome.js') },
    { find: /^@redhat-cloud-services\/frontend-components-utilities\/RBACHook$/, replacement: path.join(hubMocksDir, 'RBACHook.js') },
    { find: /^@unleash\/proxy-client-react$/, replacement: path.join(hubMocksDir, 'unleash.js') },
    { find: /^@project-kessel\/react-kessel-access-check$/, replacement: path.join(hubMocksDir, 'kesselAccessCheck.js') },
  ];
  return viteConfig;
};

// The webpack `?raw` rule is gone on purpose: Vite handles `import x from './file.yaml?raw'` natively.

// rbac-ui uses a portal container for modals in Storybook
config.previewBody = () => '<div id="chrome-app-render-root"></div><div id="storybook-modals"></div>';

export default config;
