import type { Preview } from '@storybook/react-webpack5';
import '@patternfly/react-core/dist/styles/base.css';
import React from 'react';
import { IntlProvider } from 'react-intl';
import messages from '../src/locales/data.json';
import { locale } from '../src/locales/locale';
import PermissionsContext from '../src/utilities/permissions-context';
import { 
  ChromeProvider, 
  FeatureFlagsProvider,
  type ChromeConfig,
  type FeatureFlagsConfig
} from '../src/test/storybook-context-providers';

const preview: Preview = {
  parameters: {
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
        <ChromeProvider value={chromeConfig}>
          <FeatureFlagsProvider value={featureFlags}>
            <PermissionsContext.Provider value={permissions}>
              <IntlProvider locale={locale} messages={messages[locale]}>
                <Story />
              </IntlProvider>
            </PermissionsContext.Provider>
          </FeatureFlagsProvider>
        </ChromeProvider>
      );
    },
  ],
};

export default preview;
