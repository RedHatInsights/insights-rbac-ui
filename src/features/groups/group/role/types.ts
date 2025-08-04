// Re-export types from Redux to ensure consistency
export type { RoleWithAccess } from '@redhat-cloud-services/rbac-client/types';

export interface Role {
  uuid: string;
  display_name?: string;
  name: string;
  description?: string;
  modified: string;
  access?: any[];
}

export interface RoleFilters {
  name: string;
}

export interface RoleTableRow {
  id: string;
  row: React.ReactNode[];
  item: Role;
}

export interface GroupRolesProps {
  onDefaultGroupChanged?: (group: any) => void;
}
