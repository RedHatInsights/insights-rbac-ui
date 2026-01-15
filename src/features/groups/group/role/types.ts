// Re-export types from Redux to ensure consistency
export type { RoleWithAccess } from '@redhat-cloud-services/rbac-client/types';

// Use RoleWithAccess as the base type for roles
import type { RoleWithAccess } from '@redhat-cloud-services/rbac-client/types';

export type Role = RoleWithAccess;

export interface RoleFilters {
  name: string;
}

export interface RoleTableRow {
  id: string;
  row: React.ReactNode[];
  item: Role;
}

export interface GroupRolesProps {
  onDefaultGroupChanged?: (group: { uuid: string; name: string }) => void;
}
