import { Route, Switch, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import React, { lazy, Suspense } from 'react';
import { AppPlaceholder } from './PresentationalComponents/Shared/LoaderPlaceholders';

const Users = lazy(() => import('./SmartComponents/User/Users'));
const Groups = lazy(() => import('./SmartComponents/Group/Groups'));
const Group = lazy(() => import('./SmartComponents/Group/Group'));

const paths = {
  rbac: '/',
  users: '/users',
  groups: '/groups',
  group: '/group/:id'
};

const InsightsRoute = ({ rootClass, ...rest }) => {
  const root = document.getElementById('root');
  root.removeAttribute('class');
  root.classList.add(`page__${rootClass}`, 'pf-l-page__main', 'pf-c-page__main');
  root.setAttribute('role', 'main');
  return <Route { ...rest } />;
};

InsightsRoute.propTypes = {
  rootClass: PropTypes.string
};

export const Routes = () => {
  return (
    <Suspense fallback={ <AppPlaceholder /> }>
      <Switch>
        <InsightsRoute path={ paths.users } component={ Users } rootClass="users"/>
        <InsightsRoute path={ paths.groups } component={ Groups } rootClass="groups" />
        <InsightsRoute path={ paths.group } component={ Group } rootClass="group" />
        <Route render={ () => <Redirect to={ paths.groups } /> } />
      </Switch>
    </Suspense>
  );
};

Routes.propTypes = {
  childProps: PropTypes.object
};
