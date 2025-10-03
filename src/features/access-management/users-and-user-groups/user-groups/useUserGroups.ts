import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { useDataViewFilters, useDataViewPagination, useDataViewSelection, useDataViewSort } from '@patternfly/react-data-view';

import { fetchGroups } from '../../../../redux/groups/actions';
import { FetchGroupsParams } from '../../../../redux/groups/helper';
import { selectGroups, selectGroupsTotalCount, selectIsGroupsLoading } from '../../../../redux/groups/selectors';
import { ListGroupsOrderByEnum } from '@redhat-cloud-services/rbac-client/ListGroups';
import { mappedProps } from '../../../../helpers/dataUtilities';
import { defaultSettings } from '../../../../helpers/pagination';
import { Group } from '../../../../redux/groups/reducer';

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

  // DataView hooks
  filters: ReturnType<typeof useDataViewFilters<UserGroupsFilters>>['filters'];
  sortBy: string;
  direction: 'asc' | 'desc';
  onSort: ReturnType<typeof useDataViewSort>['onSort'];
  pagination: ReturnType<typeof useDataViewPagination>;
  selection: ReturnType<typeof useDataViewSelection>;

  // Focus state
  focusedGroup: Group | undefined;
  setFocusedGroup: (group: Group | undefined) => void;

  // Actions
  fetchData: (params: FetchGroupsParams) => void;
  handleRowClick: (group: Group) => void;

  // Clear all filters
  clearAllFilters: () => void;
  onSetFilters: ReturnType<typeof useDataViewFilters<UserGroupsFilters>>['onSetFilters'];
}

/**
 * Custom hook for managing UserGroups business logic
 */
export const useUserGroups = (options: UseUserGroupsOptions = {}): UseUserGroupsReturn => {
  const { enableAdminFeatures = true } = options;

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Focus state for drawer
  const [focusedGroup, setFocusedGroup] = useState<Group | undefined>(undefined);

  // Data view hooks - use search params for persistence
  const { sortBy, direction, onSort } = useDataViewSort({
    searchParams,
    setSearchParams,
    initialSort: {
      sortBy: 'name',
      direction: 'asc',
    },
  });

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<UserGroupsFilters>({
    initialFilters: { name: '' },
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

  // Redux selectors with proper typing - using memoized selectors
  const groups = useSelector(selectGroups);
  const isLoading = useSelector(selectIsGroupsLoading);
  const totalCount = useSelector(selectGroupsTotalCount);

  // Permission context
  const orgAdmin = enableAdminFeatures; // Simplified for now
  const userAccessAdministrator = enableAdminFeatures; // Simplified for now

  // Fetch data function
  const fetchData = useCallback(
    (params: FetchGroupsParams) => {
      // mappedProps expects Record<string, unknown>, so we cast back
      const mappedParams = mappedProps(params as Record<string, unknown>);
      const payload: FetchGroupsParams = {
        ...mappedParams,
        usesMetaInURL: true,
      };
      dispatch(fetchGroups(payload));
    },
    [dispatch],
  );

  // Auto-fetch when dependencies change
  useEffect(() => {
    const { page, perPage } = pagination;
    const limit = perPage;
    const offset = (page - 1) * perPage;
    const orderBy = (sortBy || 'name') as ListGroupsOrderByEnum;
    const filtersForApi = filters;

    fetchData({ limit, offset, orderBy, filters: filtersForApi });
  }, [fetchData, pagination.page, pagination.perPage, sortBy, filters.name]);

  // Handle row click for group focus and drawer events
  const handleRowClick = useCallback(
    (group: Group) => {
      setFocusedGroup(group);
      // Note: DataView events context integration can be added later if needed
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

    // DataView hooks
    filters,
    sortBy: sortBy || 'name',
    direction: direction || 'asc',
    onSort,
    pagination,
    selection,

    // Focus state
    focusedGroup,
    setFocusedGroup,

    // Actions
    fetchData,
    handleRowClick,

    // Clear all filters
    clearAllFilters,
    onSetFilters,
  };
};
