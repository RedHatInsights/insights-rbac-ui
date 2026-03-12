import React, { useCallback, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useIntl } from 'react-intl';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';

import type { InheritedWorkspaceGroupRow, WorkspaceGroupRow } from '../../../../data/queries/groupAssignments';
import messages from '../../../../../Messages';
import { GroupDetailsDrawer } from './GroupDetailsDrawer';
import { AppLink } from '../../../../../shared/components/navigation/AppLink';
import pathnames from '../../../../utilities/pathnames';
import { TableView } from '../../../../../shared/components/table-view/TableView';
import { useTableState } from '../../../../../shared/components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../../shared/components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../../shared/components/table-view/types';

const columns = ['name', 'description', 'userCount', 'roleCount', 'inheritedFrom', 'lastModified'] as const;
type SortableColumn = 'name' | 'userCount' | 'roleCount' | 'inheritedFrom' | 'lastModified';
const sortableColumns = ['name', 'userCount', 'roleCount', 'inheritedFrom', 'lastModified'] as const;

export interface InheritedGroupAssignmentsTableProps {
  groups: InheritedWorkspaceGroupRow[];
  /** Total count of items. When omitted, PF Pagination renders in indeterminate mode. */
  totalCount?: number;
  isLoading: boolean;
  currentWorkspace?: { id: string; name: string };
  ouiaId?: string;
}

export const InheritedGroupAssignmentsTable: React.FC<InheritedGroupAssignmentsTableProps> = ({
  groups,
  totalCount,
  isLoading,
  currentWorkspace,
  ouiaId = 'iam-role-assignments-table',
}) => {
  const intl = useIntl();

  const [focusedGroup, setFocusedGroup] = useState<WorkspaceGroupRow | undefined>();

  const tableState = useTableState<typeof columns, InheritedWorkspaceGroupRow, SortableColumn>({
    columns,
    sortableColumns,
    getRowId: (row) => row.id,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 20,
    initialFilters: { name: '', inheritedFrom: '' },
  });

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.userGroup), sortable: true },
      description: { label: intl.formatMessage(messages.description) },
      userCount: { label: intl.formatMessage(messages.users), sortable: true },
      roleCount: { label: intl.formatMessage(messages.roles), sortable: true },
      inheritedFrom: {
        label: (
          <>
            {intl.formatMessage(messages.inheritedFrom)}
            <Popover
              triggerAction="hover"
              position="top"
              headerContent={intl.formatMessage(messages.inheritedFromPopoverHeader)}
              bodyContent={intl.formatMessage(messages.inheritedFromPopoverBody)}
            >
              <Icon className="pf-v6-u-pl-sm" isInline>
                <OutlinedQuestionCircleIcon />
              </Icon>
            </Popover>
          </>
        ),
        sortable: true,
      },
      lastModified: { label: intl.formatMessage(messages.lastModified), sortable: true },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, InheritedWorkspaceGroupRow> = useMemo(
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
      inheritedFrom: (row) => {
        if (row.inheritedFrom) {
          return (
            <AppLink to={pathnames['workspace-detail'].link(row.inheritedFrom.workspaceId)} className="pf-v6-c-button pf-m-link pf-m-inline">
              {row.inheritedFrom.workspaceName}
            </AppLink>
          );
        }
        return <div className="pf-v6-u-color-400">-</div>;
      },
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
      {
        type: 'text',
        id: 'inheritedFrom',
        label: intl.formatMessage(messages.inheritedFrom),
        placeholder: intl.formatMessage(messages.filterByInheritedFrom),
      },
    ],
    [intl],
  );

  const handleRowClick = useCallback(
    (group: InheritedWorkspaceGroupRow) => {
      setFocusedGroup(focusedGroup?.id === group.id ? undefined : group);
    },
    [focusedGroup],
  );

  const onCloseDrawer = useCallback(() => {
    setFocusedGroup(undefined);
  }, []);

  return (
    <GroupDetailsDrawer
      isOpen={!!focusedGroup}
      group={focusedGroup}
      onClose={onCloseDrawer}
      ouiaId={ouiaId}
      showInheritance={true}
      currentWorkspace={currentWorkspace}
    >
      <TableView<typeof columns, InheritedWorkspaceGroupRow, SortableColumn>
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
        filterConfig={filterConfig}
        filters={tableState.filters}
        onFiltersChange={tableState.onFiltersChange}
        clearAllFilters={tableState.clearAllFilters}
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
    </GroupDetailsDrawer>
  );
};
