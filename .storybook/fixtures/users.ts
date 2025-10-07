import { Principal } from '../types/entities';

export const defaultUsers: Principal[] = [
  {
    uuid: 'user-1',
    username: 'john.doe',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: false,
    external_source_id: 12345,
  },
  {
    uuid: 'user-2',
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    is_org_admin: true,
    external_source_id: 67890,
  },
  {
    uuid: 'user-3',
    username: 'bob.johnson',
    email: 'bob.johnson@example.com',
    first_name: 'Bob',
    last_name: 'Johnson',
    is_active: false,
    is_org_admin: false,
    external_source_id: 11111,
  },
];
