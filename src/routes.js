import { Route, Switch, Redirect } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import { routes } from '../package.json';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const Groups = lazy(() => import('./smart-components/group/groups'));
const Roles = lazy(() => import('./smart-components/role/roles'));
const Users = lazy(() => import('./smart-components/user/users'));
const MyUserAccess = lazy(() => import('./smart-components/myUserAccess/MUAHome'));
const AccessRequests = lazy(() => import('./smart-components/accessRequests/accessRequests'));

export const Routes = () => {
  try {
    const chrome = useChrome();
    if (localStorage.getItem('experimental:useChrome') === 'true') {
      console.group('Experimental API notice');
      console.log('Using experimental chrome API "useChrome"');
      console.log('Api value: ', chrome);
      console.groupEnd();
    }
  } catch (error) {
    /**
     * Do nothing does not break UI
     */
  }
  return (
    <Suspense fallback={<AppPlaceholder />}>
      <Switch>
        <Route path={routes.groups} component={Groups} />
        <Route path={routes.roles} component={Roles} />
        <Route path={routes.users} component={Users} />
        <Route path={routes['my-user-access']} component={MyUserAccess} />
        <Route path={routes['access-requests']} component={AccessRequests} />
        <Route>
          <Redirect to={routes.users} />
        </Route>
      </Switch>
    </Suspense>
  );
};
