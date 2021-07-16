import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import registry, { RegistryContext } from './utilities/store';
import App from './App';
import { getBaseName } from '@redhat-cloud-services/frontend-components-utilities/helpers';

const InsightsRbac = () => (
  <RegistryContext.Provider
    value={{
      getRegistry: () => registry,
    }}
  >
    <Provider store={registry.getStore()}>
      <Router basename={getBaseName(location.pathname, 2).includes('rbac') ? getBaseName(location.pathname, 2) : getBaseName(location.pathname, 1)}>
        <App />
      </Router>
    </Provider>
  </RegistryContext.Provider>
);

export default InsightsRbac;
