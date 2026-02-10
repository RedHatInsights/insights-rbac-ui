import React, { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { TableView } from '../../../../components/table-view/TableView';
import { useTableState } from '../../../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, ExpansionRendererMap, FilterConfig } from '../../../../components/table-view/types';
import messages from '../../../../Messages';

// Role type compatible with API response
interface RoleRow {
  uuid: string;
  name?: string;
  display_name?: string;
  description?: string;
  accessCount?: number;
  access?: { permission: string }[];
}

// List of permissions for expanded view with each permission on its own line
const PermissionsList: React.FC<{ role: RoleRow }> = ({ role }) => {
  const intl = useIntl();

  if (!role.access || role.access.length === 0) {
    return (
      <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
        {intl.formatMessage(messages.noPermissions)}
      </Content>
    );
  }

  return (
    <div className="pf-v6-u-mx-lg pf-v6-u-my-sm">
      {role.access.map((access, index) => (
        <Content key={index} component="p" className="pf-v6-u-mb-xs">
          {access.permission}
        </Content>
      ))}
    </div>
  );
};

interface RolesSelectionTableProps {
  roles: RoleRow[];
  selectedRoles: string[];
  onRoleSelection: (roleIds: string[]) => void;
  isLoading?: boolean;
}

// Column definition
const columns = ['name', 'description', 'permissions'] as const;
type CompoundColumn = 'permissions';
type SortableColumn = 'name' | 'description' | 'permissions';
const sortableColumns = ['name', 'description', 'permissions'] as const;

export const RolesSelectionTable: React.FC<RolesSelectionTableProps> = ({ roles, selectedRoles, onRoleSelection, isLoading = false }) => {
  const intl = useIntl();

  // Table state via useTableState — manages sort, pagination, filters, expansion
  const tableState = useTableState<typeof columns, RoleRow, SortableColumn, CompoundColumn>({
    columns,
    sortableColumns,
    getRowId: (row: RoleRow) => row.uuid,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 10,
    initialFilters: { name: '' },
  });

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.name), sortable: true },
      description: { label: intl.formatMessage(messages.description), sortable: true },
      permissions: { label: intl.formatMessage(messages.permissions), sortable: true, isCompound: true },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, RoleRow> = useMemo(
    () => ({
      name: (role) => role.display_name || role.name,
      description: (role) => role.description || '—',
      permissions: (role) => role.accessCount || 0,
    }),
    [],
  );

  const expansionRenderers: ExpansionRendererMap<CompoundColumn, RoleRow> = useMemo(
    () => ({
      permissions: (role) => <PermissionsList role={role} />,
    }),
    [],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'name',
        label: 'Role name',
        placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.name) }),
      },
    ],
    [intl],
  );

  // Filter and sort roles (local data)
  const { totalCount, paginatedRoles } = useMemo(() => {
    const searchValue = (tableState.filters.name as string) || '';

    // Filter roles based on search
    const filtered = searchValue
      ? roles.filter((role) => (role.display_name || role.name || '').toLowerCase().includes(searchValue.toLowerCase()))
      : roles;

    // Sort the filtered roles
    const sorted = [...filtered].sort((a, b) => {
      const dir = tableState.sort?.direction === 'desc' ? -1 : 1;
      if (tableState.sort?.column === 'name') {
        return dir * (a.display_name || a.name || '').localeCompare(b.display_name || b.name || '');
      } else if (tableState.sort?.column === 'description') {
        return dir * (a.description || '').localeCompare(b.description || '');
      } else if (tableState.sort?.column === 'permissions') {
        return dir * ((Number(a.accessCount) || 0) - (Number(b.accessCount) || 0));
      }
      return 0;
    });

    // Paginate
    const startIndex = (tableState.page - 1) * tableState.perPage;
    const paginated = sorted.slice(startIndex, startIndex + tableState.perPage);

    return { totalCount: sorted.length, paginatedRoles: paginated };
  }, [roles, tableState.filters.name, tableState.sort, tableState.page, tableState.perPage]);

  // Selection — parent-controlled (string IDs), convert to/from RoleRow objects
  const selectedRows = useMemo(() => roles.filter((r) => selectedRoles.includes(r.uuid)), [roles, selectedRoles]);

  const handleSelectRow = useCallback(
    (role: RoleRow, selected: boolean) => {
      if (selected) {
        onRoleSelection([...selectedRoles, role.uuid]);
      } else {
        onRoleSelection(selectedRoles.filter((id) => id !== role.uuid));
      }
    },
    [selectedRoles, onRoleSelection],
  );

  const handleSelectAll = useCallback(
    (selected: boolean, rows: RoleRow[]) => {
      if (selected) {
        const newIds = rows.map((r) => r.uuid).filter((id) => !selectedRoles.includes(id));
        onRoleSelection([...selectedRoles, ...newIds]);
      } else {
        const rowIds = new Set(rows.map((r) => r.uuid));
        onRoleSelection(selectedRoles.filter((id) => !rowIds.has(id)));
      }
    },
    [selectedRoles, onRoleSelection],
  );

  return (
    <TableView<typeof columns, RoleRow, SortableColumn, CompoundColumn>
      columns={columns}
      columnConfig={columnConfig}
      sortableColumns={sortableColumns}
      data={isLoading ? undefined : paginatedRoles}
      totalCount={totalCount}
      getRowId={(role) => role.uuid}
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
      // Expansion — from useTableState
      expandedCell={tableState.expandedCell}
      onToggleExpand={tableState.onToggleExpand}
      // Filters — from useTableState
      filterConfig={filterConfig}
      filters={tableState.filters}
      onFiltersChange={tableState.onFiltersChange}
      clearAllFilters={tableState.clearAllFilters}
      variant="compact"
      ariaLabel={intl.formatMessage(messages.selectRoles)}
      ouiaId="roles-selection-table"
      emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(messages.noRolesFound)} />}
      emptyStateNoResults={
        <DefaultEmptyStateNoResults
          title={intl.formatMessage(messages.noRolesFound)}
          body={intl.formatMessage(messages.noRolesFoundDescription)}
          onClearFilters={tableState.clearAllFilters}
        />
      }
    />
  );
};
