import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import ErroReducerCatcher from './components/ui-states/ErrorReducerCatcher';
import PermissionsContext from './utilities/permissionsContext';
import { AppPlaceholder } from './components/ui-states/LoaderPlaceholders';
import { updateGroupsFilters } from './redux/groups/actions';
import { updateRolesFilters } from './redux/roles/actions';
import { updateUsersFilters } from './redux/users/actions';
import { groupsInitialState } from './redux/groups/reducer';
import { rolesInitialState } from './redux/roles/reducer';
import { usersInitialState } from './redux/users/reducer';
import useUserData from './hooks/useUserData';
import Routing from './Routing';

// Fix for data-driven-forms wizard footer button layout with PF6
import './components/wizard/wizard-footer-fix.css';

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
        <section className="rbac-c-root pf-v6-c-page__main-section pf-v6-u-m-0 pf-v6-u-p-0">
          <Routing />
        </section>
      </ErroReducerCatcher>
    </PermissionsContext.Provider>
  );
};

export default App;
