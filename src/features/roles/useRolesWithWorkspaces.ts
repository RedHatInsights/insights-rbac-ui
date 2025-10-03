import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { useDataViewFilters, useDataViewPagination, useDataViewSelection, useDataViewSort } from '@patternfly/react-data-view';

import { fetchRolesWithPolicies } from '../../redux/roles/actions';
import { FetchRolesWithPoliciesParams } from '../../redux/roles/helper';
import { mappedProps } from '../../helpers/dataUtilities';
import { defaultSettings } from '../../helpers/pagination';
import { Role } from '../../redux/roles/reducer';
import { selectIsRolesLoading, selectRoles, selectRolesTotalCount } from '../../redux/roles/selectors';

export interface RoleFilters {
  display_name: string;
}

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

  // DataView hooks
  filters: ReturnType<typeof useDataViewFilters<RoleFilters>>['filters'];
  sortBy: string;
  direction: 'asc' | 'desc';
  onSort: ReturnType<typeof useDataViewSort>['onSort'];
  pagination: ReturnType<typeof useDataViewPagination>;
  selection: ReturnType<typeof useDataViewSelection>;

  // Focus state
  focusedRole: Role | null;
  setFocusedRole: (role: Role | null) => void;

  // Actions
  fetchData: (params: FetchRolesWithPoliciesParams) => void;
  handleRowClick: (role: Role) => void;

  // Clear all filters
  clearAllFilters: () => void;
  onSetFilters: ReturnType<typeof useDataViewFilters<RoleFilters>>['onSetFilters'];
}

/**
 * Custom hook for managing Roles business logic
 */
export const useRoles = (options: UseRolesOptions = {}): UseRolesReturn => {
  const { enableAdminFeatures = true } = options;

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Focus state for drawer
  const [focusedRole, setFocusedRole] = useState<Role | null>(null);

  // Data view hooks - use search params for persistence
  const { sortBy, direction, onSort } = useDataViewSort({
    searchParams,
    setSearchParams,
    initialSort: {
      sortBy: 'display_name',
      direction: 'asc',
    },
  });

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<RoleFilters>({
    initialFilters: { display_name: '' },
    searchParams,
    setSearchParams,
  });

  const pagination = useDataViewPagination({
    perPage: defaultSettings.limit,
    searchParams,
    setSearchParams,
  });

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.uuid === b.uuid,
  });

  // Redux selectors with proper typing
  // Use memoized selectors
  const roles = useSelector(selectRoles);
  const isLoading = useSelector(selectIsRolesLoading);
  const totalCount = useSelector(selectRolesTotalCount);

  // Permission context
  const orgAdmin = enableAdminFeatures; // Simplified for now
  const userAccessAdministrator = enableAdminFeatures; // Simplified for now

  // Fetch data function
  const fetchData = useCallback(
    (params: FetchRolesWithPoliciesParams) => {
      // mappedProps expects Record<string, unknown>, so we cast back
      const mappedParams = mappedProps(params as Record<string, unknown>);
      const payload: FetchRolesWithPoliciesParams = {
        ...mappedParams,
        usesMetaInURL: true,
      };
      dispatch(fetchRolesWithPolicies(payload));
    },
    [dispatch],
  );

  // Auto-fetch when dependencies change
  useEffect(() => {
    const { page, perPage } = pagination;
    const limit = perPage;
    const offset = (page - 1) * perPage;
    const orderBy = sortBy || 'display_name';
    const filtersForApi = filters;

    fetchData({ limit, offset, orderBy, filters: filtersForApi });
  }, [fetchData, pagination.page, pagination.perPage, sortBy, filters.display_name]);

  // Handle row click for role focus and drawer events
  const handleRowClick = useCallback(
    (role: Role) => {
      setFocusedRole(role);
      // Note: DataView events context integration can be added later if needed
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

    // DataView hooks
    filters,
    sortBy: sortBy || 'display_name',
    direction: direction || 'asc',
    onSort,
    pagination,
    selection,

    // Focus state
    focusedRole,
    setFocusedRole,

    // Actions
    fetchData,
    handleRowClick,

    // Clear all filters
    clearAllFilters,
    onSetFilters,
  };
};
