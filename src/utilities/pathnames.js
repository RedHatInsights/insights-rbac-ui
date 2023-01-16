const pathnames = {
  rbac: {
    path: '/',
    title: 'User Access',
  },
  groups: {
    path: '/groups',
    title: 'Groups',
  },
  'add-group': {
    path: '/groups/add-group',
    title: 'Create group',
  },
  'add-user-to-group': {
    path: '/users/detail/:username/add-to-group',
    title: 'Add user to a group',
  },
  'remove-group': {
    path: '/groups/removegroups',
    title: 'Delete group',
  },
  'group-edit': {
    path: '/groups/edit/:id',
    description: 'Edit single group',
    title: 'Edit group',
  },
  'group-detail': {
    path: '/groups/detail/:uuid',
    title: 'Group',
  },
  'group-detail-members-edit': {
    path: '/groups/detail/:uuid/members/edit',
    title: 'Edit group members',
  },
  'group-detail-roles-edit': {
    path: '/groups/detail/:uuid/roles/edit',
    title: 'Edit group roles',
  },
  'group-detail-members-remove': {
    path: '/groups/detail/:uuid/members/remove',
    title: 'Remove group members',
  },
  'group-detail-roles-remove': {
    path: '/groups/detail/:uuid/roles/remove',
    title: 'Remove group roles',
  },
  'group-detail-roles': {
    path: '/groups/detail/:uuid/roles',
    title: 'Group roles',
  },
  'group-add-roles': {
    path: '/groups/detail/:uuid/roles/add_roles',
    title: 'Add group roles',
  },
  'group-detail-members': {
    path: '/groups/detail/:uuid/members',
    title: 'Group members',
  },
  'group-add-members': {
    path: '/groups/detail/:uuid/members/add_members',
    title: 'Add group members',
  },
  'group-detail-role-detail': {
    path: '/groups/detail/:groupUuid/roles/detail/:uuid',
    title: 'Group role',
  },
  roles: {
    path: '/roles',
    title: 'Roles',
  },
  'add-role': {
    path: '/roles/add-role',
    title: 'Add role',
  },
  'remove-role': {
    path: '/roles/remove/:id',
    title: 'Remove role',
  },
  'edit-role': {
    path: '/roles/edit/:id',
    title: 'Edit role',
  },
  'role-detail': {
    path: '/roles/detail/:uuid',
    title: 'Role',
  },
  'role-add-permission': {
    path: '/roles/detail/:uuid/role-add-permission',
    title: 'Add permissions',
  },
  'role-detail-remove': {
    path: '/roles/detail/:id/remove',
    title: 'Remove role',
  },
  'role-detail-edit': {
    path: '/roles/detail/:id/edit',
    title: 'Edit role',
  },
  'role-detail-permission': {
    path: '/roles/detail/:roleId/permission/:permissionId',
    title: 'Role permission',
  },
  'role-detail-permission-edit': {
    path: '/roles/detail/:roleId/permission/:permissionId/edit',
    title: 'Edit permissions',
  },
  users: {
    path: '/users',
    title: 'Users',
  },
  'user-detail': {
    path: '/users/detail/:username',
    title: 'User',
  },
  'my-user-access': {
    path: '/my-user-access',
    title: 'My User Access',
  },
  'quickstarts-test': {
    path: '/quickstarts-test',
    title: 'Quickstarts',
  },
};

export default pathnames;
