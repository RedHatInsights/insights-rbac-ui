import React from 'react';
import { Provider } from 'react-redux';
import { RegistryContext, getRegistry } from '../utilities/store';
import App from '../App';
import { IntlProvider } from 'react-intl';
import messages from '../locales/data.json';

export const locale = 'en';

const IamUserAccess = () => {
  // Always get the current registry instance (supports resetRegistry() in Storybook)
  const registry = getRegistry();

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <RegistryContext.Provider
        value={{
          getRegistry,
        }}
      >
        <Provider store={registry.getStore()}>
          <App />
        </Provider>
      </RegistryContext.Provider>
    </IntlProvider>
  );
};

export default IamUserAccess;
