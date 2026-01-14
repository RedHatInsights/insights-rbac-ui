import React, { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { IntlProvider } from 'react-intl';
import NotificationPortal from '@redhat-cloud-services/frontend-components-notifications/NotificationPortal';

import { RegistryContext, getRegistry } from './utilities/store';
import { queryClient } from './data/queries/client';
import messages from './locales/data.json';
import { locale } from './locales/locale';
import ErroReducerCatcher from './components/ui-states/ErrorReducerCatcher';
import PermissionsContext from './utilities/permissionsContext';
import pathnames from './utilities/pathnames';
import { AppPlaceholder } from './components/ui-states/LoaderPlaceholders';
import useAppNavigate from './hooks/useAppNavigate';
import useUserData from './hooks/useUserData';
import Routing from './Routing';
import { updateGroupsFilters } from './redux/groups/actions';
import { updateRolesFilters } from './redux/roles/actions';
import { updateUsersFilters } from './redux/users/actions';
import { groupsInitialState } from './redux/groups/reducer';
import { rolesInitialState } from './redux/roles/reducer';
import { usersInitialState } from './redux/users/reducer';

const MyUserAccessPage = lazy(() => import('./features/myUserAccess/MyUserAccess'));

/**
 * Full application routing with Redux filter cleanup on unmount.
 */
const FullAppRouting: React.FC = () => {
  const dispatch = useDispatch();

  // Cleanup Redux filters on unmount
  useEffect(() => {
    return () => {
      dispatch(updateUsersFilters(usersInitialState.users.filters));
      dispatch(updateGroupsFilters(groupsInitialState.groups.filters));
      dispatch(updateRolesFilters(rolesInitialState.roles.filters));
    };
  }, []);

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
 * Inner app component that sets up PermissionsContext and ErrorReducerCatcher.
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

  return (
    <PermissionsContext.Provider value={{ ...userData }}>
      <ErroReducerCatcher>{muaMode ? <MuaRouting /> : <FullAppRouting />}</ErroReducerCatcher>
    </PermissionsContext.Provider>
  );
};

/**
 * Main application entry point.
 * Used by both IamUserAccess (full app) and MyUserAccess (simplified mode).
 */
const AppEntry: React.FC<AppEntryProps> = ({ muaMode = false, withNotificationPortal = true }) => {
  const registry = getRegistry();

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <QueryClientProvider client={queryClient}>
        <RegistryContext.Provider value={{ getRegistry }}>
          <Provider store={registry.getStore()}>
            {withNotificationPortal && <NotificationPortal />}
            <AppShell muaMode={muaMode} />
          </Provider>
        </RegistryContext.Provider>
      </QueryClientProvider>
    </IntlProvider>
  );
};

export default AppEntry;
