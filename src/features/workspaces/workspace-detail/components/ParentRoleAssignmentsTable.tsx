import React, { useCallback, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useIntl } from 'react-intl';
import { DataViewState, DataViewTextFilter, DataViewTh } from '@patternfly/react-data-view';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { Pagination, Tooltip } from '@patternfly/react-core';
import { ThProps } from '@patternfly/react-table';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { useDataViewSelection } from '@patternfly/react-data-view/dist/dynamic/Hooks';

import messages from '../../../../Messages';
import { GroupDetailsDrawer, GroupWithInheritance } from './GroupDetailsDrawer';
import { EmptyTable } from './EmptyTable';

interface ParentRoleAssignmentsTableProps {
  // Data props
  groups: GroupWithInheritance[];
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

  // UI configuration props
  ouiaId?: string;
}

export const ParentRoleAssignmentsTable: React.FC<ParentRoleAssignmentsTableProps> = ({
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
  ouiaId = 'iam-parent-role-assignments-table',
}) => {
  const intl = useIntl();

  // Local state for drawer only
  const [focusedGroup, setFocusedGroup] = useState<GroupWithInheritance | undefined>();

  // Selection hook
  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });

  // Define columns - includes the "Inherited from" column
  const columns = useMemo(() => {
    const baseColumns = [
      { label: intl.formatMessage(messages.userGroup), key: 'name', sort: true },
      { label: intl.formatMessage(messages.description), key: 'description', sort: false },
      { label: intl.formatMessage(messages.users), key: 'principalCount', sort: true },
      { label: intl.formatMessage(messages.roles), key: 'roleCount', sort: true },
      { label: intl.formatMessage(messages.inheritedFrom), key: 'inheritedFrom', sort: true },
      { label: intl.formatMessage(messages.lastModified), key: 'modified', sort: true },
    ];

    return baseColumns.map((col, index) => ({ ...col, index }));
  }, [intl]);

  // Drawer handlers
  const onRowClick = useCallback((group: GroupWithInheritance | undefined) => {
    setFocusedGroup(group);
  }, []);

  const onCloseDrawer = useCallback(() => {
    setFocusedGroup(undefined);
  }, []);

  // Calculate sortable columns
  const sortByIndex = useMemo(() => {
    return columns.findIndex((column) => column.key === sortBy);
  }, [sortBy, columns]);

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: sortByIndex,
      direction,
      defaultDirection: 'asc',
    },
    onSort: (_event, index, direction) => onSort(_event, columns[index].key, direction),
    columnIndex,
  });

  const sortableColumns: DataViewTh[] = columns.map((column, index) => ({
    cell: column.label,
    props: {
      ...(column.sort ? { sort: getSortParams(index) } : {}),
    },
  }));

  // Transform groups into table rows
  const rows = useMemo(() => {
    const handleRowClick = (event?: React.MouseEvent | React.KeyboardEvent, group?: GroupWithInheritance) => {
      if (event && (event.currentTarget.matches('td') || event.currentTarget.matches('tr'))) {
        onRowClick(group);
      }
    };

    return groups.map((group: GroupWithInheritance) => ({
      id: group.uuid,
      row: [
        group.name,
        group.description ? (
          <Tooltip isContentLeftAligned content={group.description}>
            <span>{group.description.length > 23 ? `${group.description.slice(0, 20)}...` : group.description}</span>
          </Tooltip>
        ) : (
          <div className="pf-v5-u-color-400">{intl.formatMessage(messages['usersAndUserGroupsNoDescription'])}</div>
        ),
        group.principalCount,
        group.roleCount,
        group.inheritedFrom ? (
          <a href={`#/workspaces/${group.inheritedFrom.workspaceId}`} className="pf-v5-c-button pf-m-link pf-m-inline">
            {group.inheritedFrom.workspaceName}
          </a>
        ) : (
          <div className="pf-v5-u-color-400">-</div>
        ),
        group.modified ? formatDistanceToNow(new Date(group.modified), { addSuffix: true }) : '',
      ],
      props: {
        isClickable: true,
        onRowClick: (event?: React.MouseEvent | React.KeyboardEvent) => handleRowClick(event, focusedGroup?.uuid === group.uuid ? undefined : group),
        isRowSelected: false,
      },
    }));
  }, [groups, focusedGroup, intl, onRowClick]);

  const activeState = isLoading ? DataViewState.loading : groups.length === 0 ? DataViewState.empty : undefined;

  return (
    <GroupDetailsDrawer isOpen={!!focusedGroup} group={focusedGroup} onClose={onCloseDrawer} ouiaId={ouiaId} showInheritance={true}>
      <DataView activeState={activeState} selection={selection}>
        <DataViewToolbar
          bulkSelect={
            <BulkSelect
              isDataPaginated
              pageCount={groups.length}
              selectedCount={selection.selected?.length || 0}
              totalCount={totalCount}
              onSelect={(value) => {
                if (value === BulkSelectValue.none) {
                  selection.onSelect?.(false);
                } else if (value === BulkSelectValue.page) {
                  selection.onSelect?.(true, rows);
                } else if (value === BulkSelectValue.nonePage) {
                  selection.onSelect?.(false, rows);
                }
              }}
            />
          }
          pagination={
            <Pagination perPage={perPage} page={page} itemCount={totalCount} onSetPage={onSetPage} onPerPageSelect={onPerPageSelect} isCompact />
          }
          filters={
            <DataViewFilters onChange={(_e, values) => onSetFilters(values)} values={filters}>
              <DataViewTextFilter filterId="name" title="User group" placeholder="Filter by user group" />
              <DataViewTextFilter filterId="inheritedFrom" title="Inherited from" placeholder="Filter by inherited from" />
            </DataViewFilters>
          }
          clearAllFilters={clearAllFilters}
        />
        <DataViewTable
          variant="compact"
          aria-label="Parent Role Assignments Table"
          ouiaId={`${ouiaId}-table`}
          columns={sortableColumns}
          rows={rows}
          headStates={{ loading: <SkeletonTableHead columns={columns.map((column) => column.label)} /> }}
          bodyStates={{
            loading: <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />,
            empty: <EmptyTable titleText={intl.formatMessage(messages.userGroupsEmptyStateTitle)} />,
          }}
        />
        <DataViewToolbar
          ouiaId={`${ouiaId}-footer-toolbar`}
          pagination={<Pagination perPage={perPage} page={page} itemCount={totalCount} onSetPage={onSetPage} onPerPageSelect={onPerPageSelect} />}
        />
      </DataView>
    </GroupDetailsDrawer>
  );
};
