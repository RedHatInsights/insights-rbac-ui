import { Route, Switch, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import React, { lazy, Suspense } from 'react';
import { AppPlaceholder } from './presentational-components/shared/loader-place-holders';

const Groups = lazy(() => import('./smart-components/group/groups'));
const Group = lazy(() => import('./smart-components/group/group'));

const paths = {
  rbac: '/',
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
