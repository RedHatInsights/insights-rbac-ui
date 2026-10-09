import type { Preview } from '@storybook/react-webpack5';
import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/patternfly/patternfly-addons.css';
import '@redhat-cloud-services/hcc-storybook-hub/css/storybook.css';
import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
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
import { type Mock, sb } from 'storybook/test';
import { IntlMessagesProvider } from '../src/shared/i18n';
import { messageCatalogs } from '../src/shared/i18n/messageCatalogs';
import { useChromeLocale } from '../src/shared/hooks/useChromeLocale';
import messageDescriptors from '../src/Messages';
import { ServiceProvider, createBrowserServices } from '../src/shared/services';
import type { AddNotificationFn } from '../src/shared/entry/browser';
import { ApiErrorProvider } from '../src/shared/contexts/ApiErrorContext';

sb.mock(import('../src/shared/i18n/messageCatalogs.ts'));
sb.mock(import('../src/shared/hooks/useChromeLocale.ts'));

const JAWA_MAP: Record<string, string> = {
  a: 'å',
  b: 'ß',
  c: 'ç',
  d: 'ð',
  e: 'é',
  f: 'ƒ',
  g: 'ğ',
  h: 'ĥ',
  i: 'î',
  j: 'ĵ',
  k: 'ķ',
  l: 'ł',
  m: 'ɱ',
  n: 'ñ',
  o: 'ö',
  p: 'þ',
  q: 'ǫ',
  r: 'ř',
  s: '§',
  t: 'ţ',
  u: 'ü',
  v: 'v',
  w: 'ŵ',
  x: 'x',
  y: 'ý',
  z: 'ž',
  A: 'Å',
  B: 'ß',
  C: 'Ç',
  D: 'Ð',
  E: 'É',
  F: 'Ƒ',
  G: 'Ğ',
  H: 'Ĥ',
  I: 'Î',
  J: 'Ĵ',
  K: 'Ķ',
  L: 'Ł',
  M: 'Ɱ',
  N: 'Ñ',
  O: 'Ö',
  P: 'Þ',
  Q: 'Ǫ',
  R: 'Ř',
  S: '§',
  T: 'Ţ',
  U: 'Ü',
  V: 'V',
  W: 'Ŵ',
  X: 'X',
  Y: 'Ý',
  Z: 'Ž',
};

function pseudoLocalize(str: string): string {
  let result = '';
  let inBrace = 0;
  for (const ch of str) {
    if (ch === '{') inBrace++;
    if (ch === '}') inBrace--;
    result += inBrace > 0 ? ch : (JAWA_MAP[ch] ?? ch);
  }
  return `[${result}]`;
}

const enDefaults = Object.fromEntries(Object.entries(messageDescriptors).map(([k, v]) => [k, v.defaultMessage as string]));
const jawaCatalog = Object.fromEntries(Object.entries(enDefaults).map(([k, v]) => [k, pseudoLocalize(v)]));

function withMissingMarkers(messages: Record<string, string>): Record<string, string> {
  const allKeys = new Set([...Object.keys(enDefaults), ...Object.keys(messages)]);
  return new Proxy(messages, {
    get(target, key: string) {
      if (key in target) return target[key];
      if (key in enDefaults) return `\u{1F6A8} UNTRANSLATED \u{1F6A8} ${enDefaults[key]}`;
      return undefined;
    },
    has(_target, key: string) {
      return allKeys.has(key);
    },
    ownKeys() {
      return [...allKeys];
    },
    getOwnPropertyDescriptor(target, key: string) {
      return {
        configurable: true,
        enumerable: true,
        value: key in target ? target[key] : key in enDefaults ? `\u{1F6A8} UNTRANSLATED \u{1F6A8} ${enDefaults[key]}` : undefined,
      };
    },
  });
}

// Wrapper that provides all providers for component stories (non-journey)
// This must be inside NotificationsProvider, StorybookMockProvider, and FeatureFlagsProvider
// to access useAddNotification, mock state, and feature flags.
const ComponentProviders: React.FC<{ locale: string; children: React.ReactNode }> = ({ locale, children }) => {
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
    locale,
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
  globalTypes: {
    locale: {
      description: 'Locale',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'fr', title: 'Français' },
          { value: 'ko', title: '한국어' },
          { value: 'zh-CN', title: '中文' },
          { value: 'ja', title: '日本語' },
          { value: 'jw', title: 'Utinni! (Jawa)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    locale: 'en',
  },
  beforeEach: () => {
    for (const locale of ['fr', 'ko', 'zh-CN', 'ja']) {
      messageCatalogs[locale] = () =>
        import(`../messages/${locale}.json`).then((mod: { default: Record<string, string> }) => ({
          default: withMissingMarkers(mod.default),
        }));
    }
    messageCatalogs.jw = () => Promise.resolve({ default: jawaCatalog });
  },
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
  decorators: [
    (Story, { parameters, args, globals }) => {
      const locale = (globals.locale as string) ?? 'en';
      (useChromeLocale as Mock).mockReturnValue(locale);
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
            <IntlMessagesProvider locale={locale}>
              <NotificationsProvider>
                <ComponentProviders locale={locale}>
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
