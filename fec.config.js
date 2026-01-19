const path = require('path');

module.exports = {
  appUrl: ['/iam'],
  debug: true,
  useProxy: true,
  proxyVerbose: true,
  frontendCRDPath: path.resolve(__dirname, './deploy/frontend.yaml'),
  /**
   * Change to false after your app is registered in configuration files
   */
  interceptChromeConfig: false,
  /**
   * Add additional webpack plugins
   */
  plugins: [],
  chromeHost: process.env.FEC_CHROME_HOST ?? undefined,
  chromePort: process.env.FEC_CHROME_PORT ?? undefined,
  hotReload: process.env.HOT === 'true',
  moduleFederation: {
    exposes: {
      './Iam': path.resolve(__dirname, './src/Iam.tsx'),
      './CreateWorkspaceWizardModule': path.resolve(__dirname, './src/features/workspaces/create-workspace/CreateWorkspaceWizardModule.tsx'),
      './Workspaces/ManagedSelector': path.resolve(__dirname, './src/features/workspaces/components/managed-selector/ManagedSelector.tsx'),
      './Workspaces/WorkspaceSelector': path.resolve(
        __dirname,
        './src/features/workspaces/components/managed-selector/components/WorkspaceSelector.tsx',
      ),
    },
    exclude: ['react-router-dom'],
    shared: [{ 'react-router-dom': { singleton: true, version: '^6.18.0', requiredVersion: '*' } }],
  },
};
