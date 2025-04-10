const path = require('path');

module.exports = {
  appUrl: ['/iam/my-user-access', '/iam', '/iam/user-access'],
  debug: true,
  useProxy: true,
  proxyVerbose: true,
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
      './MyUserAccess': path.resolve(__dirname, './src/entries/MyUserAccess.js'),
      './IamUserAccess': path.resolve(__dirname, './src/entries/IamUserAccess.js'),
      './CreateWorkspaceWizard': path.resolve(__dirname, './src/smart-components/workspaces/create-workspace/CreateWorkspaceWizard.tsx'),
    },
    exclude: ['react-router-dom'],
    shared: [{ 'react-router-dom': { singleton: true, version: '^6.18.0', requiredVersion: '*' } }],
  },
};
