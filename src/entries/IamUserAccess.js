import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import registry, { RegistryContext } from '../utilities/store';
import App from '../App';
import { getBaseName } from '@redhat-cloud-services/frontend-components-utilities/helpers';
import { IntlProvider } from 'react-intl';
import messages from '../locales/data.json';

export const locale = 'en';

// make sure basename is always /iam/user-access
const createBasename = () => `${getBaseName(location.pathname, 1)}/user-access`.replace('//', '/');

const IamUserAccess = () => (
  <IntlProvider locale={locale} messages={messages[locale]}>
    <RegistryContext.Provider
      value={{
        getRegistry: () => registry,
      }}
    >
      <Provider store={registry.getStore()}>
        <Router basename={createBasename()}>
          <App />
        </Router>
      </Provider>
    </RegistryContext.Provider>
  </IntlProvider>
);

export default IamUserAccess;
