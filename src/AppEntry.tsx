import React, { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { IntlProvider } from 'react-intl';
import NotificationPortal from '@redhat-cloud-services/frontend-components-notifications/NotificationPortal';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';

import messages from './locales/data.json';
import { locale } from './locales/locale';
import ApiErrorBoundary from './components/ui-states/ApiErrorBoundary';
import PermissionsContext from './utilities/permissionsContext';
import pathnames from './utilities/pathnames';
import { AppPlaceholder } from './components/ui-states/LoaderPlaceholders';
import useAppNavigate from './hooks/useAppNavigate';
import useUserData from './hooks/useUserData';
import Routing from './Routing';

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
 * Main application entry point.
 * Used by both IamUserAccess (full app) and MyUserAccess (simplified mode).
 */
const AppEntry: React.FC<AppEntryProps> = ({ muaMode = false, withNotificationPortal = true }) => {
  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <NotificationsProvider>
        <ApiErrorBoundary>
          {withNotificationPortal && <NotificationPortal />}
          <AppShell muaMode={muaMode} />
        </ApiErrorBoundary>
      </NotificationsProvider>
    </IntlProvider>
  );
};

export default AppEntry;
