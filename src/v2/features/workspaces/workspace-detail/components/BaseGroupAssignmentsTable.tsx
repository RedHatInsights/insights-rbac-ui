import React, { useCallback, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';

import type { WorkspaceGroupRow } from '../../../../data/queries/groupAssignments';
import messages from '../../../../../Messages';
import { GroupDetailsDrawer } from './GroupDetailsDrawer';
import { RemoveGroupFromWorkspaceModal } from './RemoveGroupFromWorkspaceModal';
import { GrantAccessWizard } from '../../grant-access/GrantAccessWizard';
import { useWorkspacesFlag } from '../../../../../shared/hooks/useWorkspacesFlag';
import { ActionDropdown, type ActionDropdownItem } from '../../../../../shared/components/ActionDropdown/ActionDropdown';
import { TableView } from '../../../../../shared/components/table-view/TableView';
import { useTableState } from '../../../../../shared/components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../../shared/components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../../shared/components/table-view/types';
import useAppNavigate from '../../../../../shared/hooks/useAppNavigate';
import pathnames from '../../../../utilities/pathnames';

const columns = ['name', 'description', 'userCount', 'roleCount', 'lastModified'] as const;
type SortableColumn = 'name' | 'userCount' | 'roleCount' | 'lastModified';
const sortableColumns = ['name', 'userCount', 'roleCount', 'lastModified'] as const;

export interface BaseGroupAssignmentsTableProps {
  groups: WorkspaceGroupRow[];
  /** Total count of items. When omitted, PF Pagination renders in indeterminate mode. */
  totalCount?: number;
  isLoading: boolean;
  workspaceName?: string;
  currentWorkspace?: { id: string; name: string };
  ouiaId?: string;
  /** Whether the user has permission to grant access (Kessel `create` relation). Defaults to `false`. */
  canGrantAccess?: boolean;
  /** Controlled state: whether the grant access wizard is open */
  isGrantAccessWizardOpen?: boolean;
  /** Controlled callback: toggle the grant access wizard */
  onGrantAccessWizardToggle?: (open: boolean) => void;
}

export const BaseGroupAssignmentsTable: React.FC<BaseGroupAssignmentsTableProps> = ({
  groups,
  totalCount,
  isLoading,
  workspaceName,
  currentWorkspace,
  ouiaId = 'iam-role-assignments-table',
  canGrantAccess = false,
  isGrantAccessWizardOpen: externalWizardOpen,
  onGrantAccessWizardToggle,
}) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const grantAccessEnabled = useWorkspacesFlag('m4');

  const [focusedGroup, setFocusedGroup] = useState<WorkspaceGroupRow | undefined>();
  const [internalWizardOpen, setInternalWizardOpen] = useState(false);
  const isGrantAccessWizardOpen = externalWizardOpen ?? internalWizardOpen;
  const setIsGrantAccessWizardOpen = onGrantAccessWizardToggle ?? setInternalWizardOpen;
  const [groupToRemove, setGroupToRemove] = useState<WorkspaceGroupRow | undefined>();

  const tableState = useTableState<typeof columns, WorkspaceGroupRow, SortableColumn>({
    columns,
    sortableColumns,
    getRowId: (row) => row.id,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 20,
    initialFilters: { name: '' },
    syncWithUrl: true,
  });

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.userGroup), sortable: true },
      description: { label: intl.formatMessage(messages.description) },
      userCount: { label: intl.formatMessage(messages.users), sortable: true },
      roleCount: { label: intl.formatMessage(messages.roles), sortable: true },
      lastModified: { label: intl.formatMessage(messages.lastModified), sortable: true },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, WorkspaceGroupRow> = useMemo(
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
      userCount: (row) => row.userCount,
      roleCount: (row) => row.roleCount,
      lastModified: (row) => (row.lastModified ? formatDistanceToNow(new Date(row.lastModified), { addSuffix: true }) : ''),
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

  const renderActions = useCallback(
    (group: WorkspaceGroupRow) => {
      const items: ActionDropdownItem[] = [
        {
          key: 'edit-access',
          label: intl.formatMessage(messages.editAccessForThisWorkspace),
          onClick: () => {
            if (currentWorkspace) {
              navigate(pathnames['workspace-role-access'].link(currentWorkspace.id, group.id));
            }
          },
          isDisabled: !currentWorkspace,
        },
        { key: 'divider', label: '', isDivider: true },
        {
          key: 'remove-from-workspace',
          label: intl.formatMessage(messages.removeGroupFromWorkspace),
          isDanger: true,
          onClick: () => setGroupToRemove(group),
        },
      ];
      return <ActionDropdown items={items} ariaLabel={`Actions for ${group.name}`} ouiaId={`${ouiaId}-row-actions-${group.id}`} />;
    },
    [intl, currentWorkspace, navigate, ouiaId],
  );

  const handleRowClick = useCallback(
    (group: WorkspaceGroupRow) => {
      setFocusedGroup(focusedGroup?.id === group.id ? undefined : group);
    },
    [focusedGroup],
  );

  const onCloseDrawer = useCallback(() => {
    setFocusedGroup(undefined);
  }, []);

  const toolbarActions = useMemo(
    () =>
      currentWorkspace ? (
        <Button
          variant="primary"
          isDisabled={!grantAccessEnabled || !canGrantAccess}
          onClick={() => setIsGrantAccessWizardOpen(true)}
          ouiaId={`${ouiaId}-grant-access-button`}
        >
          {intl.formatMessage(messages.grantAccess)}
        </Button>
      ) : undefined,
    [grantAccessEnabled, canGrantAccess, ouiaId, intl, currentWorkspace],
  );

  return (
    <GroupDetailsDrawer
      isOpen={!!focusedGroup}
      group={focusedGroup}
      onClose={onCloseDrawer}
      ouiaId={ouiaId}
      currentWorkspace={currentWorkspace}
      onRemoveFromWorkspace={currentWorkspace ? (group) => setGroupToRemove(group) : undefined}
    >
      <TableView<typeof columns, WorkspaceGroupRow, SortableColumn>
        columns={columns}
        columnConfig={columnConfig}
        sortableColumns={sortableColumns}
        data={isLoading ? undefined : groups}
        totalCount={totalCount}
        getRowId={(row) => row.id}
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
        renderActions={currentWorkspace ? renderActions : undefined}
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
      {isGrantAccessWizardOpen && workspaceName && currentWorkspace && (
        <GrantAccessWizard
          workspaceName={workspaceName}
          workspaceId={currentWorkspace.id}
          afterSubmit={() => setIsGrantAccessWizardOpen(false)}
          onCancel={() => setIsGrantAccessWizardOpen(false)}
        />
      )}
      {groupToRemove && currentWorkspace && (
        <RemoveGroupFromWorkspaceModal
          isOpen={!!groupToRemove}
          groupId={groupToRemove.id}
          groupName={groupToRemove.name}
          workspaceId={currentWorkspace.id}
          workspaceName={currentWorkspace.name}
          onClose={() => setGroupToRemove(undefined)}
        />
      )}
    </GroupDetailsDrawer>
  );
};
