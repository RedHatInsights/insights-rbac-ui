import { Navigate, Route as RouterRoute, Routes as RouterRoutes, matchPath, useLocation } from 'react-router-dom';
import React, { lazy, Suspense, useEffect, useMemo } from 'react';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import pathnames from './utilities/pathnames';
import QuickstartsTestButtons from './utilities/quickstarts-test-buttons';
import ElementWrapper from './smart-components/common/ElementWrapper';
import { mergeToBasename } from './presentational-components/shared/AppLink';

const Users = lazy(() => import('./smart-components/user/users'));
const UserDetail = lazy(() => import('./smart-components/user/user'));
const AddUserToGroup = lazy(() => import('./smart-components/user/add-user-to-group/add-user-to-group'));


const Groups = lazy(() => import('./smart-components/group/groups'));
const Group = lazy(() => import('./smart-components/group/group'));
const AddGroupWizard = lazy(() => import('./smart-components/group/add-group/add-group-wizard'));
const EditGroup = lazy(() => import('./smart-components/group/edit-group-modal'));
const RemoveGroup = lazy(() => import('./smart-components/group/remove-group-modal'));
const GroupMembers = lazy(() => import('./smart-components/group/member/group-members'));
const GroupRoles = lazy(() => import('./smart-components/group/role/group-roles'));
const AddGroupRoles = lazy(() => import('./smart-components/group/role/add-group-roles'));
const AddGroupMembers = lazy(() => import('./smart-components/group/member/add-group-members'));

const QuickstartsTest = lazy(() => import('./smart-components/quickstarts/quickstarts-test'));

const routes = [
  {
    path: pathnames['user-detail'].path,
    element: UserDetail,
    childRoutes: [
      {
        path: pathnames['add-user-to-group'].path,
        element: AddUserToGroup,
      },
      {
        path: pathnames['user-add-group-roles'].path,
        element: AddGroupRoles,
      },
    ],
  },
  {
    path: pathnames.users.path,
    element: Users,
  },

  {
    path: pathnames['role-detail'].path,
    element: Role,
    childRoutes: [
      {
        path: pathnames['role-detail-remove'].path,
        element: RemoveRole,
      },
      {
        path: pathnames['role-detail-edit'].path,
        element: EditRole,
      },
      {
        path: pathnames['role-add-permission'].path,
        element: AddRolePermissionWizard,
      },
    ],
  },

      {
        path: pathnames['group-detail-members'].path,
        element: GroupMembers,
        childRoutes: [
          {
            path: pathnames['group-members-edit-group'].path,
            element: EditGroup,
          },
          {
            path: pathnames['group-members-remove-group'].path,
            element: RemoveGroup,
          },
          {
            path: pathnames['group-add-members'].path,
            element: AddGroupMembers,
          },
        ],
      },
    ],
  },
  {
    path: pathnames.groups.path,
    element: Groups,
    childRoutes: [
      {
        path: pathnames['add-group'].path,
        element: AddGroupWizard,
      },
      {
        path: pathnames['edit-group'].path,
        element: EditGroup,
      },
      {
        path: pathnames['remove-group'].path,
        element: RemoveGroup,
      },
    ],
  },

  ...(localStorage.getItem('quickstarts:enabled') === 'true' ? [{ path: pathnames['quickstarts-test'].path, element: QuickstartsTest }] : []),
];

interface RouteType {
  path?: string;
  element: React.ComponentType;
  childRoutes?: RouteType[];
  elementProps?: Record<string, unknown>;
}

const renderRoutes = (routes: RouteType[] = []) =>
  routes.map(({ path, element: Element, childRoutes, elementProps }) => (
    <RouterRoute
      key={path}
      path={path}
      element={
        <ElementWrapper path={path}>
          <Element {...elementProps} />
        </ElementWrapper>
      }
    >
      {renderRoutes(childRoutes)}
    </RouterRoute>
  ));

const Routing = () => {
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

  const renderedRoutes = useMemo(() => renderRoutes(routes as never), [routes]);
  return (
    <Suspense fallback={<AppPlaceholder />}>
      <QuickstartsTestButtons />
      <RouterRoutes>
        {renderedRoutes}
        {/* Catch all unmatched routes */}
        <RouterRoute path="*" element={<Navigate to={mergeToBasename(pathnames.users.link)} />} />
      </RouterRoutes>
    </Suspense>
  );
};

export default Routing;
