import React, { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

import { RegistryContext, getRegistry } from '../utilities/store';
import messages from '../locales/data.json';
import ErroReducerCatcher from '../components/ui-states/ErrorReducerCatcher';
import PermissionsContext from '../utilities/permissionsContext';
import pathnames from '../utilities/pathnames';
import { AppPlaceholder } from '../components/ui-states/LoaderPlaceholders';
import useAppNavigate from '../hooks/useAppNavigate';
import useUserData from '../hooks/useUserData';

const MyUserAccess = lazy(() => import('../features/myUserAccess/MyUserAccess'));

export const locale = 'en';

const MuaApp = () => {
  const chrome = useChrome();
  const location = useLocation();
  const navigate = useAppNavigate('/iam');
  const userData = useUserData();

  useEffect(() => {
    if (location?.pathname?.match(/\/(iam)$/)) {
      navigate(pathnames['my-user-access'].link);
    }
    // set correct title

    chrome.updateDocumentTitle('My User Access');
  }, []);

  return (
    <PermissionsContext.Provider value={{ ...userData }}>
      <ErroReducerCatcher>
        <section style={{ marginLeft: 0, padding: 0 }}>
          <Suspense fallback={<AppPlaceholder />}>
            <Routes>
              <Route path="/" element={<MyUserAccess />} />
            </Routes>
          </Suspense>
        </section>
      </ErroReducerCatcher>
    </PermissionsContext.Provider>
  );
};

const SettingsMua = () => {
  // Always get the current registry instance (supports resetRegistry() in Storybook)
  const registry = getRegistry();

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <RegistryContext.Provider
        value={{
          getRegistry,
        }}
      >
        <Provider store={registry.getStore()}>
          <MuaApp />
        </Provider>
      </RegistryContext.Provider>
    </IntlProvider>
  );
};

export default SettingsMua;
