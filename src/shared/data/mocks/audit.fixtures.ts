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
  {
    created: '2024-02-18T09:30:00Z',
    principal_username: 'adumble',
    description: 'Added user bbunny to group DevOps',
    resource_type: 'user',
    action: 'add',
  },
  {
    created: '2024-02-18T08:15:00Z',
    principal_username: 'bbunny',
    description: 'Created role Security Analyst',
    resource_type: 'role',
    action: 'create',
  },
  {
    created: '2024-02-17T15:00:00Z',
    principal_username: 'ccarrot',
    description: 'Deleted user temp-contractor from organization',
    resource_type: 'user',
    action: 'delete',
  },
  {
    created: '2024-02-17T12:00:00Z',
    principal_username: 'ccarrot',
    description: 'Edited group Compliance Team members',
    resource_type: 'group',
    action: 'edit',
  },
  {
    created: '2024-02-17T10:30:00Z',
    principal_username: 'adumble',
    description: 'Removed user jsmith from group Viewers',
    resource_type: 'user',
    action: 'remove',
  },
];

const RESOURCES = ['group', 'role', 'user'] as const;
const ACTIONS = ['add', 'remove', 'create', 'delete', 'edit'] as const;

/**
 * 25 audit log entries for pagination tests (2 pages at 20 per page).
 * First 10 are defaultAuditLogs; 11–25 have unique descriptions "Audit entry N: ..." for assertions.
 */
export function buildAuditLogsForPagination(): AuditLog[] {
  const entries: AuditLog[] = [...defaultAuditLogs];
  for (let i = defaultAuditLogs.length; i < 25; i++) {
    const n = i + 1;
    const offset = i - defaultAuditLogs.length;
    const day = 16 - Math.floor(offset / 12);
    const hour = 23 - (offset % 12);
    entries.push({
      created: `2024-02-${day}T${String(hour).padStart(2, '0')}:00:00Z`,
      principal_username: i % 2 === 0 ? 'adumble' : 'bbunny',
      description: `Audit entry ${n}: ${ACTIONS[i % ACTIONS.length]} on ${RESOURCES[i % RESOURCES.length]}`,
      resource_type: RESOURCES[i % RESOURCES.length],
      action: ACTIONS[i % ACTIONS.length],
    });
  }
  return entries;
}

export const auditLogsForPagination = buildAuditLogsForPagination();
