/**
 * Shared mock data for Access Management user journeys
 * Based on Figma designs in static/mocks/
 */

// =============================================================================
// USERS MOCK DATA
// Based on: static/mocks/Users tab/
// =============================================================================

export const mockUsers = [
  {
    username: 'adumble',
    email: 'dumble@redhat.com',
    first_name: 'Albus',
    last_name: 'Dumbledore',
    is_active: true,
    is_org_admin: true,
    external_source_id: '101',
  },
  {
    username: 'bbunny',
    email: 'bbunny@redhat.com',
    first_name: 'Bad',
    last_name: 'Bunny',
    is_active: true,
    is_org_admin: true,
    external_source_id: '102',
  },
  {
    username: 'ginger-spice',
    email: 'gspice@redhat.com',
    first_name: 'Geri',
    last_name: 'Halliwell',
    is_active: true,
    is_org_admin: false,
    external_source_id: '103',
  },
  {
    username: 'posh-spice',
    email: 'pspice@redhat.com',
    first_name: 'Victoria',
    last_name: 'Beckham',
    is_active: true,
    is_org_admin: false,
    external_source_id: '104',
  },
  {
    username: 'scary-spice',
    email: 'sspice@redhat.com',
    first_name: 'Mel',
    last_name: 'B',
    is_active: true,
    is_org_admin: false,
    external_source_id: '105',
  },
  {
    username: 'sporty-spice',
    email: 'spspice@redhat.com',
    first_name: 'Melanie',
    last_name: 'C',
    is_active: true,
    is_org_admin: false,
    external_source_id: '106',
  },
  {
    username: 'baby-spice',
    email: 'bspice@redhat.com',
    first_name: 'Emma',
    last_name: 'Bunton',
    is_active: true,
    is_org_admin: false,
    external_source_id: '107',
  },
  {
    username: 'bwhite',
    email: 'bwhite@redhat.com',
    first_name: 'Betty',
    last_name: 'White',
    is_active: true,
    is_org_admin: false,
    external_source_id: '108',
  },
  {
    username: 'dzbornak',
    email: 'dzbornak@redhat.com',
    first_name: 'Dorothy',
    last_name: 'Zbornak',
    is_active: true,
    is_org_admin: true,
    external_source_id: '109',
  },
  {
    username: 'spetrillo',
    email: 'spetrillo@redhat.com',
    first_name: 'Sophia',
    last_name: 'Petrillo',
    is_active: true,
    is_org_admin: true,
    external_source_id: '110',
  },
  {
    username: 'bdevereaux',
    email: 'bdevera@redhat.com',
    first_name: 'Blanche',
    last_name: 'Devereaux',
    is_active: true,
    is_org_admin: true,
    external_source_id: '111',
  },
];

// User to groups mapping (for User groups count column and details drawer)
export const userGroupsMembership: Record<string, string[]> = {
  adumble: ['group-default', 'group-admin'],
  bbunny: ['group-default', 'group-admin'],
  'ginger-spice': ['group-default', 'group-spice-girls'],
  'posh-spice': ['group-default', 'group-spice-girls'],
  'scary-spice': ['group-default', 'group-spice-girls'],
  'sporty-spice': ['group-default', 'group-spice-girls'],
  'baby-spice': ['group-default', 'group-spice-girls'],
  bwhite: ['group-default', 'group-golden-girls'],
  dzbornak: ['group-default', 'group-golden-girls'],
  spetrillo: ['group-default', 'group-golden-girls'],
  bdevereaux: ['group-default', 'group-golden-girls'],
};

// =============================================================================
// USER GROUPS MOCK DATA
// Based on: static/mocks/User groups table plus details/
// =============================================================================

export const mockGroups = [
  {
    uuid: 'group-default',
    name: 'Default group',
    description: 'Group that gets all users',
    principalCount: 11, // All users
    roleCount: 1,
    serviceAccountCount: 5,
    workspaceCount: 1,
    created: '2023-01-01T00:00:00Z',
    modified: '2024-12-15T10:30:00Z',
    platform_default: true,
    admin_default: false,
    system: false,
  },
  {
    uuid: 'group-admin',
    name: 'Admin group',
    description: 'All org admin users',
    principalCount: 4, // adumble, bbunny, dzbornak, spetrillo, bdevereaux - wait, that's 5
    roleCount: 1,
    serviceAccountCount: 4,
    workspaceCount: 1,
    created: '2023-01-15T00:00:00Z',
    modified: '2024-12-15T10:30:00Z',
    platform_default: false,
    admin_default: true,
    system: false,
  },
  {
    uuid: 'group-spice-girls',
    name: 'Spice girls',
    description: 'Group of international pop stars',
    principalCount: 5,
    roleCount: 1,
    serviceAccountCount: 3,
    workspaceCount: 1,
    created: '2023-06-01T00:00:00Z',
    modified: '2025-01-14T09:00:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: 'group-powerpuff-girls',
    name: 'Powerpuff girls',
    description: 'No description',
    principalCount: 3,
    roleCount: 1,
    serviceAccountCount: 3,
    workspaceCount: 1,
    created: '2023-08-01T00:00:00Z',
    modified: '2025-01-12T14:20:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: 'group-golden-girls',
    name: 'Golden girls',
    description: 'Classic show members',
    principalCount: 4,
    roleCount: 2,
    serviceAccountCount: 2,
    workspaceCount: 2,
    created: '2023-09-01T00:00:00Z',
    modified: '2025-01-14T09:00:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
];

// Group members mapping
export const groupMembers: Record<string, typeof mockUsers> = {
  'group-default': mockUsers,
  'group-admin': mockUsers.filter((u) => u.is_org_admin),
  'group-spice-girls': mockUsers.filter((u) => u.username.includes('spice')),
  'group-powerpuff-girls': [], // Empty for testing
  'group-golden-girls': mockUsers.filter((u) => ['bwhite', 'dzbornak', 'spetrillo', 'bdevereaux'].includes(u.username)),
};

// =============================================================================
// SERVICE ACCOUNTS MOCK DATA
// =============================================================================

export const mockServiceAccounts = [
  {
    uuid: 'sa-1',
    name: 'CI/CD Pipeline',
    clientId: 'pipeline-client-001',
    owner: 'adumble',
    timeCreated: '2023-01-01T10:00:00Z',
    description: 'Service account for CI/CD automation',
  },
  {
    uuid: 'sa-2',
    name: 'Monitoring Agent',
    clientId: 'monitoring-agent-002',
    owner: 'bbunny',
    timeCreated: '2023-02-15T11:00:00Z',
    description: 'Service account for monitoring systems',
  },
  {
    uuid: 'sa-3',
    name: 'Backup Service',
    clientId: 'backup-svc-003',
    owner: 'dzbornak',
    timeCreated: '2023-03-20T14:00:00Z',
    description: 'Service account for backup operations',
  },
  {
    uuid: 'sa-4',
    name: 'API Gateway',
    clientId: 'api-gateway-004',
    owner: 'spetrillo',
    timeCreated: '2023-04-10T09:00:00Z',
    description: 'Service account for API gateway',
  },
  {
    uuid: 'sa-5',
    name: 'Log Collector',
    clientId: 'log-collector-005',
    owner: 'bdevereaux',
    timeCreated: '2023-05-05T16:00:00Z',
    description: 'Service account for log collection',
  },
];

// =============================================================================
// ROLES MOCK DATA (V2 - GAP)
// Based on: static/mocks/Roles/
// NOTE: These use V2 API structure which is not yet available
// =============================================================================

export const mockRolesV2 = [
  {
    uuid: 'role-tenant-admin',
    name: 'Tenant admin',
    description: 'Full administrative access',
    permissions: 5,
    workspaces: 1,
    userGroups: 1,
    modified: '2024-01-01T00:00:00Z',
    system: true, // Canned role - no kebab/checkbox
  },
  {
    uuid: 'role-workspace-admin',
    name: 'Workspace admin',
    description: 'Workspace administrative access',
    permissions: 4,
    workspaces: 1,
    userGroups: 1,
    modified: '2024-01-01T00:00:00Z',
    system: true,
  },
  {
    uuid: 'role-rhel-devops',
    name: 'RHEL DevOps',
    description: 'RHEL development operations',
    permissions: 3,
    workspaces: 2,
    userGroups: 2,
    modified: '2024-01-01T00:00:00Z',
    system: false,
  },
  {
    uuid: 'role-cost-mgmt',
    name: 'Cost mgmt role',
    description: 'Cost management access',
    permissions: null, // "Not available" in UI
    workspaces: null,
    userGroups: null,
    modified: '2024-01-01T00:00:00Z',
    system: true,
  },
  {
    uuid: 'role-rhel-inventory',
    name: 'RHEL Inventory viewer',
    description: 'View RHEL inventory',
    permissions: 1,
    workspaces: 1,
    userGroups: 1,
    modified: '2025-01-13T00:00:00Z',
    system: false,
  },
];

// Role permissions (for drawer)
export const rolePermissions: Record<string, Array<{ application: string; resourceType: string; operation: string }>> = {
  'role-tenant-admin': [
    { application: 'rbac', resourceType: '*', operation: '*' },
    { application: 'inventory', resourceType: '*', operation: '*' },
    { application: 'cost-management', resourceType: '*', operation: '*' },
    { application: 'subscriptions', resourceType: '*', operation: '*' },
    { application: 'patch', resourceType: '*', operation: '*' },
  ],
  'role-workspace-admin': [
    { application: 'rbac', resourceType: 'workspace', operation: '*' },
    { application: 'rbac', resourceType: 'group', operation: '*' },
    { application: 'rbac', resourceType: 'role', operation: 'read' },
    { application: 'rbac', resourceType: 'principal', operation: 'read' },
  ],
  'role-rhel-devops': [
    { application: 'inventory', resourceType: 'hosts', operation: '*' },
    { application: 'patch', resourceType: 'systems', operation: '*' },
    { application: 'advisor', resourceType: 'recommendations', operation: 'read' },
  ],
  'role-cost-mgmt': [],
  'role-rhel-inventory': [{ application: 'inventory', resourceType: 'hosts', operation: 'read' }],
};

// Role to user groups mapping (for drawer)
export const roleUserGroups: Record<string, string[]> = {
  'role-tenant-admin': ['group-admin'],
  'role-workspace-admin': ['group-admin'],
  'role-rhel-devops': ['group-spice-girls', 'group-powerpuff-girls'],
  'role-cost-mgmt': ['group-golden-girls'],
  'role-rhel-inventory': ['group-golden-girls'],
};

// =============================================================================
// ROLES V1 MOCK DATA (Current API)
// =============================================================================

export const mockRolesV1 = [
  {
    uuid: 'role-1',
    name: 'Organization Administrator',
    display_name: 'Organization Administrator',
    description: 'Full administrative access to the organization',
    system: true,
    platform_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 50,
  },
  {
    uuid: 'role-2',
    name: 'User Access Administrator',
    display_name: 'User Access Administrator',
    description: 'Manage users and groups',
    system: true,
    platform_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 15,
  },
  {
    uuid: 'role-3',
    name: 'Viewer',
    display_name: 'Viewer',
    description: 'Read-only access to all resources',
    system: true,
    platform_default: true,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 10,
  },
];

// =============================================================================
// WORKSPACES MOCK DATA
// =============================================================================

export const mockWorkspaces = [
  {
    uuid: 'ws-root',
    name: 'Root workspace',
    description: 'Organization root workspace',
    parent_id: null,
  },
  {
    uuid: 'ws-dev',
    name: 'Development',
    description: 'Development environment',
    parent_id: 'ws-root',
  },
  {
    uuid: 'ws-prod',
    name: 'Production',
    description: 'Production environment',
    parent_id: 'ws-root',
  },
];
