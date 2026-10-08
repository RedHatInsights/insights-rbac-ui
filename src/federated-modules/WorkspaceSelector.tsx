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
 * - IntlMessagesProvider (loads the selected locale catalog)
 * - AccessCheck.Provider (Kessel permissions)
 * - ServiceProvider (axios instance)
 * - QueryClientProvider (react-query)
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AccessCheck } from '@project-kessel/react-kessel-access-check';
import { createStandaloneQueryClient } from '../shared/components/QueryClientSetup';
import { ServiceProvider } from '../shared/contexts/ServiceContext';
import type { AppServices } from '../shared/services/types';
import { browserApiClient } from '../shared/entry/browser';
import { locale } from '../locales/locale';
import { IntlMessagesProvider } from '../shared/i18n/IntlMessagesProvider';
import {
  ManagedWorkspaceSelector,
  ManagedWorkspaceSelectorProps,
} from '../v2/features/workspaces/components/managed-selector/ManagedWorkspaceSelector';

export { locale };

// Create a standalone query client for the module
const moduleQueryClient = createStandaloneQueryClient();

// Standalone services — federated modules run inside Chrome, so these are safe defaults.
// The selector only uses axios for RBAC API calls; external IT API fields are unused.
const moduleServices: AppServices = {
  axios: browserApiClient,
  notify: () => {},
  getToken: async () => '',
  environment: 'stage',
  ssoUrl: '',
  identity: undefined,
  isITLess: false,
};

// Kessel access check API configuration (same as Iam.tsx)
const accessCheckBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
const accessCheckApiPath = '/api/kessel/v1beta2';

/** Federated module props - re-exported from internal component */
export type WorkspaceSelectorProps = ManagedWorkspaceSelectorProps;

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = (props) => {
  return (
    <IntlMessagesProvider locale={locale}>
      <AccessCheck.Provider baseUrl={accessCheckBaseUrl} apiPath={accessCheckApiPath}>
        <ServiceProvider value={moduleServices}>
          <QueryClientProvider client={moduleQueryClient}>
            <ManagedWorkspaceSelector {...props} />
          </QueryClientProvider>
        </ServiceProvider>
      </AccessCheck.Provider>
    </IntlMessagesProvider>
  );
};

export default WorkspaceSelector;
