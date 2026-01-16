import { useCallback, useMemo, useState } from 'react';

import { useTableState } from '../../../../components/table-view/hooks/useTableState';
import { type User, useUsersQuery } from '../../../../data/queries/users';
import { defaultSettings } from '../../../../helpers/pagination';
import { type SortableColumnId, standardColumns } from './components/useUsersTableConfig';

export interface UsersFilters {
  username: string;
  email: string;
  status: string;
}

export interface UseUsersOptions {
  /** Whether to enable admin functionality */
  enableAdminFeatures?: boolean;
}

export interface UseUsersReturn {
  // Data
  users: User[];
  isLoading: boolean;
  totalCount: number;

  // Permissions
  orgAdmin: boolean;
  userAccessAdministrator: boolean;

  // Table state from useTableState
  tableState: ReturnType<typeof useTableState<typeof standardColumns, User, SortableColumnId, never>>;

  // Convenience accessors for backwards compatibility
  filters: UsersFilters;
  sortBy: string;
  direction: 'asc' | 'desc';

  // User focus for drawer
  focusedUser: User | null;
  setFocusedUser: (user: User | null) => void;

  // Actions
  refetch: () => void;
  handleRowClick: (user: User) => void;
}

/**
 * Custom hook for managing Users business logic.
 * Uses useTableState for all table state and React Query for data fetching.
 */
export const useUsers = (options: UseUsersOptions = {}): UseUsersReturn => {
  const { enableAdminFeatures = true } = options;

  // Focus state for drawer
  const [focusedUser, setFocusedUser] = useState<User | null>(null);

  // useTableState handles ALL table state with URL synchronization
  const tableState = useTableState<typeof standardColumns, User, SortableColumnId>({
    columns: standardColumns,
    sortableColumns: ['username'] as const,
    initialSort: { column: 'username', direction: 'asc' },
    initialPerPage: defaultSettings.limit,
    initialFilters: { username: '', email: '', status: '' },
    getRowId: (user) => user.username,
    syncWithUrl: true, // Page-level tables sync with URL
  });

  // Use React Query for data fetching - using apiParams from tableState
  const { data, isLoading, refetch } = useUsersQuery({
    limit: tableState.apiParams.limit,
    offset: tableState.apiParams.offset,
    orderBy: tableState.sort?.column || 'username',
    username: (tableState.apiParams.filters.username as string) || undefined,
    email: (tableState.apiParams.filters.email as string) || undefined,
    status: (tableState.apiParams.filters.status as 'enabled' | 'disabled' | 'all') || undefined,
    sortOrder: tableState.sort?.direction || 'asc',
  });

  // Extract data from query response
  const users = useMemo(() => (data?.data as User[]) || [], [data]);
  const totalCount = useMemo(() => data?.meta?.count || 0, [data]);

  // Permission context
  const orgAdmin = enableAdminFeatures;
  const userAccessAdministrator = enableAdminFeatures;

  // Handle row click for user focus
  const handleRowClick = useCallback(
    (user: User) => {
      setFocusedUser(user);
    },
    [setFocusedUser],
  );

  return {
    // Data
    users,
    isLoading,
    totalCount,

    // Permissions
    orgAdmin: enableAdminFeatures && orgAdmin,
    userAccessAdministrator: enableAdminFeatures && userAccessAdministrator,

    // Full table state
    tableState,

    // Convenience accessors for backwards compatibility
    filters: {
      username: (tableState.filters.username as string) || '',
      email: (tableState.filters.email as string) || '',
      status: (tableState.filters.status as string) || '',
    } as UsersFilters,
    sortBy: tableState.sort?.column || 'username',
    direction: tableState.sort?.direction || 'asc',

    // User focus for drawer
    focusedUser,
    setFocusedUser,

    // Actions
    refetch,
    handleRowClick,
  };
};
