import { Group } from '../types/entities';

export const defaultGroups: Group[] = [
  {
    uuid: 'group-1',
    name: 'Platform Admins',
    description: 'Platform administration team',
    principalCount: 5,
    roleCount: 3,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-15T00:00:00Z',
  },
  {
    uuid: 'group-2',
    name: 'Support Team',
    description: 'Customer support access',
    principalCount: 12,
    roleCount: 2,
    created: '2024-01-05T00:00:00Z',
    modified: '2024-01-20T00:00:00Z',
  },
  {
    uuid: 'group-3',
    name: 'Engineering',
    description: 'Engineering team access',
    principalCount: 25,
    roleCount: 5,
    created: '2024-01-10T00:00:00Z',
    modified: '2024-01-25T00:00:00Z',
  },
];
