/**
 * Pathnames configuration for V2 (Access Management) features.
 *
 * With the unified /iam basename, all paths are prefixed with /access-management/*.
 * The `path` property is what react-router matches against (relative to /iam basename).
 * The `link` property is a function for navigation (also relative to /iam basename).
 */

import type { PathnameConfig } from '../../shared/utilities/pathnames';

// ===========================================
// Overview
// ===========================================

const overview: PathnameConfig = {
  link: () => '/overview',
  path: '/overview/*',
  title: 'Overview',
};

// ===========================================
// My Access
// ===========================================

const myAccess: PathnameConfig = {
  link: () => '/my-access',
  path: '/my-access/*',
  title: 'My Access',
};

const myAccessGroups: PathnameConfig = {
  link: () => '/my-access/groups',
  path: 'groups/*',
  title: 'My Access',
};

const myAccessWorkspaces: PathnameConfig = {
  link: () => '/my-access/workspaces',
  path: 'workspaces/*',
  title: 'My Access',
};

// ===========================================
// Organization Management
// ===========================================

const organizationManagement: PathnameConfig = {
  link: () => '/organization-management/organization-wide-access',
  path: '/organization-management/organization-wide-access/*',
  title: 'Organization Management',
};

// ===========================================
// Access Management Section - /access-management/*
// ===========================================

const usersAndUserGroups: PathnameConfig = {
  link: () => '/access-management/users-and-user-groups',
  path: '/access-management/users-and-user-groups/*',
  title: 'Users & User Groups',
};

const usersNew: PathnameConfig = {
  link: () => '/access-management/users-and-user-groups/users',
  path: 'users/*',
  title: 'Users & User Groups',
};

const userGroups: PathnameConfig = {
  link: () => '/access-management/users-and-user-groups/user-groups',
  path: 'user-groups/*',
  title: 'Users & User Groups',
};

const usersAndUserGroupsEditGroup: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/access-management/users-and-user-groups/edit-group/${groupId}`,
  path: '/access-management/users-and-user-groups/edit-group/:groupId',
  title: 'Edit group',
};

const usersAndUserGroupsCreateGroup: PathnameConfig = {
  link: () => '/access-management/users-and-user-groups/create-group',
  path: '/access-management/users-and-user-groups/create-group',
  title: 'Create user group',
};

const inviteGroupUsers: PathnameConfig = {
  link: () => '/access-management/users-and-user-groups/users/invite',
  path: 'invite',
  title: 'Users & User Groups',
};

const createUserGroup: PathnameConfig = {
  link: () => '/access-management/users-and-user-groups/user-groups/create-user-group',
  path: 'create-user-group',
  title: 'Users & User Groups',
};

const accessManagementRoles: PathnameConfig = {
  link: () => '/access-management/roles',
  path: '/access-management/roles/*',
  title: 'Roles',
};

const accessManagementAddRole: PathnameConfig = {
  link: () => '/access-management/roles/add-role',
  path: 'add-role',
  title: 'Add role',
};

const accessManagementEditRole: PathnameConfig<(roleId: string) => string> = {
  link: (roleId) => `/access-management/roles/edit/${roleId}`,
  path: 'edit/:roleId',
  title: 'Edit role',
};

const accessManagementWorkspaces: PathnameConfig = {
  link: () => '/access-management/workspaces',
  path: '/access-management/workspaces/*',
  title: 'Workspaces',
};

// ===========================================
// Workspace paths (V2 access-management routes)
// ===========================================

const workspaceDetail: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/detail/${workspaceId}`,
  path: '/access-management/workspaces/detail/:workspaceId/*',
  title: 'Workspace detail',
};

const editWorkspacesList: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/edit/${workspaceId}`,
  path: 'edit/:workspaceId',
  title: 'Edit Workspace',
};

const createWorkspace: PathnameConfig = {
  link: () => '/access-management/workspaces/create-workspace',
  path: 'create-workspace',
  title: 'Create workspace',
};

const editWorkspace: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/detail/${workspaceId}/edit`,
  path: 'edit',
  title: 'Edit Workspace',
};

// TODO: V1 roleDetail path used by V2 GroupDetailsDrawer. Migrate when V2 role detail routes exist.
const roleDetail: PathnameConfig<(roleId: string) => string> = {
  link: (roleId) => `/user-access/roles/detail/${roleId}`,
  path: '/user-access/roles/detail/:roleId/*',
  title: 'Role',
};

// ===========================================
// Workspace actions — list-level (children of WorkspaceList outlet)
// ===========================================

const createSubWorkspace: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/${workspaceId}/create-sub-workspace`,
  path: ':workspaceId/create-sub-workspace',
  title: 'Create sub-workspace',
};

const createSiblingWorkspace: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/${workspaceId}/create-sibling-workspace`,
  path: ':workspaceId/create-sibling-workspace',
  title: 'Create sibling workspace',
};

const moveWorkspace: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/${workspaceId}/move`,
  path: ':workspaceId/move',
  title: 'Move workspace',
};

const deleteWorkspace: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/${workspaceId}/delete`,
  path: ':workspaceId/delete',
  title: 'Delete workspace',
};

// ===========================================
// Workspace detail tabs (parallel Routes inside WorkspaceDetailShell)
// ===========================================

const workspaceDetailDirectRoles: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/detail/${workspaceId}/direct-roles`,
  path: 'direct-roles',
  title: 'Workspace detail - Direct role assignments',
};

const workspaceDetailDirectRolesGroup: PathnameConfig<(workspaceId: string, groupId: string) => string> = {
  link: (workspaceId, groupId) => `/access-management/workspaces/detail/${workspaceId}/direct-roles/${groupId}`,
  path: 'direct-roles/:groupId/*',
  title: 'Workspace detail - Group drawer',
};

const workspaceDetailInheritedRoles: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/detail/${workspaceId}/inherited-roles`,
  path: 'inherited-roles',
  title: 'Workspace detail - Inherited roles',
};

const workspaceDetailAssets: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/detail/${workspaceId}/assets`,
  path: 'assets',
  title: 'Workspace detail - Assets',
};

// ===========================================
// Workspace detail modal overlays (parallel Routes inside WorkspaceDetailShell)
// ===========================================

const workspaceDetailGrantAccess: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/detail/${workspaceId}/grant-access`,
  path: 'grant-access',
  title: 'Grant access to workspace',
};

const workspaceDetailEditAccess: PathnameConfig<(workspaceId: string, groupId: string) => string> = {
  link: (workspaceId, groupId) => `/access-management/workspaces/detail/${workspaceId}/direct-roles/${groupId}/edit-access`,
  path: 'direct-roles/:groupId/edit-access',
  title: 'Edit access',
};

// ===========================================
// Workspace actions — detail-level (children of WorkspaceDetail outlet)
// ===========================================

const moveWorkspaceDetail: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/detail/${workspaceId}/move`,
  path: 'move',
  title: 'Move workspace',
};

const deleteWorkspaceDetail: PathnameConfig<(workspaceId: string) => string> = {
  link: (workspaceId) => `/access-management/workspaces/detail/${workspaceId}/delete`,
  path: 'delete',
  title: 'Delete workspace',
};

// ===========================================
// Role Access Modal
// ===========================================

const workspaceRoleAccess: PathnameConfig<(workspaceId: string, groupId: string) => string> = {
  link: (workspaceId, groupId) => `/access-management/workspaces/detail/${workspaceId}/role-access/${groupId}`,
  path: 'role-access/:groupId',
  title: 'Edit access',
};

// ===========================================
// Organization Management modal overlays
// ===========================================

const orgManagementGrantAccess: PathnameConfig = {
  link: () => '/organization-management/organization-wide-access/grant-access',
  path: 'grant-access',
  title: 'Grant organization-wide access',
};

const orgManagementGroup: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/organization-management/organization-wide-access/${groupId}`,
  path: ':groupId',
  title: 'Organization Management - Group drawer',
};

const orgManagementEditAccess: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/organization-management/organization-wide-access/${groupId}/edit-access`,
  path: ':groupId/edit-access',
  title: 'Organization Management - Edit access',
};

// ===========================================
// Audit Log
// ===========================================

const accessManagementAuditLog: PathnameConfig = {
  link: () => '/access-management/audit-log',
  path: '/access-management/audit-log',
  title: 'Audit Log',
};

// ===========================================
// Export
// ===========================================

const pathnames = {
  overview,
  'my-access': myAccess,
  'my-access-groups': myAccessGroups,
  'my-access-workspaces': myAccessWorkspaces,
  'organization-management': organizationManagement,
  workspaces: accessManagementWorkspaces,
  'users-and-user-groups': usersAndUserGroups,
  'users-new': usersNew,
  'user-groups': userGroups,
  'users-and-user-groups-edit-group': usersAndUserGroupsEditGroup,
  'users-and-user-groups-create-group': usersAndUserGroupsCreateGroup,
  'invite-group-users': inviteGroupUsers,
  'create-user-group': createUserGroup,
  'access-management-roles': accessManagementRoles,
  'access-management-add-role': accessManagementAddRole,
  'access-management-edit-role': accessManagementEditRole,
  'access-management-workspaces': accessManagementWorkspaces,
  'workspace-detail': workspaceDetail,
  'edit-workspaces-list': editWorkspacesList,
  'create-workspace': createWorkspace,
  'edit-workspace': editWorkspace,
  'role-detail': roleDetail,
  'workspace-role-access': workspaceRoleAccess,
  'access-management-audit-log': accessManagementAuditLog,
  'create-sub-workspace': createSubWorkspace,
  'create-sibling-workspace': createSiblingWorkspace,
  'move-workspace': moveWorkspace,
  'delete-workspace': deleteWorkspace,
  'move-workspace-detail': moveWorkspaceDetail,
  'delete-workspace-detail': deleteWorkspaceDetail,
  'workspace-detail-direct-roles': workspaceDetailDirectRoles,
  'workspace-detail-direct-roles-group': workspaceDetailDirectRolesGroup,
  'workspace-detail-inherited-roles': workspaceDetailInheritedRoles,
  'workspace-detail-assets': workspaceDetailAssets,
  'workspace-detail-grant-access': workspaceDetailGrantAccess,
  'workspace-detail-edit-access': workspaceDetailEditAccess,
  'org-management-grant-access': orgManagementGrantAccess,
  'org-management-group': orgManagementGroup,
  'org-management-edit-access': orgManagementEditAccess,
} as const;

export default pathnames;

export {
  overview,
  myAccess,
  myAccessGroups,
  myAccessWorkspaces,
  organizationManagement,
  usersAndUserGroups,
  usersNew,
  userGroups,
  usersAndUserGroupsEditGroup,
  usersAndUserGroupsCreateGroup,
  inviteGroupUsers,
  createUserGroup,
  accessManagementRoles,
  accessManagementAddRole,
  accessManagementEditRole,
  accessManagementWorkspaces,
  workspaceDetail,
  editWorkspacesList,
  createWorkspace,
  editWorkspace,
  roleDetail,
  workspaceRoleAccess,
  accessManagementAuditLog,
  createSubWorkspace,
  createSiblingWorkspace,
  moveWorkspace,
  deleteWorkspace,
  moveWorkspaceDetail,
  deleteWorkspaceDetail,
  workspaceDetailDirectRoles,
  workspaceDetailDirectRolesGroup,
  workspaceDetailInheritedRoles,
  workspaceDetailAssets,
  workspaceDetailGrantAccess,
  workspaceDetailEditAccess,
  orgManagementGrantAccess,
  orgManagementGroup,
};

export type { PathnameConfig };
