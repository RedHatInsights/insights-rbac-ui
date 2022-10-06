import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { Routes } from './routes';
import { useDispatch } from 'react-redux';
import Main from '@redhat-cloud-services/frontend-components/Main';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import ErroReducerCatcher from './presentational-components/shared/ErrorReducerCatcher';
import PermissionsContext from './utilities/permissions-context';
import { updateGroupsFilters } from './redux/actions/group-actions';
import { updateRolesFilters } from './redux/actions/role-actions';
import { updateUsersFilters } from './redux/actions/user-actions';
import { groupsInitialState } from './redux/reducers/group-reducer';
import { rolesInitialState } from './redux/reducers/role-reducer';
import { usersInitialState } from './redux/reducers/user-reducer';

import './App.scss';

const App = () => {
  const dispatch = useDispatch();
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
    const { globalConfig } = useChrome();
    console.log(globalConfig);
    console.log('blah');
    console.log(globalConfig.rbac);

    const unregister = insights.chrome.on('APP_NAVIGATION', (event) => {
      if (event.domEvent) {
        history.push(`/${event.navId}`);
      }
    });

    return () => {
      if (typeof unregister === 'function') {
        unregister();
      }

      dispatch(updateUsersFilters(usersInitialState.users.filters));
      dispatch(updateGroupsFilters(groupsInitialState.groups.filters));
      dispatch(updateRolesFilters(rolesInitialState.roles.filters));
    };
  }, []);

  if (!userData.ready) {
    return <AppPlaceholder />;
  }

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

App.propTypes = {
  history: PropTypes.object,
};

export default App;
