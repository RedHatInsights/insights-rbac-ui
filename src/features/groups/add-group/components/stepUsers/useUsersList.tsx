import { useCallback, useContext, useEffect, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useDataViewFilters, useDataViewSelection } from '@patternfly/react-data-view';
import React, { Fragment } from 'react';
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';
import CloseIcon from '@patternfly/react-icons/dist/js/icons/close-icon';
import { fetchUsers, updateUsersFilters } from '../../../../../redux/users/actions';
import PermissionsContext from '../../../../../utilities/permissionsContext';
import { isPaginationPresentInUrl, syncDefaultPaginationWithUrl } from '../../../../../helpers/pagination';
import { areFiltersPresentInUrl, syncDefaultFiltersWithUrl } from '../../../../../helpers/urlFilters';
import messages from '../../../../../Messages';
import type { User } from './types';

// Types
interface DataViewUserFilters {
  username: string;
  email: string;
  status: string[];
}

interface UserTableRow {
  id: string;
  row: [React.ReactNode, string, string, string, string]; // First column can be JSX (Org Admin icons)
  item: User;
}

// Hook options
interface UseUsersListOptions {
  usesMetaInURL?: boolean;
  displayNarrow?: boolean;
  initialSelectedUsers: User[];
  onSelect: (selectedUsers: User[]) => void;
}

// Hook return interface
export interface UseUsersListReturn {
  // Core data
  users: User[];
  isLoading: boolean;
  pagination: any;

  // DataView hooks
  filters: ReturnType<typeof useDataViewFilters<DataViewUserFilters>>;
  selection: ReturnType<typeof useDataViewSelection>;

  // Computed values
  tableRows: UserTableRow[];
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

export const useUsersList = ({ usesMetaInURL = false, initialSelectedUsers, onSelect }: UseUsersListOptions): UseUsersListReturn => {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  useContext(PermissionsContext);

  // Redux selectors - use 50 as default for members step
  const pagination = useSelector(({ userReducer }: any) => {
    const { users } = userReducer;
    return {
      limit: (usesMetaInURL ? users.pagination.limit : users.meta.limit) ?? 50, // Always use 50 for members
      offset: (usesMetaInURL ? users.pagination.offset : users.meta.offset) ?? 0,
      count: usesMetaInURL ? users.pagination.count : users.meta.count,
      redirected: usesMetaInURL && users.pagination.redirected,
    };
  }, shallowEqual);

  // Memoize the default filters and empty array to prevent new object creation
  const defaultFilters = useMemo(() => ({ status: ['Active'] }), []);
  const emptyUsers = useMemo(() => [], []);

  // Memoize location search check to prevent selector instability
  const hasUrlSearch = useMemo(() => location.search.length > 0, [location.search]);

  const { rawUsers, isLoading, stateFilters } = useSelector(({ userReducer }: any) => {
    const {
      users: { data, filters = {} },
      isUserDataLoading,
    } = userReducer;
    const hasFilters = Object.keys(filters).length > 0;
    return {
      rawUsers: data || emptyUsers,
      isLoading: isUserDataLoading || false,
      stateFilters: hasUrlSearch || hasFilters ? filters : defaultFilters,
    };
  }, shallowEqual);

  // Memoize the users transformation to prevent infinite re-renders
  const users = useMemo(() => {
    return rawUsers?.map?.((data: any) => ({ ...data, uuid: data.username })) || [];
  }, [rawUsers]);

  // DataView hooks
  const filters = useDataViewFilters<DataViewUserFilters>({
    initialFilters: {
      username: stateFilters.username || '',
      email: stateFilters.email || '',
      status: stateFilters.status || ['Active'],
    },
  });

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
    initialSelected: initialSelectedUsers.map((user) => ({ id: user.uuid || user.username })),
  });

  // Handle selection changes - call onSelect when selection changes
  useEffect(() => {
    if (onSelect && selection.selected) {
      const selectedUserIds = selection.selected.map((item: any) => item.id);
      const selectedUserObjects = users.filter((user: User) => selectedUserIds.includes(user.uuid || user.username));
      onSelect(selectedUserObjects);
    }
  }, [selection.selected, users, onSelect]);

  // Filter users based on current filters
  const filteredUsers = useMemo(() => {
    return (
      users?.filter?.((user: User) =>
        Object.keys(stateFilters).every((key: string) => {
          if (!stateFilters[key] || (Array.isArray(stateFilters[key]) && stateFilters[key].length === 0)) {
            return true;
          }
          if (key === 'status') {
            return stateFilters[key].includes(user.is_active ? 'Active' : 'Inactive');
          }
          if (key === 'username') {
            return user.username?.toLowerCase().includes(stateFilters[key].toLowerCase());
          }
          if (key === 'email') {
            return user.email?.toLowerCase().includes(stateFilters[key].toLowerCase());
          }
          return true;
        }),
      ) || []
    );
  }, [users, stateFilters]);

  // Fetch data function
  const fetchData = useCallback(
    (config: Record<string, unknown> = {}) => {
      const finalConfig = {
        ...pagination,
        filters: stateFilters,
        ...config,
      };
      if (usesMetaInURL) {
        dispatch(updateUsersFilters(finalConfig));
      }
      dispatch(fetchUsers(finalConfig));
    },
    [dispatch, usesMetaInURL, pagination, stateFilters],
  );

  // Initial data fetch and URL sync
  useEffect(() => {
    if (usesMetaInURL) {
      const filtersInUrl = areFiltersPresentInUrl(location, ['status', 'username', 'email']);
      const paginationInUrl = isPaginationPresentInUrl(location);

      if (!filtersInUrl && !paginationInUrl) {
        syncDefaultFiltersWithUrl(location, navigate, ['username', 'email', 'status'], { status: ['Active'] });
        syncDefaultPaginationWithUrl(location, navigate, { limit: 50, offset: 0, count: 0, itemCount: 0 });
      }
    }

    fetchData();
  }, []);

  // Table rows without selection (handled by DataView selection prop)
  const tableRows = useMemo((): UserTableRow[] => {
    return filteredUsers.map(
      (user: User): UserTableRow => ({
        id: user.uuid || user.username,
        row: [
          // Org Admin column with icons
          <Fragment key={`org-admin-${user.uuid || user.username}`}>
            {user.is_org_admin ? <CheckIcon key="yes-icon" className="pf-v5-u-mr-sm" /> : <CloseIcon key="no-icon" className="pf-v5-u-mr-sm" />}
            <span key="text">{user.is_org_admin ? 'Yes' : 'No'}</span>
          </Fragment>,
          user.username,
          user.email || '',
          user.first_name || '',
          user.last_name || '',
        ],
        item: user,
      }),
    );
  }, [filteredUsers]);

  // Column definitions
  const columns = useMemo(
    () => [
      { cell: intl.formatMessage(messages.orgAdministrator), props: { width: 15 } },
      { cell: intl.formatMessage(messages.username), props: { width: 20 } },
      { cell: intl.formatMessage(messages.email), props: { width: 25 } },
      { cell: intl.formatMessage(messages.firstName) },
      { cell: intl.formatMessage(messages.lastName) },
    ],
    [intl],
  );

  // Computed values (memoize to prevent constant recalculation)
  const hasActiveFilters = useMemo(
    () =>
      Object.values(filters.filters).some((value) => {
        if (Array.isArray(value)) {
          return value.length > 0 && !(value.length === 1 && value[0] === 'Active');
        }
        return value !== '';
      }),
    [filters.filters],
  );

  // Empty state props (memoized to prevent infinite re-renders)
  const emptyStateProps = useMemo(
    () => ({
      colSpan: columns.length,
      hasActiveFilters,
    }),
    [columns.length, hasActiveFilters],
  );

  return {
    users: filteredUsers,
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
