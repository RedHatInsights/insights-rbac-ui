import type { Preview } from '@storybook/react-webpack5';
import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/patternfly/patternfly-addons.css';
import React from 'react';
import { createPortal } from 'react-dom';
import { IntlProvider } from 'react-intl';
import { QueryClientSetup } from '../src/components/QueryClientSetup';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import messages from '../src/locales/data.json';
import { locale } from '../src/locales/locale';
import PermissionsContext from '../src/utilities/permissionsContext';
import { type FeatureFlagsConfig, FeatureFlagsProvider } from './context-providers';
import { type Environment, StorybookMockProvider } from './contexts/StorybookMockContext';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { ServiceProvider, createBrowserServices } from '../src/services';
import { ApiErrorProvider } from '../src/contexts/ApiErrorContext';

// Wrapper that provides all providers for component stories (non-journey)
// This must be inside NotificationsProvider to access useAddNotification
// Includes: ApiErrorProvider → ServiceProvider → QueryClientSetup
const ComponentProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const addNotification = useAddNotification();
  const services = createBrowserServices(addNotification);

  return (
    <ApiErrorProvider>
      <ServiceProvider value={services}>
        <QueryClientSetup testMode>
          {typeof document !== 'undefined' && createPortal(<ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />, document.body)}
          {children}
        </QueryClientSetup>
      </ServiceProvider>
    </ApiErrorProvider>
  );
};

const preview: Preview = {
  beforeAll: async () => {
    initialize({ onUnhandledRequest: 'error' });
  },
  loaders: [mswLoader],
  parameters: {
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['Documentation', 'Federated Modules', 'User Journeys', 'Features', 'Components', '*'],
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
    // Default permission flags (can be overridden per story)
    // Note: for explicit permission arrays, use parameters.permissions = ['rbac:*:*'] etc.
    orgAdmin: false,
    userAccessAdministrator: false,
    chrome: {
      environment: 'prod',
    },
    featureFlags: {
      'platform.rbac.itless': false,
    },
    // NOTE: Kessel access checks use workspacePermissions (all 6 relations → workspace ID arrays)
    // e.g., workspacePermissions: { view: ['ws-1'], edit: ['ws-1'], delete: [], create: ['ws-1'], move: [], rename: [] }
  },
  decorators: [
    (Story, { parameters, args }) => {
      // Derive mock state from story args/parameters
      // Support both legacy object format (parameters.permissions.orgAdmin) and direct params
      const legacyPermissions = typeof parameters.permissions === 'object' && !Array.isArray(parameters.permissions) ? parameters.permissions : {};
      const isOrgAdmin = args.orgAdmin ?? legacyPermissions.orgAdmin ?? parameters.orgAdmin ?? false;
      const userAccessAdministrator =
        args.userAccessAdministrator ?? legacyPermissions.userAccessAdministrator ?? parameters.userAccessAdministrator ?? false;

      // Permissions for PermissionsContext (legacy - orgAdmin/userAccessAdministrator flags)
      const permissionsContextValue = {
        userAccessAdministrator,
        orgAdmin: isOrgAdmin,
      };

      // Permissions: prefer explicit array from args or parameters, fallback to deriving from legacy flags
      // Supports any app permissions (rbac:*, inventory:*, etc.)
      // Check args first (for stories with decorators that modify parameters), then parameters
      const permissions: string[] = Array.isArray(args.permissions)
        ? args.permissions
        : Array.isArray(parameters.permissions)
          ? parameters.permissions
          : Array.isArray(parameters.rbacPermissions)
            ? parameters.rbacPermissions
            : isOrgAdmin || userAccessAdministrator
              ? ['rbac:*:*']
              : [];

      // Environment mapping - check explicit story parameter first, then chrome.environment
      // Story-level parameters.environment takes precedence over default chrome.environment
      const environment: Environment =
        parameters.environment === 'staging'
          ? 'staging'
          : parameters.environment === 'production' || parameters.chrome?.environment === 'prod'
            ? 'production'
            : 'staging';

      // Workspace permissions for Kessel stories (all 6 relations)
      const workspacePermissions = parameters.workspacePermissions ?? { view: [], edit: [], delete: [], create: [], move: [], rename: [] };

      // User identity for auth.getUser() - use userIdentity parameter
      const userIdentity = parameters.userIdentity;

      const featureFlags: FeatureFlagsConfig = {
        'platform.rbac.itless': false,
        ...parameters.featureFlags,
        // Override with args if provided (for interactive controls)
        ...(args['platform.rbac.itless'] !== undefined && { 'platform.rbac.itless': args['platform.rbac.itless'] }),
        ...(args['platform.rbac.workspaces'] !== undefined && { 'platform.rbac.workspaces': args['platform.rbac.workspaces'] }),
        ...(args['platform.rbac.workspaces-organization-management'] !== undefined && {
          'platform.rbac.workspaces-organization-management': args['platform.rbac.workspaces-organization-management'],
        }),
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

      // Journey stories set noWrapping: true and provide their own providers via Iam
      // This allows them to test the full production component tree
      if (parameters.noWrapping) {
        return (
          <StorybookMockProvider
            environment={environment}
            isOrgAdmin={isOrgAdmin}
            permissions={permissions}
            workspacePermissions={workspacePermissions}
            userIdentity={userIdentity}
          >
            <FeatureFlagsProvider value={featureFlags}>
              <Story />
            </FeatureFlagsProvider>
          </StorybookMockProvider>
        );
      }

      // Component stories get full provider wrapping (QueryClient, ServiceProvider, etc.)
      return (
        <StorybookMockProvider
          environment={environment}
          isOrgAdmin={isOrgAdmin}
          permissions={permissions}
          workspacePermissions={workspacePermissions}
          userIdentity={userIdentity}
        >
          <FeatureFlagsProvider value={featureFlags}>
            <PermissionsContext.Provider value={permissionsContextValue}>
              <IntlProvider locale={locale} messages={messages[locale]}>
                <NotificationsProvider>
                  <ComponentProviders>
                    <Story />
                  </ComponentProviders>
                </NotificationsProvider>
              </IntlProvider>
            </PermissionsContext.Provider>
          </FeatureFlagsProvider>
        </StorybookMockProvider>
      );
    },
  ],
};

export default preview;
