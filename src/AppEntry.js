import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import registry, { RegistryContext } from './utilities/store';
import App from './App';
import { getBaseName } from '@redhat-cloud-services/frontend-components-utilities/helpers';
import { IntlProvider } from 'react-intl';
import messages from './locales/data.json';

export const locale = 'en';

const InsightsRbac = () => (
  <IntlProvider locale={locale} messages={messages[locale]}>
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
  </IntlProvider>
);

export default InsightsRbac;
