import { useFlag } from '@unleash/proxy-client-react';
import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import { Navigate, Route as RouterRoute, Routes as RouterRoutes, matchPath, useLocation } from 'react-router-dom';
import { mergeToBasename, useAppLink } from './hooks/useAppLink';
import { useWorkspacesFlag } from './hooks/useWorkspacesFlag';
import { usePlatformTracking } from './hooks/usePlatformTracking';
import { AppPlaceholder } from './components/ui-states/LoaderPlaceholders';
import ElementWrapper from './components/ElementWrapper';
import PermissionGuard from './components/PermissionGuard';
import EditWorkspaceModal from './features/workspaces/EditWorkspaceModal';
import pathnames from './utilities/pathnames';
import QuickstartsTestButtons from './utilities/quickstartsTestButtons';
import { type PermissionConfig, getPermissions } from './utilities/route-definitions';

const Overview = lazy(() => import('./features/overview/overview'));
const AuditLog = lazy(() => import('./features/audit-log/AuditLog'));

const WorkspacesOverview = lazy(() => import('./features/workspaces/overview/WorkspacesOverview'));
const WorkspaceList = lazy(() => import('./features/workspaces/WorkspaceList'));
const CreateWorkspaceWizard = lazy(() => import('./features/workspaces/create-workspace/CreateWorkspaceWizard'));
const WorkspaceDetail = lazy(() => import('./features/workspaces/workspace-detail/WorkspaceDetail'));
const Users = lazy(() => import('./features/users/users'));
const UserDetail = lazy(() => import('./features/users/User'));
const AddUserToGroup = lazy(() => import('./features/users/add-user-to-group/AddUserToGroup'));
const InviteUsersModal = lazy(() => import('./features/users/invite-users/InviteUsersModal'));
const InviteUsersModalCommonAuth = lazy(() => import('./features/users/invite-users/invite-users-modal-common-auth'));

const Roles = lazy(() => import('./features/roles/Roles'));
const Role = lazy(() => import('./features/roles/role/Role'));
const AddRoleWizard = lazy(() => import('./features/roles/add-role/AddRoleWizard'));
const EditRole = lazy(() => import('./features/roles/EditRoleModal'));
const RemoveRole = lazy(() => import('./features/roles/RemoveRoleModal'));
const AddRolePermissionWizard = lazy(() => import('./features/roles/add-role-permissions/AddRolePermissionWizard'));
const ResourceDefinitions = lazy(() => import('./features/roles/RoleResourceDefinitions'));
const EditResourceDefinitionsModal = lazy(() => import('./features/roles/EditResourceDefinitionsModal'));
const RolesWithWorkspaces = lazy(() => import('./features/roles/RolesWithWorkspaces'));
const newEditRole = lazy(() => import('./features/roles/edit-role/EditRole'));

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
const MyUserAccessPage = lazy(() => import('./features/myUserAccess/MyUserAccess'));
const OrganizationManagement = lazy(() => import('./features/organization-management/OrganizationManagement'));

/**
 * Helper to get permissions from route-definitions.ts (single source of truth)
 * Use with pathnames[...].link() to get the full path
 */
const p = (fullPath: string): PermissionConfig => getPermissions(fullPath.replace(/\/\*$/, ''));

const getRoutes = ({
  enableServiceAccounts,
  isITLess,
  isCommonAuthModel,
  hideWorkspaceDetails,
  hasWorkspacesList,
  hasAccessManagement,
}: Record<string, boolean>): Route[] => [
  // ===========================================
  // Access Management (V2) - Users & User Groups
  // ===========================================
  {
    path: pathnames['users-and-user-groups'].path,
    element: UsersAndUserGroups,
    ...p(pathnames['users-and-user-groups'].link()),
    childRoutes: [
      {
        path: pathnames['users-new'].path,
        element: AccessManagementUsers,
        ...p(pathnames['users-new'].link()),
        childRoutes: [
          isCommonAuthModel && {
            path: pathnames['invite-group-users'].path,
            element: InviteUsersModalCommonAuth,
            ...p(pathnames['invite-group-users'].link()),
          },
        ].filter(Boolean) as Route[],
      },
      {
        path: pathnames['user-groups'].path,
        element: AccessManagementUserGroups,
        ...p(pathnames['user-groups'].link()),
        childRoutes: [
          {
            path: pathnames['create-user-group'].path,
            element: AddGroupWizard,
            ...p(pathnames['create-user-group'].link()),
          },
        ],
      },
    ],
  },
  {
    path: pathnames['users-and-user-groups-edit-group'].path,
    element: EditUserGroup,
    ...p(pathnames['users-and-user-groups-edit-group'].link(':groupId')),
  },
  {
    path: pathnames['users-and-user-groups-create-group'].path,
    element: (() => <EditUserGroup createNewGroup />) as React.FC,
    ...p(pathnames['users-and-user-groups-create-group'].link()),
  },

  // ===========================================
  // User Access (V1) - Overview
  // ===========================================
  {
    path: pathnames.overview.path,
    element: hasWorkspacesList ? WorkspacesOverview : Overview,
    ...p(pathnames.overview.link()),
  },

  // ===========================================
  // User Access (V1) - Audit Log
  // ===========================================
  {
    path: pathnames['audit-log'].path,
    element: AuditLog,
    ...p(pathnames['audit-log'].link()),
  },

  // ===========================================
  // User Access (V1) - Workspaces
  // ===========================================
  {
    path: pathnames.workspaces.path,
    element: WorkspaceList,
    ...p(pathnames.workspaces.link()),
    childRoutes: [
      {
        path: pathnames['create-workspace'].path,
        element: CreateWorkspaceWizard,
        ...p(pathnames['create-workspace'].link()),
      },
      {
        path: pathnames['edit-workspaces-list'].path,
        element: EditWorkspaceModal,
        ...p(pathnames['edit-workspaces-list'].link(':workspaceId')),
      },
    ],
  },

  // ===========================================
  // Organization Management
  // Requires orgAdmin platform flag (not the same as rbac:*:* permission)
  // ===========================================
  {
    path: pathnames['organization-management'].path,
    element: OrganizationManagement,
    ...p(pathnames['organization-management'].link()),
  },

  // ===========================================
  // User Access (V1) - Workspace Detail
  // ===========================================
  ...(hideWorkspaceDetails
    ? []
    : [
        {
          path: pathnames['workspace-detail'].path,
          element: WorkspaceDetail,
          ...p(pathnames['workspace-detail'].link(':workspaceId')),
          childRoutes: [
            {
              path: pathnames['edit-workspace'].path,
              element: EditWorkspaceModal,
              ...p(pathnames['edit-workspace'].link(':workspaceId')),
            },
          ],
        },
      ]),

  // ===========================================
  // User Access (V1) - User Detail
  // ===========================================
  {
    path: pathnames['user-detail'].path,
    element: UserDetail,
    ...p(pathnames['user-detail'].link(':username')),
    childRoutes: [
      {
        path: pathnames['add-user-to-group'].path,
        element: AddUserToGroup,
        ...p(pathnames['add-user-to-group'].link(':username')),
      },
      {
        path: pathnames['user-add-group-roles'].path,
        element: AddGroupRoles,
        ...p(pathnames['user-add-group-roles'].link(':username', ':groupId')),
      },
    ],
  },

  // ===========================================
  // User Access (V1) - Users
  // ===========================================
  {
    path: pathnames.users.path,
    element: Users,
    ...p(pathnames.users.link()),
    childRoutes: [
      (isITLess || isCommonAuthModel) && {
        path: pathnames['invite-users'].path,
        element: isCommonAuthModel ? InviteUsersModalCommonAuth : InviteUsersModal,
        ...p(pathnames['invite-users'].link()),
      },
    ].filter(Boolean) as Route[],
  },

  // ===========================================
  // User Access (V1) - Role Detail
  // ===========================================
  {
    path: pathnames['role-detail'].path,
    element: Role,
    ...p(pathnames['role-detail'].link(':roleId')),
    childRoutes: [
      {
        path: pathnames['role-detail-remove'].path,
        element: RemoveRole,
        ...p(pathnames['role-detail-remove'].link(':roleId')),
      },
      {
        path: pathnames['role-detail-edit'].path,
        element: EditRole,
        ...p(pathnames['role-detail-edit'].link(':roleId')),
      },
      {
        path: pathnames['role-add-permission'].path,
        element: AddRolePermissionWizard,
        ...p(pathnames['role-add-permission'].link(':roleId')),
      },
    ],
  },

  // ===========================================
  // User Access (V1) - Role Permission Detail
  // ===========================================
  {
    path: pathnames['role-detail-permission'].path,
    element: ResourceDefinitions,
    ...p(pathnames['role-detail-permission'].link(':roleId', ':permissionId')),
    childRoutes: [
      {
        path: pathnames['role-detail-permission-edit'].path,
        element: EditResourceDefinitionsModal,
        ...p(pathnames['role-detail-permission-edit'].link(':roleId', ':permissionId')),
      },
    ],
  },

  // ===========================================
  // Roles - V2 (Access Management) or V1 (User Access)
  // ===========================================
  ...(hasAccessManagement
    ? [
        // Access Management (V2) - Workspaces
        {
          path: pathnames['access-management-workspaces'].path,
          element: WorkspaceList,
          ...p(pathnames['access-management-workspaces'].link()),
          childRoutes: [
            {
              path: pathnames['create-workspace'].path,
              element: CreateWorkspaceWizard,
              ...p(pathnames['create-workspace'].link()),
            },
            {
              path: pathnames['edit-workspaces-list'].path,
              element: EditWorkspaceModal,
              ...p(pathnames['edit-workspaces-list'].link(':workspaceId')),
            },
          ],
        },
        // Access Management (V2) - Roles
        {
          path: pathnames['access-management-roles'].path,
          element: RolesWithWorkspaces,
          ...p(pathnames['access-management-roles'].link()),
          childRoutes: [
            {
              path: pathnames['access-management-add-role'].path,
              element: AddRoleWizard,
              ...p(pathnames['access-management-add-role'].link()),
            },
          ],
        },
        {
          path: `${pathnames['access-management-roles'].link()}/${pathnames['access-management-edit-role'].path}`,
          element: newEditRole,
          ...p(pathnames['access-management-edit-role'].link(':roleId')),
        },
      ]
    : [
        // User Access (V1) - Roles
        {
          path: pathnames.roles.path,
          element: Roles,
          ...p(pathnames.roles.link()),
          childRoutes: [
            {
              path: pathnames['roles-add-group-roles'].path,
              element: AddGroupRoles,
              // Inherits read from parent (no permissions override)
            },
            {
              path: pathnames['add-role'].path,
              element: AddRoleWizard,
              ...p(pathnames['add-role'].link()),
            },
            {
              path: pathnames['remove-role'].path,
              element: RemoveRole,
              ...p(pathnames['remove-role'].link(':roleId')),
            },
            {
              path: pathnames['edit-role'].path,
              element: EditRole,
              ...p(pathnames['edit-role'].link(':roleId')),
            },
          ],
        },
      ]),

  // ===========================================
  // User Access (V1) - Group Role Detail (standalone)
  // ===========================================
  {
    path: pathnames['group-detail-role-detail'].path,
    element: Role,
    ...p(pathnames['group-detail-role-detail'].link(':groupId', ':roleId')),
  },

  // ===========================================
  // User Access (V1) - Group Detail
  // ===========================================
  {
    path: pathnames['group-detail'].path,
    element: Group,
    ...p(pathnames['group-detail'].link(':groupId')),
    childRoutes: [
      {
        path: pathnames['group-detail'].path,
        // @ts-ignore
        element: (({ groupId }) => <Navigate to={mergeToBasename(pathnames['group-detail-roles'].link).replace(':groupId', groupId)} />) as React.FC,
        // Inherits read from parent
      },
      {
        path: pathnames['group-detail-roles'].path,
        element: GroupRoles,
        // Inherits read from parent
        childRoutes: [
          {
            path: pathnames['group-roles-edit-group'].path,
            element: EditGroup,
            ...p(pathnames['group-roles-edit-group'].link(':groupId')),
          },
          {
            path: pathnames['group-roles-remove-group'].path,
            element: RemoveGroup,
            ...p(pathnames['group-roles-remove-group'].link(':groupId')),
          },
          {
            path: pathnames['group-add-roles'].path,
            element: AddGroupRoles,
            ...p(pathnames['group-add-roles'].link(':groupId')),
          },
        ],
      },
      {
        path: pathnames['group-detail-members'].path,
        element: GroupMembers,
        // Inherits read from parent
        childRoutes: [
          {
            path: pathnames['group-members-edit-group'].path,
            element: EditGroup,
            ...p(pathnames['group-members-edit-group'].link(':groupId')),
          },
          {
            path: pathnames['group-members-remove-group'].path,
            element: RemoveGroup,
            ...p(pathnames['group-members-remove-group'].link(':groupId')),
          },
          {
            path: pathnames['group-add-members'].path,
            element: AddGroupMembers,
            ...p(pathnames['group-add-members'].link(':groupId')),
          },
        ],
      },
      ...(enableServiceAccounts
        ? [
            {
              path: pathnames['group-detail-service-accounts'].path,
              element: GroupServiceAccounts,
              // Inherits read from parent
              childRoutes: [
                {
                  path: pathnames['group-service-accounts-edit-group'].path,
                  element: EditGroup,
                  ...p(pathnames['group-service-accounts-edit-group'].link(':groupId')),
                },
                {
                  path: pathnames['group-service-accounts-remove-group'].path,
                  element: RemoveServiceAccountFromGroup,
                  ...p(pathnames['group-service-accounts-remove-group'].link(':groupId')),
                },
                {
                  path: pathnames['group-add-service-account'].path,
                  element: AddGroupServiceAccounts,
                  ...p(pathnames['group-add-service-account'].link(':groupId')),
                },
              ],
            },
          ]
        : []),
    ],
  },

  // ===========================================
  // User Access (V1) - Groups
  // ===========================================
  {
    path: pathnames.groups.path,
    element: Groups,
    ...p(pathnames.groups.link()),
    childRoutes: [
      {
        path: pathnames['add-group'].path,
        element: AddGroupWizard,
        ...p(pathnames['add-group'].link()),
      },
      {
        path: pathnames['edit-group'].path,
        element: EditGroup,
        ...p(pathnames['edit-group'].link(':groupId')),
      },
      {
        path: pathnames['remove-group'].path,
        element: RemoveGroup,
        ...p(pathnames['remove-group'].link(':groupId')),
      },
    ],
  },

  // ===========================================
  // Quickstarts (dev only)
  // ===========================================
  ...(localStorage.getItem('quickstarts:enabled') === 'true'
    ? [
        {
          path: pathnames['quickstarts-test'].path,
          element: QuickstartsTest,
          ...p(pathnames['quickstarts-test'].link()),
        },
      ]
    : []),

  // ===========================================
  // My User Access Section
  // ===========================================
  {
    path: pathnames['my-user-access'].path,
    element: MyUserAccessPage,
    ...p(pathnames['my-user-access'].link()),
  },
];

// ===========================================
// Route Type (unified for root and child routes)
// ===========================================

interface Route {
  path?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: React.ComponentType<any>;
  elementProps?: Record<string, unknown>;
  /** Required permissions (empty = public route) */
  permissions?: string[];
  /** true = inherit parent permissions (default), false = own only */
  inheritPermissions?: boolean;
  /** true = AND logic (default), false = OR logic */
  checkAll?: boolean;
  /** true = requires orgAdmin platform flag */
  requireOrgAdmin?: boolean;
  childRoutes?: Route[];
}

// ===========================================
// Route Rendering with Permission Guards
// ===========================================

/** Recursive route renderer with permission inheritance */
const renderRoutes = (routes: Route[], parentPermissions: string[] = [], parentRequireOrgAdmin = false): React.ReactNode =>
  routes
    .filter(Boolean)
    .map(
      ({
        path,
        element: Element,
        childRoutes,
        elementProps,
        permissions = [],
        inheritPermissions = true,
        checkAll = true,
        requireOrgAdmin = false,
      }) => {
        const effectivePermissions = inheritPermissions ? [...parentPermissions, ...permissions] : permissions;
        const effectiveRequireOrgAdmin = inheritPermissions ? parentRequireOrgAdmin || requireOrgAdmin : requireOrgAdmin;

        return (
          <RouterRoute
            key={path}
            path={path}
            element={
              <PermissionGuard permissions={effectivePermissions} checkAll={checkAll} requireOrgAdmin={effectiveRequireOrgAdmin}>
                <ElementWrapper path={path}>
                  <Element {...elementProps} />
                </ElementWrapper>
              </PermissionGuard>
            }
          >
            {renderRoutes(childRoutes ?? [], effectivePermissions, effectiveRequireOrgAdmin)}
          </RouterRoute>
        );
      },
    );

const Routing = () => {
  const location = useLocation();
  const { setDocumentTitle } = usePlatformTracking();
  const isITLess = useFlag('platform.rbac.itless');
  const isCommonAuthModel = useFlag('platform.rbac.common-auth-model');
  const enableServiceAccounts = useFlag('platform.rbac.group-service-accounts.stable');

  // Workspace feature flags
  const hasRbacDetailPages = useWorkspacesFlag('m3'); // M3 or master flag
  const hasWorkspacesList = useWorkspacesFlag('m1'); // M1 or higher
  const isWorkspacesFlag = useWorkspacesFlag('m5'); // Master flag (for routing config)
  const hideWorkspaceDetails = hasWorkspacesList && !hasRbacDetailPages; // M1-M2 only (no RBAC detail pages yet)
  const hasAccessManagement = useFlag('platform.rbac.workspaces-organization-management'); // Controls access-management routes
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
      setDocumentTitle(`${currPath.title} - User Access`);
    }
  }, [location.pathname, setDocumentTitle]);

  const routes = getRoutes({
    enableServiceAccounts,
    isITLess,
    isWorkspacesFlag,
    isCommonAuthModel,
    hideWorkspaceDetails,
    hasWorkspacesList,
    hasAccessManagement,
  });
  const renderedRoutes = useMemo(() => renderRoutes(routes), [routes]);

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <QuickstartsTestButtons />
      <RouterRoutes>
        {renderedRoutes}
        {/* Catch all unmatched routes - redirect to My User Access */}
        <RouterRoute path="*" element={<Navigate to={toAppLink(pathnames['my-user-access'].link())} />} />
      </RouterRoutes>
    </Suspense>
  );
};

export default Routing;
