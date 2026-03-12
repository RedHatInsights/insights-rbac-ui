import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTableState } from '../../../shared/components/table-view/hooks/useTableState';
import type { UseTableStateReturn } from '../../../shared/components/table-view/types';
import { type Role, type RolesListParams, extractRolesV2Links, useRolesV2Query } from '../../data/queries/roles';
import { PER_PAGE_OPTIONS } from '../../../shared/helpers/pagination';

export type { Role } from '../../data/queries/roles';

const columns = ['name', 'description', 'permissions', 'last_modified'] as const;
type SortableColumn = 'name' | 'last_modified';
const sortableColumns = ['name', 'last_modified'] as const;

export interface UseRolesOptions {
  enableAdminFeatures?: boolean;
}

export interface UseRolesReturn {
  roles: Role[];
  isLoading: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  orgAdmin: boolean;
  userAccessAdministrator: boolean;

  tableState: UseTableStateReturn<typeof columns, Role, SortableColumn, never>;

  focusedRole: Role | null;
  setFocusedRole: (role: Role | null) => void;

  refetch: () => void;
  handleRowClick: (role: Role) => void;
}

/**
 * Custom hook for managing V2 Roles business logic.
 *
 * Uses cursor-based server-side pagination via useTableState's cursor mode.
 * Name filtering uses glob pattern (`*term*`) — will work server-side when
 * the backend ships glob support. Until then, V2 only supports exact match
 * so the filter may return no results for partial queries. This is acceptable
 * since V2 is behind a feature flag.
 */
export const useRoles = (options: UseRolesOptions = {}): UseRolesReturn => {
  const { enableAdminFeatures = true } = options;

  const [focusedRole, setFocusedRole] = useState<Role | null>(null);

  const tableState = useTableState<typeof columns, Role, SortableColumn>({
    columns,
    sortableColumns,
    getRowId: (row: Role) => row.id!,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 20,
    perPageOptions: PER_PAGE_OPTIONS.map((opt) => opt.value),
    initialFilters: { name: '' },
    paginationMode: 'cursor',
  });

  const nameFilter = typeof tableState.filters.name === 'string' && tableState.filters.name ? tableState.filters.name : undefined;

  const queryParams: RolesListParams = {
    limit: tableState.apiParams.limit,
    cursor: tableState.apiParams.cursor,
    name: nameFilter ? `*${nameFilter}*` : undefined,
    fields: 'id,name,description,permissions_count,last_modified,org_id',
    orderBy: tableState.apiParams.orderBy,
  };

  const { data: rolesData, isLoading, refetch } = useRolesV2Query(queryParams);

  // Feed cursor links to useTableState so cursor stack navigation works.
  // Extract setCursorLinks once to avoid unstable cursorMeta object in deps.
  const setCursorLinks = tableState.cursorMeta?.setCursorLinks;
  useEffect(() => {
    const links = extractRolesV2Links(rolesData);
    if (links && setCursorLinks) {
      setCursorLinks(links);
    }
  }, [rolesData, setCursorLinks]);

  const roles = useMemo(() => rolesData?.data ?? [], [rolesData]);

  // Derive hasNextPage/hasPreviousPage directly from the API response
  // instead of relying on the useTableState roundtrip.
  const links = extractRolesV2Links(rolesData);
  const hasNextPage = links?.next != null;
  const hasPreviousPage = links?.previous != null;

  const orgAdmin = enableAdminFeatures;
  const userAccessAdministrator = enableAdminFeatures;

  const handleRowClick = useCallback(
    (role: Role) => {
      setFocusedRole(role);
    },
    [setFocusedRole],
  );

  return {
    roles,
    isLoading,
    hasNextPage,
    hasPreviousPage,

    orgAdmin: enableAdminFeatures && orgAdmin,
    userAccessAdministrator: enableAdminFeatures && userAccessAdministrator,

    tableState,

    focusedRole,
    setFocusedRole,

    refetch,
    handleRowClick,
  };
};
