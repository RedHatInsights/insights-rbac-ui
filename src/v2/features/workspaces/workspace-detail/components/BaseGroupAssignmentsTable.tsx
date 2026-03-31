import React, { useCallback, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';

import type { WorkspaceGroupRow } from '../../../../data/queries/groupAssignments';
import messages from '../../../../../Messages';
import { GroupDetailsDrawer } from './GroupDetailsDrawer';
import { RemoveGroupFromWorkspaceModal } from './RemoveGroupFromWorkspaceModal';
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
  currentWorkspace?: { id: string; name: string; type: 'workspace' | 'tenant' };
  ouiaId?: string;
  /** Whether the user has permission to grant access (Kessel `role_binding_grant`). Defaults to `false`. */
  canGrantAccess?: boolean;
  /** Whether the user has permission to edit role bindings (Kessel `role_binding_grant` — BE uses same permission as grant, see RHCLOUD-46392). Defaults to `false`. */
  canEditAccess?: boolean;
  /** Whether the user has permission to revoke role bindings (Kessel `role_binding_revoke`). Defaults to `false`. */
  canRevokeAccess?: boolean;
  /** Whether to sync table state (sort, filters, pagination) with URL params. Defaults to `true`. */
  syncWithUrl?: boolean;
  /** URL-driven focused group: when set and found in groups data, the drawer opens */
  focusedGroupId?: string;
  /** Navigate to group drawer route */
  onGroupSelect: (group: WorkspaceGroupRow) => void;
  /** Navigate away from group drawer route */
  onGroupDeselect: () => void;
  /** Navigate to grant access route */
  onGrantAccess: () => void;
}

export const BaseGroupAssignmentsTable: React.FC<BaseGroupAssignmentsTableProps> = ({
  groups,
  totalCount,
  isLoading,
  currentWorkspace,
  ouiaId = 'iam-role-assignments-table',
  canGrantAccess = false,
  canEditAccess = false,
  canRevokeAccess = false,
  syncWithUrl = true,
  focusedGroupId,
  onGroupSelect,
  onGroupDeselect,
  onGrantAccess,
}) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const grantAccessEnabled = useWorkspacesFlag('m4');

  const focusedGroup = useMemo(() => (focusedGroupId ? groups.find((g) => g.id === focusedGroupId) : undefined), [focusedGroupId, groups]);
  const [groupToRemove, setGroupToRemove] = useState<WorkspaceGroupRow | undefined>();

  const tableState = useTableState<typeof columns, WorkspaceGroupRow, SortableColumn>({
    columns,
    sortableColumns,
    getRowId: (row) => row.id,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 20,
    initialFilters: { name: '' },
    syncWithUrl,
  });

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.userGroupName), sortable: true },
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

  const filteredGroups = useMemo(() => {
    const nameFilter = typeof tableState.filters.name === 'string' ? tableState.filters.name.toLowerCase() : '';
    if (!nameFilter) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(nameFilter));
  }, [groups, tableState.filters.name]);

  const renderActions = useCallback(
    (group: WorkspaceGroupRow) => {
      const items: ActionDropdownItem[] = [
        {
          key: 'edit-access',
          label: intl.formatMessage(messages.editAccess),
          onClick: () => {
            if (currentWorkspace) {
              navigate(pathnames['workspace-detail-edit-access'].link(currentWorkspace.id, group.id));
            }
          },
          isDisabled: !currentWorkspace || !canEditAccess || group.isDefaultGroup,
        },
        {
          key: 'remove-access',
          label: intl.formatMessage(messages.removeAccess),
          isDanger: canRevokeAccess && !group.isDefaultGroup,
          onClick: () => setGroupToRemove(group),
          isDisabled: !canRevokeAccess || group.isDefaultGroup,
        },
      ];
      return <ActionDropdown items={items} ariaLabel={`Actions for ${group.name}`} ouiaId={`${ouiaId}-row-actions-${group.id}`} />;
    },
    [intl, currentWorkspace, navigate, ouiaId, canEditAccess, canRevokeAccess],
  );

  const handleRowClick = useCallback(
    (group: WorkspaceGroupRow) => {
      if (focusedGroup?.id === group.id) {
        onGroupDeselect();
      } else {
        onGroupSelect(group);
      }
    },
    [focusedGroup, onGroupSelect, onGroupDeselect],
  );

  const toolbarActions = useMemo(
    () =>
      currentWorkspace ? (
        <Button
          variant="primary"
          isDisabled={!grantAccessEnabled || !canGrantAccess}
          onClick={onGrantAccess}
          ouiaId={`${ouiaId}-grant-access-button`}
        >
          {intl.formatMessage(messages.grantAccess)}
        </Button>
      ) : undefined,
    [grantAccessEnabled, canGrantAccess, ouiaId, intl, currentWorkspace, onGrantAccess],
  );

  return (
    <GroupDetailsDrawer
      isOpen={!!focusedGroup}
      group={focusedGroup}
      onClose={onGroupDeselect}
      ouiaId={ouiaId}
      currentWorkspace={currentWorkspace}
      canEditAccess={canEditAccess}
      canRevokeAccess={canRevokeAccess}
      onRemoveFromWorkspace={currentWorkspace ? (group) => setGroupToRemove(group) : undefined}
    >
      <TableView<typeof columns, WorkspaceGroupRow, SortableColumn>
        columns={columns}
        columnConfig={columnConfig}
        sortableColumns={sortableColumns}
        data={isLoading ? undefined : filteredGroups}
        totalCount={tableState.filters.name ? filteredGroups.length : (totalCount ?? filteredGroups.length)}
        getRowId={(row) => row.id}
        cellRenderers={cellRenderers}
        sort={tableState.sort}
        onSortChange={tableState.onSortChange}
        page={tableState.page}
        perPage={tableState.perPage}
        onPageChange={tableState.onPageChange}
        onPerPageChange={tableState.onPerPageChange}
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
