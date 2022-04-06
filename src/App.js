import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { Routes } from './routes';
import Main from '@redhat-cloud-services/frontend-components/Main';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import { IntlProvider } from 'react-intl';
import ErroReducerCatcher from './presentational-components/shared/ErrorReducerCatcher';
import PermissionsContext from './utilities/permissions-context';

import './App.scss';

const App = () => {
  const [userData, setUserData] = useState({
    ready: false,
    orgAdmin: false,
    userAccessAdministrator: false,
  });
  const history = useHistory();

  useEffect(() => {
    insights.chrome.init();
    insights.chrome.registerModule('access-requests');
    !insights.chrome.getApp() && history.push('/my-user-access'); // redirect to MUA if url is "/settings"
    Promise.all([insights.chrome.auth.getUser(), window.insights.chrome.getUserPermissions('rbac')]).then(([user, permissions]) => {
      setUserData({
        ready: true,
        orgAdmin: user?.identity?.user?.is_org_admin,
        userAccessAdministrator: !!permissions.find(({ permission }) => permission === 'rbac:*:*'),
      });
    });
    insights.chrome.identifyApp(insights.chrome.getApp());

    const unregister = insights.chrome.on('APP_NAVIGATION', (event) => {
      if (event.domEvent) {
        history.push(`/${event.navId}`);
      }
    });

    return () => {
      if (typeof unregister === 'function') {
        unregister();
      }
    };
  }, []);

  if (!userData.ready) {
    return <AppPlaceholder />;
  }

  return (
    <IntlProvider locale="en">
      <PermissionsContext.Provider value={{ ...userData }}>
        <ErroReducerCatcher>
          <Main style={{ marginLeft: 0, padding: 0 }}>
            <Routes />
          </Main>
        </ErroReducerCatcher>
      </PermissionsContext.Provider>
    </IntlProvider>
  );
};

App.propTypes = {
  history: PropTypes.object,
};

export default App;
