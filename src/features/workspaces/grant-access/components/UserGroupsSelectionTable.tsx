import React, { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { TableView } from '../../../../components/table-view/TableView';
import { useTableState } from '../../../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, ExpansionRendererMap, FilterConfig } from '../../../../components/table-view/types';
import { useGroupMembersQuery } from '../../../../data/queries/groups';
import messages from '../../../../Messages';

// Group type for the table - compatible with API response
interface GroupRow {
  uuid: string;
  name: string;
  description?: string;
  principalCount?: number;
  platform_default?: boolean;
  admin_default?: boolean;
}

// Simple list of member names for expanded view
const MembersList: React.FC<{ groupId: string }> = ({ groupId }) => {
  const intl = useIntl();
  const { data: membersData, isLoading } = useGroupMembersQuery(groupId, { limit: 100 }, { enabled: !!groupId });
  const members = membersData?.members ?? [];

  if (isLoading) {
    return (
      <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
        Loading members...
      </Content>
    );
  }

  if (members.length === 0) {
    return (
      <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
        {intl.formatMessage(messages.noGroupMembers)}
      </Content>
    );
  }

  const memberNames = members.map((member: { first_name?: string; last_name?: string; username?: string; email?: string }) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member.username || member.email || 'Unknown';
  });

  return (
    <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
      {memberNames.join(', ')}
    </Content>
  );
};

interface UserGroupsSelectionTableProps {
  groups: GroupRow[];
  selectedGroups: string[];
  onGroupSelection: (groupIds: string[]) => void;
  isLoading?: boolean;
}

// Column definition
const columns = ['name', 'members'] as const;
type CompoundColumn = 'members';
type SortableColumn = 'name' | 'members';
const sortableColumns = ['name', 'members'] as const;

export const UserGroupsSelectionTable: React.FC<UserGroupsSelectionTableProps> = ({
  groups,
  selectedGroups,
  onGroupSelection,
  isLoading = false,
}) => {
  const intl = useIntl();

  // Table state via useTableState — manages sort, pagination, filters, expansion
  const tableState = useTableState<typeof columns, GroupRow, SortableColumn, CompoundColumn>({
    columns,
    sortableColumns,
    getRowId: (row: GroupRow) => row.uuid,
    isRowSelectable: (row: GroupRow) => !(row.platform_default || row.admin_default),
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 10,
    initialFilters: { name: '' },
  });

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.name), sortable: true },
      members: { label: intl.formatMessage(messages.members), sortable: true, isCompound: true },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, GroupRow> = useMemo(
    () => ({
      name: (group) => group.name,
      members: (group) => group.principalCount || 0,
    }),
    [],
  );

  const expansionRenderers: ExpansionRendererMap<CompoundColumn, GroupRow> = useMemo(
    () => ({
      members: (group) => <MembersList groupId={group.uuid} />,
    }),
    [],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'name',
        label: 'User group name',
        placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.name) }),
      },
    ],
    [intl],
  );

  // Filter and sort groups (local data)
  const { totalCount, paginatedGroups } = useMemo(() => {
    const searchValue = (tableState.filters.name as string) || '';

    // Filter groups based on search
    const filtered = searchValue ? groups.filter((group) => group.name.toLowerCase().includes(searchValue.toLowerCase())) : groups;

    // Sort the filtered groups
    const sorted = [...filtered].sort((a, b) => {
      const dir = tableState.sort?.direction === 'desc' ? -1 : 1;
      if (tableState.sort?.column === 'name') {
        return dir * (a.name || '').localeCompare(b.name || '');
      } else if (tableState.sort?.column === 'members') {
        return dir * ((Number(a.principalCount) || 0) - (Number(b.principalCount) || 0));
      }
      return 0;
    });

    // Paginate
    const startIndex = (tableState.page - 1) * tableState.perPage;
    const paginated = sorted.slice(startIndex, startIndex + tableState.perPage);

    return { totalCount: sorted.length, paginatedGroups: paginated };
  }, [groups, tableState.filters.name, tableState.sort, tableState.page, tableState.perPage]);

  // Selection — parent-controlled (string IDs), convert to/from GroupRow objects
  const selectedRows = useMemo(() => groups.filter((g) => selectedGroups.includes(g.uuid)), [groups, selectedGroups]);

  const handleSelectRow = useCallback(
    (group: GroupRow, selected: boolean) => {
      if (selected) {
        onGroupSelection([...selectedGroups, group.uuid]);
      } else {
        onGroupSelection(selectedGroups.filter((id) => id !== group.uuid));
      }
    },
    [selectedGroups, onGroupSelection],
  );

  const handleSelectAll = useCallback(
    (selected: boolean, rows: GroupRow[]) => {
      const selectableRows = rows.filter((g) => !(g.platform_default || g.admin_default));
      if (selected) {
        const newIds = selectableRows.map((g) => g.uuid).filter((id) => !selectedGroups.includes(id));
        onGroupSelection([...selectedGroups, ...newIds]);
      } else {
        const rowIds = new Set(selectableRows.map((g) => g.uuid));
        onGroupSelection(selectedGroups.filter((id) => !rowIds.has(id)));
      }
    },
    [selectedGroups, onGroupSelection],
  );

  const isRowSelectable = useCallback((group: GroupRow) => !(group.platform_default || group.admin_default), []);

  // Compound expansion - only non-default groups can expand
  const isCellExpandable = useCallback((group: GroupRow) => !(group.platform_default || group.admin_default), []);

  return (
    <TableView<typeof columns, GroupRow, SortableColumn, CompoundColumn>
      columns={columns}
      columnConfig={columnConfig}
      sortableColumns={sortableColumns}
      data={isLoading ? undefined : paginatedGroups}
      totalCount={totalCount}
      getRowId={(group) => group.uuid}
      cellRenderers={cellRenderers}
      expansionRenderers={expansionRenderers}
      // Sort — from useTableState
      sort={tableState.sort}
      onSortChange={tableState.onSortChange}
      // Pagination — from useTableState
      page={tableState.page}
      perPage={tableState.perPage}
      onPageChange={tableState.onPageChange}
      onPerPageChange={tableState.onPerPageChange}
      // Selection — parent-controlled
      selectable={true}
      selectedRows={selectedRows}
      onSelectRow={handleSelectRow}
      onSelectAll={handleSelectAll}
      isRowSelectable={isRowSelectable}
      // Expansion — from useTableState
      expandedCell={tableState.expandedCell}
      onToggleExpand={tableState.onToggleExpand}
      isCellExpandable={isCellExpandable}
      // Filters — from useTableState
      filterConfig={filterConfig}
      filters={tableState.filters}
      onFiltersChange={tableState.onFiltersChange}
      clearAllFilters={tableState.clearAllFilters}
      variant="compact"
      ariaLabel={intl.formatMessage(messages.selectUserGroups)}
      ouiaId="user-groups-selection-table"
      emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(messages.noGroupsAvailable)} />}
      emptyStateNoResults={
        <DefaultEmptyStateNoResults
          title={intl.formatMessage(messages.noGroupsFound)}
          body={intl.formatMessage(messages.noGroupsFoundDescription)}
          onClearFilters={tableState.clearAllFilters}
        />
      }
    />
  );
};
