import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { DataViewTextFilter } from '@patternfly/react-data-view';
import { Table } from '@patternfly/react-table/dist/dynamic/components/Table';
import { TableVariant } from '@patternfly/react-table';
import { Tbody } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Td } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Th } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Thead } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { ExpandableRowContent } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Checkbox } from '@patternfly/react-core/dist/dynamic/components/Checkbox';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { SearchIcon } from '@patternfly/react-icons/dist/dynamic/icons/search-icon';
import { Group } from '../../../../redux/groups/reducer';
import { fetchMembersForExpandedGroup } from '../../../../redux/groups/actions';
import messages from '../../../../Messages';

// Simple list of member names for expanded view
const MembersList: React.FC<{ group: Group }> = ({ group }) => {
  const intl = useIntl();

  if (!group.members || group.isLoadingMembers) {
    return <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">Loading members...</Text>;
  }

  if (group.members.length === 0) {
    return <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.noGroupMembers)}</Text>;
  }

  const memberNames = group.members.map((member: any) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member.username || member.email || 'Unknown';
  });

  return <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{memberNames.join(', ')}</Text>;
};

interface UserGroupsSelectionTableProps {
  groups: Group[];
  selectedGroups: string[];
  onGroupSelection: (groupIds: string[]) => void;
  isLoading?: boolean;
}

export const UserGroupsSelectionTable: React.FC<UserGroupsSelectionTableProps> = ({
  groups,
  selectedGroups,
  onGroupSelection,
  isLoading = false,
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [expandedCells, setExpandedCells] = useState<Record<string, string>>({});
  const [searchValue, setSearchValue] = useState('');
  const [sortByState, setSortByState] = useState({ index: 1, direction: 'asc' as 'asc' | 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const columns: Array<{ title: string; key: string; screenReaderText?: string }> = [
    { title: '', key: 'selection', screenReaderText: 'Row selection' },
    { title: intl.formatMessage(messages.name), key: 'name' },
    { title: intl.formatMessage(messages.members), key: 'members' },
  ];

  const handleRowSelect = (group: Group, isChecking: boolean) => {
    if (isChecking) {
      onGroupSelection([...selectedGroups, group.uuid]);
    } else {
      onGroupSelection(selectedGroups.filter((id) => id !== group.uuid));
    }
  };

  const isRowSelected = (group: Group) => {
    return selectedGroups.includes(group.uuid);
  };

  const isRowSelectable = (group: Group) => {
    return !(group.platform_default || group.admin_default);
  };

  const handleExpansion = (groupId: string, columnKey: string, isExpanding: boolean) => {
    setExpandedCells((prev) => {
      if (isExpanding) {
        if (columnKey === 'members') {
          dispatch(fetchMembersForExpandedGroup(groupId, undefined, { limit: 100 }));
        }
        return { ...prev, [groupId]: columnKey };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [groupId]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  const compoundExpandParams = (group: Group, columnKey: string, rowIndex: number, columnIndex: number) => ({
    isExpanded: expandedCells[group.uuid] === columnKey,
    onToggle: () => handleExpansion(group.uuid, columnKey, expandedCells[group.uuid] !== columnKey),
    expandId: `compound-${columnKey}-${group.uuid}`,
    rowIndex,
    columnIndex,
  });

  const handleSort = (_event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => {
    setSortByState({ index, direction });
  };

  const getSortParams = (columnIndex: number) => ({
    sort: {
      sortBy: {
        index: sortByState.index,
        direction: sortByState.direction,
      },
      onSort: (_event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => handleSort(_event, index, direction),
      columnIndex,
    },
  });

  const { totalCount, paginatedGroups } = React.useMemo(() => {
    // Filter groups based on search
    let filtered = searchValue ? groups.filter((group) => group.name.toLowerCase().includes(searchValue.toLowerCase())) : groups;

    // Sort the filtered groups
    const sorted = [...filtered].sort((a, b) => {
      const { index, direction } = sortByState;

      if (index === 1) {
        // Sort by name
        const aVal = a.name || '';
        const bVal = b.name || '';
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else if (index === 2) {
        // Sort by member count
        const aVal = Number(a.principalCount) || 0;
        const bVal = Number(b.principalCount) || 0;
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    // Paginate the sorted results
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginated = sorted.slice(startIndex, endIndex);

    return {
      totalCount: sorted.length,
      paginatedGroups: paginated,
    };
  }, [groups, searchValue, sortByState, page, perPage]);

  const hasSearchFilter = searchValue !== '';

  const handlePageChange = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageChange = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  const handleFilterChange = (_key: string, newFilters: Partial<{ name: string }>) => {
    const newFilterValue = newFilters.name || '';
    setSearchValue(newFilterValue);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchValue('');
    setPage(1);
  };

  const loadingHeader = <SkeletonTableHead columns={columns.map((col) => col.title)} />;
  const loadingBody = <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />;

  const emptyState = (
    <EmptyState>
      <EmptyStateHeader
        titleText={hasSearchFilter ? intl.formatMessage(messages.noGroupsFound) : intl.formatMessage(messages.noGroupsAvailable)}
        headingLevel="h4"
        icon={<EmptyStateIcon icon={SearchIcon} />}
      />
      <EmptyStateBody>
        {hasSearchFilter ? intl.formatMessage(messages.noGroupsFoundDescription) : intl.formatMessage(messages.noGroupsAvailable)}
      </EmptyStateBody>
    </EmptyState>
  );

  const activeState = isLoading ? DataViewState.loading : totalCount === 0 ? DataViewState.empty : undefined;

  const paginationComponent = (
    <Pagination itemCount={totalCount} page={page} perPage={perPage} onSetPage={handlePageChange} onPerPageSelect={handlePerPageChange} isCompact />
  );

  return (
    <DataView activeState={activeState}>
      <DataViewToolbar
        pagination={paginationComponent}
        filters={
          <DataViewFilters onChange={handleFilterChange} values={{ name: searchValue }}>
            <DataViewTextFilter
              filterId="name"
              title="User group name"
              placeholder={intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.name) })}
            />
          </DataViewFilters>
        }
        clearAllFilters={hasSearchFilter ? handleClearFilters : undefined}
      />

      {/* Custom table for compound expandable rows */}
      {isLoading ? (
        <Table aria-label="Loading user groups">
          {loadingHeader}
          {loadingBody}
        </Table>
      ) : totalCount === 0 ? (
        <Table aria-label="Empty user groups">
          <Thead>
            <Tr>
              {columns.map((column, index) => (
                <Th key={index} screenReaderText={column.screenReaderText || (column.title !== '' ? column.title : undefined)}>
                  {column.title}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td colSpan={columns.length}>{emptyState}</Td>
            </Tr>
          </Tbody>
        </Table>
      ) : (
        <Table isExpandable aria-label={intl.formatMessage(messages.selectUserGroups)} variant={TableVariant.compact} borders={false}>
          <Thead>
            <Tr>
              <Th className="pf-v5-c-table__check" screenReaderText="Row selection">
                {/* Empty header for row selection column */}
              </Th>
              <Th {...getSortParams(1)}>{columns[1].title}</Th>
              <Th {...getSortParams(2)}>{columns[2].title}</Th>
            </Tr>
          </Thead>
          {paginatedGroups.map((group, rowIndex) => {
            const canSelect = isRowSelectable(group);
            const isSelected = isRowSelected(group);
            const expandedCellKey = expandedCells[group.uuid];
            const isRowExpanded = !!expandedCellKey;

            return (
              <Tbody key={group.uuid} isExpanded={isRowExpanded}>
                <Tr>
                  <Td className="pf-v5-c-table__check">
                    {canSelect ? (
                      <Checkbox
                        id={`select-${group.uuid}`}
                        isChecked={isSelected}
                        onChange={(_event, isChecking) => handleRowSelect(group, isChecking)}
                        aria-label={`Select ${group.name}`}
                      />
                    ) : null}
                  </Td>

                  <Td dataLabel={columns[1].title}>{group.name}</Td>

                  <Td
                    dataLabel={columns[2].title}
                    {...(group.platform_default || group.admin_default
                      ? { className: 'rbac-c-not-expandable-cell' }
                      : { compoundExpand: compoundExpandParams(group, 'members', rowIndex, 1) })}
                  >
                    {group.principalCount || 0}
                  </Td>
                </Tr>
                <Tr isExpanded={isRowExpanded && expandedCellKey === 'members'}>
                  <Td dataLabel="Members" noPadding colSpan={columns.length}>
                    <ExpandableRowContent>
                      <MembersList group={group} />
                    </ExpandableRowContent>
                  </Td>
                </Tr>
              </Tbody>
            );
          })}
        </Table>
      )}

      <DataViewToolbar pagination={paginationComponent} />
    </DataView>
  );
};
