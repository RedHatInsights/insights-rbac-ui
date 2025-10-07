// Re-export Role types from Redux reducer
export type { Role, RoleGroup, Access } from '../../redux/roles/reducer';

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
