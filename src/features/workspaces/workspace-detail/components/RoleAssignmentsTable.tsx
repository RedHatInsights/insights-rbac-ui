import React, { useCallback, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useIntl } from 'react-intl';
import { DataViewState, DataViewTextFilter, DataViewTh } from '@patternfly/react-data-view';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { Button, EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon, Pagination, Tooltip } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { ThProps } from '@patternfly/react-table';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { useDataViewSelection } from '@patternfly/react-data-view/dist/dynamic/Hooks';

import { Group } from '../../../../redux/groups/reducer';
import messages from '../../../../Messages';
import { GroupDetailsDrawer } from './GroupDetailsDrawer';

const EmptyTable: React.FC<{ titleText: string }> = ({ titleText }) => (
  <EmptyState>
    <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
    <EmptyStateBody>No user groups match the filter criteria. Remove all filters or clear all to show results.</EmptyStateBody>
  </EmptyState>
);

interface RoleAssignmentsTableProps {
  // Data props
  groups: Group[];
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
  filters: { name: string };
  onSetFilters: (filters: Partial<{ name: string }>) => void;
  clearAllFilters: () => void;

  // UI configuration props
  ouiaId?: string;
}

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
  ouiaId = 'iam-role-assignments-table',
}) => {
  const intl = useIntl();

  // Local state for drawer only
  const [focusedGroup, setFocusedGroup] = useState<Group | undefined>();

  // Selection hook
  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });

  // Define columns - matching the required columns from the spec
  const columns = useMemo(() => {
    const baseColumns = [
      { label: intl.formatMessage(messages.userGroup), key: 'name', sort: true },
      { label: intl.formatMessage(messages.description), key: 'description', sort: false },
      { label: intl.formatMessage(messages.users), key: 'principalCount', sort: true },
      { label: intl.formatMessage(messages.roles), key: 'roleCount', sort: true },
      { label: intl.formatMessage(messages.lastModified), key: 'modified', sort: true },
    ];

    return baseColumns.map((col, index) => ({ ...col, index }));
  }, [intl]);

  // Drawer handlers
  const onRowClick = useCallback((group: Group | undefined) => {
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
    const handleRowClick = (event: any, group: Group | undefined) => {
      if (event.currentTarget.matches('td') || event.currentTarget.matches('tr')) {
        onRowClick(group);
      }
    };

    return groups.map((group: Group) => ({
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
        group.modified ? formatDistanceToNow(new Date(group.modified), { addSuffix: true }) : '',
      ],
      props: {
        isClickable: true,
        onRowClick: (event: any) => handleRowClick(event, focusedGroup?.uuid === group.uuid ? undefined : group),
        isRowSelected: false,
      },
    }));
  }, [groups, focusedGroup, intl, onRowClick]);

  const activeState = isLoading ? DataViewState.loading : groups.length === 0 ? DataViewState.empty : undefined;

  return (
    <GroupDetailsDrawer isOpen={!!focusedGroup} group={focusedGroup} onClose={onCloseDrawer} ouiaId={ouiaId}>
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
            </DataViewFilters>
          }
          actions={
            <Button variant="primary" isDisabled ouiaId={`${ouiaId}-grant-access-button`}>
              {intl.formatMessage(messages.grantAccess)}
            </Button>
          }
          clearAllFilters={clearAllFilters}
        />
        <DataViewTable
          variant="compact"
          aria-label="Role Assignments Table"
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
