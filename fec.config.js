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
      // Application entry point
      './Iam': path.resolve(__dirname, './src/federated-modules/Iam.tsx'),
      // Shared modules (self-contained with providers)
      './modules/CreateWorkspaceWizard': path.resolve(__dirname, './src/federated-modules/CreateWorkspaceWizard.tsx'),
      './modules/WorkspaceSelector': path.resolve(__dirname, './src/federated-modules/WorkspaceSelector.tsx'),
    },
    exclude: ['react-router-dom'],
    shared: [{ 'react-router-dom': { singleton: true, version: '^6.18.0', requiredVersion: '*' } }],
  },
};
