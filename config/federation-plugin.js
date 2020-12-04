const { resolve } = require('path');

const moduleFederationPlugin = require('@redhat-cloud-services/frontend-components-config/federated-modules')({
  root: resolve(__dirname, '../'),
});

module.exports = moduleFederationPlugin;
