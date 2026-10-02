import React, { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { SimpleList } from '@patternfly/react-core/dist/dynamic/components/SimpleList';
import { SimpleListItem } from '@patternfly/react-core/dist/dynamic/components/SimpleList';
import { TableView } from '@redhat-cloud-services/frontend-components/TableView';
import { useTableState } from '@redhat-cloud-services/frontend-components/TableView';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '@redhat-cloud-services/frontend-components/TableView';
import type { CellRendererMap, ColumnConfigMap, ExpansionRendererMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';

import type { Role } from '../../../../data/queries/roles';
import { useRoleQuery } from '../../../../data/queries/roles';
import { commonMessages } from '../../../../../shared/messages/common';

type RoleRow = Role;

// Fetches permissions on demand when the row is expanded
const PermissionsList: React.FC<{ roleId: string }> = ({ roleId }) => {
  const intl = useIntl();
  const { data: role, isLoading } = useRoleQuery(roleId, { enabled: !!roleId });
  const permissions = role?.permissions ?? [];

  if (isLoading) {
    return (
      <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
        {intl.formatMessage(commonMessages.loading)}
      </Content>
    );
  }

  if (permissions.length === 0) {
    return (
      <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
        {intl.formatMessage(commonMessages.noPermissions)}
      </Content>
    );
  }

  return (
    <SimpleList aria-label="Role permissions" className="pf-v6-u-mx-lg pf-v6-u-my-sm" isControlled={false}>
      {permissions.map((perm) => (
        <SimpleListItem key={`${perm.application}:${perm.resource_type}:${perm.operation}`}>
          {`${perm.application}:${perm.resource_type}:${perm.operation}`}
        </SimpleListItem>
      ))}
    </SimpleList>
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
    getRowId: (row: RoleRow) => row.id ?? '',
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 10,
    initialFilters: { name: '' },
  });

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(commonMessages.name), sortable: true },
      description: {
        label: intl.formatMessage(commonMessages.description),
        sortable: true,
      },
      permissions: {
        label: intl.formatMessage(commonMessages.permissions),
        sortable: true,
        isCompound: true,
        width: 20,
      },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, RoleRow> = useMemo(
    () => ({
      name: (role) => role.name,
      description: (role) => role.description || '—',
      permissions: (role) => role.permissions_count ?? 0,
    }),
    [],
  );

  const expansionRenderers: ExpansionRendererMap<CompoundColumn, RoleRow> = useMemo(
    () => ({
      permissions: (role) => <PermissionsList roleId={role.id ?? ''} />,
    }),
    [],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'name',
        label: 'Role name',
        placeholder: intl.formatMessage(commonMessages.filterByKey, { key: intl.formatMessage(commonMessages.name) }),
      },
    ],
    [intl],
  );

  // Filter and sort roles (local data)
  const { totalCount, paginatedRoles } = useMemo(() => {
    const searchValue = typeof tableState.filters.name === 'string' ? tableState.filters.name : '';

    const filtered = searchValue ? roles.filter((role) => (role.name || '').toLowerCase().includes(searchValue.toLowerCase())) : roles;

    const sorted = [...filtered].sort((a, b) => {
      const dir = tableState.sort?.direction === 'desc' ? -1 : 1;
      if (tableState.sort?.column === 'name') {
        return dir * (a.name || '').localeCompare(b.name || '');
      } else if (tableState.sort?.column === 'description') {
        return dir * (a.description || '').localeCompare(b.description || '');
      } else if (tableState.sort?.column === 'permissions') {
        return dir * ((a.permissions_count ?? 0) - (b.permissions_count ?? 0));
      }
      return 0;
    });

    // Paginate
    const startIndex = (tableState.page - 1) * tableState.perPage;
    const paginated = sorted.slice(startIndex, startIndex + tableState.perPage);

    return { totalCount: sorted.length, paginatedRoles: paginated };
  }, [roles, tableState.filters.name, tableState.sort, tableState.page, tableState.perPage]);

  // Selection — parent-controlled (string IDs), convert to/from RoleRow objects
  const selectedRows = useMemo(() => roles.filter((r) => r.id && selectedRoles.includes(r.id)), [roles, selectedRoles]);

  const handleSelectRow = useCallback(
    (role: RoleRow, selected: boolean) => {
      if (!role.id) return;
      if (selected) {
        onRoleSelection([...selectedRoles, role.id]);
      } else {
        onRoleSelection(selectedRoles.filter((id) => id !== role.id));
      }
    },
    [selectedRoles, onRoleSelection],
  );

  const handleSelectAll = useCallback(
    (selected: boolean, rows: RoleRow[]) => {
      if (selected) {
        const newIds = rows.map((r) => r.id).filter((id): id is string => id != null && !selectedRoles.includes(id));
        onRoleSelection([...selectedRoles, ...newIds]);
      } else {
        const rowIds = new Set(rows.map((r) => r.id));
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
      getRowId={(role) => role.id ?? ''}
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
      ariaLabel={intl.formatMessage({ id: 'selectRoles', defaultMessage: 'Select role(s)', description: 'Select roles step title' })}
      ouiaId="roles-selection-table"
      emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(commonMessages.noRolesFound)} />}
      emptyStateNoResults={
        <DefaultEmptyStateNoResults
          title={intl.formatMessage(commonMessages.noRolesFound)}
          body={intl.formatMessage({
            id: 'noRolesFoundDescription',
            defaultMessage: 'No roles match your current search criteria.',
            description: 'Empty state description when no roles match filters',
          })}
          onClearFilters={tableState.clearAllFilters}
        />
      }
    />
  );
};
