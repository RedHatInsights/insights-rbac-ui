/**
 * CreateWorkspaceWizard - Federated Module
 *
 * Self-contained workspace creation wizard for module federation.
 * External consumers can use this via AsyncComponent without needing their own providers.
 *
 * ```tsx
 * <AsyncComponent
 *   scope="rbac"
 *   module="./modules/CreateWorkspaceWizard"
 *   afterSubmit={handleSuccess}
 *   onCancel={handleCancel}
 *   fallback={<Skeleton />}
 * />
 * ```
 *
 * Providers included:
 * - QueryClientProvider (react-query)
 * - ServiceProvider (axios instance)
 * - IntlProvider (i18n)
 *
 * Note: Requires a Router in the parent tree (provided by Chrome at runtime).
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import { createStandaloneQueryClient } from '../shared/components/QueryClientSetup';
import { ServiceProvider } from '../shared/contexts/ServiceContext';
import type { AppServices } from '../shared/services/types';
import { browserApiClient } from '../shared/entry/browser';
import messages from '../locales/data.json';
import {
  CreateWorkspaceWizard as CreateWorkspaceWizardInner,
  CreateWorkspaceWizardProps,
} from '../v2/features/workspaces/create-workspace/CreateWorkspaceWizard';

export const locale = 'en';

// Create a standalone query client for the module
const moduleQueryClient = createStandaloneQueryClient();

// Standalone services — federated modules run inside Chrome, so these are safe defaults.
// The wizard only uses axios for RBAC API calls; external IT API fields are unused.
const moduleServices: AppServices = {
  axios: browserApiClient,
  notify: () => {},
  getToken: async () => '',
  environment: 'stage',
  ssoUrl: '',
  identity: undefined,
  isITLess: false,
};

const CreateWorkspaceWizard: React.FunctionComponent<CreateWorkspaceWizardProps> = (props) => {
  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <ServiceProvider value={moduleServices}>
        <QueryClientProvider client={moduleQueryClient}>
          <CreateWorkspaceWizardInner {...props} />
        </QueryClientProvider>
      </ServiceProvider>
    </IntlProvider>
  );
};

export default CreateWorkspaceWizard;
export type { CreateWorkspaceWizardProps };
