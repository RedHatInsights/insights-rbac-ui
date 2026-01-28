import type { Preview } from '@storybook/react-webpack5';
import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/patternfly/patternfly-addons.css';
import React, { Fragment, useState } from 'react';
import { createPortal } from 'react-dom';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';
import messages from '../src/locales/data.json';
import { locale } from '../src/locales/locale';
import PermissionsContext from '../src/utilities/permissionsContext';
import { ChromeProvider, FeatureFlagsProvider, AccessCheckProvider_, type ChromeConfig, type FeatureFlagsConfig, type AccessCheckConfig } from './context-providers';
import { initialize, mswLoader } from 'msw-storybook-addon';

// Create a fresh QueryClient for each story to prevent state leaking
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests/stories
        staleTime: 0, // Always refetch - required for stories that test API calls after interactions
      },
      mutations: {
        retry: false,
      },
    },
  });


// Wrapper that provides a fresh QueryClient for each story to prevent state leaking
const QueryClientWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(() => createTestQueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      {typeof document !== 'undefined' && createPortal(
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />,
        document.body
      )}
      {children}
    </QueryClientProvider>
  );
};


// Mock insights global for Storybook
declare global {
  var insights: {
    chrome: {
      getEnvironment: () => string;
    };
  };
}

// Mock global insights object for libraries that access it directly (e.g. RBACHook)
const mockInsightsChrome = {
  getEnvironment: () => 'prod',
  getUserPermissions: () => Promise.resolve([
    { permission: 'inventory:hosts:read', resourceDefinitions: [] },
    { permission: 'inventory:hosts:write', resourceDefinitions: [] },
    { permission: 'inventory:groups:write', resourceDefinitions: [] },
    { permission: 'cost-management:*:*', resourceDefinitions: [] },
    { permission: 'rbac:*:*', resourceDefinitions: [] },
  ]),
  auth: {
    getUser: () => Promise.resolve({
      identity: {
        user: {
          username: 'test-user',
          email: 'test@redhat.com',
          is_org_admin: true,
          is_internal: false,
        },
      },
    }),
    getToken: () => Promise.resolve('mock-jwt-token-12345'),
  },
};

if (typeof global !== 'undefined') {
  (global as any).insights = { chrome: mockInsightsChrome };
} else if (typeof window !== 'undefined') {
  (window as any).insights = { chrome: mockInsightsChrome };
}

const preview: Preview = {
  beforeAll: async () => {
    initialize({ onUnhandledRequest: 'error' });
  },
  loaders: [mswLoader],
  parameters: {
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['User Journeys', '*'],
      },
    },
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
    // Default Kessel access check config - user can edit and create everywhere
    accessCheck: {
      canEdit: () => true,
      canCreate: () => true,
    },
  },
  decorators: [
    (Story, { parameters, args }) => {
      const permissions = {
        userAccessAdministrator: false,
        orgAdmin: false,
        ...parameters.permissions,
        // Override with args if provided (for interactive controls)
        ...(args.orgAdmin !== undefined && { orgAdmin: args.orgAdmin }),
        ...(args.userAccessAdministrator !== undefined && { userAccessAdministrator: args.userAccessAdministrator }),
      };

      // Merge chrome config from parameters (may include full Chrome API from createDynamicEnvironment)
      // with any arg overrides
      const chromeConfig: ChromeConfig = {
        environment: 'prod',
        ...parameters.chrome, // This may include getUserPermissions, auth, etc. from createDynamicEnvironment
        // Override with args if provided (for interactive controls)
        ...(args.environment !== undefined && { environment: args.environment }),
      };

      const featureFlags: FeatureFlagsConfig = {
        'platform.rbac.itless': false,
        ...parameters.featureFlags,
        // Override with args if provided (for interactive controls)
        ...(args['platform.rbac.itless'] !== undefined && { 'platform.rbac.itless': args['platform.rbac.itless'] }),
        ...(args['platform.rbac.workspaces'] !== undefined && { 'platform.rbac.workspaces': args['platform.rbac.workspaces'] }),
        ...(args['platform.rbac.workspaces-list'] !== undefined && { 'platform.rbac.workspaces-list': args['platform.rbac.workspaces-list'] }),
        ...(args['platform.rbac.workspace-hierarchy'] !== undefined && {
          'platform.rbac.workspace-hierarchy': args['platform.rbac.workspace-hierarchy'],
        }),
        ...(args['platform.rbac.workspaces-role-bindings'] !== undefined && {
          'platform.rbac.workspaces-role-bindings': args['platform.rbac.workspaces-role-bindings'],
        }),
        ...(args['platform.rbac.workspaces-role-bindings-write'] !== undefined && {
          'platform.rbac.workspaces-role-bindings-write': args['platform.rbac.workspaces-role-bindings-write'],
        }),
        ...(args['platform.rbac.group-service-accounts'] !== undefined && {
          'platform.rbac.group-service-accounts': args['platform.rbac.group-service-accounts'],
        }),
        ...(args['platform.rbac.group-service-accounts.stable'] !== undefined && {
          'platform.rbac.group-service-accounts.stable': args['platform.rbac.group-service-accounts.stable'],
        }),
        ...(args['platform.rbac.common-auth-model'] !== undefined && { 'platform.rbac.common-auth-model': args['platform.rbac.common-auth-model'] }),
        ...(args['platform.rbac.common.userstable'] !== undefined && { 'platform.rbac.common.userstable': args['platform.rbac.common.userstable'] }),
        ...(args['platform.rbac.workspaces-eligible'] !== undefined && {
          'platform.rbac.workspaces-eligible': args['platform.rbac.workspaces-eligible'],
        }),
      };

      // Kessel access check configuration
      const accessCheckConfig: AccessCheckConfig = {
        canEdit: () => true, // Default: user can edit everything
        canCreate: () => true, // Default: user can create everywhere
        ...parameters.accessCheck,
        // Override with args if provided
        ...(args.canEdit !== undefined && { canEdit: args.canEdit }),
        ...(args.canCreate !== undefined && { canCreate: args.canCreate }),
      };

      return (
        <QueryClientWrapper>
          <ChromeProvider value={chromeConfig}>
            <FeatureFlagsProvider value={featureFlags}>
              <AccessCheckProvider_ value={accessCheckConfig}>
                <PermissionsContext.Provider value={permissions}>
                  <IntlProvider locale={locale} messages={messages[locale]}>
                    <Fragment>
                      <NotificationsProvider>
                        <Story />
                      </NotificationsProvider>
                    </Fragment>
                  </IntlProvider>
                </PermissionsContext.Provider>
              </AccessCheckProvider_>
            </FeatureFlagsProvider>
          </ChromeProvider>
        </QueryClientWrapper>
      );
    },
  ],
};

export default preview;
