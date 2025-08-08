// TypeScript interfaces for Group components

export interface GroupState {
  uuid: string;
  name: string;
  description?: string;
  platform_default: boolean;
  system: boolean;
  admin_default: boolean;
}

// Export GroupState as Group for compatibility with other components
export interface Group extends GroupState {
  principalCount?: number;
  roleCount?: number;
  policyCount?: number;
  created?: string;
  modified?: string;
  roles?: any[];
  members?: any[];
  isLoadingRoles?: boolean;
  isLoadingMembers?: boolean;
}

export interface RBACStore {
  groupReducer: GroupReducerState;
  // Add other reducers as needed
  [key: string]: any;
}

export interface GroupReducerState {
  selectedGroup?: GroupState;
  isRecordLoading: boolean;
  groups: {
    pagination?: any;
    meta?: any;
    filters?: any;
  };
  error?: string;
  systemGroup?: {
    uuid: string;
  };
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
  onSort: (event: any, index: number, direction: 'asc' | 'desc') => void;
  isAdmin: boolean;
  isLoading?: boolean;
  hasActiveFilters: boolean;
  onExpansion: (groupId: string, columnKey: string, isExpanding: boolean) => void;
  onEditGroup: (groupId: string) => void;
  onDeleteGroups: (groupIds: string[]) => void;
}
