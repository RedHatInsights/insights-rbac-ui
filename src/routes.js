import { Route, Switch, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import React, { lazy, Suspense } from 'react';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';

const Groups = lazy(() => import('./smart-components/group/groups'));
const Roles = lazy(() => import('./smart-components/role/roles'));

const paths = {
  rbac: '/',
  groups: '/groups',
  roles: '/roles'
};

const InsightsRoute = ({ rootClass, ...rest }) => {
  const root = document.getElementById('root');
  root.removeAttribute('class');
  root.classList.add(`page__${rootClass}`, 'pf-l-page__main', 'pf-c-page__main');
  root.setAttribute('role', 'main');
  return (<Route { ...rest } />);
};

InsightsRoute.propTypes = {
  rootClass: PropTypes.string
};

export const Routes = () => {
  return (
    <Suspense fallback={ <AppPlaceholder /> }>
      <Switch>
        <InsightsRoute path={ paths.groups } component={ Groups } rootClass="groups" />
        <InsightsRoute path={ paths.roles } component={ Roles } rootClass="roles" />
        <Route render={ () => <Redirect to={ paths.groups } /> } />
      </Switch>
    </Suspense>
  );
};

Routes.propTypes = {
  childProps: PropTypes.object
};
