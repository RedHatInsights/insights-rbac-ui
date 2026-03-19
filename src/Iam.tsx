import React from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { IntlProvider } from 'react-intl';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';

import messages from './locales/data.json';
import { locale } from './locales/locale';
import { ApiErrorProvider } from './shared/contexts/ApiErrorContext';
import { QueryClientSetup } from './shared/components/QueryClientSetup';
import ApiErrorBoundary from './shared/components/ui-states/ApiErrorBoundary';
import { ServiceProvider } from './shared/contexts/ServiceContext';
import { type AddNotificationFn, createBrowserServices } from './shared/entry/browser';
import { IamV1 } from './v1/IamV1';
import { IamV2 } from './v2/IamV2';

export interface IamProps {
  testMode?: boolean;
}

/**
 * Shared provider stack for both V1 and V2.
 * Sets up: ApiErrorProvider → ServiceProvider → QueryClientSetup → ApiErrorBoundary
 */
const SharedProviders: React.FC<IamProps & { children: React.ReactNode }> = ({ testMode, children }) => {
  const addNotification = useAddNotification() as AddNotificationFn;
  const services = createBrowserServices(addNotification);

  return (
    <ApiErrorProvider>
      <ServiceProvider value={services}>
        <QueryClientSetup testMode={testMode}>
          <ApiErrorBoundary>{children}</ApiErrorBoundary>
        </QueryClientSetup>
      </ServiceProvider>
    </ApiErrorProvider>
  );
};

/**
 * Version router: reads the access-management flag and renders V1 or V2.
 */
const VersionRouter: React.FC = () => {
  const hasAccessManagement = useFlag('platform.rbac.workspaces');
  return hasAccessManagement ? <IamV2 /> : <IamV1 />;
};

/**
 * Main application entry point for IAM.
 *
 * Provider hierarchy:
 * - IntlProvider (i18n)
 * - NotificationsProvider (toast notifications)
 * - SharedProviders (error handling, services, query client)
 * - VersionRouter → IamV1 or IamV2
 */
export const Iam: React.FC<IamProps> = ({ testMode = false }) => {
  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <NotificationsProvider>
        <SharedProviders testMode={testMode}>
          <VersionRouter />
        </SharedProviders>
      </NotificationsProvider>
    </IntlProvider>
  );
};
