import type { Preview } from '@storybook/react-webpack5';
import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/patternfly/patternfly-addons.css';
import '@redhat-cloud-services/hcc-storybook-hub/css/storybook.css';
import React, { useContext } from 'react';
import { type IntlConfig } from 'react-intl';
import { createPortal } from 'react-dom';
import { IntlMessagesProvider, preloadLocaleMessages } from '../src/shared/i18n/IntlMessagesProvider';
import { type LocaleMessages, loadLocaleMessages } from '../src/shared/i18n/localeCatalogs';
import { QueryClientSetup } from '../src/shared/components/QueryClientSetup';
import {
  type FeatureFlagsConfig,
  FeatureFlagsContext,
  FeatureFlagsProvider,
  StorybookMockProvider,
  deriveTenantPermissions,
  hccPreviewDefaults,
  useMockState,
} from '@redhat-cloud-services/hcc-storybook-hub';
import type { Environment } from '@redhat-cloud-services/hcc-storybook-hub';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { locale } from '../src/locales/locale';
import { ServiceProvider, createBrowserServices } from '../src/shared/services';
import type { AddNotificationFn } from '../src/shared/entry/browser';
import { ApiErrorProvider } from '../src/shared/contexts/ApiErrorContext';

// Storybook-only locale switcher (toolbar "Locale" or story-level `globals: { locale }`).
// Each option loads its own catalog; the partial zh-CN demo relies on descriptor defaultMessage fallbacks.
const storyCatalogLoaders: Record<string, () => Promise<LocaleMessages>> = {
  [locale]: () => loadLocaleMessages(locale),
  'zh-CN': async () => (await import('./locales/zh-CN.demo.json')).default,
};

const loadStoryCatalog = (selectedLocale: string): Promise<LocaleMessages> => storyCatalogLoaders[selectedLocale]?.() ?? loadLocaleMessages(locale);

const resolveStoryLocale = (selectedLocale: unknown): string =>
  typeof selectedLocale === 'string' && Object.hasOwn(storyCatalogLoaders, selectedLocale) ? selectedLocale : locale;

const handleStoryIntlError: NonNullable<IntlConfig['onError']> = (error) => {
  if (error.code !== 'MISSING_TRANSLATION') {
    console.error(error);
  }
};

// Wrapper that provides all providers for component stories (non-journey)
// This must be inside NotificationsProvider, StorybookMockProvider, and FeatureFlagsProvider
// to access useAddNotification, mock state, and feature flags.
const ComponentProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const addNotification = useAddNotification() as AddNotificationFn;
  const { environment, userIdentity } = useMockState();
  const featureFlags = useContext(FeatureFlagsContext);
  const isITLess = featureFlags['platform.rbac.itless'] ?? false;

  const services = createBrowserServices({
    addNotification,
    getToken: async () => 'mock-token',
    environment,
    ssoUrl: 'https://sso.redhat.com',
    identity: userIdentity
      ? { org_id: userIdentity.org_id, account_id: userIdentity.internal?.account_id }
      : { org_id: '12345', account_id: '54321' },
    isITLess,
  });

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
  ...hccPreviewDefaults,
  parameters: {
    ...hccPreviewDefaults.parameters,
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['Documentation', 'Federated Modules', 'User Journeys', 'Features', 'Components', '*'],
      },
    },
    parameters: {
      // Sets the delay (in milliseconds) at the component level for all stories.
      chromatic: { delay: 300 },
    },
    actions: { argTypesRegex: '^on.*' },
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
    // NOTE: Kessel access checks use workspacePermissions (all 5 relations → workspace ID arrays)
    // e.g., workspacePermissions: { view: ['ws-1'], edit: ['ws-1'], delete: [], create: ['ws-1'], move: [] }
  },
  globalTypes: {
    locale: {
      description: 'UI locale for component stories',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'zh-CN', title: '简体中文 (demo)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    locale,
  },
  loaders: [
    ...(hccPreviewDefaults.loaders ?? []),
    async ({ globals, parameters }) => {
      const storyLocale = parameters.noWrapping ? locale : resolveStoryLocale(globals.locale);
      await preloadLocaleMessages(storyLocale, loadStoryCatalog);
    },
  ],
  decorators: [
    (Story, { parameters, args, globals }) => {
      // Derive mock state from story args/parameters
      // Support both legacy object format (parameters.permissions.orgAdmin) and direct params
      const legacyPermissions = typeof parameters.permissions === 'object' && !Array.isArray(parameters.permissions) ? parameters.permissions : {};
      const isOrgAdmin = args.orgAdmin ?? legacyPermissions.orgAdmin ?? parameters.orgAdmin ?? false;
      const userAccessAdministrator =
        args.userAccessAdministrator ?? legacyPermissions.userAccessAdministrator ?? parameters.userAccessAdministrator ?? false;

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
        parameters.environment === 'stage'
          ? 'stage'
          : parameters.environment === 'production' || parameters.chrome?.environment === 'prod'
            ? 'production'
            : 'stage';

      // Workspace permissions for Kessel stories (all 5 relations)
      // Check args first (for stories with decorators that override permissions via args), then parameters
      const workspacePermissions = args.workspacePermissions ??
        parameters.workspacePermissions ?? { view: [], edit: [], delete: [], create: [], move: [] };

      // Tenant permissions for V2 domain hooks (Kessel tenant-scoped checks)
      // Auto-derive from Chrome permissions when not explicitly provided
      const explicitTenantPermissions = args.tenantPermissions ?? parameters.tenantPermissions;
      const tenantPermissions = explicitTenantPermissions ?? deriveTenantPermissions(permissions);

      const writableRoleIds: string[] | undefined = args.writableRoleIds ?? parameters.writableRoleIds;

      // User identity for auth.getUser() - use userIdentity parameter
      const userIdentity = parameters.userIdentity;

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
            tenantPermissions={tenantPermissions}
            writableRoleIds={writableRoleIds}
            userIdentity={userIdentity}
          >
            <FeatureFlagsProvider value={featureFlags}>
              <Story />
            </FeatureFlagsProvider>
          </StorybookMockProvider>
        );
      }

      // Component stories get full provider wrapping (QueryClient, ServiceProvider, etc.)
      const storyLocale = resolveStoryLocale(globals.locale);
      return (
        <StorybookMockProvider
          environment={environment}
          isOrgAdmin={isOrgAdmin}
          permissions={permissions}
          workspacePermissions={workspacePermissions}
          tenantPermissions={tenantPermissions}
          writableRoleIds={writableRoleIds}
          userIdentity={userIdentity}
        >
          <FeatureFlagsProvider value={featureFlags}>
            <IntlMessagesProvider
              locale={storyLocale}
              loadMessages={loadStoryCatalog}
              onError={storyLocale === 'zh-CN' ? handleStoryIntlError : undefined}
            >
              <NotificationsProvider>
                <ComponentProviders>
                  <Story />
                </ComponentProviders>
              </NotificationsProvider>
            </IntlMessagesProvider>
          </FeatureFlagsProvider>
        </StorybookMockProvider>
      );
    },
  ],
};

export default preview;
