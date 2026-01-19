// Re-export types from React Query to ensure consistency
export type { GroupRole } from '../../../../data/queries/groups';

// Use GroupRole as the base type for roles in group context
import type { GroupRole } from '../../../../data/queries/groups';

export type Role = GroupRole;

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
