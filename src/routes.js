import { Route, Switch, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import React, { lazy, Suspense } from 'react';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import { routes } from '../package.json';

const Groups = lazy(() => import('./smart-components/group/groups'));
const Roles = lazy(() => import('./smart-components/role/roles'));
const Users = lazy(() => import('./smart-components/user/users'));
const MyUserAccess = lazy(() => import('./smart-components/myUserAccess/MUAHome'));

const InsightsRoute = ({ rootClass, ...rest }) => {
  const root = document.getElementById('root');
  root.removeAttribute('class');
  root.classList.add(`page__${rootClass}`, 'pf-l-page__main', 'pf-c-page__main');
  root.setAttribute('role', 'main');
  return <Route {...rest} />;
};

InsightsRoute.propTypes = {
  rootClass: PropTypes.string,
};

export const Routes = () => {
  return (
    <Suspense fallback={<AppPlaceholder />}>
      <Switch>
        <InsightsRoute path={routes.groups} component={Groups} rootClass="groups" />
        <InsightsRoute path={routes.roles} component={Roles} rootClass="roles" />
        <InsightsRoute path={routes.users} component={Users} rootClass="users" />
        <InsightsRoute path={routes['my-user-access']} component={MyUserAccess} rootClass="myUserAccess" />
        <Route>
          <Redirect to={routes['my-user-access']} />
        </Route>
      </Switch>
    </Suspense>
  );
};

Routes.propTypes = {
  childProps: PropTypes.object,
};
