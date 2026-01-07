import React, { Fragment } from 'react';
import { Provider } from 'react-redux';
import { RegistryContext, getRegistry } from './utilities/store';
import App from './App';
import { IntlProvider } from 'react-intl';
import messages from './locales/data.json';
import { locale } from './locales/locale';
import NotificationPortal from '@redhat-cloud-services/frontend-components-notifications/NotificationPortal';

const InsightsRbac: React.FunctionComponent<{ withNotificationPortal?: boolean }> = ({ withNotificationPortal = true }) => {
  // Always get the current registry instance (supports resetRegistry() in Storybook)
  const registry = getRegistry();
  const NotificationPortalMaybe = withNotificationPortal ? NotificationPortal : Fragment;

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <RegistryContext.Provider
        value={{
          getRegistry,
        }}
      >
        <Provider store={registry.getStore()}>
          <NotificationPortalMaybe>
            <App />
          </NotificationPortalMaybe>
        </Provider>
      </RegistryContext.Provider>
    </IntlProvider>
  );
};

export default InsightsRbac;
