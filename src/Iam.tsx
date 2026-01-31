import React from 'react';
import { IntlProvider } from 'react-intl';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { AccessCheck } from '@project-kessel/react-kessel-access-check';

import messages from './locales/data.json';
import { locale } from './locales/locale';
import { ApiErrorProvider } from './contexts/ApiErrorContext';
import { QueryClientSetup } from './components/QueryClientSetup';
import ApiErrorBoundary from './components/ui-states/ApiErrorBoundary';
import PermissionsContext from './utilities/permissionsContext';
import { AppPlaceholder } from './components/ui-states/LoaderPlaceholders';
import useUserData from './hooks/useUserData';
import Routing from './Routing';
import { ServiceProvider } from './contexts/ServiceContext';
import { type AddNotificationFn, createBrowserServices } from './entry/browser';

export interface IamProps {
  /** Use test-friendly QueryClient settings (no cache, no retry). Default: false */
  testMode?: boolean;
}

/**
 * Inner app component that sets up PermissionsContext and renders routes.
 */
const IamShell: React.FC = () => {
  const userData = useUserData();

  if (!userData.ready) {
    return <AppPlaceholder />;
  }

  return (
    <PermissionsContext.Provider value={{ ...userData }}>
      <section className="rbac-c-root pf-v6-c-page__main-section pf-v6-u-m-0 pf-v6-u-p-0">
        <Routing />
      </section>
    </PermissionsContext.Provider>
  );
};

/**
 * Provider stack for IAM application.
 * Sets up: ApiErrorProvider → ServiceProvider → QueryClientSetup → ApiErrorBoundary
 *
 * Must be rendered inside NotificationsProvider to access useAddNotification.
 */
const IamProviders: React.FC<IamProps> = ({ testMode }) => {
  const addNotification = useAddNotification() as AddNotificationFn;
  const services = createBrowserServices(addNotification);

  return (
    <ApiErrorProvider>
      <ServiceProvider value={services}>
        <QueryClientSetup testMode={testMode}>
          <ApiErrorBoundary>
            <IamShell />
          </ApiErrorBoundary>
        </QueryClientSetup>
      </ServiceProvider>
    </ApiErrorProvider>
  );
};

/**
 * Main application entry point for IAM.
 * Handles all /iam/* routes with a unified router.
 *
 * Provider hierarchy:
 * - IntlProvider (i18n)
 * - AccessCheck.Provider (Kessel)
 * - NotificationsProvider (toast notifications + portal)
 * - ApiErrorProvider (error state management)
 * - ServiceProvider (axios, notify)
 * - QueryClientSetup (React Query)
 * - ApiErrorBoundary (error UI)
 * - IamShell (permissions + routing)
 */
const Iam: React.FC<IamProps> = ({ testMode = false }) => {
  // Kessel access check API configuration
  // baseUrl is the current origin, apiPath points to the inventory API
  const accessCheckBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const accessCheckApiPath = '/api/inventory/v1beta2';

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <AccessCheck.Provider baseUrl={accessCheckBaseUrl} apiPath={accessCheckApiPath}>
        <NotificationsProvider>
          <IamProviders testMode={testMode} />
        </NotificationsProvider>
      </AccessCheck.Provider>
    </IntlProvider>
  );
};

export default Iam;
