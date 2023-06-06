const path = require('path');

module.exports = {
  appUrl: ['/iam/my-user-access', '/settings/rbac', '/iam', '/iam/user-access'],
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
  _unstableHotReload: process.env.HOT === 'true',
  moduleFederation: {
    exposes: {
      './MyUserAccess': path.resolve(__dirname, './src/entries/MyUserAccess.js'),
      './IamUserAccess': path.resolve(__dirname, './src/entries/IamUserAccess.js'),
    },
    exclude: ['react-router-dom'],
    shared: [
      {
        'react-router-dom': {
          singleton: true,
          import: false,
          requiredVersion: '^6.9.0',
        },
      },
    ],
  },
};
