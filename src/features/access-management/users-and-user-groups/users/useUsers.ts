import { useCallback, useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { useDataViewFilters, useDataViewPagination, useDataViewSelection, useDataViewSort } from '@patternfly/react-data-view';

import type { RBACStore } from '../../../../redux/store';
import { fetchUsers } from '../../../../redux/users/actions';
import { mappedProps } from '../../../../helpers/dataUtilities';
import { defaultSettings } from '../../../../helpers/pagination';
import { User } from '../../../../redux/users/reducer';

import type {} from '@patternfly/react-data-view';

// Import the exact type that fetchUsers expects
interface FetchUsersApiProps {
  limit?: number;
  offset?: number;
  orderBy?: string;
  filters?: any;
  usesMetaInURL?: boolean;
}

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

  // DataView hooks
  filters: ReturnType<typeof useDataViewFilters<UsersFilters>>['filters'];
  sortBy: string;
  direction: 'asc' | 'desc';
  onSort: ReturnType<typeof useDataViewSort>['onSort'];
  pagination: ReturnType<typeof useDataViewPagination>;
  selection: ReturnType<typeof useDataViewSelection>;

  // User focus for drawer
  focusedUser: User | null;
  setFocusedUser: (user: User | null) => void;

  // Actions
  fetchData: (params: FetchUsersApiProps) => void;
  handleRowClick: (user: User) => void;

  // Clear all filters
  clearAllFilters: () => void;
  onSetFilters: ReturnType<typeof useDataViewFilters<UsersFilters>>['onSetFilters'];
}

/**
 * Custom hook for managing Users business logic
 */
export const useUsers = (options: UseUsersOptions = {}): UseUsersReturn => {
  const { enableAdminFeatures = true } = options;

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Focus state for drawer
  const [focusedUser, setFocusedUser] = useState<User | null>(null);

  // Data view hooks - use search params for persistence
  const { sortBy, direction, onSort } = useDataViewSort({
    searchParams,
    setSearchParams,
    initialSort: {
      sortBy: 'username',
      direction: 'asc',
    },
  });

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<UsersFilters>({
    initialFilters: { username: '', email: '', status: '' },
    searchParams,
    setSearchParams,
  });

  const pagination = useDataViewPagination({
    perPage: defaultSettings.limit,
    searchParams,
    setSearchParams,
  });

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.username === b.username,
  });

  // Redux selectors with proper typing
  const users = useSelector((state: RBACStore) => state.userReducer.users.data || [], shallowEqual);
  const isLoading = useSelector((state: RBACStore) => state.userReducer.isUserDataLoading || false);
  const totalCount = useSelector((state: RBACStore) => state.userReducer.users.meta?.count || 0);

  // Permission context
  const orgAdmin = enableAdminFeatures; // Simplified for now
  const userAccessAdministrator = enableAdminFeatures; // Simplified for now

  // Fetch data function
  const fetchData = useCallback(
    (params: FetchUsersApiProps) => {
      // mappedProps expects Record<string, unknown>, so we cast back
      const mappedParams = mappedProps(params as Record<string, unknown>);
      const payload: FetchUsersApiProps = {
        ...mappedParams,
        usesMetaInURL: true,
      };
      dispatch(fetchUsers(payload));
    },
    [dispatch],
  );

  // Auto-fetch when dependencies change
  useEffect(() => {
    const { page, perPage } = pagination;
    const limit = perPage;
    const offset = (page - 1) * perPage;
    const orderBy = sortBy || 'username';
    const filtersForApi = filters;

    fetchData({ limit, offset, orderBy, filters: filtersForApi });
  }, [fetchData, pagination.page, pagination.perPage, sortBy, filters.username]);

  // Handle row click for user focus
  const handleRowClick = useCallback(
    (user: User) => {
      setFocusedUser(user);
      // Note: DataView events context integration can be added later if needed
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

    // DataView hooks
    filters,
    sortBy: sortBy || 'username',
    direction: direction || 'asc',
    onSort,
    pagination,
    selection,

    // User focus for drawer
    focusedUser,
    setFocusedUser,

    // Actions
    fetchData,
    handleRowClick,

    // Clear all filters
    clearAllFilters,
    onSetFilters,
  };
};
