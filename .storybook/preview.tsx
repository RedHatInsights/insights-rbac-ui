import type { Preview } from '@storybook/react-webpack5';
import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/patternfly/patternfly-addons.css';
import React, { Fragment } from 'react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import NotificationPortal from '@redhat-cloud-services/frontend-components-notifications/NotificationPortal/';
import messages from '../src/locales/data.json';
import { locale } from '../src/locales/locale';
import PermissionsContext from '../src/utilities/permissionsContext';
import { registryFactory, RegistryContext } from '../src/utilities/store';
import { 
  ChromeProvider, 
  FeatureFlagsProvider,
  type ChromeConfig,
  type FeatureFlagsConfig
} from './context-providers';
import { initialize, mswLoader } from 'msw-storybook-addon';

// Mock insights global for Storybook
declare global {
  var insights: {
    chrome: {
      getEnvironment: () => string;
    };
  };
}

if (typeof global !== 'undefined') {
  (global as any).insights = {
    chrome: {
      getEnvironment: () => 'prod',
    },
  };
} else if (typeof window !== 'undefined') {
  (window as any).insights = {
    chrome: {
      getEnvironment: () => 'prod',
    },
  };
}

const preview: Preview = {
  beforeAll: async () => {
    initialize({ onUnhandledRequest: 'error' });
  },
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    parameters: {
      // Sets the delay (in milliseconds) at the component level for all stories.
      chromatic: { delay: 300 },
    },
    actions: { argTypesRegex: '^on.*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Default configurations for all stories (can be overridden per story)
    permissions: {
      userAccessAdministrator: false,
      orgAdmin: false,
    },
    chrome: {
      environment: 'prod',
    },
    featureFlags: {
      'platform.rbac.itless': false,
    },
  },
  decorators: [
    // 👇 Combined context decorator - reads from story parameters and args
    (Story, { parameters, args }) => {
      const registry = registryFactory();

      const permissions = {
        userAccessAdministrator: false,
        orgAdmin: false,
        ...parameters.permissions,
        // Override with args if provided (for interactive controls)
        ...(args.orgAdmin !== undefined && { orgAdmin: args.orgAdmin }),
        ...(args.userAccessAdministrator !== undefined && { userAccessAdministrator: args.userAccessAdministrator }),
      };
      
      const chromeConfig: ChromeConfig = {
        environment: 'prod',
        ...parameters.chrome,
        // Override with args if provided (for interactive controls)
        ...(args.environment !== undefined && { environment: args.environment }),
      };
      
      const featureFlags: FeatureFlagsConfig = {
        'platform.rbac.itless': false,
        ...parameters.featureFlags,
        // Override with args if provided (for interactive controls)
        ...(args['platform.rbac.itless'] !== undefined && { 'platform.rbac.itless': args['platform.rbac.itless'] }),
      };
      
      return (
        <RegistryContext.Provider
          value={{
            getRegistry: () => registry,
          }}
        >
          <Provider store={registry.getStore()}>
            <ChromeProvider value={chromeConfig}>
              <FeatureFlagsProvider value={featureFlags}>
                <PermissionsContext.Provider value={permissions}>
                  <IntlProvider locale={locale} messages={messages[locale]}>
                    <Fragment>
                      <NotificationPortal />
                      <Story />
                    </Fragment>
                  </IntlProvider>
                </PermissionsContext.Provider>
              </FeatureFlagsProvider>
            </ChromeProvider>
          </Provider>
        </RegistryContext.Provider>
      );
    },
  ],
};

export default preview;
