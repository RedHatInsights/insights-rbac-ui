import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, useHistory } from 'react-router-dom';
import { Provider } from 'react-redux';
import { getBaseName } from '@redhat-cloud-services/frontend-components-utilities/helpers';
import Main from '@redhat-cloud-services/frontend-components/Main';
import { IntlProvider } from 'react-intl';

import registry, { RegistryContext } from '../utilities/store';
import messages from '../locales/data.json';
import ErroReducerCatcher from '../presentational-components/shared/ErrorReducerCatcher';
import PermissionsContext from '../utilities/permissions-context';
import pathnames from '../utilities/pathnames';
import { AppPlaceholder } from '../presentational-components/shared/loader-placeholders';
import useUserData from '../hooks/useUserData';

const MyUserAccess = lazy(() => import('../smart-components/myUserAccess/MUAHome'));

import '../App.scss';

export const locale = 'en';

const Routes = () => {
  const history = useHistory();
  useEffect(() => {
    // redirect to MUA if url is "/settings"
    if (window?.location?.pathname?.match(/\/(iam|settings)$/)) {
      history.push('/my-user-access');
    }
    // set correct title
    document.title = 'My User Access';
  }, []);

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <Route path={pathnames['my-user-access'].path} component={MyUserAccess} />
    </Suspense>
  );
};

const MuaApp = () => {
  const userData = useUserData();
  return (
    <PermissionsContext.Provider value={{ ...userData }}>
      <ErroReducerCatcher>
        <Main style={{ marginLeft: 0, padding: 0 }}>
          <Routes />
        </Main>
      </ErroReducerCatcher>
    </PermissionsContext.Provider>
  );
};

const SettingsMua = () => (
  <IntlProvider locale={locale} messages={messages[locale]}>
    <RegistryContext.Provider
      value={{
        getRegistry: () => registry,
      }}
    >
      <Provider store={registry.getStore()}>
        <Router basename={getBaseName(location.pathname)}>
          <MuaApp />
        </Router>
      </Provider>
    </RegistryContext.Provider>
  </IntlProvider>
);

export default SettingsMua;
