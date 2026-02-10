import { useCallback, useState } from 'react';

import { useTableState } from '../../components/table-view/hooks/useTableState';
import type { UseTableStateReturn } from '../../components/table-view/types';
import { type ListRolesParams, useRolesQuery } from '../../data/queries/roles';
import type { RoleOutDynamic } from '@redhat-cloud-services/rbac-client/types';
import { PER_PAGE_OPTIONS } from '../../helpers/pagination';

// Re-export Role type for backwards compatibility
export type Role = RoleOutDynamic;

// Column definition
const columns = ['display_name', 'description', 'accessCount', 'modified'] as const;
type SortableColumn = 'display_name' | 'modified';
const sortableColumns = ['display_name', 'modified'] as const;

export interface UseRolesOptions {
  /** Whether to enable admin functionality */
  enableAdminFeatures?: boolean;
}

export interface UseRolesReturn {
  // Data
  roles: Role[];
  isLoading: boolean;
  totalCount: number;

  // Permissions
  orgAdmin: boolean;
  userAccessAdministrator: boolean;

  // Table state (from useTableState)
  tableState: UseTableStateReturn<typeof columns, Role, SortableColumn, never>;

  // Focus state
  focusedRole: Role | null;
  setFocusedRole: (role: Role | null) => void;

  // Actions
  refetch: () => void;
  handleRowClick: (role: Role) => void;
}

/**
 * Custom hook for managing Roles business logic.
 * Uses useTableState for all table state management (sort, pagination, filters, selection).
 */
export const useRoles = (options: UseRolesOptions = {}): UseRolesReturn => {
  const { enableAdminFeatures = true } = options;

  // Focus state for drawer
  const [focusedRole, setFocusedRole] = useState<Role | null>(null);

  // Table state via useTableState — single source of truth for sort, pagination, filters, selection
  const tableState = useTableState<typeof columns, Role, SortableColumn>({
    columns,
    sortableColumns,
    getRowId: (row: Role) => row.uuid!,
    initialSort: { column: 'display_name', direction: 'asc' },
    initialPerPage: 20,
    perPageOptions: PER_PAGE_OPTIONS.map((opt) => opt.value),
    initialFilters: { display_name: '' },
    syncWithUrl: true,
  });

  // Build query params from table state
  const queryParams: ListRolesParams = {
    limit: tableState.perPage,
    offset: (tableState.page - 1) * tableState.perPage,
    orderBy: (tableState.sort
      ? tableState.sort.direction === 'desc'
        ? `-${tableState.sort.column}`
        : tableState.sort.column
      : 'display_name') as ListRolesParams['orderBy'],
    displayName: (tableState.filters.display_name as string) || undefined,
    nameMatch: 'partial',
    scope: 'org_id',
    addFields: ['groups_in_count', 'groups_in', 'access'],
  };

  // Use TanStack Query
  const { data: rolesData, isLoading, refetch } = useRolesQuery(queryParams);

  // Extract roles and total count from query result
  const roles = (rolesData?.data ?? []) as Role[];
  const totalCount = rolesData?.meta?.count ?? 0;

  // Permission context
  const orgAdmin = enableAdminFeatures;
  const userAccessAdministrator = enableAdminFeatures;

  // Handle row click for role focus and drawer events
  const handleRowClick = useCallback(
    (role: Role) => {
      setFocusedRole(role);
    },
    [setFocusedRole],
  );

  return {
    // Data
    roles,
    isLoading,
    totalCount,

    // Permissions
    orgAdmin: enableAdminFeatures && orgAdmin,
    userAccessAdministrator: enableAdminFeatures && userAccessAdministrator,

    // Table state
    tableState,

    // Focus state
    focusedRole,
    setFocusedRole,

    // Actions
    refetch,
    handleRowClick,
  };
};
