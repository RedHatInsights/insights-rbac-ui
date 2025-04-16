const pathnames = {
  rbac: {
    path: '/',
    title: 'User Access',
  },
  overview: {
    link: '/overview',
    path: '/overview/*',
    title: 'Overview',
  },
  workspaces: {
    link: '/workspaces',
    path: '/workspaces/*',
    title: 'Workspaces',
  },
  'edit-workspaces-list': {
    link: '/workspaces/edit/:workspaceId',
    path: 'edit/:workspaceId',
    title: 'Edit Workspace',
  },
  'create-workspace': {
    link: '/workspaces/create-workspace',
    path: 'create-workspace',
    title: 'Create workspace',
  },
  'edit-workspace': {
    link: '/workspaces/detail/:workspaceId/edit',
    path: '/workspaces/detail/:workspaceId/edit',
    title: 'Edit Workspace',
  },
  'workspace-detail': {
    link: '/workspaces/detail/:workspaceId',
    path: '/workspaces/detail/:workspaceId/',
    title: 'Workspace detail',
  },
  groups: {
    link: '/groups',
    path: '/groups/*',
    title: 'Groups',
  },
  'add-group': {
    link: '/groups/add-group',
    path: 'add-group',
    title: 'Create group',
  },
  'remove-group': {
    link: '/groups/remove-group/:groupId',
    path: 'remove-group/:groupId',
    title: 'Delete group',
  },
  'edit-group': {
    link: '/groups/edit/:groupId',
    path: 'edit/:groupId',
    title: 'Edit group',
  },
  'group-detail': {
    link: '/groups/detail/:groupId',
    path: '/groups/detail/:groupId/*',
    title: 'Group',
  },
  'group-detail-roles': {
    link: '/groups/detail/:groupId/roles',
    path: 'roles/*',
    title: 'Group roles',
  },
  'group-roles-edit-group': {
    link: '/groups/detail/:groupId/roles/edit-group',
    path: 'edit-group',
    title: 'Group roles - edit group',
  },
  'group-roles-remove-group': {
    link: '/groups/detail/:groupId/roles/remove-group',
    path: 'remove-group',
    title: 'Group roles - remove group',
  },
  'group-add-roles': {
    link: '/groups/detail/:groupId/roles/add-roles',
    path: 'add-roles',
    title: 'Add group roles',
  },
  'group-detail-role-detail': {
    link: '/groups/detail/:groupId/roles/detail/:roleId',
    path: '/groups/detail/:groupId/roles/detail/:roleId',
    title: 'Group role',
  },
  'group-detail-members': {
    link: '/groups/detail/:groupId/members',
    path: 'members/*',
    title: 'Group members',
  },
  'group-add-members': {
    link: '/groups/detail/:groupId/members/add-members',
    path: 'add-members',
    title: 'Add group members',
  },
  'group-members-edit-group': {
    link: '/groups/detail/:groupId/members/edit-group',
    path: 'edit-group',
    title: 'Group members - edit group',
  },
  'group-members-remove-group': {
    link: '/groups/detail/:groupId/members/remove-group',
    path: 'remove-group',
    title: 'Group members - remove group',
  },
  'group-detail-service-accounts': {
    link: '/groups/detail/:groupId/service-accounts',
    path: 'service-accounts/*',
    title: 'Group service accounts',
  },
  'group-add-service-account': {
    link: '/groups/detail/:groupId/service-accounts/add-service-account',
    path: 'add-service-account',
    title: 'Add group service account',
  },
  'group-service-accounts-edit-group': {
    link: '/groups/detail/:groupId/service-accounts/edit-group',
    path: 'edit-group',
    title: 'Group service-accounts - edit group',
  },
  'group-service-accounts-remove-group': {
    link: '/groups/detail/:groupId/service-accounts/remove',
    path: 'remove',
    title: 'Group service-accounts - remove group',
  },
  roles: {
    link: '/roles',
    path: '/roles/*',
    title: 'Roles',
  },
  'roles-add-group-roles': {
    link: '/roles/:roleId/add-group-roles/:groupId',
    path: ':roleId/add-group-roles/:groupId',
    title: 'Add group roles',
  },
  'add-role': {
    link: '/roles/add-role',
    path: 'add-role',
    title: 'Add role',
  },
  'remove-role': {
    link: '/roles/remove/:roleId',
    path: 'remove/:roleId',
    title: 'Remove role',
  },
  'edit-role': {
    link: '/roles/edit/:roleId',
    path: 'edit/:roleId',
    title: 'Edit role',
  },
  'role-detail': {
    link: '/roles/detail/:roleId',
    path: '/roles/detail/:roleId/*',
    title: 'Role',
  },
  'role-add-permission': {
    link: '/roles/detail/:roleId/role-add-permission',
    path: 'role-add-permission',
    title: 'Add permissions',
  },
  'role-detail-remove': {
    link: '/roles/detail/:roleId/remove',
    path: 'remove',
    title: 'Remove role',
  },
  'role-detail-edit': {
    link: '/roles/detail/:roleId/edit',
    path: 'edit',
    title: 'Edit role',
  },
  'role-detail-permission': {
    link: '/roles/detail/:roleId/permission/:permissionId',
    path: '/roles/detail/:roleId/permission/:permissionId/*',
    title: 'Role permission',
  },
  'role-detail-permission-edit': {
    link: '/roles/detail/:roleId/permission/:permissionId/edit',
    path: 'edit',
    title: 'Edit permissions',
  },
  users: {
    link: '/users',
    path: '/users',
    title: 'Users',
  },
  'invite-users': {
    link: '/users/invite',
    path: 'invite',
    title: 'Invite users',
  },
  'user-detail': {
    link: '/users/detail/:username',
    path: '/users/detail/:username/*',
    title: 'User',
  },
  'add-user-to-group': {
    link: '/users/detail/:username/add-to-group',
    path: 'add-to-group',
    title: 'Add user to a group',
  },
  'user-add-group-roles': {
    link: '/users/detail/:username/add-group-roles/:groupId',
    path: 'add-group-roles/:groupId',
    title: 'Add group roles',
  },
  'my-user-access': {
    link: '/my-user-access',
    path: '/*',
    title: 'My User Access',
  },
  'quickstarts-test': {
    link: '/quickstarts-test',
    path: 'quickstarts-test',
    title: 'Quickstarts',
  },
  'users-and-user-groups': {
    link: '/users-and-user-groups',
    path: '/users-and-user-groups/*',
    title: 'Users & User Groups',
  },
  'users-new': {
    link: '/users-and-user-groups/users',
    path: 'users/*',
    title: 'Users & User Groups',
  },
  'user-groups': {
    link: '/users-and-user-groups/user-groups',
    path: 'user-groups/*',
    title: 'Users & User Groups',
  },
  'users-and-user-groups-edit-group': {
    link: '/users-and-user-groups/edit-group/:groupId',
    path: '/users-and-user-groups/edit-group/:groupId',
    title: 'Edit group',
  },
  'users-and-user-groups-create-group': {
    link: '/users-and-user-groups/create-group',
    path: '/users-and-user-groups/create-group',
    title: 'Create user group',
  },
  'invite-group-users': {
    link: '/users-and-user-groups/users/invite',
    path: 'invite',
    title: 'Users & User Groups',
  },
  'create-user-group': {
    link: '/users-and-user-groups/user-groups/create-user-group',
    path: 'create-user-group',
    title: 'Users & User Groups',
  },
};

export default pathnames;
