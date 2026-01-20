import React, { useCallback, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';

import { type Group } from '../../../../data/queries/groups';
import type { GroupWithInheritance } from './GroupDetailsDrawer';
import messages from '../../../../Messages';
import { GroupDetailsDrawer } from './GroupDetailsDrawer';
import { AppLink } from '../../../../components/navigation/AppLink';
import { GrantAccessWizard } from '../../grant-access/GrantAccessWizard';
import { useWorkspacesFlag } from '../../../../hooks/useWorkspacesFlag';
import { TableView } from '../../../../components/table-view/TableView';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig, SortDirection } from '../../../../components/table-view/types';

const isGroupWithInheritance = (group: Group | GroupWithInheritance): group is GroupWithInheritance => {
  return 'inheritedFrom' in group && group.inheritedFrom !== undefined;
};

interface RoleAssignmentsTableProps {
  // Data props
  groups: Group[] | GroupWithInheritance[];
  totalCount: number;
  isLoading: boolean;
  page: number;
  perPage: number;
  onSetPage: (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => void;
  onPerPageSelect: (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, perPage: number) => void;

  // Sorting props
  sortBy?: string;
  direction?: 'asc' | 'desc';
  onSort: (event: React.MouseEvent | React.KeyboardEvent, key: string, direction: 'asc' | 'desc') => void;

  // Filtering props
  filters: { name: string; inheritedFrom?: string };
  onSetFilters: (filters: Partial<{ name: string; inheritedFrom?: string }>) => void;
  clearAllFilters: () => void;

  workspaceName?: string;
  currentWorkspace?: { id: string; name: string };

  // UI configuration props
  ouiaId?: string;
}

// Column definitions - with and without inheritance
const columnsWithInheritance = ['name', 'description', 'principalCount', 'roleCount', 'inheritedFrom', 'modified'] as const;
const columnsWithoutInheritance = ['name', 'description', 'principalCount', 'roleCount', 'modified'] as const;

type SortableColumnWithInheritance = 'name' | 'principalCount' | 'roleCount' | 'inheritedFrom' | 'modified';
type SortableColumnWithoutInheritance = 'name' | 'principalCount' | 'roleCount' | 'modified';

export const RoleAssignmentsTable: React.FC<RoleAssignmentsTableProps> = ({
  groups,
  totalCount,
  isLoading,
  page,
  perPage,
  onSetPage,
  onPerPageSelect,
  sortBy = 'name',
  direction = 'asc',
  onSort,
  filters,
  onSetFilters,
  clearAllFilters,
  workspaceName,
  currentWorkspace,
  ouiaId = 'iam-role-assignments-table',
}) => {
  const intl = useIntl();
  const grantAccessWizard = useWorkspacesFlag('m5');

  const [focusedGroup, setFocusedGroup] = useState<Group | undefined>();
  const [isGrantAccessWizardOpen, setIsGrantAccessWizardOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<(Group | GroupWithInheritance)[]>([]);

  // Check if any group has inheritance information
  const hasInheritanceData = useMemo(() => {
    return groups.length > 0 && groups.some(isGroupWithInheritance);
  }, [groups]);

  // Column configuration - with inheritance
  const columnConfigWithInheritance: ColumnConfigMap<typeof columnsWithInheritance> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.userGroup), sortable: true },
      description: { label: intl.formatMessage(messages.description) },
      principalCount: { label: intl.formatMessage(messages.users), sortable: true },
      roleCount: { label: intl.formatMessage(messages.roles), sortable: true },
      inheritedFrom: { label: intl.formatMessage(messages.inheritedFrom), sortable: true },
      modified: { label: intl.formatMessage(messages.lastModified), sortable: true },
    }),
    [intl],
  );

  // Column configuration - without inheritance
  const columnConfigWithoutInheritance: ColumnConfigMap<typeof columnsWithoutInheritance> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.userGroup), sortable: true },
      description: { label: intl.formatMessage(messages.description) },
      principalCount: { label: intl.formatMessage(messages.users), sortable: true },
      roleCount: { label: intl.formatMessage(messages.roles), sortable: true },
      modified: { label: intl.formatMessage(messages.lastModified), sortable: true },
    }),
    [intl],
  );

  // Cell renderers - with inheritance
  const cellRenderersWithInheritance: CellRendererMap<typeof columnsWithInheritance, Group | GroupWithInheritance> = useMemo(
    () => ({
      name: (row) => row.name,
      description: (row) =>
        row.description ? (
          <Tooltip isContentLeftAligned content={row.description}>
            <span>{row.description.length > 23 ? `${row.description.slice(0, 20)}...` : row.description}</span>
          </Tooltip>
        ) : (
          <div className="pf-v6-u-color-400">{intl.formatMessage(messages['usersAndUserGroupsNoDescription'])}</div>
        ),
      principalCount: (row) => row.principalCount,
      roleCount: (row) => row.roleCount,
      inheritedFrom: (row) => {
        if (isGroupWithInheritance(row) && row.inheritedFrom) {
          return (
            <AppLink to={`#/workspaces/${row.inheritedFrom.workspaceId}`} linkBasename="/iam" className="pf-v6-c-button pf-m-link pf-m-inline">
              {row.inheritedFrom.workspaceName}
            </AppLink>
          );
        }
        return <div className="pf-v6-u-color-400">-</div>;
      },
      modified: (row) => (row.modified ? formatDistanceToNow(new Date(row.modified), { addSuffix: true }) : ''),
    }),
    [intl],
  );

  // Cell renderers - without inheritance
  const cellRenderersWithoutInheritance: CellRendererMap<typeof columnsWithoutInheritance, Group | GroupWithInheritance> = useMemo(
    () => ({
      name: (row) => row.name,
      description: (row) =>
        row.description ? (
          <Tooltip isContentLeftAligned content={row.description}>
            <span>{row.description.length > 23 ? `${row.description.slice(0, 20)}...` : row.description}</span>
          </Tooltip>
        ) : (
          <div className="pf-v6-u-color-400">{intl.formatMessage(messages['usersAndUserGroupsNoDescription'])}</div>
        ),
      principalCount: (row) => row.principalCount,
      roleCount: (row) => row.roleCount,
      modified: (row) => (row.modified ? formatDistanceToNow(new Date(row.modified), { addSuffix: true }) : ''),
    }),
    [intl],
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = useMemo(() => {
    const baseFilters: FilterConfig[] = [
      {
        type: 'search',
        id: 'name',
        placeholder: intl.formatMessage(messages.filterByUserGroup),
      },
    ];

    if (hasInheritanceData) {
      baseFilters.push({
        type: 'text',
        id: 'inheritedFrom',
        label: intl.formatMessage(messages.inheritedFrom),
        placeholder: intl.formatMessage(messages.filterByInheritedFrom),
      });
    }

    return baseFilters;
  }, [intl, hasInheritanceData]);

  // Sort handling
  const currentSort = useMemo(
    () =>
      sortBy
        ? {
            column: sortBy as SortableColumnWithInheritance | SortableColumnWithoutInheritance,
            direction: direction as SortDirection,
          }
        : null,
    [sortBy, direction],
  );

  const handleSortChangeWithInheritance = useCallback(
    (column: SortableColumnWithInheritance, newDirection: SortDirection) => {
      onSort({} as React.MouseEvent, column, newDirection);
    },
    [onSort],
  );

  const handleSortChangeWithoutInheritance = useCallback(
    (column: SortableColumnWithoutInheritance, newDirection: SortDirection) => {
      onSort({} as React.MouseEvent, column, newDirection);
    },
    [onSort],
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilters: Record<string, string | string[]>) => {
      onSetFilters({
        name: (newFilters.name as string) || '',
        inheritedFrom: (newFilters.inheritedFrom as string) || undefined,
      });
    },
    [onSetFilters],
  );

  // Selection handlers
  const handleSelectRow = useCallback((row: Group | GroupWithInheritance, isSelected: boolean) => {
    setSelectedRows((prev) => {
      if (isSelected) {
        return [...prev, row];
      }
      return prev.filter((r) => r.uuid !== row.uuid);
    });
  }, []);

  const handleSelectAll = useCallback((isSelected: boolean, currentRows: (Group | GroupWithInheritance)[]) => {
    if (isSelected) {
      setSelectedRows((prev) => {
        const existingIds = new Set(prev.map((r) => r.uuid));
        const newRows = currentRows.filter((r) => !existingIds.has(r.uuid));
        return [...prev, ...newRows];
      });
    } else {
      const rowIds = new Set(currentRows.map((r) => r.uuid));
      setSelectedRows((prev) => prev.filter((r) => !rowIds.has(r.uuid)));
    }
  }, []);

  // Handle row click for drawer
  const handleRowClick = useCallback(
    (group: Group | GroupWithInheritance) => {
      setFocusedGroup(focusedGroup?.uuid === group.uuid ? undefined : group);
    },
    [focusedGroup],
  );

  // Drawer handlers
  const onCloseDrawer = useCallback(() => {
    setFocusedGroup(undefined);
  }, []);

  // Toolbar actions
  const toolbarActions = useMemo(
    () => (
      <Button
        variant="primary"
        isDisabled={!grantAccessWizard}
        onClick={() => setIsGrantAccessWizardOpen(true)}
        ouiaId={`${ouiaId}-grant-access-button`}
      >
        {intl.formatMessage(messages.grantAccess)}
      </Button>
    ),
    [grantAccessWizard, ouiaId, intl],
  );

  const sortableColumnsWithInheritance = ['name', 'principalCount', 'roleCount', 'inheritedFrom', 'modified'] as const;
  const sortableColumnsWithoutInheritance = ['name', 'principalCount', 'roleCount', 'modified'] as const;

  return (
    <GroupDetailsDrawer
      isOpen={!!focusedGroup}
      group={focusedGroup}
      onClose={onCloseDrawer}
      ouiaId={ouiaId}
      showInheritance={hasInheritanceData}
      currentWorkspace={currentWorkspace}
    >
      {hasInheritanceData ? (
        <TableView<typeof columnsWithInheritance, Group | GroupWithInheritance, SortableColumnWithInheritance>
          columns={columnsWithInheritance}
          columnConfig={columnConfigWithInheritance}
          sortableColumns={sortableColumnsWithInheritance}
          data={isLoading ? undefined : groups}
          totalCount={totalCount}
          getRowId={(row) => row.uuid}
          cellRenderers={cellRenderersWithInheritance}
          sort={currentSort as { column: SortableColumnWithInheritance; direction: SortDirection } | null}
          onSortChange={handleSortChangeWithInheritance}
          page={page}
          perPage={perPage}
          onPageChange={(newPage) => onSetPage({} as MouseEvent, newPage)}
          onPerPageChange={(newPerPage) => onPerPageSelect({} as MouseEvent, newPerPage)}
          selectable={true}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          filterConfig={filterConfig}
          filters={filters}
          onFiltersChange={handleFilterChange}
          clearAllFilters={clearAllFilters}
          toolbarActions={toolbarActions}
          onRowClick={handleRowClick}
          isRowClickable={() => true}
          variant="compact"
          ariaLabel="Role Assignments Table"
          ouiaId={`${ouiaId}-table`}
          emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(messages.userGroupsEmptyStateTitle)} />}
          emptyStateNoResults={
            <DefaultEmptyStateNoResults title={intl.formatMessage(messages.userGroupsEmptyStateTitle)} onClearFilters={clearAllFilters} />
          }
        />
      ) : (
        <TableView<typeof columnsWithoutInheritance, Group | GroupWithInheritance, SortableColumnWithoutInheritance>
          columns={columnsWithoutInheritance}
          columnConfig={columnConfigWithoutInheritance}
          sortableColumns={sortableColumnsWithoutInheritance}
          data={isLoading ? undefined : groups}
          totalCount={totalCount}
          getRowId={(row) => row.uuid}
          cellRenderers={cellRenderersWithoutInheritance}
          sort={currentSort as { column: SortableColumnWithoutInheritance; direction: SortDirection } | null}
          onSortChange={handleSortChangeWithoutInheritance}
          page={page}
          perPage={perPage}
          onPageChange={(newPage) => onSetPage({} as MouseEvent, newPage)}
          onPerPageChange={(newPerPage) => onPerPageSelect({} as MouseEvent, newPerPage)}
          selectable={true}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          filterConfig={filterConfig}
          filters={filters}
          onFiltersChange={handleFilterChange}
          clearAllFilters={clearAllFilters}
          toolbarActions={toolbarActions}
          onRowClick={handleRowClick}
          isRowClickable={() => true}
          variant="compact"
          ariaLabel="Role Assignments Table"
          ouiaId={`${ouiaId}-table`}
          emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(messages.userGroupsEmptyStateTitle)} />}
          emptyStateNoResults={
            <DefaultEmptyStateNoResults title={intl.formatMessage(messages.userGroupsEmptyStateTitle)} onClearFilters={clearAllFilters} />
          }
        />
      )}
      {isGrantAccessWizardOpen && workspaceName && (
        <GrantAccessWizard
          workspaceName={workspaceName}
          afterSubmit={() => setIsGrantAccessWizardOpen(false)}
          onCancel={() => setIsGrantAccessWizardOpen(false)}
        />
      )}
    </GroupDetailsDrawer>
  );
};
