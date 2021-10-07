const pathnames = {
  rbac: '/',
  groups: '/groups',
  'add-group': '/groups/add-group',
  'remove-group': '/groups/removegroups',
  'group-edit': {
    path: '/groups/edit/:id',
    description: 'Edit single group',
  },
  'group-detail': '/groups/detail/:uuid',
  'group-detail-members-edit': '/groups/detail/:uuid/members/edit',
  'group-detail-roles-edit': '/groups/detail/:uuid/roles/edit',
  'group-detail-members-remove': '/groups/detail/:uuid/members/remove',
  'group-detail-roles-remove': '/groups/detail/:uuid/roles/remove',
  'group-detail-roles': '/groups/detail/:uuid/roles',
  'group-add-roles': '/groups/detail/:uuid/roles/add_roles',
  'group-detail-members': '/groups/detail/:uuid/members',
  'group-add-members': '/groups/detail/:uuid/members/add_members',
  'group-detail-role-detail': '/groups/detail/:groupUuid/roles/detail/:uuid',
  roles: '/roles',
  'add-role': '/roles/add-role',
  'remove-role': '/roles/remove/:id',
  'edit-role': '/roles/edit/:id',
  'role-detail': '/roles/detail/:uuid',
  'role-add-permission': '/roles/detail/:uuid/role-add-permission',
  'role-detail-remove': '/roles/detail/:id/remove',
  'role-detail-edit': '/roles/detail/:id/edit',
  'role-detail-permission': '/roles/detail/:roleId/permission/:permissionId',
  'role-detail-permission-edit': '/roles/detail/:roleId/permission/:permissionId/edit',
  users: '/users',
  'user-detail': '/users/detail/:username',
  'my-user-access': '/my-user-access',
  'access-requests': '/access-requests',
  'access-requests-detail': '/access-requests/:requestId',
  'quickstarts-test': '/quickstarts-test',
};

export default pathnames;
