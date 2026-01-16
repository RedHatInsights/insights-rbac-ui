import { useCallback, useMemo, useState } from 'react';

import { useTableState } from '../../../../components/table-view/hooks/useTableState';
import { type Group, useGroupsQuery } from '../../../../data/queries/groups';
import { defaultSettings } from '../../../../helpers/pagination';
import { type SortableColumnId, columns as userGroupsColumns } from './components/useUserGroupsTableConfig';

// Re-export the Group type for use in components
export type { Group };

export interface UserGroupsFilters {
  name: string;
}

export interface UseUserGroupsOptions {
  /** Whether to enable admin functionality */
  enableAdminFeatures?: boolean;
}

export interface UseUserGroupsReturn {
  // Data
  groups: Group[];
  isLoading: boolean;
  totalCount: number;

  // Permissions
  orgAdmin: boolean;
  userAccessAdministrator: boolean;

  // Table state from useTableState
  tableState: ReturnType<typeof useTableState<typeof userGroupsColumns, Group, SortableColumnId, never>>;

  // Convenience accessors for backwards compatibility
  filters: UserGroupsFilters;
  sortBy: string;
  direction: 'asc' | 'desc';

  // Focus state
  focusedGroup: Group | undefined;
  setFocusedGroup: (group: Group | undefined) => void;

  // Actions
  refetch: () => void;
  handleRowClick: (group: Group) => void;
}

/**
 * Custom hook for managing UserGroups business logic.
 * Uses useTableState for all table state and React Query for data fetching.
 */
export const useUserGroups = (options: UseUserGroupsOptions = {}): UseUserGroupsReturn => {
  const { enableAdminFeatures = true } = options;

  // Focus state for drawer
  const [focusedGroup, setFocusedGroup] = useState<Group | undefined>(undefined);

  // useTableState handles ALL table state with URL synchronization
  const tableState = useTableState<typeof userGroupsColumns, Group, SortableColumnId>({
    columns: userGroupsColumns,
    sortableColumns: ['name', 'modified'] as const,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: defaultSettings.limit,
    initialFilters: { name: '' },
    getRowId: (group) => group.uuid,
    syncWithUrl: true, // Page-level tables sync with URL
  });

  // Use React Query for data fetching - using apiParams from tableState
  const { data, isLoading, refetch } = useGroupsQuery({
    limit: tableState.apiParams.limit,
    offset: tableState.apiParams.offset,
    orderBy: tableState.apiParams.orderBy,
    name: (tableState.apiParams.filters.name as string) || undefined,
  });

  // Extract data from query response
  const groups = useMemo(() => (data?.data as Group[]) || [], [data]);
  const totalCount = useMemo(() => data?.meta?.count || 0, [data]);

  // Permission context
  const orgAdmin = enableAdminFeatures;
  const userAccessAdministrator = enableAdminFeatures;

  // Handle row click for group focus and drawer events
  const handleRowClick = useCallback(
    (group: Group) => {
      setFocusedGroup(group);
    },
    [setFocusedGroup],
  );

  return {
    // Data
    groups,
    isLoading,
    totalCount,

    // Permissions
    orgAdmin: enableAdminFeatures && orgAdmin,
    userAccessAdministrator: enableAdminFeatures && userAccessAdministrator,

    // Full table state
    tableState,

    // Convenience accessors for backwards compatibility
    filters: { name: (tableState.filters.name as string) || '' } as UserGroupsFilters,
    sortBy: tableState.sort?.column || 'name',
    direction: tableState.sort?.direction || 'asc',

    // Focus state
    focusedGroup,
    setFocusedGroup,

    // Actions
    refetch,
    handleRowClick,
  };
};
