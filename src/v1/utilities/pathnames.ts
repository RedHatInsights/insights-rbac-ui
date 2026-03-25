/**
 * Pathnames configuration for V1 (User Access) features.
 *
 * With the unified /iam basename, all paths are prefixed with /user-access/*.
 * The `path` property is what react-router matches against (relative to /iam basename).
 * The `link` property is a function for navigation (also relative to /iam basename).
 */

import type { PathnameConfig } from '../../shared/utilities/pathnames';

// ===========================================
// Root
// ===========================================

const rbac: PathnameConfig = {
  link: () => '/',
  path: '/',
  title: 'User Access',
};

// ===========================================
// User Access Section - /user-access/*
// ===========================================

const overview: PathnameConfig = {
  link: () => '/user-access/overview',
  path: '/user-access/overview/*',
  title: 'Overview',
};

const users: PathnameConfig = {
  link: () => '/user-access/users',
  path: '/user-access/users',
  title: 'Users',
};

const inviteUsers: PathnameConfig = {
  link: () => '/user-access/users/invite',
  path: 'invite',
  title: 'Invite users',
};

const userDetail: PathnameConfig<(username: string) => string> = {
  link: (username) => `/user-access/users/detail/${username}`,
  path: '/user-access/users/detail/:username/*',
  title: 'User',
};

const addUserToGroup: PathnameConfig<(username: string) => string> = {
  link: (username) => `/user-access/users/detail/${username}/add-to-group`,
  path: 'add-to-group',
  title: 'Add user to a group',
};

const userAddGroupRoles: PathnameConfig<(username: string, groupId: string) => string> = {
  link: (username, groupId) => `/user-access/users/detail/${username}/add-group-roles/${groupId}`,
  path: 'add-group-roles/:groupId',
  title: 'Add group roles',
};

const roles: PathnameConfig = {
  link: () => '/user-access/roles',
  path: '/user-access/roles/*',
  title: 'Roles',
};

const rolesAddGroupRoles: PathnameConfig<(roleId: string, groupId: string) => string> = {
  link: (roleId, groupId) => `/user-access/roles/${roleId}/add-group-roles/${groupId}`,
  path: ':roleId/add-group-roles/:groupId',
  title: 'Add group roles',
};

const addRole: PathnameConfig = {
  link: () => '/user-access/roles/add-role',
  path: 'add-role',
  title: 'Add role',
};

const removeRole: PathnameConfig<(roleId: string) => string> = {
  link: (roleId) => `/user-access/roles/remove/${roleId}`,
  path: 'remove/:roleId',
  title: 'Remove role',
};

const editRole: PathnameConfig<(roleId: string) => string> = {
  link: (roleId) => `/user-access/roles/edit/${roleId}`,
  path: 'edit/:roleId',
  title: 'Edit role',
};

const roleDetail: PathnameConfig<(roleId: string) => string> = {
  link: (roleId) => `/user-access/roles/detail/${roleId}`,
  path: '/user-access/roles/detail/:roleId/*',
  title: 'Role',
};

const roleAddPermission: PathnameConfig<(roleId: string) => string> = {
  link: (roleId) => `/user-access/roles/detail/${roleId}/role-add-permission`,
  path: 'role-add-permission',
  title: 'Add permissions',
};

const roleDetailRemove: PathnameConfig<(roleId: string) => string> = {
  link: (roleId) => `/user-access/roles/detail/${roleId}/remove`,
  path: 'remove',
  title: 'Remove role',
};

const roleDetailEdit: PathnameConfig<(roleId: string) => string> = {
  link: (roleId) => `/user-access/roles/detail/${roleId}/edit`,
  path: 'edit',
  title: 'Edit role',
};

const roleDetailPermission: PathnameConfig<(roleId: string, permissionId: string) => string> = {
  link: (roleId, permissionId) => `/user-access/roles/detail/${roleId}/permission/${permissionId}`,
  path: '/user-access/roles/detail/:roleId/permission/:permissionId/*',
  title: 'Role permission',
};

const roleDetailPermissionEdit: PathnameConfig<(roleId: string, permissionId: string) => string> = {
  link: (roleId, permissionId) => `/user-access/roles/detail/${roleId}/permission/${permissionId}/edit`,
  path: 'edit',
  title: 'Edit permissions',
};

const groups: PathnameConfig = {
  link: () => '/user-access/groups',
  path: '/user-access/groups/*',
  title: 'Groups',
};

const addGroup: PathnameConfig = {
  link: () => '/user-access/groups/add-group',
  path: 'add-group',
  title: 'Create group',
};

const removeGroup: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/remove-group/${groupId}`,
  path: 'remove-group/:groupId',
  title: 'Delete group',
};

const editGroup: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/edit/${groupId}`,
  path: 'edit/:groupId',
  title: 'Edit group',
};

const groupDetail: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}`,
  path: '/user-access/groups/detail/:groupId/*',
  title: 'Group',
};

const groupDetailRoles: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}/roles`,
  path: 'roles/*',
  title: 'Group roles',
};

const groupRolesEditGroup: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}/roles/edit-group`,
  path: 'edit-group',
  title: 'Group roles - edit group',
};

const groupRolesRemoveGroup: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}/roles/remove-group`,
  path: 'remove-group',
  title: 'Group roles - remove group',
};

const groupAddRoles: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}/roles/add-roles`,
  path: 'add-roles',
  title: 'Add group roles',
};

const groupDetailRoleDetail: PathnameConfig<(groupId: string, roleId: string) => string> = {
  link: (groupId, roleId) => `/user-access/groups/detail/${groupId}/roles/detail/${roleId}`,
  path: '/user-access/groups/detail/:groupId/roles/detail/:roleId',
  title: 'Group role',
};

const groupDetailMembers: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}/members`,
  path: 'members/*',
  title: 'Group members',
};

const groupAddMembers: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}/members/add-members`,
  path: 'add-members',
  title: 'Add group members',
};

const groupMembersEditGroup: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}/members/edit-group`,
  path: 'edit-group',
  title: 'Group members - edit group',
};

const groupMembersRemoveGroup: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}/members/remove-group`,
  path: 'remove-group',
  title: 'Group members - remove group',
};

const groupDetailServiceAccounts: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}/service-accounts`,
  path: 'service-accounts/*',
  title: 'Group service accounts',
};

const groupAddServiceAccount: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}/service-accounts/add-service-account`,
  path: 'add-service-account',
  title: 'Add group service account',
};

const groupServiceAccountsEditGroup: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}/service-accounts/edit-group`,
  path: 'edit-group',
  title: 'Group service-accounts - edit group',
};

const groupServiceAccountsRemoveGroup: PathnameConfig<(groupId: string) => string> = {
  link: (groupId) => `/user-access/groups/detail/${groupId}/service-accounts/remove`,
  path: 'remove',
  title: 'Group service-accounts - remove group',
};

const quickstartsTest: PathnameConfig = {
  link: () => '/user-access/quickstarts-test',
  path: '/user-access/quickstarts-test',
  title: 'Quickstarts',
};

// ===========================================
// My User Access
// ===========================================

const myUserAccess: PathnameConfig = {
  link: () => '/my-user-access',
  path: '/my-user-access/*',
  title: 'My User Access',
};

// ===========================================
// Export
// ===========================================

const pathnames = {
  rbac,
  overview,
  users,
  'invite-users': inviteUsers,
  'user-detail': userDetail,
  'add-user-to-group': addUserToGroup,
  'user-add-group-roles': userAddGroupRoles,
  roles,
  'roles-add-group-roles': rolesAddGroupRoles,
  'add-role': addRole,
  'remove-role': removeRole,
  'edit-role': editRole,
  'role-detail': roleDetail,
  'role-add-permission': roleAddPermission,
  'role-detail-remove': roleDetailRemove,
  'role-detail-edit': roleDetailEdit,
  'role-detail-permission': roleDetailPermission,
  'role-detail-permission-edit': roleDetailPermissionEdit,
  groups,
  'add-group': addGroup,
  'remove-group': removeGroup,
  'edit-group': editGroup,
  'group-detail': groupDetail,
  'group-detail-roles': groupDetailRoles,
  'group-roles-edit-group': groupRolesEditGroup,
  'group-roles-remove-group': groupRolesRemoveGroup,
  'group-add-roles': groupAddRoles,
  'group-detail-role-detail': groupDetailRoleDetail,
  'group-detail-members': groupDetailMembers,
  'group-add-members': groupAddMembers,
  'group-members-edit-group': groupMembersEditGroup,
  'group-members-remove-group': groupMembersRemoveGroup,
  'group-detail-service-accounts': groupDetailServiceAccounts,
  'group-add-service-account': groupAddServiceAccount,
  'group-service-accounts-edit-group': groupServiceAccountsEditGroup,
  'group-service-accounts-remove-group': groupServiceAccountsRemoveGroup,
  'quickstarts-test': quickstartsTest,
  'my-user-access': myUserAccess,
} as const;

export default pathnames;

export {
  rbac,
  overview,
  users,
  inviteUsers,
  userDetail,
  addUserToGroup,
  userAddGroupRoles,
  roles,
  rolesAddGroupRoles,
  addRole,
  removeRole,
  editRole,
  roleDetail,
  roleAddPermission,
  roleDetailRemove,
  roleDetailEdit,
  roleDetailPermission,
  roleDetailPermissionEdit,
  groups,
  addGroup,
  removeGroup,
  editGroup,
  groupDetail,
  groupDetailRoles,
  groupRolesEditGroup,
  groupRolesRemoveGroup,
  groupAddRoles,
  groupDetailRoleDetail,
  groupDetailMembers,
  groupAddMembers,
  groupMembersEditGroup,
  groupMembersRemoveGroup,
  groupDetailServiceAccounts,
  groupAddServiceAccount,
  groupServiceAccountsEditGroup,
  groupServiceAccountsRemoveGroup,
  quickstartsTest,
  myUserAccess,
};

export type { PathnameConfig };
