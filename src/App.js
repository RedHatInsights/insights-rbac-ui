import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import ErroReducerCatcher from './presentational-components/shared/ErrorReducerCatcher';
import PermissionsContext from './utilities/permissions-context';
import { AppPlaceholder } from './presentational-components/shared/LoaderPlaceholders';
import { updateGroupsFilters } from './redux/actions/group-actions';
import { updateRolesFilters } from './redux/actions/role-actions';
import { updateUsersFilters } from './redux/actions/user-actions';
import { groupsInitialState } from './redux/reducers/group-reducer';
import { rolesInitialState } from './redux/reducers/role-reducer';
import { usersInitialState } from './redux/reducers/user-reducer';
import useUserData from './hooks/useUserData';
import Routing from './Routing';

import './App.scss';

const App = () => {
  const dispatch = useDispatch();
  const userData = useUserData();

  useEffect(() => {
    return () => {
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
        <section className="rbac-c-root pf-v5-c-page__main-section pf-v5-u-m-0 pf-v5-u-p-0">
          <Routing />
        </section>
      </ErroReducerCatcher>
    </PermissionsContext.Provider>
  );
};

export default App;
