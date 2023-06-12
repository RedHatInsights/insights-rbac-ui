import { Route, Routes as RouterRoutes, Navigate } from 'react-router-dom';
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
        !!matchPath(
          {
            path: item.path,
            end: true,
          },
          location.pathname
        )
    );
    if (currPath?.title) {
      updateDocumentTitle(`${currPath.title} - User Access`);
    }
  }, [location.pathname, updateDocumentTitle]);

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <QuickstartsTestButtons />
      <RouterRoutes>
        <Route path={pathnames.groups.path} element={<Groups />} />
        <Route path={pathnames.roles.path} element={<Roles />} />
        <Route path={pathnames.users.path} element={<Users />} />

        {localStorage.getItem('quickstarts:enabled') === 'true' && <Route path={pathnames['quickstarts-test'].path} element={<QuickstartsTest />} />}
        <Route path="*" element={<Navigate to="users" />} />
      </RouterRoutes>
    </Suspense>
  );
};
