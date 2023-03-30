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
      // TODO: Remove root app once CSC is updated
      './RootApp': path.resolve(__dirname, './src/AppEntry.js'),
      './SettingsUserAccess': path.resolve(__dirname, './src/entries/SettingsUserAccess.js'),
      './MyUserAccess': path.resolve(__dirname, './src/entries/MyUserAccess.js'),
      './IamUserAccess': path.resolve(__dirname, './src/entries/IamUserAccess.js'),
    },
  },
};
