import { Route, Switch, Redirect } from 'react-router-dom';
import React, { lazy, Suspense, useEffect } from 'react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import pathnames from './utilities/pathnames';
import QuickstartsTestButtons from './utilities/quickstarts-test-buttons';

const Groups = lazy(() => import('./smart-components/group/groups'));
const Roles = lazy(() => import('./smart-components/role/roles'));
const Users = lazy(() => import('./smart-components/user/users'));
const MyUserAccess = lazy(() => import('./smart-components/myUserAccess/MUAHome'));
const AccessRequests = lazy(() => import('./smart-components/accessRequests/accessRequests'));
const QuickstartsTest = lazy(() => import('./smart-components/quickstarts/quickstarts-test'));

export const Routes = () => {
  const { registerEvent } = useChrome();
  console.log({ registerEvent });
  useEffect(() => {
    if (typeof registerEvent === 'function') {
      registerEvent('invalidate', 'rbac', 'group', (data) => console.log('RBAC EVENT: ', data));
    }
  }, []);
  return (
    <Suspense fallback={<AppPlaceholder />}>
      <QuickstartsTestButtons />
      <Switch>
        <Route path={pathnames.groups} component={Groups} />
        <Route path={pathnames.roles} component={Roles} />
        <Route path={pathnames.users} component={Users} />
        <Route path={pathnames['my-user-access']} component={MyUserAccess} />
        <Route path={pathnames['access-requests']} component={AccessRequests} />

        {localStorage.getItem('quickstarts:enabled') === 'true' && <Route path={pathnames['quickstarts-test']} component={QuickstartsTest} />}
        <Route>
          <Redirect to={pathnames.users} />
        </Route>
      </Switch>
    </Suspense>
  );
};
