/**
 * WorkspaceSelector - Federated Module
 *
 * Self-contained workspace selector for module federation.
 * External consumers can use this via AsyncComponent without needing their own providers.
 *
 * ```tsx
 * <AsyncComponent
 *   scope="rbac"
 *   module="./modules/WorkspaceSelector"
 *   onSelect={handleSelect}
 *   fallback={<Skeleton />}
 * />
 * ```
 *
 * Providers included:
 * - IntlProvider (i18n)
 * - AccessCheck.Provider (Kessel permissions)
 * - ServiceProvider (axios instance)
 * - QueryClientProvider (react-query)
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import { AccessCheck } from '@project-kessel/react-kessel-access-check';
import { createStandaloneQueryClient } from '../components/QueryClientSetup';
import { ServiceProvider } from '../contexts/ServiceContext';
import { browserApiClient } from '../entry/browser';
import messages from '../locales/data.json';
import { ManagedWorkspaceSelector, ManagedWorkspaceSelectorProps } from '../features/workspaces/components/managed-selector/ManagedWorkspaceSelector';

export const locale = 'en';

// Create a standalone query client for the module
const moduleQueryClient = createStandaloneQueryClient();

// Create standalone services for the module (no notifications needed for read-only selector)
const moduleServices = {
  axios: browserApiClient,
  notify: () => {}, // No-op since selector doesn't trigger notifications
};

// Kessel access check API configuration (same as Iam.tsx)
const accessCheckBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
const accessCheckApiPath = '/api/kessel/v1beta2';

/** Federated module props - re-exported from internal component */
export type WorkspaceSelectorProps = ManagedWorkspaceSelectorProps;

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = (props) => {
  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <AccessCheck.Provider baseUrl={accessCheckBaseUrl} apiPath={accessCheckApiPath}>
        <ServiceProvider value={moduleServices}>
          <QueryClientProvider client={moduleQueryClient}>
            <ManagedWorkspaceSelector {...props} />
          </QueryClientProvider>
        </ServiceProvider>
      </AccessCheck.Provider>
    </IntlProvider>
  );
};

export default WorkspaceSelector;
