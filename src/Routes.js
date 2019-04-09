import { Route, Switch, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import React, { lazy, Suspense } from 'react';
import some from 'lodash/some';
import { AppPlaceholder } from './PresentationalComponents/Shared/LoaderPlaceholders';

/**
 * Aysnc imports of components
 *
 * https://webpack.js.org/guides/code-splitting/
 * https://reactjs.org/docs/code-splitting.html
 *
 * pros:
 *      1) code splitting
 *      2) can be used in server-side rendering
 * cons:
 *      1) naming chunk names adds unnecessary docs to code,
 *         see the difference with DashboardMap and InventoryDeployments.
 *
 */
const Users = lazy(() => import('./SmartComponents/User/Users'));
const User = lazy(() => import('./SmartComponents/User/User'));
const Groups = lazy(() => import('./SmartComponents/Group/Groups'));
const Group = lazy(() => import('./SmartComponents/Group/Group'));

const paths = {
  rbac: '/',
  users: '/users',
  user: '/user/:id',
  groups: '/groups',
  group: '/group/:id'
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

/**
 * the Switch component changes routes depending on the path.
 *
 * Route properties:
 *      exact - path must match exactly,
 *      path - https://prod.foo.redhat.com:1337/insights/advisor/rules
 *      component - component to be rendered when a route has been chosen.
 */
export const Routes = props => {
  const path = props.childProps.location.pathname;
  return (
    <Suspense fallback={ <AppPlaceholder /> }>
      <Switch>
        <InsightsRoute path={ paths.users } component={ Users } rootClass="users"/>
        <InsightsRoute path={ paths.user } component={ User } rootClass="user"/>
        <InsightsRoute path={ paths.groups } component={ Groups } rootClass="groups" />
        <InsightsRoute path={ paths.group } component={ Group } rootClass="group" />
        { /* Finally, catch all unmatched routes */ }
        <Route render={ () => (some(paths, p => p === path) ? null : <Redirect to={ paths.groups } />) } />
      </Switch>
    </Suspense>
  );
};

Routes.propTypes = {
  childProps: PropTypes.object
};
