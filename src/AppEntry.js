import React from 'react';
import { Provider } from 'react-redux';
import registry, { RegistryContext } from './utilities/store';
import App from './App';

const InsightsRbac = () => (
  <RegistryContext.Provider
    value={{
      getRegistry: () => registry,
    }}
  >
    <Provider store={registry.getStore()}>
      <App />
    </Provider>
  </RegistryContext.Provider>
);

export default InsightsRbac;
