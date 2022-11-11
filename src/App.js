import React, { useEffect } from 'react';
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
import useUserData from './hooks/useUserData';

import './App.scss';

const App = () => {
  const dispatch = useDispatch();
  const userData = useUserData();
  const history = useHistory();

  useEffect(() => {
    insights.chrome.init();
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

export default App;
