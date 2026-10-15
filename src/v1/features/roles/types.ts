// Re-export Role types from rbac-client (migrated from React Query)
// Note: Use RoleOutDynamic for the full role type (with all fields from API)
// The basic Role type only has name, display_name, description
export type { Access, RoleOutDynamic, AdditionalGroup } from '../../data/api/roles';

// Role is an alias for RoleOutDynamic for backwards compatibility with components
// that expect the full role shape from the list API
export type { RoleOutDynamic as Role } from '../../data/api/roles';

// Backwards-compatible alias for AdditionalGroup (groups assigned to a role)
export type { AdditionalGroup as RoleGroup } from '../../data/api/roles';

// Component-specific types
export interface RolesFilters {
  display_name: string;
}

export interface SortByState {
  index: number;
  direction: 'asc' | 'desc';
}

export interface ExpandedCells {
  [roleUuid: string]: 'groups' | 'permissions';
}

export interface RolesEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
}
