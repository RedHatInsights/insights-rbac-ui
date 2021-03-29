import { Route, Switch, Redirect } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import { routes } from '../package.json';

const Groups = lazy(() => import('./smart-components/group/groups'));
const Roles = lazy(() => import('./smart-components/role/roles'));
const Users = lazy(() => import('./smart-components/user/users'));
const MyUserAccess = lazy(() => import('./smart-components/myUserAccess/MUAHome'));
const AccessRequest = lazy(() => import('./smart-components/accessRequest/accessRequest'));

export const Routes = () => {
  return (
    <Suspense fallback={<AppPlaceholder />}>
      <Switch>
        <Route path={routes.groups} component={Groups} />
        <Route path={routes.roles} component={Roles} />
        <Route path={routes.users} component={Users} />
        <Route path={routes['my-user-access']} component={MyUserAccess} />
        <Route path={routes['access-request']} component={AccessRequest} />
        <Route>
          <Redirect to={routes.users} />
        </Route>
      </Switch>
    </Suspense>
  );
};
