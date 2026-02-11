import React, { useCallback, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';

import { type Group } from '../../../../data/queries/groups';
import messages from '../../../../Messages';
import { GroupDetailsDrawer } from './GroupDetailsDrawer';
import { GrantAccessWizard } from '../../grant-access/GrantAccessWizard';
import { useWorkspacesFlag } from '../../../../hooks/useWorkspacesFlag';
import { TableView } from '../../../../components/table-view/TableView';
import { useTableState } from '../../../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../components/table-view/types';

const columns = ['name', 'description', 'principalCount', 'roleCount', 'modified'] as const;
type SortableColumn = 'name' | 'principalCount' | 'roleCount' | 'modified';
const sortableColumns = ['name', 'principalCount', 'roleCount', 'modified'] as const;

export interface BaseGroupAssignmentsTableProps {
  groups: Group[];
  /** Total count of items. When omitted, PF Pagination renders in indeterminate mode. */
  totalCount?: number;
  isLoading: boolean;
  workspaceName?: string;
  currentWorkspace?: { id: string; name: string };
  ouiaId?: string;
}

export const BaseGroupAssignmentsTable: React.FC<BaseGroupAssignmentsTableProps> = ({
  groups,
  totalCount,
  isLoading,
  workspaceName,
  currentWorkspace,
  ouiaId = 'iam-role-assignments-table',
}) => {
  const intl = useIntl();
  const grantAccessWizard = useWorkspacesFlag('m5');

  const [focusedGroup, setFocusedGroup] = useState<Group | undefined>();
  const [isGrantAccessWizardOpen, setIsGrantAccessWizardOpen] = useState(false);

  const tableState = useTableState<typeof columns, Group, SortableColumn>({
    columns,
    sortableColumns,
    getRowId: (row) => row.uuid,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 20,
    initialFilters: { name: '' },
    syncWithUrl: true,
  });

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.userGroup), sortable: true },
      description: { label: intl.formatMessage(messages.description) },
      principalCount: { label: intl.formatMessage(messages.users), sortable: true },
      roleCount: { label: intl.formatMessage(messages.roles), sortable: true },
      modified: { label: intl.formatMessage(messages.lastModified), sortable: true },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, Group> = useMemo(
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

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'search',
        id: 'name',
        placeholder: intl.formatMessage(messages.filterByUserGroup),
      },
    ],
    [intl],
  );

  const handleRowClick = useCallback(
    (group: Group) => {
      setFocusedGroup(focusedGroup?.uuid === group.uuid ? undefined : group);
    },
    [focusedGroup],
  );

  const onCloseDrawer = useCallback(() => {
    setFocusedGroup(undefined);
  }, []);

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

  return (
    <GroupDetailsDrawer isOpen={!!focusedGroup} group={focusedGroup} onClose={onCloseDrawer} ouiaId={ouiaId} currentWorkspace={currentWorkspace}>
      <TableView<typeof columns, Group, SortableColumn>
        columns={columns}
        columnConfig={columnConfig}
        sortableColumns={sortableColumns}
        data={isLoading ? undefined : groups}
        totalCount={totalCount}
        getRowId={(row) => row.uuid}
        cellRenderers={cellRenderers}
        sort={tableState.sort}
        onSortChange={tableState.onSortChange}
        page={tableState.page}
        perPage={tableState.perPage}
        onPageChange={tableState.onPageChange}
        onPerPageChange={tableState.onPerPageChange}
        selectable={true}
        selectedRows={tableState.selectedRows}
        onSelectRow={tableState.onSelectRow}
        onSelectAll={tableState.onSelectAll}
        filterConfig={filterConfig}
        filters={tableState.filters}
        onFiltersChange={tableState.onFiltersChange}
        clearAllFilters={tableState.clearAllFilters}
        toolbarActions={toolbarActions}
        onRowClick={handleRowClick}
        isRowClickable={() => true}
        variant="compact"
        ariaLabel="Role Assignments Table"
        ouiaId={`${ouiaId}-table`}
        emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(messages.userGroupsEmptyStateTitle)} />}
        emptyStateNoResults={
          <DefaultEmptyStateNoResults title={intl.formatMessage(messages.userGroupsEmptyStateTitle)} onClearFilters={tableState.clearAllFilters} />
        }
      />
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
