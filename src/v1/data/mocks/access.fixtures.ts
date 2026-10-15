import type { Access } from '../api/access';

export type { Access };

export const defaultAccessPermissions: Access[] = [
  { permission: 'rbac:group:read', resourceDefinitions: [] },
  { permission: 'rbac:group:write', resourceDefinitions: [] },
  { permission: 'rbac:role:read', resourceDefinitions: [] },
  { permission: 'rbac:role:write', resourceDefinitions: [] },
  { permission: 'rbac:principal:read', resourceDefinitions: [] },
  { permission: 'rbac:principal:write', resourceDefinitions: [] },
  { permission: 'inventory:hosts:read', resourceDefinitions: [] },
  { permission: 'inventory:hosts:write', resourceDefinitions: [] },
  { permission: 'inventory:groups:read', resourceDefinitions: [] },
  { permission: 'cost-management:*:read', resourceDefinitions: [] },
];
