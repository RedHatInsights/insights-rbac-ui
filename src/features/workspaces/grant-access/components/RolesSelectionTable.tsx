import React, { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TableView } from '../../../../components/table-view/TableView';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../components/table-view/components/TableViewEmptyState';
import type {
  CellRendererMap,
  ColumnConfigMap,
  ExpandedCell,
  ExpansionRendererMap,
  FilterConfig,
  FilterState,
  SortState,
} from '../../../../components/table-view/types';
import { Role } from '../../../../redux/roles/reducer';
import messages from '../../../../Messages';

// List of permissions for expanded view with each permission on its own line
const PermissionsList: React.FC<{ role: Role }> = ({ role }) => {
  const intl = useIntl();

  if (!role.access || role.access.length === 0) {
    return <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.noPermissions)}</Text>;
  }

  return (
    <div className="pf-v5-u-mx-lg pf-v5-u-my-sm">
      {role.access.map((access, index) => (
        <Text key={index} component="p" className="pf-v5-u-mb-xs">
          {access.permission}
        </Text>
      ))}
    </div>
  );
};

interface RolesSelectionTableProps {
  roles: Role[];
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
  const [expandedCell, setExpandedCell] = useState<ExpandedCell<CompoundColumn> | null>(null);
  const [filters, setFilters] = useState<FilterState>({ name: '' });
  const [sort, setSort] = useState<SortState<SortableColumn>>({ column: 'name', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.name), sortable: true },
      description: { label: intl.formatMessage(messages.description), sortable: true },
      permissions: { label: intl.formatMessage(messages.permissions), sortable: true, isCompound: true },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, Role> = useMemo(
    () => ({
      name: (role) => role.display_name || role.name,
      description: (role) => role.description || '—',
      permissions: (role) => role.accessCount || 0,
    }),
    [],
  );

  const expansionRenderers: ExpansionRendererMap<CompoundColumn, Role> = useMemo(
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

  // Filter and sort roles
  const { totalCount, paginatedRoles } = useMemo(() => {
    const searchValue = (filters.name as string) || '';

    // Filter roles based on search
    let filtered = searchValue ? roles.filter((role) => (role.display_name || role.name).toLowerCase().includes(searchValue.toLowerCase())) : roles;

    // Sort the filtered roles
    const sorted = [...filtered].sort((a, b) => {
      if (sort.column === 'name') {
        const aVal = a.display_name || a.name || '';
        const bVal = b.display_name || b.name || '';
        return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else if (sort.column === 'description') {
        const aVal = a.description || '';
        const bVal = b.description || '';
        return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else if (sort.column === 'permissions') {
        const aVal = Number(a.accessCount) || 0;
        const bVal = Number(b.accessCount) || 0;
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    // Paginate
    const startIndex = (page - 1) * perPage;
    const paginated = sorted.slice(startIndex, startIndex + perPage);

    return { totalCount: sorted.length, paginatedRoles: paginated };
  }, [roles, filters.name, sort, page, perPage]);

  // Selection - convert between Role objects and string IDs
  const selectedRows = useMemo(() => roles.filter((r) => selectedRoles.includes(r.uuid)), [roles, selectedRoles]);

  const handleSelectRow = useCallback(
    (role: Role, selected: boolean) => {
      if (selected) {
        onRoleSelection([...selectedRoles, role.uuid]);
      } else {
        onRoleSelection(selectedRoles.filter((id) => id !== role.uuid));
      }
    },
    [selectedRoles, onRoleSelection],
  );

  const handleSelectAll = useCallback(
    (selected: boolean, rows: Role[]) => {
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

  // Compound expansion
  const handleToggleExpand = useCallback((rowId: string, column: CompoundColumn) => {
    setExpandedCell((prev) => (prev?.rowId === rowId && prev?.column === column ? null : { rowId, column }));
  }, []);

  const handleSortChange = useCallback((column: SortableColumn, direction: 'asc' | 'desc') => {
    setSort({ column, direction });
  }, []);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({ name: '' });
    setPage(1);
  }, []);

  return (
    <TableView<typeof columns, Role, SortableColumn, CompoundColumn>
      columns={columns}
      columnConfig={columnConfig}
      sortableColumns={sortableColumns}
      data={isLoading ? undefined : paginatedRoles}
      totalCount={totalCount}
      getRowId={(role) => role.uuid}
      cellRenderers={cellRenderers}
      expansionRenderers={expansionRenderers}
      sort={sort}
      onSortChange={handleSortChange}
      page={page}
      perPage={perPage}
      onPageChange={setPage}
      onPerPageChange={(newPerPage) => {
        setPerPage(newPerPage);
        setPage(1);
      }}
      selectable={true}
      selectedRows={selectedRows}
      onSelectRow={handleSelectRow}
      onSelectAll={handleSelectAll}
      expandedCell={expandedCell}
      onToggleExpand={handleToggleExpand}
      filterConfig={filterConfig}
      filters={filters}
      onFiltersChange={handleFiltersChange}
      clearAllFilters={clearAllFilters}
      variant="compact"
      ariaLabel={intl.formatMessage(messages.selectRoles)}
      ouiaId="roles-selection-table"
      emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(messages.noRolesFound)} />}
      emptyStateNoResults={
        <DefaultEmptyStateNoResults
          title={intl.formatMessage(messages.noRolesFound)}
          body={intl.formatMessage(messages.noRolesFoundDescription)}
          onClearFilters={clearAllFilters}
        />
      }
    />
  );
};
