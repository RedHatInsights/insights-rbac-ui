import { Route, Routes as RouterRoutes, Navigate } from 'react-router-dom';
import React, { lazy, Suspense, useEffect } from 'react';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import pathnames from './utilities/pathnames';
import QuickstartsTestButtons from './utilities/quickstarts-test-buttons';
import { matchPath, useLocation } from 'react-router-dom';

const Groups = lazy(() => import('./smart-components/group/groups'));
const Roles = lazy(() => import('./smart-components/role/roles'));
const Users = lazy(() => import('./smart-components/user/users'));
const MyUserAccess = lazy(() => import('./smart-components/myUserAccess/MUAHome'));
const AccessRequests = lazy(() => import('./smart-components/accessRequests/accessRequests'));
const QuickstartsTest = lazy(() => import('./smart-components/quickstarts/quickstarts-test'));

export const Routes = () => {
  const location = useLocation();
  useEffect(() => {
    insights.chrome.updateDocumentTitle(
      Object.values(pathnames).find(
        (item) =>
          !!matchPath(
            {
              path: item.path,
              end: true,
            },
            location.pathname
          )
      )?.title || 'User Access'
    );
  }, [location.pathname]);
  console.log({ location });

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <QuickstartsTestButtons />
      <RouterRoutes>
        <Route path={pathnames.groups.path} element={<Groups />} />
        <Route path={pathnames.roles.path} element={<Roles />} />
        <Route path={pathnames.users.path} element={<Users />} />
        <Route path={pathnames['access-requests'].path} element={<AccessRequests />} />
        <Route path={'/'} element={<MyUserAccess />} />

        {localStorage.getItem('quickstarts:enabled') === 'true' && <Route path={pathnames['quickstarts-test'].path} element={<QuickstartsTest />} />}
        <Route path="*" element={<Navigate to="users" />} />
      </RouterRoutes>
    </Suspense>
  );
};
