import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';
import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import { Navigate, Route as RouterRoute, Routes as RouterRoutes, matchPath, useLocation } from 'react-router-dom';
import { mergeToBasename, useAppLink } from './hooks/useAppLink';
import { useWorkspacesFlag } from './hooks/useWorkspacesFlag';
import { AppPlaceholder } from './components/ui-states/LoaderPlaceholders';
import ElementWrapper from './components/ElementWrapper';
import EditWorkspaceModal from './features/workspaces/EditWorkspaceModal';
import pathnames from './utilities/pathnames';
import QuickstartsTestButtons from './utilities/quickstartsTestButtons';

const Overview = lazy(() => import('./features/overview/overview'));

const WorkspacesOverview = lazy(() => import('./features/workspaces/overview/WorkspacesOverview'));
const WorkspaceList = lazy(() => import('./features/workspaces/WorkspaceList'));
const CreateWorkspaceWizard = lazy(() => import('./features/workspaces/create-workspace/CreateWorkspaceWizard'));
const WorkspaceDetail = lazy(() => import('./features/workspaces/workspace-detail/WorkspaceDetail'));
const Users = lazy(() => import('./features/users/users'));
const UserDetail = lazy(() => import('./features/users/user'));
const AddUserToGroup = lazy(() => import('./features/users/add-user-to-group/add-user-to-group'));
const InviteUsersModal = lazy(() => import('./features/users/invite-users/invite-users-modal'));
const InviteUsersModalCommonAuth = lazy(() => import('./features/users/invite-users/invite-users-modal-common-auth'));

const Roles = lazy(() => import('./features/roles/Roles'));
const Role = lazy(() => import('./features/roles/role'));
const AddRoleWizard = lazy(() => import('./features/roles/add-role/add-role-wizard'));
const EditRole = lazy(() => import('./features/roles/edit-role-modal'));
const RemoveRole = lazy(() => import('./features/roles/remove-role-modal'));
const AddRolePermissionWizard = lazy(() => import('./features/roles/add-role-permissions/add-role-permission-wizard'));
const ResourceDefinitions = lazy(() => import('./features/roles/role-resource-definitions'));
const EditResourceDefinitionsModal = lazy(() => import('./features/roles/edit-resource-definitions-modal'));
const RolesWithWorkspaces = lazy(() => import('./features/roles/RolesWithWorkspaces'));
const newEditRole = lazy(() => import('./features/roles/edit-role/edit-role'));

const Groups = lazy(() => import('./features/groups/Groups'));
const Group = lazy(() => import('./features/groups/group/Group'));
const AddGroupWizard = lazy(() => import('./features/groups/add-group/AddGroupWizard'));
const EditGroup = lazy(() => import('./features/groups/EditGroupModal'));
const RemoveGroup = lazy(() => import('./features/groups/RemoveGroupModal'));
const GroupMembers = lazy(() => import('./features/groups/group/members/GroupMembers'));
const GroupRoles = lazy(() => import('./features/groups/group/role/GroupRoles'));
const GroupServiceAccounts = lazy(() => import('./features/groups/group/service-account/GroupServiceAccounts'));
const AddGroupRoles = lazy(() => import('./features/groups/group/role/AddGroupRoles'));
const AddGroupMembers = lazy(() => import('./features/groups/group/member/AddGroupMembers'));
const AddGroupServiceAccounts = lazy(() => import('./features/groups/group/service-account/AddGroupServiceAccounts'));
const RemoveServiceAccountFromGroup = lazy(() => import('./features/groups/group/service-account/RemoveGroupServiceAccounts'));
const QuickstartsTest = lazy(() => import('./features/quickstarts/QuickstartsTest'));

const UsersAndUserGroups = lazy(() => import('./features/access-management/users-and-user-groups/UsersAndUserGroups'));
const AccessManagementUsers = lazy(() => import('./features/access-management/users-and-user-groups/users/Users'));
const AccessManagementUserGroups = lazy(() => import('./features/access-management/users-and-user-groups/user-groups/UserGroups'));
const EditUserGroup = lazy(() => import('./features/access-management/users-and-user-groups/user-groups/edit-user-group/EditUserGroup'));

const getRoutes = ({ enableServiceAccounts, isITLess, isWorkspacesFlag, isCommonAuthModel, hideWorkspaceDetails }: Record<string, boolean>) => [
  {
    path: pathnames['users-and-user-groups'].path,
    element: UsersAndUserGroups,
    childRoutes: [
      {
        path: pathnames['users-new'].path,
        element: AccessManagementUsers,
        childRoutes: [
          isCommonAuthModel && {
            path: pathnames['invite-group-users'].path,
            element: InviteUsersModalCommonAuth,
          },
        ],
      },
      {
        path: pathnames['user-groups'].path,
        element: AccessManagementUserGroups,
        childRoutes: [
          {
            path: pathnames['create-user-group'].path,
            element: AddGroupWizard,
          },
        ],
      },
    ],
  },
  {
    path: pathnames['users-and-user-groups-edit-group'].path,
    element: EditUserGroup,
  },
  {
    path: pathnames['users-and-user-groups-create-group'].path,
    element: (() => <EditUserGroup createNewGroup />) as React.FC,
  },
  {
    path: pathnames.overview.path,
    element: isWorkspacesFlag ? WorkspacesOverview : Overview,
  },
  {
    path: pathnames.workspaces.path,
    element: WorkspaceList,
    childRoutes: [
      {
        path: pathnames['create-workspace'].path,
        element: CreateWorkspaceWizard,
      },
      {
        path: pathnames['edit-workspaces-list'].path,
        element: EditWorkspaceModal,
      },
    ],
  },
  !hideWorkspaceDetails && {
    path: pathnames['workspace-detail'].path,
    element: WorkspaceDetail,
    childRoutes: [
      {
        path: pathnames['edit-workspace'].path,
        element: EditWorkspaceModal,
      },
    ],
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
      (isITLess || isCommonAuthModel) && {
        path: pathnames['invite-users'].path,
        element: isCommonAuthModel ? InviteUsersModalCommonAuth : InviteUsersModal,
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
  ...(!isWorkspacesFlag
    ? [
        {
          path: pathnames.roles.path,
          element: RolesWithWorkspaces,
          childRoutes: [
            {
              path: pathnames['add-role'].path,
              element: AddRoleWizard,
            },
          ],
        },
        {
          path: `${pathnames.roles.link}/${pathnames['edit-role'].path}`,
          element: newEditRole,
        },
      ]
    : [
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
      ]),

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

  ...(localStorage.getItem('quickstarts:enabled') === 'true'
    ? [
        {
          path: pathnames['quickstarts-test'].path,
          element: QuickstartsTest,
        },
      ]
    : []),
];

interface RouteType {
  path?: string;
  element: React.ComponentType;
  childRoutes?: RouteType[];
  elementProps?: Record<string, unknown>;
}

const renderRoutes = (routes: RouteType[] = []) =>
  routes
    .filter(Boolean) // Filter out falsy values (false, null, undefined)
    .map(({ path, element: Element, childRoutes, elementProps }) => (
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
  const isCommonAuthModel = useFlag('platform.rbac.common-auth-model');
  const enableServiceAccounts =
    (isBeta() && useFlag('platform.rbac.group-service-accounts')) || (!isBeta() && useFlag('platform.rbac.group-service-accounts.stable'));

  // Workspace feature flags
  const hasRbacDetailPages = useWorkspacesFlag('m3'); // M3 or master flag
  const hasWorkspacesList = useWorkspacesFlag('m1'); // M1 or higher
  const isWorkspacesFlag = useWorkspacesFlag('m5'); // Master flag (for routing config)
  const hideWorkspaceDetails = hasWorkspacesList && !hasRbacDetailPages; // M1-M2 only (no RBAC detail pages yet)
  const toAppLink = useAppLink();

  useEffect(() => {
    const currPath = Object.values(pathnames).find(
      (item) =>
        !!matchPath(
          {
            path: item.path,
            end: true,
          },
          location.pathname,
        ),
    );
    if (currPath?.title) {
      updateDocumentTitle(`${currPath.title} - User Access`);
    }
  }, [location.pathname, updateDocumentTitle]);

  const routes = getRoutes({
    enableServiceAccounts,
    isITLess,
    isWorkspacesFlag,
    isCommonAuthModel,
    hideWorkspaceDetails,
  });
  const renderedRoutes = useMemo(() => renderRoutes(routes as never), [routes]);

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <QuickstartsTestButtons />
      <RouterRoutes>
        {renderedRoutes}
        {/* Catch all unmatched routes */}
        <RouterRoute path="*" element={<Navigate to={toAppLink(pathnames.users.link)} />} />
      </RouterRoutes>
    </Suspense>
  );
};

export default Routing;
