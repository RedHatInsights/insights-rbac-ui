import { Navigate, Route as RouterRoute, Routes as RouterRoutes, matchPath, useLocation } from 'react-router-dom';
import React, { lazy, Suspense, useEffect, useMemo } from 'react';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import pathnames from './utilities/pathnames';
import QuickstartsTestButtons from './utilities/quickstarts-test-buttons';
import ElementWrapper from './smart-components/common/ElementWrapper';
import { mergeToBasename } from './presentational-components/shared/AppLink';
import { useFlag } from '@unleash/proxy-client-react';

const Overview = lazy(() => import('./smart-components/overview/overview'));

const Users = lazy(() => import('./smart-components/user/users'));
const UserDetail = lazy(() => import('./smart-components/user/user'));
const AddUserToGroup = lazy(() => import('./smart-components/user/add-user-to-group/add-user-to-group'));
const InviteUsersModal = lazy(() => import('./smart-components/user/invite-users/invite-users-modal'));

const Roles = lazy(() => import('./smart-components/role/roles'));
const Role = lazy(() => import('./smart-components/role/role'));
const AddRoleWizard = lazy(() => import('./smart-components/role/add-role/add-role-wizard'));
const EditRole = lazy(() => import('./smart-components/role/edit-role-modal'));
const RemoveRole = lazy(() => import('./smart-components/role/remove-role-modal'));
const AddRolePermissionWizard = lazy(() => import('./smart-components/role/add-role-permissions/add-role-permission-wizard'));
const ResourceDefinitions = lazy(() => import('./smart-components/role/role-resource-definitions'));
const EditResourceDefinitionsModal = lazy(() => import('./smart-components/role/edit-resource-definitions-modal'));

const Groups = lazy(() => import('./smart-components/group/groups'));
const Group = lazy(() => import('./smart-components/group/group'));
const AddGroupWizard = lazy(() => import('./smart-components/group/add-group/add-group-wizard'));
const EditGroup = lazy(() => import('./smart-components/group/edit-group-modal'));
const RemoveGroup = lazy(() => import('./smart-components/group/remove-group-modal'));
const GroupMembers = lazy(() => import('./smart-components/group/member/group-members'));
const GroupRoles = lazy(() => import('./smart-components/group/role/group-roles'));
const GroupServiceAccounts = lazy(() => import('./smart-components/group/service-account/group-service-accounts'));
const AddGroupRoles = lazy(() => import('./smart-components/group/role/add-group-roles'));
const AddGroupMembers = lazy(() => import('./smart-components/group/member/add-group-members'));
const AddGroupServiceAccounts = lazy(() => import('./smart-components/group/service-account/add-group-service-accounts'));
const RemoveServiceAccountFromGroup = lazy(() => import('./smart-components/group/service-account/remove-group-service-accounts'));
const QuickstartsTest = lazy(() => import('./smart-components/quickstarts/quickstarts-test'));

const getRoutes = ({ enableServiceAccounts, isITLess }: Record<string, boolean>) => [
  {
    path: pathnames.overview.path,
    element: Overview,
  },
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
    childRoutes: [
      isITLess && {
        path: pathnames['invite-users'].path,
        element: InviteUsersModal,
      },
    ],
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
    path: pathnames['role-detail-permission'].path,
    element: ResourceDefinitions,
    childRoutes: [
      {
        path: pathnames['role-detail-permission-edit'].path,
        element: EditResourceDefinitionsModal,
      },
    ],
  },
  {
    path: pathnames.roles.path,
    element: Roles,
    childRoutes: [
      {
        path: pathnames['roles-add-group-roles'].path,
        element: AddGroupRoles,
      },
      {
        path: pathnames['add-role'].path,
        element: AddRoleWizard,
      },
      {
        path: pathnames['remove-role'].path,
        element: RemoveRole,
      },
      {
        path: pathnames['edit-role'].path,
        element: EditRole,
      },
    ],
  },

  {
    path: pathnames['group-detail-role-detail'].path,
    element: Role,
  },
  {
    path: pathnames['group-detail'].path,
    element: Group,
    childRoutes: [
      {
        path: pathnames['group-detail'].path,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        element: (({ groupId }) => <Navigate to={mergeToBasename(pathnames['group-detail-roles'].link).replace(':groupId', groupId)} />) as React.FC,
      },
      {
        path: pathnames['group-detail-roles'].path,
        element: GroupRoles,
        childRoutes: [
          {
            path: pathnames['group-roles-edit-group'].path,
            element: EditGroup,
          },
          {
            path: pathnames['group-roles-remove-group'].path,
            element: RemoveGroup,
          },
          {
            path: pathnames['group-add-roles'].path,
            element: AddGroupRoles,
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
      ...(enableServiceAccounts
        ? [
            {
              path: pathnames['group-detail-service-accounts'].path,
              element: GroupServiceAccounts,
              childRoutes: [
                {
                  path: pathnames['group-service-accounts-edit-group'].path,
                  element: EditGroup,
                },
                {
                  path: pathnames['group-service-accounts-remove-group'].path,
                  element: RemoveServiceAccountFromGroup,
                },
                {
                  path: pathnames['group-add-service-account'].path,
                  element: AddGroupServiceAccounts,
                },
              ],
            },
          ]
        : []),
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
  const { updateDocumentTitle, isBeta } = useChrome();
  const isITLess = useFlag('platform.rbac.itless');
  const enableServiceAccounts =
    (isBeta() && useFlag('platform.rbac.group-service-accounts')) || (!isBeta() && useFlag('platform.rbac.group-service-accounts.stable'));

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

  const routes = getRoutes({ enableServiceAccounts, isITLess });
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
