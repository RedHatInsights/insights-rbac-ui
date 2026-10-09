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
import { createStandaloneQueryClient } from '../shared/components/QueryClientSetup';
import { ServiceProvider } from '../shared/contexts/ServiceContext';
import type { AppServices } from '../shared/services/types';
import { browserApiClient } from '../shared/entry/browser';
import { IntlMessagesProvider } from '../shared/i18n';
import {
  CreateWorkspaceWizard as CreateWorkspaceWizardInner,
  CreateWorkspaceWizardProps,
} from '../v2/features/workspaces/create-workspace/CreateWorkspaceWizard';

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
  locale: 'en',
};

type FederatedCreateWorkspaceWizardProps = CreateWorkspaceWizardProps & { locale?: string };

const CreateWorkspaceWizard: React.FunctionComponent<FederatedCreateWorkspaceWizardProps> = ({ locale = 'en', ...props }) => {
  const services = { ...moduleServices, locale };
  return (
    <IntlMessagesProvider locale={locale}>
      <ServiceProvider value={services}>
        <QueryClientProvider client={moduleQueryClient}>
          <CreateWorkspaceWizardInner {...props} />
        </QueryClientProvider>
      </ServiceProvider>
    </IntlMessagesProvider>
  );
};

export default CreateWorkspaceWizard;
export type { FederatedCreateWorkspaceWizardProps as CreateWorkspaceWizardProps };
