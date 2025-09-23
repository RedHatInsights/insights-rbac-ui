import React, { useCallback, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useIntl } from 'react-intl';
import { DataViewState, DataViewTextFilter } from '@patternfly/react-data-view';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { Button, Pagination, Tooltip } from '@patternfly/react-core';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { useDataViewSelection } from '@patternfly/react-data-view/dist/dynamic/Hooks';

import { Group } from '../../../../redux/groups/reducer';
import messages from '../../../../Messages';
import { GroupDetailsDrawer, GroupWithInheritance } from './GroupDetailsDrawer';
import { EmptyTable } from './EmptyTable';

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
  onSort: (event: React.MouseEvent | React.KeyboardEvent, key: string, direction: 'asc' | 'desc') => void;

  // Filtering props
  filters: { name: string; inheritedFrom?: string };
  onSetFilters: (filters: Partial<{ name: string; inheritedFrom?: string }>) => void;
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
  onSort,
  filters,
  onSetFilters,
  clearAllFilters,
  ouiaId = 'iam-role-assignments-table',
}) => {
  const intl = useIntl();

  // Local state for drawer only
  const [focusedGroup, setFocusedGroup] = useState<Group | undefined>();

  // Local sorting state - similar to working AccessTable implementation
  const [sortByState, setSortByState] = useState({
    index: 0,
    direction: 'asc' as 'asc' | 'desc',
  });

  // Selection hook
  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });

  // Check if any group has inheritance information
  const hasInheritanceData = useMemo(() => {
    return groups.length > 0 && groups.some(isGroupWithInheritance);
  }, [groups]);

  // Define columns - conditionally includes inheritance column
  const columns = useMemo(() => {
    const baseColumns = [
      { label: intl.formatMessage(messages.userGroup), key: 'name', sort: true },
      { label: intl.formatMessage(messages.description), key: 'description', sort: false },
      { label: intl.formatMessage(messages.users), key: 'principalCount', sort: true },
      { label: intl.formatMessage(messages.roles), key: 'roleCount', sort: true },
      ...(hasInheritanceData ? [{ label: intl.formatMessage(messages.inheritedFrom), key: 'inheritedFrom', sort: true }] : []),
      { label: intl.formatMessage(messages.lastModified), key: 'modified', sort: true },
    ];

    return baseColumns.map((col, index) => ({ ...col, index }));
  }, [intl, hasInheritanceData]);

  // Drawer handlers
  const onRowClick = useCallback((group: Group | undefined) => {
    setFocusedGroup(group);
  }, []);

  const onCloseDrawer = useCallback(() => {
    setFocusedGroup(undefined);
  }, []);

  // Handle sorting like in working AccessTable implementation
  const handleSort = useCallback(
    (_event: any, index: number, direction: 'asc' | 'desc') => {
      const column = columns[index];
      if (!column?.key) {
        return; // Don't sort if column doesn't have a key
      }
      setSortByState({ index, direction });
      // Notify parent component about sort change
      onSort(_event, column.key, direction);
      onSetPage(_event, 1); // Reset to first page when sorting
    },
    [columns, onSort, onSetPage],
  );

  const getSortParams = (columnIndex: number) => ({
    sortBy: {
      index: sortByState.index,
      direction: sortByState.direction,
      defaultDirection: 'asc' as const,
    },
    onSort: handleSort,
    columnIndex,
  });

  // Convert columns to DataView format with sorting
  const dataViewColumns = useMemo(
    () =>
      columns.map((column, index) => ({
        cell: column.label,
        props: column.sort ? { sort: getSortParams(index) } : {},
      })),
    [columns, sortByState, handleSort],
  );

  // Transform groups into table rows
  const rows = useMemo(() => {
    const handleRowClick = (event?: React.MouseEvent | React.KeyboardEvent, group?: Group | GroupWithInheritance) => {
      if (event && (event.currentTarget.matches('td') || event.currentTarget.matches('tr'))) {
        onRowClick(group);
      }
    };

    return groups.map((group: Group | GroupWithInheritance) => {
      const baseRow = [
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
      ];

      // Add inheritance column if this group has inheritance data
      if (isGroupWithInheritance(group)) {
        const inheritanceCell = group.inheritedFrom ? (
          <a href={`#/workspaces/${group.inheritedFrom.workspaceId}`} className="pf-v5-c-button pf-m-link pf-m-inline">
            {group.inheritedFrom.workspaceName}
          </a>
        ) : (
          <div className="pf-v5-u-color-400">-</div>
        );
        baseRow.push(inheritanceCell);
      } else if (hasInheritanceData) {
        // Add empty cell if other groups have inheritance but this one doesn't
        baseRow.push(<div className="pf-v5-u-color-400">-</div>);
      }

      // Add last modified column
      baseRow.push(group.modified ? formatDistanceToNow(new Date(group.modified), { addSuffix: true }) : '');

      return {
        id: group.uuid,
        row: baseRow,
        props: {
          isClickable: true,
          onRowClick: (event?: React.MouseEvent | React.KeyboardEvent) =>
            handleRowClick(event, focusedGroup?.uuid === group.uuid ? undefined : group),
          isRowSelected: false,
        },
      };
    });
  }, [groups, focusedGroup, intl, onRowClick, hasInheritanceData]);

  const activeState = isLoading ? DataViewState.loading : groups.length === 0 ? DataViewState.empty : undefined;

  return (
    <GroupDetailsDrawer isOpen={!!focusedGroup} group={focusedGroup} onClose={onCloseDrawer} ouiaId={ouiaId} showInheritance={hasInheritanceData}>
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
              <DataViewTextFilter
                filterId="name"
                title={intl.formatMessage(messages.userGroup)}
                placeholder={intl.formatMessage(messages.filterByUserGroup)}
              />
              {hasInheritanceData && (
                <DataViewTextFilter
                  filterId="inheritedFrom"
                  title={intl.formatMessage(messages.inheritedFrom)}
                  placeholder={intl.formatMessage(messages.filterByInheritedFrom)}
                />
              )}
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
          columns={dataViewColumns}
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
