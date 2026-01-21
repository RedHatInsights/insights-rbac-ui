import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { IntlProvider } from 'react-intl';
import NotificationPortal from '@redhat-cloud-services/frontend-components-notifications/NotificationPortal';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';
import { AccessCheck } from '@project-kessel/react-kessel-access-check';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';

import messages from './locales/data.json';
import { locale } from './locales/locale';
import ApiErrorBoundary from './components/ui-states/ApiErrorBoundary';
import PermissionsContext from './utilities/permissionsContext';
import pathnames from './utilities/pathnames';
import { AppPlaceholder } from './components/ui-states/LoaderPlaceholders';
import useAppNavigate from './hooks/useAppNavigate';
import useUserData from './hooks/useUserData';
import Routing from './Routing';
import { type AppServices, ServiceProvider, createBrowserServices } from './services';

const MyUserAccessPage = lazy(() => import('./features/myUserAccess/MyUserAccess'));

/**
 * Full application routing.
 */
const FullAppRouting: React.FC = () => {
  return (
    <section className="rbac-c-root pf-v6-c-page__main-section pf-v6-u-m-0 pf-v6-u-p-0">
      <Routing />
    </section>
  );
};

/**
 * Simplified routing for "My User Access" mode - only renders the / route
 * and handles the /iam redirect to /iam/my-user-access.
 */
const MuaRouting: React.FC = () => {
  const chrome = useChrome();
  const location = useLocation();
  const navigate = useAppNavigate('/iam');

  useEffect(() => {
    if (location?.pathname?.match(/\/(iam)$/)) {
      navigate(pathnames['my-user-access'].link);
    }
    chrome.updateDocumentTitle('My User Access');
  }, []);

  return (
    <section style={{ marginLeft: 0, padding: 0 }}>
      <Suspense fallback={<AppPlaceholder />}>
        <Routes>
          <Route path="/" element={<MyUserAccessPage />} />
        </Routes>
      </Suspense>
    </section>
  );
};

export interface AppEntryProps {
  /** Set to true for "My User Access" mode (renders only the / route) */
  muaMode?: boolean;
  /** Set to false to disable notification portal (useful in Storybook) */
  withNotificationPortal?: boolean;
}

export interface AppShellProps {
  /** Set to true for "My User Access" mode (renders only the / route) */
  muaMode?: boolean;
}

/**
 * Inner app component that sets up PermissionsContext.
 * Common wrapper for both full app and MUA mode.
 *
 * This is exported separately for use in Storybook journey tests where
 * the QueryClientProvider is provided by the Storybook decorator (ensuring
 * fresh query clients per story).
 */
export const AppShell: React.FC<AppShellProps> = ({ muaMode = false }) => {
  const userData = useUserData();

  if (!userData.ready) {
    return <AppPlaceholder />;
  }

  return <PermissionsContext.Provider value={{ ...userData }}>{muaMode ? <MuaRouting /> : <FullAppRouting />}</PermissionsContext.Provider>;
};

/**
 * Inner wrapper that provides ServiceProvider with browser services.
 * Must be rendered inside NotificationsProvider to access useAddNotification.
 */
const AppWithServices: React.FC<AppShellProps> = ({ muaMode = false }) => {
  const addNotification = useAddNotification();

  // Memoize services to prevent unnecessary re-renders
  // Cast addNotification to the expected type - the actual function is compatible
  // but TypeScript's strict union type checking requires this cast
  const services: AppServices = useMemo(
    () =>
      createBrowserServices(
        addNotification as (notification: { variant: string; title: string; description?: string; dismissable?: boolean }) => void,
      ),
    [addNotification],
  );

  return (
    <ServiceProvider value={services}>
      <AppShell muaMode={muaMode} />
    </ServiceProvider>
  );
};

/**
 * Main application entry point.
 * Used by both IamUserAccess (full app) and MyUserAccess (simplified mode).
 *
 * Wraps the application with:
 * - IntlProvider for i18n
 * - NotificationsProvider for toast notifications
 * - ServiceProvider for dependency injection (axios, notify)
 * - ApiErrorBoundary for error handling
 */
const AppEntry: React.FC<AppEntryProps> = ({ muaMode = false, withNotificationPortal = true }) => {
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
            <AppWithServices muaMode={muaMode} />
          </ApiErrorBoundary>
        </NotificationsProvider>
      </AccessCheck.Provider>
    </IntlProvider>
  );
};

export default AppEntry;
