// TypeScript interfaces for Group UI components
// Core data interfaces (Group, GroupState, Member, GroupReducerState) are now in src/redux/groups/reducer.ts

// Import and re-export core interfaces from Redux for convenience
import type { Group, GroupReducerState, GroupState, Member } from '../../redux/groups/reducer';
export type { Group, GroupState, Member, GroupReducerState };

export interface RBACStore {
  groupReducer: GroupReducerState;
  // Add other reducers as needed
  [key: string]: unknown;
}

export interface TabItem {
  eventKey: number;
  title: string;
  name: string;
  to: string;
}

export interface OutletContext {
  [key: string]:
    | {
        onDefaultGroupChanged?: (show: boolean) => void;
      }
    | string
    | undefined;
  groupId: string;
  systemGroupUuid?: string;
}

// Additional interfaces for compatibility
export interface ExpandedCells {
  [key: string]: string;
}

export interface SortByState {
  index: number;
  direction: 'asc' | 'desc';
}

export interface EmptyGroupsStateProps {
  hasActiveFilters: boolean;
}

export interface GroupActionsMenuProps {
  selectedRows: Group[];
  onCreateGroup: () => void;
  onEditGroup: (groupId: string) => void;
  onDeleteGroups: (groupIds: string[]) => void;
  onSelect: () => void;
}

export interface GroupsTableProps {
  groups: Group[];
  expandedCells: ExpandedCells;
  setExpandedCells: (cells: ExpandedCells) => void;
  selectedRows: Group[];
  onRowSelection: (selectedRows: Group[]) => void;
  sortByState: SortByState;
  onSort: (event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => void;
  isAdmin: boolean;
  isLoading?: boolean;
  hasActiveFilters: boolean;
  onExpansion: (groupId: string, columnKey: string, isExpanding: boolean) => void;
  onEditGroup: (groupId: string) => void;
  onDeleteGroups: (groupIds: string[]) => void;
}
