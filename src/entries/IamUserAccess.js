import React from 'react';
import { Provider } from 'react-redux';
import registry, { RegistryContext } from '../utilities/store';
import App from '../App';
import { IntlProvider } from 'react-intl';
import messages from '../locales/data.json';

export const locale = 'en';

const IamUserAccess = () => (
  <IntlProvider locale={locale} messages={messages[locale]}>
    <RegistryContext.Provider
      value={{
        getRegistry: () => registry,
      }}
    >
      <Provider store={registry.getStore()}>
        <App />
      </Provider>
    </RegistryContext.Provider>
  </IntlProvider>
);

export default IamUserAccess;
