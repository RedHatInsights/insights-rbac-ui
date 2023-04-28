import { Route, Switch, Redirect } from 'react-router-dom';
import React, { lazy, Suspense, useEffect } from 'react';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import pathnames from './utilities/pathnames';
import QuickstartsTestButtons from './utilities/quickstarts-test-buttons';
import { matchPath, useLocation } from 'react-router-dom';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

const Groups = lazy(() => import('./smart-components/group/groups'));
const Roles = lazy(() => import('./smart-components/role/roles'));
const Users = lazy(() => import('./smart-components/user/users'));
const QuickstartsTest = lazy(() => import('./smart-components/quickstarts/quickstarts-test'));

export const Routes = () => {
  const location = useLocation();
  const { updateDocumentTitle } = useChrome();
  useEffect(() => {
    const currPath = Object.values(pathnames).find(
      (item) =>
        !!matchPath(location.pathname, {
          path: item.path,
          exact: true,
          strict: false,
        })
    );
    if (currPath?.title) {
      updateDocumentTitle(`${currPath.title} - User Access`);
    }
  }, [location.pathname, updateDocumentTitle]);

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <QuickstartsTestButtons />
      <Switch>
        <Route path={pathnames.groups.path} component={Groups} />
        <Route path={pathnames.roles.path} component={Roles} />
        <Route path={pathnames.users.path} component={Users} />

        {localStorage.getItem('quickstarts:enabled') === 'true' && <Route path={pathnames['quickstarts-test'].path} component={QuickstartsTest} />}
        <Route>
          <Redirect to={pathnames.users.path} />
        </Route>
      </Switch>
    </Suspense>
  );
};
