import { useCallback, useEffect, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useDataViewFilters, useDataViewSelection } from '@patternfly/react-data-view';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { defaultSettings } from '../../../../../helpers/pagination';
import { debounce } from '../../../../../utilities/debounce';
import { mappedProps } from '../../../../../helpers/dataUtilities';
import { fetchRolesWithPolicies } from '../../../../../redux/roles/actions';
import { fetchAddRolesForGroup } from '../../../../../redux/groups/actions';
import type { RBACStore } from '../../../../../redux/store.d';

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
  initialSelectedRoles: Role[];
  onSelect: (selectedRoles: Role[]) => void;
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
  debouncedFetchData: (apiProps?: Record<string, unknown>, nameFilter?: string) => void;

  // Empty state props
  emptyStateProps: {
    colSpan: number;
    hasActiveFilters: boolean;
  };
}

export const useRolesList = ({
  rolesExcluded = false,
  groupId: groupUuid,
  usesMetaInURL = false,
  initialSelectedRoles,
  onSelect,
}: UseRolesListOptions): UseRolesListReturn => {
  const chrome = useChrome();
  const dispatch = useDispatch();

  // Redux selectors - AddGroupRoles modal uses general roles API, so data is always in roleReducer
  const selector = ({ roleReducer }: RBACStore) => {
    return {
      roles: roleReducer?.roles?.data || [],
      pagination: roleReducer?.roles?.meta,
      isLoading: roleReducer?.isLoading || false,
    };
  };

  const { roles, pagination, isLoading } = useSelector(selector, shallowEqual);

  // DataView hooks
  const filters = useDataViewFilters<RoleFilters>({
    initialFilters: { name: '' },
  });

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
    initialSelected: initialSelectedRoles.map((role) => ({ id: role.uuid })),
  });

  // Handle selection changes - call onSelect when selection changes
  useEffect(() => {
    if (selection.selected && selection.selected.length > 0) {
      const selectedRoleIds = selection.selected.map((item: any) => item.id);
      const selectedRoleObjects = roles.filter((role) => selectedRoleIds.includes(role.uuid));
      onSelect(selectedRoleObjects);
    } else {
      // Handle empty selection
      onSelect([]);
    }
  }, [selection.selected, roles, onSelect]);

  // Fetch data function with explicit filter support to avoid stale closures
  const fetchData = useCallback(
    (apiProps: Record<string, unknown> = {}, explicitNameFilter?: string) => {
      if (rolesExcluded && groupUuid) {
        // Group-specific roles fetching - doesn't need URL management
        return dispatch(fetchAddRolesForGroup(groupUuid, apiProps));
      } else {
        // General roles fetching - pass usesMetaInURL to prevent parent URL conflicts
        const finalConfig = {
          ...apiProps,
          usesMetaInURL,
          // Use explicit nameFilter if provided (even if empty), otherwise current filter state
          ...(explicitNameFilter !== undefined
            ? explicitNameFilter.trim() !== ''
              ? { filters: { name: explicitNameFilter } }
              : {} // Empty filter - don't include name parameter
            : filters.filters.name && filters.filters.name.trim() !== ''
              ? { filters: { name: filters.filters.name } }
              : {}),
        };
        return dispatch(fetchRolesWithPolicies(mappedProps(finalConfig)));
      }
    },
    [rolesExcluded, groupUuid, dispatch, usesMetaInURL], // Remove filters.filters.name to prevent stale closures
  );

  // Debounced fetch for filtering with explicit filter value
  // Note: filters.filters.name is captured from closure, not in deps to maintain debounce stability
  const debouncedFetchData = useMemo(
    () =>
      debounce((apiProps: Record<string, unknown> = {}, nameFilter?: string) => {
        if (rolesExcluded && groupUuid) {
          // Group-specific roles fetching - doesn't need URL management
          return dispatch(fetchAddRolesForGroup(groupUuid, apiProps));
        } else {
          // General roles fetching - pass usesMetaInURL to prevent parent URL conflicts
          const finalConfig = {
            ...apiProps,
            usesMetaInURL,
            // Use explicit nameFilter if provided (even if empty), otherwise current filter state
            ...(nameFilter !== undefined
              ? nameFilter.trim() !== ''
                ? { filters: { name: nameFilter } }
                : {} // Empty filter - don't include name parameter
              : filters.filters.name && filters.filters.name.trim() !== ''
                ? { filters: { name: filters.filters.name } }
                : {}),
          };
          return dispatch(fetchRolesWithPolicies(mappedProps(finalConfig)));
        }
      }),
    [rolesExcluded, groupUuid, dispatch, usesMetaInURL],
  );

  // Initial data fetch (run only once on mount to prevent infinite loops)
  useEffect(() => {
    fetchData(defaultSettings); // No explicit filter needed for initial load
  }, []); // Empty dependency array - run only on mount

  // Chrome global filter setup (separate effect to handle chrome changes)
  useEffect(() => {
    chrome?.hideGlobalFilter?.(true);
    return () => chrome?.hideGlobalFilter?.(false);
  }, [chrome]); // Only depend on chrome, not fetchData

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
  const columns = useMemo(() => [{ cell: 'Name', props: { width: 20 } }, { cell: 'Description' }], []);

  // Computed values (memoize to prevent constant recalculation)
  const hasActiveFilters = useMemo(() => Object.values(filters.filters).some((value) => value !== ''), [filters.filters]);

  // Empty state props (memoized to prevent infinite re-renders)
  const emptyStateProps = useMemo(
    () => ({
      colSpan: columns.length,
      hasActiveFilters,
    }),
    [columns.length, hasActiveFilters],
  );

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
    debouncedFetchData,
    emptyStateProps,
  };
};
