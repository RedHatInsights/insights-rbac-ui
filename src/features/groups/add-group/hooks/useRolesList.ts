import { useCallback, useEffect, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useDataViewFilters, useDataViewSelection } from '@patternfly/react-data-view';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { defaultCompactSettings } from '../../../../helpers/pagination';
import { mappedProps } from '../../../../helpers/dataUtilities';
import { fetchRolesWithPolicies } from '../../../../redux/roles/actions';
import { fetchAddRolesForGroup } from '../../../../redux/groups/actions';
import type { RBACStore } from '../../../../redux/store.d';

// Types
interface Role {
  uuid: string;
  display_name?: string;
  name: string;
  description?: string;
}

interface RoleTableRow {
  id: string;
  row: [string, string | undefined];
  item: Role;
}

interface RoleFilters {
  name: string;
}

// Hook options
interface UseRolesListOptions {
  rolesExcluded?: boolean;
  groupId?: string;
  usesMetaInURL?: boolean;
}

// Hook return interface
export interface UseRolesListReturn {
  // Core data
  roles: Role[];
  isLoading: boolean;
  pagination: any;

  // DataView hooks
  filters: ReturnType<typeof useDataViewFilters<RoleFilters>>;
  selection: ReturnType<typeof useDataViewSelection>;

  // Computed values
  tableRows: RoleTableRow[];
  columns: Array<{ cell: string; props?: any }>;
  hasActiveFilters: boolean;

  // Actions
  fetchData: (apiProps?: Record<string, unknown>) => void;

  // Empty state props
  emptyStateProps: {
    colSpan: number;
    hasActiveFilters: boolean;
  };
}

export const useRolesList = ({ rolesExcluded = false, groupId: groupUuid, usesMetaInURL = false }: UseRolesListOptions): UseRolesListReturn => {
  const chrome = useChrome();
  const dispatch = useDispatch();

  // Redux selectors
  const selector = ({ roleReducer }: RBACStore) => ({
    roles: roleReducer?.roles?.data || [],
    pagination: roleReducer?.roles?.meta,
    isLoading: roleReducer?.isLoading || false,
  });

  const { roles, pagination, isLoading } = useSelector(selector, shallowEqual);

  // DataView hooks
  const filters = useDataViewFilters<RoleFilters>({
    initialFilters: { name: '' },
  });

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
  });

  // Fetch data function
  const fetchData = useCallback(
    (apiProps: Record<string, unknown> = {}) => {
      const config = { ...apiProps };

      if (rolesExcluded && groupUuid) {
        // Group-specific roles fetching - doesn't need URL management
        return dispatch(fetchAddRolesForGroup(groupUuid, config));
      } else {
        // General roles fetching - pass usesMetaInURL to prevent parent URL conflicts
        const finalConfig = { ...config, usesMetaInURL };
        return dispatch(fetchRolesWithPolicies(mappedProps(finalConfig)));
      }
    },
    [rolesExcluded, groupUuid, dispatch, usesMetaInURL],
  );

  // Initial data fetch and chrome setup
  useEffect(() => {
    fetchData(defaultCompactSettings);
    chrome?.hideGlobalFilter?.(true);
    return () => chrome?.hideGlobalFilter?.(false);
  }, [fetchData, chrome]);

  // Table rows without selection (handled by DataView selection prop)
  const tableRows = useMemo((): RoleTableRow[] => {
    return roles.map(
      (role): RoleTableRow => ({
        id: role.uuid,
        row: [role.display_name || role.name, role.description],
        item: role,
      }),
    );
  }, [roles]);

  // Column definitions
  const columns = useMemo(() => [{ cell: 'Role name', props: { width: 20 } }, { cell: 'Description' }], []);

  // Computed values
  const hasActiveFilters = Object.values(filters.filters).some((value) => value !== '');

  // Empty state props
  const emptyStateProps = {
    colSpan: columns.length,
    hasActiveFilters,
  };

  return {
    roles,
    isLoading,
    pagination,
    filters,
    selection,
    tableRows,
    columns,
    hasActiveFilters,
    fetchData,
    emptyStateProps,
  };
};
