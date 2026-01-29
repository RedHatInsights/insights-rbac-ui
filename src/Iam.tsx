import React from 'react';
import { IntlProvider } from 'react-intl';
import NotificationPortal from '@redhat-cloud-services/frontend-components-notifications/NotificationPortal';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';
import { AccessCheck } from '@project-kessel/react-kessel-access-check';

import messages from './locales/data.json';
import { locale } from './locales/locale';
import ApiErrorBoundary from './components/ui-states/ApiErrorBoundary';
import PermissionsContext from './utilities/permissionsContext';
import { AppPlaceholder } from './components/ui-states/LoaderPlaceholders';
import useUserData from './hooks/useUserData';
import Routing from './Routing';

export interface IamProps {
  /** Set to false to disable notification portal (useful in Storybook) */
  withNotificationPortal?: boolean;
}

/**
 * Inner app component that sets up PermissionsContext.
 *
 * This is exported separately for use in Storybook journey tests where
 * the QueryClientProvider is provided by the Storybook decorator (ensuring
 * fresh query clients per story).
 */
export const IamShell: React.FC = () => {
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
 * Main application entry point for IAM.
 * Handles all /iam/* routes with a unified router.
 */
const Iam: React.FC<IamProps> = ({ withNotificationPortal = true }) => {
  // Kessel access check API configuration
  // baseUrl is the current origin, apiPath points to the inventory API
  const accessCheckBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const accessCheckApiPath = '/api/inventory/v1beta2';

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <AccessCheck.Provider baseUrl={accessCheckBaseUrl} apiPath={accessCheckApiPath}>
        <NotificationsProvider>
          <ApiErrorBoundary>
            {withNotificationPortal && <NotificationPortal />}
            <IamShell />
          </ApiErrorBoundary>
        </NotificationsProvider>
      </AccessCheck.Provider>
    </IntlProvider>
  );
};

export default Iam;
