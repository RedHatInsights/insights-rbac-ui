export interface MockRoleBinding {
  id: string;
  role_id: string;
  role_name: string;
  subject_type: 'user' | 'group' | 'service-account';
  subject_id: string;
  resource_id: string;
  resource_type: string;
  created: string;
}

export const defaultRoleBindings: MockRoleBinding[] = [
  {
    id: 'binding-1',
    role_id: 'role-tenant-admin',
    role_name: 'Tenant admin',
    subject_type: 'user',
    subject_id: 'adumble',
    resource_id: 'workspace-1',
    resource_type: 'workspace',
    created: '2024-06-01T00:00:00Z',
  },
  {
    id: 'binding-2',
    role_id: 'role-workspace-admin',
    role_name: 'Workspace admin',
    subject_type: 'group',
    subject_id: 'group-1',
    resource_id: 'workspace-2',
    resource_type: 'workspace',
    created: '2024-06-01T00:00:00Z',
  },
  {
    id: 'binding-3',
    role_id: 'role-rhel-devops',
    role_name: 'RHEL DevOps',
    subject_type: 'user',
    subject_id: 'bbunny',
    resource_id: 'workspace-3',
    resource_type: 'workspace',
    created: '2024-05-15T00:00:00Z',
  },
];
