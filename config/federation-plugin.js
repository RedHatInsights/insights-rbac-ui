const { ModuleFederationPlugin } = require('webpack').container;
const pkg = require('../package.json');
const {
  dependencies,
  insights: { appname },
} = pkg;

module.exports = new ModuleFederationPlugin({
  name: appname,
  filename: `${appname}.[chunkhash].js`,
  library: { type: 'var', name: appname },
  exposes: {
    './RootApp': './src/AppEntry',
  },
  shared: [
    { react: { singleton: true, requiredVersion: dependencies.react } },
    { 'react-dom': { singleton: true, requiredVersion: dependencies['react-dom'] } },
    { 'react-router-dom': { singleton: true, requiredVersion: dependencies['react-router-dom'] } },
    { '@patternfly/react-table': { singleton: true, requiredVersion: dependencies['@patternfly/react-table'] } },
    { '@patternfly/react-core': { singleton: true, requiredVersion: dependencies['@patternfly/react-core'] } },
    { 'react-redux': { singleton: true, requiredVersion: dependencies['react-redux'] } },
  ],
});
