import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';
import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import { Navigate, Route as RouterRoute, Routes as RouterRoutes, matchPath, useLocation } from 'react-router-dom';
import { mergeToBasename, useAppLink } from './hooks/useAppLink';
import { useWorkspacesFlag } from './hooks/useWorkspacesFlag';
import { AppPlaceholder } from './components/ui-states/LoaderPlaceholders';
import ElementWrapper from './components/ElementWrapper';
import PermissionGuard from './components/PermissionGuard';
import EditWorkspaceModal from './features/workspaces/EditWorkspaceModal';
import pathnames from './utilities/pathnames';
import QuickstartsTestButtons from './utilities/quickstartsTestButtons';

const Overview = lazy(() => import('./features/overview/overview'));

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

const getRoutes = ({
  enableServiceAccounts,
  isITLess,
  isCommonAuthModel,
  hideWorkspaceDetails,
  hasWorkspacesList,
  hasAccessManagement,
}: Record<string, boolean>): RootRoute[] => [
  // ===========================================
  // Access Management (V2) - Users & User Groups
  // ===========================================
  {
    path: pathnames['users-and-user-groups'].path,
    element: UsersAndUserGroups,
    permissions: ['rbac:principal:read', 'rbac:group:read'],
    checkAll: false, // OR logic - can see if has users OR groups permission
    childRoutes: [
      {
        path: pathnames['users-new'].path,
        element: AccessManagementUsers,
        permissions: ['rbac:principal:read'],
        inheritPermissions: false, // Tab uses only its own permission
        childRoutes: [
          isCommonAuthModel && {
            path: pathnames['invite-group-users'].path,
            element: InviteUsersModalCommonAuth,
            permissions: ['rbac:principal:write'],
          },
        ].filter(Boolean) as ChildRoute[],
      },
      {
        path: pathnames['user-groups'].path,
        element: AccessManagementUserGroups,
        permissions: ['rbac:group:read'],
        inheritPermissions: false, // Tab uses only its own permission
        childRoutes: [
          {
            path: pathnames['create-user-group'].path,
            element: AddGroupWizard,
            permissions: ['rbac:group:write'],
          },
        ],
      },
    ],
  },
  {
    path: pathnames['users-and-user-groups-edit-group'].path,
    element: EditUserGroup,
    permissions: ['rbac:group:write'],
  },
  {
    path: pathnames['users-and-user-groups-create-group'].path,
    element: (() => <EditUserGroup createNewGroup />) as React.FC,
    permissions: ['rbac:group:write'],
  },

  // ===========================================
  // User Access (V1) - Overview
  // ===========================================
  {
    path: pathnames.overview.path,
    element: hasWorkspacesList ? WorkspacesOverview : Overview,
    permissions: ['rbac:*:read'],
  },

  // ===========================================
  // User Access (V1) - Workspaces
  // ===========================================
  {
    path: pathnames.workspaces.path,
    element: WorkspaceList,
    permissions: ['inventory:groups:read'],
    childRoutes: [
      {
        path: pathnames['create-workspace'].path,
        element: CreateWorkspaceWizard,
        permissions: ['inventory:groups:write'],
      },
      {
        path: pathnames['edit-workspaces-list'].path,
        element: EditWorkspaceModal,
        permissions: ['inventory:groups:write'],
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
    permissions: [],
    requireOrgAdmin: true,
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
          permissions: ['inventory:groups:read'],
          childRoutes: [
            {
              path: pathnames['edit-workspace'].path,
              element: EditWorkspaceModal,
              permissions: ['inventory:groups:write'],
            },
          ],
        } as RootRoute,
      ]),

  // ===========================================
  // User Access (V1) - User Detail
  // ===========================================
  {
    path: pathnames['user-detail'].path,
    element: UserDetail,
    permissions: ['rbac:principal:read'],
    childRoutes: [
      {
        path: pathnames['add-user-to-group'].path,
        element: AddUserToGroup,
        permissions: ['rbac:principal:write'],
      },
      {
        path: pathnames['user-add-group-roles'].path,
        element: AddGroupRoles,
        permissions: ['rbac:group:write'],
      },
    ],
  },

  // ===========================================
  // User Access (V1) - Users
  // ===========================================
  {
    path: pathnames.users.path,
    element: Users,
    permissions: ['rbac:principal:read'],
    childRoutes: [
      (isITLess || isCommonAuthModel) && {
        path: pathnames['invite-users'].path,
        element: isCommonAuthModel ? InviteUsersModalCommonAuth : InviteUsersModal,
        permissions: ['rbac:principal:write'],
      },
    ].filter(Boolean) as ChildRoute[],
  },

  // ===========================================
  // User Access (V1) - Role Detail
  // ===========================================
  {
    path: pathnames['role-detail'].path,
    element: Role,
    permissions: ['rbac:role:read'],
    childRoutes: [
      {
        path: pathnames['role-detail-remove'].path,
        element: RemoveRole,
        permissions: ['rbac:role:write'],
      },
      {
        path: pathnames['role-detail-edit'].path,
        element: EditRole,
        permissions: ['rbac:role:write'],
      },
      {
        path: pathnames['role-add-permission'].path,
        element: AddRolePermissionWizard,
        permissions: ['rbac:role:write'],
      },
    ],
  },

  // ===========================================
  // User Access (V1) - Role Permission Detail
  // ===========================================
  {
    path: pathnames['role-detail-permission'].path,
    element: ResourceDefinitions,
    permissions: ['rbac:role:read'],
    childRoutes: [
      {
        path: pathnames['role-detail-permission-edit'].path,
        element: EditResourceDefinitionsModal,
        permissions: ['rbac:role:write'],
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
          permissions: ['inventory:groups:read'],
          childRoutes: [
            {
              path: pathnames['create-workspace'].path,
              element: CreateWorkspaceWizard,
              permissions: ['inventory:groups:write'],
            },
            {
              path: pathnames['edit-workspaces-list'].path,
              element: EditWorkspaceModal,
              permissions: ['inventory:groups:write'],
            },
          ],
        } as RootRoute,
        // Access Management (V2) - Roles
        {
          path: pathnames['access-management-roles'].path,
          element: RolesWithWorkspaces,
          permissions: ['rbac:role:read'],
          childRoutes: [
            {
              path: pathnames['access-management-add-role'].path,
              element: AddRoleWizard,
              permissions: ['rbac:role:write'],
            },
          ],
        } as RootRoute,
        {
          path: `${pathnames['access-management-roles'].link()}/${pathnames['access-management-edit-role'].path}`,
          element: newEditRole,
          permissions: ['rbac:role:write'],
        } as RootRoute,
      ]
    : [
        // User Access (V1) - Roles
        {
          path: pathnames.roles.path,
          element: Roles,
          permissions: ['rbac:role:read'],
          childRoutes: [
            {
              path: pathnames['roles-add-group-roles'].path,
              element: AddGroupRoles,
              // Inherits read from parent
            },
            {
              path: pathnames['add-role'].path,
              element: AddRoleWizard,
              permissions: ['rbac:role:write'],
            },
            {
              path: pathnames['remove-role'].path,
              element: RemoveRole,
              permissions: ['rbac:role:write'],
            },
            {
              path: pathnames['edit-role'].path,
              element: EditRole,
              permissions: ['rbac:role:write'],
            },
          ],
        } as RootRoute,
      ]),

  // ===========================================
  // User Access (V1) - Group Role Detail (standalone)
  // ===========================================
  {
    path: pathnames['group-detail-role-detail'].path,
    element: Role,
    permissions: ['rbac:role:read'],
  },

  // ===========================================
  // User Access (V1) - Group Detail
  // ===========================================
  {
    path: pathnames['group-detail'].path,
    element: Group,
    permissions: ['rbac:group:read'],
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
            permissions: ['rbac:group:write'],
          },
          {
            path: pathnames['group-roles-remove-group'].path,
            element: RemoveGroup,
            permissions: ['rbac:group:write'],
          },
          {
            path: pathnames['group-add-roles'].path,
            element: AddGroupRoles,
            permissions: ['rbac:group:write'],
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
            permissions: ['rbac:group:write'],
          },
          {
            path: pathnames['group-members-remove-group'].path,
            element: RemoveGroup,
            permissions: ['rbac:group:write'],
          },
          {
            path: pathnames['group-add-members'].path,
            element: AddGroupMembers,
            permissions: ['rbac:group:write'],
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
                  permissions: ['rbac:group:write'],
                },
                {
                  path: pathnames['group-service-accounts-remove-group'].path,
                  element: RemoveServiceAccountFromGroup,
                  permissions: ['rbac:group:write'],
                },
                {
                  path: pathnames['group-add-service-account'].path,
                  element: AddGroupServiceAccounts,
                  permissions: ['rbac:group:write'],
                },
              ],
            } as ChildRoute,
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
    permissions: ['rbac:group:read'],
    childRoutes: [
      {
        path: pathnames['add-group'].path,
        element: AddGroupWizard,
        permissions: ['rbac:group:write'],
      },
      {
        path: pathnames['edit-group'].path,
        element: EditGroup,
        permissions: ['rbac:group:write'],
      },
      {
        path: pathnames['remove-group'].path,
        element: RemoveGroup,
        permissions: ['rbac:group:write'],
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
          permissions: [], // Public
        } as RootRoute,
      ]
    : []),

  // ===========================================
  // My User Access Section
  // ===========================================
  {
    path: pathnames['my-user-access'].path,
    element: MyUserAccessPage,
    permissions: [], // Public - users can see their own access
  },
];

// ===========================================
// Route Type Hierarchy (Compile-Time Enforcement)
// ===========================================

/** Shared properties for all routes */
interface BaseRoute {
  path?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: React.ComponentType<any>;
  elementProps?: Record<string, unknown>;
  /** true = AND logic (default), false = OR logic */
  checkAll?: boolean;
  /** true = requires orgAdmin platform flag (not the same as rbac:*:* permission) */
  requireOrgAdmin?: boolean;
}

/** Child routes - permissions OPTIONAL (inherit from parent if omitted) */
interface ChildRoute extends BaseRoute {
  /** Optional - inherits from parent if omitted */
  permissions?: string[];
  /** true = inherit parent permissions (default), false = own only */
  inheritPermissions?: boolean;
  childRoutes?: ChildRoute[];
}

/** Root routes - permissions REQUIRED (TypeScript enforced) */
interface RootRoute extends BaseRoute {
  /** REQUIRED - compile error if missing */
  permissions: string[];
  childRoutes?: ChildRoute[];
}

// ===========================================
// Route Rendering with Permission Guards
// ===========================================

/** Internal helper for recursive rendering (accepts ChildRoute[] for children) */
const renderChildRoutes = (routes: ChildRoute[] = [], parentPermissions: string[] = [], parentRequireOrgAdmin = false): React.ReactNode =>
  routes
    .filter(Boolean)
    .map(
      ({ path, element: Element, childRoutes, elementProps, permissions, checkAll = true, inheritPermissions = true, requireOrgAdmin = false }) => {
        const ownPermissions = permissions ?? [];
        const effectivePermissions = inheritPermissions ? [...parentPermissions, ...ownPermissions] : ownPermissions;
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
            {renderChildRoutes(childRoutes, effectivePermissions, effectiveRequireOrgAdmin)}
          </RouterRoute>
        );
      },
    );

/** Entry point - accepts RootRoute[] (permissions required) */
const renderRoutes = (routes: RootRoute[]): React.ReactNode =>
  routes.filter(Boolean).map(({ path, element: Element, childRoutes, elementProps, permissions, checkAll = true, requireOrgAdmin = false }) => (
    <RouterRoute
      key={path}
      path={path}
      element={
        <PermissionGuard permissions={permissions} checkAll={checkAll} requireOrgAdmin={requireOrgAdmin}>
          <ElementWrapper path={path}>
            <Element {...elementProps} />
          </ElementWrapper>
        </PermissionGuard>
      }
    >
      {renderChildRoutes(childRoutes, permissions, requireOrgAdmin)}
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
      updateDocumentTitle(`${currPath.title} - User Access`);
    }
  }, [location.pathname, updateDocumentTitle]);

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
