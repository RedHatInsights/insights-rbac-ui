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
import { createStandaloneQueryClient } from '../components/QueryClientSetup';
import { ServiceProvider } from '../contexts/ServiceContext';
import { browserApiClient } from '../entry/browser';
import messages from '../locales/data.json';
import {
  CreateWorkspaceWizard as CreateWorkspaceWizardInner,
  CreateWorkspaceWizardProps,
} from '../features/workspaces/create-workspace/CreateWorkspaceWizard';

export const locale = 'en';

// Create a standalone query client for the module
const moduleQueryClient = createStandaloneQueryClient();

// Create standalone services for the module
const moduleServices = {
  axios: browserApiClient,
  notify: () => {}, // Wizard handles its own notifications via useAddNotification
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
