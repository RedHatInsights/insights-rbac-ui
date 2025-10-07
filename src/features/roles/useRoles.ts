import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { fetchRolesWithPolicies } from '../../redux/roles/actions';
import { fetchAdminGroup } from '../../redux/groups/actions';
import { mappedProps } from '../../helpers/dataUtilities';
import { defaultAdminSettings, defaultSettings } from '../../helpers/pagination';
import PermissionsContext from '../../utilities/permissionsContext';
import messages from '../../Messages';
import type { RBACStore } from '../../redux/store';
import type { Role } from '../../redux/roles/reducer';
import type { ExpandedCells, SortByState } from './types';
import type { Group } from '../../redux/groups/reducer';
import type { FetchRolesWithPoliciesParams } from '../../redux/roles/helper';

export interface UseRolesReturn {
  // Core data
  roles: Role[];
  isLoading: boolean;
  totalCount: number;

  // Permissions
  isAdmin: boolean;

  // Filter state
  filterValue: string;
  setFilterValue: (value: string) => void;
  hasActiveFilters: boolean;

  // Pagination
  page: number;
  perPage: number;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;

  // Sorting
  sortByState: SortByState;
  setSortByState: (state: SortByState) => void;
  orderBy: string;

  // Expansion (compound expandable)
  expandedCells: ExpandedCells;
  setExpandedCells: (cells: ExpandedCells) => void;

  // Selection
  selectedRows: Array<{ uuid: string; label: string }>;
  setSelectedRows: React.Dispatch<React.SetStateAction<Array<{ uuid: string; label: string }>>>;

  // Computed values
  columns: Array<{ title: string; key?: string }>;
  isSelectable: boolean;

  // Actions
  fetchData: (options?: Partial<FetchRolesWithPoliciesParams>) => void;
  handleClearFilters: () => void;

  // Additional state
  adminGroup: Group | undefined;
}

export const useRoles = (): UseRolesReturn => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const chrome = useChrome();
  const [searchParams, setSearchParams] = useSearchParams();

  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  // Redux selectors
  const {
    roles,
    filters: reduxFilters,
    pagination: rawPagination,
    isLoading,
    adminGroup,
  } = useSelector(
    (state: RBACStore) => ({
      adminGroup: state.groupReducer?.adminGroup,
      roles: state.roleReducer?.roles?.data || [],
      filters: state.roleReducer?.roles?.filters || {},
      pagination: state.roleReducer?.roles?.pagination || {},
      isLoading: state.roleReducer?.isLoading || false,
    }),
    shallowEqual,
  );

  // Apply pagination defaults
  const paginationDefaults = orgAdmin ? defaultAdminSettings : defaultSettings;
  const rawLimit = rawPagination.limit ?? paginationDefaults.limit;
  const rawOffset = rawPagination.offset ?? paginationDefaults.offset;
  const totalCount = rawPagination.count || 0;

  // Local state
  const [filterValue, setFilterValue] = useState(reduxFilters.display_name || '');
  const [expandedCells, setExpandedCells] = useState<ExpandedCells>({});
  const [selectedRows, setSelectedRows] = useState<Array<{ uuid: string; label: string }>>([]);

  // Initialize permissions check
  const isSelectable = useMemo(() => orgAdmin || userAccessAdministrator, [orgAdmin, userAccessAdministrator]);

  // Initialize sort state - index accounts for optional selection column
  // When isSelectable=true: [checkbox, Name, ...] so Name is at index 1
  // When isSelectable=false: [Name, ...] so Name is at index 0
  const [sortByState, setSortByState] = useState<SortByState>(() => ({
    index: isSelectable ? 1 : 0,
    direction: 'asc',
  }));

  // Columns definition
  const columns = useMemo(
    () => [
      { title: intl.formatMessage(messages.name), key: 'display_name' },
      { title: intl.formatMessage(messages.description) },
      { title: intl.formatMessage(messages.groups) },
      { title: intl.formatMessage(messages.permissions) },
      { title: intl.formatMessage(messages.lastModified), key: 'modified' },
    ],
    [intl],
  );

  // Map sort indices to column keys for resilience
  const sortIndexToKey = useMemo(() => {
    const mapping: Record<number, string> = {};
    columns.forEach((col, idx) => {
      // Adjust index if selection column is present
      const adjustedIdx = idx + Number(isSelectable);
      mapping[adjustedIdx] = col.key || 'display_name';
    });
    return mapping;
  }, [columns, isSelectable]);

  // Calculate orderBy from sort state using the mapping
  const orderBy = useMemo(() => {
    const key = sortIndexToKey[sortByState.index] || 'display_name';
    return `${sortByState.direction === 'desc' ? '-' : ''}${key}`;
  }, [sortByState, sortIndexToKey]);

  // Get pagination from URL
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const urlPerPage = parseInt(searchParams.get('per_page') || String(paginationDefaults.limit), 10);

  // Calculate current page and perPage
  const page = Math.floor(rawOffset / rawLimit) + 1;
  const perPage = rawLimit;

  // Memoized fetch function
  const fetchData = useCallback(
    (options: Partial<FetchRolesWithPoliciesParams> = {}) => {
      const defaultOptions = {
        limit: perPage,
        offset: (page - 1) * perPage,
        orderBy,
        filters: { display_name: filterValue },
      };

      dispatch(fetchRolesWithPolicies({ ...mappedProps({ ...defaultOptions, ...options }), usesMetaInURL: true, chrome }));
    },
    [dispatch, chrome, perPage, page, orderBy, filterValue],
  );

  // Set page (update URL and trigger fetch)
  const setPage = useCallback(
    (newPage: number) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', String(newPage));
      setSearchParams(newParams, { replace: true });

      // Fetch with new offset
      const newOffset = (newPage - 1) * perPage;
      fetchData({ offset: newOffset });
    },
    [searchParams, setSearchParams, perPage, fetchData],
  );

  // Set perPage (update URL and trigger fetch)
  const setPerPage = useCallback(
    (newPerPage: number) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('per_page', String(newPerPage));
      newParams.set('page', '1'); // Reset to page 1 when changing page size
      setSearchParams(newParams, { replace: true });

      // Fetch with new limit and reset offset
      fetchData({ limit: newPerPage, offset: 0 });
    },
    [searchParams, setSearchParams, fetchData],
  );

  // Initialize from URL and fetch data on mount
  useEffect(() => {
    chrome.appNavClick?.({ id: 'roles', secondaryNav: true });

    // Only make API calls if user has proper permissions
    if (orgAdmin || userAccessAdministrator) {
      dispatch(fetchAdminGroup({ chrome }));

      // Use URL params for initial fetch
      const offset = (urlPage - 1) * urlPerPage;
      fetchData({ limit: urlPerPage, offset });
    }
  }, []); // Run once on mount - no navigation triggered!

  // Handle filter changes
  const handleClearFilters = useCallback(() => {
    setFilterValue('');
    fetchData({ filters: { display_name: '' }, offset: 0 });

    // Reset to page 1 when clearing filters
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams, fetchData]);

  // Computed values
  const hasActiveFilters = filterValue.length > 0;

  return {
    // Core data
    roles,
    isLoading,
    totalCount,

    // Permissions
    isAdmin,

    // Filter state
    filterValue,
    setFilterValue,
    hasActiveFilters,

    // Pagination
    page,
    perPage,
    setPage,
    setPerPage,

    // Sorting
    sortByState,
    setSortByState,
    orderBy,

    // Expansion
    expandedCells,
    setExpandedCells,

    // Selection
    selectedRows,
    setSelectedRows,

    // Computed values
    columns,
    isSelectable,

    // Actions
    fetchData,
    handleClearFilters,

    // Additional state
    adminGroup,
  };
};
