import type { AuditLog } from '../api/audit';

export const defaultAuditLogs: AuditLog[] = [
  {
    created: '2024-02-20T14:32:00Z',
    principal_username: 'adumble',
    description: 'Added user ginger-spice to group Platform Users',
    resource_type: 'group',
    action: 'add',
  },
  {
    created: '2024-02-20T13:15:00Z',
    principal_username: 'bbunny',
    description: 'Removed role Cost Management Viewer from group Finance',
    resource_type: 'role',
    action: 'remove',
  },
  {
    created: '2024-02-20T11:00:00Z',
    principal_username: 'adumble',
    description: 'Created role Custom Auditor',
    resource_type: 'role',
    action: 'create',
  },
  {
    created: '2024-02-19T16:45:00Z',
    principal_username: 'adumble',
    description: 'Deleted group Legacy Access',
    resource_type: 'group',
    action: 'delete',
  },
  {
    created: '2024-02-19T10:20:00Z',
    principal_username: 'bbunny',
    description: 'Edited role Platform Administrator permissions',
    resource_type: 'role',
    action: 'edit',
  },
];
