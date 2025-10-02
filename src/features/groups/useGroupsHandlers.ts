import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { fetchMembersForExpandedGroup, fetchRolesForExpandedGroup } from '../../redux/groups/actions';
import { applyFiltersToUrl } from '../../helpers/urlFilters';
import { useAppLink } from '../../hooks/useAppLink';
import pathnames from '../../utilities/pathnames';
import type { Group } from './types';

interface PaginationState {
  limit: number;
  offset: number;
  [key: string]: unknown;
}

interface UseGroupsHandlersProps {
  isAdmin: boolean;
  columns: Array<{ key?: string; title: string }>;
  expanded: Record<string, number | boolean>;
  onExpandedChange: (expanded: Record<string, number | boolean>) => void;
  onSelectedRowsChange: (rows: Group[]) => void;
  onRemoveGroupsChange: (groups: Group[]) => void;
  onSortChange: (sortState: { index: number; direction: 'asc' | 'desc' }) => void;
  onFilterValueChange: (filterValue: string) => void;
  data: Group[];
  pagination: PaginationState;
  orderBy: string;
  totalCount: number;
  filterValue: string;
  fetchData: (options: Record<string, unknown>) => void;
}

export const useGroupsHandlers = ({
  isAdmin,
  columns,
  expanded,
  onExpandedChange,
  onSelectedRowsChange,
  onRemoveGroupsChange,
  onSortChange,
  onFilterValueChange,
  data,
  pagination,
  orderBy,
  totalCount,
  filterValue,
  fetchData,
}: UseGroupsHandlersProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const toAppLink = useAppLink();

  // Expanded data fetchers - directly from legacy
  const fetchExpandedRoles = useCallback(
    (uuid: string, flags?: Record<string, unknown>) => dispatch(fetchRolesForExpandedGroup(uuid, { limit: 100 }, flags)),
    [dispatch],
  );

  const fetchExpandedMembers = useCallback((uuid: string) => dispatch(fetchMembersForExpandedGroup(uuid, undefined, { limit: 100 })), [dispatch]);

  // Expand handler - directly from legacy
  const onExpand = useCallback(
    (_event: React.MouseEvent | null, _rowIndex: number, colIndex: number, isOpen: boolean, rowData: Group) => {
      const adjustedIndex = colIndex + Number(!isAdmin);

      if (!isOpen) {
        onExpandedChange({ ...expanded, [rowData.uuid]: adjustedIndex });
        if (adjustedIndex === 2) {
          fetchExpandedRoles(rowData.uuid, {
            isPlatformDefault: rowData.platform_default,
            isAdminDefault: rowData.admin_default,
          });
        }
        if (adjustedIndex === 3) {
          fetchExpandedMembers(rowData.uuid);
        }
      } else {
        onExpandedChange({ ...expanded, [rowData.uuid]: -1 });
      }
    },
    [expanded, isAdmin, fetchExpandedRoles, fetchExpandedMembers, onExpandedChange],
  );

  // Sort handler
  const handleSort = useCallback(
    (e: React.MouseEvent, index: number, direction: 'asc' | 'desc') => {
      const orderBy = `${direction === 'desc' ? '-' : ''}${columns[index - Number(isAdmin)].key}`;
      onSortChange({ index, direction });
      applyFiltersToUrl(location, navigate, { name: filterValue });
      fetchData({ ...pagination, orderBy, filters: { name: filterValue } });
    },
    [columns, isAdmin, location, navigate, filterValue, pagination, fetchData, onSortChange],
  );

  // Bulk actions handlers
  const handleBulkSelect = useCallback(
    (value: BulkSelectValue) => {
      if (value === BulkSelectValue.none) {
        onSelectedRowsChange([]);
      } else if (value === BulkSelectValue.page) {
        const selectableItems = data.filter((item) => !(item.platform_default || item.admin_default));
        onSelectedRowsChange(selectableItems);
      } else if (value === BulkSelectValue.nonePage) {
        // Handle main checkbox click to deselect all items
        onSelectedRowsChange([]);
      }
    },
    [data, onSelectedRowsChange],
  );

  const handleEdit = useCallback(
    (groupId: string) => {
      const editPath = (pathnames['edit-group'].link as string).replace(':groupId', groupId);
      navigate(toAppLink(editPath));
    },
    [navigate, toAppLink],
  );

  const handleDelete = useCallback(
    (groups: Group[]) => {
      onRemoveGroupsChange(groups);
      const groupIds = groups.map(({ uuid }) => uuid);
      const removePath = (pathnames['remove-group'].link as string).replace(':groupId', groupIds.join(','));
      navigate(toAppLink(removePath));
      onSelectedRowsChange([]); // Clear selection after action
    },
    [navigate, toAppLink, onRemoveGroupsChange, onSelectedRowsChange],
  );

  // Pagination handlers
  const handlePageChange = useCallback(
    (newPage: number) => {
      const newOffset = (newPage - 1) * pagination.limit;
      fetchData({
        count: totalCount,
        limit: pagination.limit,
        offset: newOffset,
        orderBy,
        filters: { name: filterValue },
      });
    },
    [pagination.limit, totalCount, orderBy, filterValue, fetchData],
  );

  const handlePerPageChange = useCallback(
    (perPage: number) => {
      fetchData({
        count: totalCount,
        limit: perPage,
        offset: 0,
        orderBy,
        filters: { name: filterValue },
      });
    },
    [totalCount, orderBy, filterValue, fetchData],
  );

  // Filter handlers
  const handleFiltersChange = useCallback(
    (values: { name?: string }) => {
      const name = values.name || '';
      onFilterValueChange(name);
      applyFiltersToUrl(location, navigate, { name });
      fetchData({
        count: totalCount,
        limit: pagination.limit,
        offset: 0,
        orderBy,
        filters: { name },
      });
    },
    [onFilterValueChange, location, navigate, totalCount, pagination.limit, orderBy, fetchData],
  );

  const handleClearAllFilters = useCallback(() => {
    const name = '';
    onFilterValueChange(name);
    applyFiltersToUrl(location, navigate, { name });
    fetchData({
      count: totalCount,
      limit: pagination.limit,
      offset: 0,
      orderBy,
      filters: { name },
    });
  }, [onFilterValueChange, location, navigate, totalCount, pagination.limit, orderBy, fetchData]);

  return {
    onExpand,
    handleSort,
    handleBulkSelect,
    handleEdit,
    handleDelete,
    handlePageChange,
    handlePerPageChange,
    handleFiltersChange,
    handleClearAllFilters,
  };
};
