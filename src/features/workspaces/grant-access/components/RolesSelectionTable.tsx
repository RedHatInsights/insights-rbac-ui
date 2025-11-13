import React, { useState } from 'react';
import { useIntl } from 'react-intl';
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

export const RolesSelectionTable: React.FC<RolesSelectionTableProps> = ({ roles, selectedRoles, onRoleSelection, isLoading = false }) => {
  const intl = useIntl();
  const [expandedCells, setExpandedCells] = useState<Record<string, string>>({});
  const [searchValue, setSearchValue] = useState('');
  const [sortByState, setSortByState] = useState({ index: 1, direction: 'asc' as 'asc' | 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const columns: Array<{ title: string; key: string; screenReaderText?: string }> = [
    { title: '', key: 'selection', screenReaderText: 'Row selection' },
    { title: intl.formatMessage(messages.name), key: 'name' },
    { title: intl.formatMessage(messages.description), key: 'description' },
    { title: intl.formatMessage(messages.permissions), key: 'permissions' },
  ];

  const handleRowSelect = (role: Role, isChecking: boolean) => {
    if (isChecking) {
      onRoleSelection([...selectedRoles, role.uuid]);
    } else {
      onRoleSelection(selectedRoles.filter((id) => id !== role.uuid));
    }
  };

  const isRowSelected = (role: Role) => {
    return selectedRoles.includes(role.uuid);
  };

  const handleExpansion = (roleId: string, columnKey: string, isExpanding: boolean) => {
    setExpandedCells((prev) => {
      if (isExpanding) {
        return { ...prev, [roleId]: columnKey };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [roleId]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  const compoundExpandParams = (role: Role, columnKey: string, rowIndex: number, columnIndex: number) => ({
    isExpanded: expandedCells[role.uuid] === columnKey,
    onToggle: () => handleExpansion(role.uuid, columnKey, expandedCells[role.uuid] !== columnKey),
    expandId: `compound-${columnKey}-${role.uuid}`,
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

  const { totalCount, paginatedRoles } = React.useMemo(() => {
    // Filter roles based on search
    let filtered = searchValue ? roles.filter((role) => (role.display_name || role.name).toLowerCase().includes(searchValue.toLowerCase())) : roles;

    // Sort the filtered roles
    const sorted = [...filtered].sort((a, b) => {
      const { index, direction } = sortByState;

      if (index === 1) {
        // Sort by name
        const aVal = a.display_name || a.name || '';
        const bVal = b.display_name || b.name || '';
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else if (index === 2) {
        // Sort by description
        const aVal = a.description || '';
        const bVal = b.description || '';
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else if (index === 3) {
        // Sort by permission count
        const aVal = Number(a.accessCount) || 0;
        const bVal = Number(b.accessCount) || 0;
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
      paginatedRoles: paginated,
    };
  }, [roles, searchValue, sortByState, page, perPage]);

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
        titleText={hasSearchFilter ? intl.formatMessage(messages.noRolesFound) : intl.formatMessage(messages.noRolesFound)}
        headingLevel="h4"
        icon={<EmptyStateIcon icon={SearchIcon} />}
      />
      <EmptyStateBody>
        {hasSearchFilter ? intl.formatMessage(messages.noRolesFoundDescription) : intl.formatMessage(messages.noRolesFoundDescription)}
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
              title="Role name"
              placeholder={intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.name) })}
            />
          </DataViewFilters>
        }
        clearAllFilters={hasSearchFilter ? handleClearFilters : undefined}
      />

      {/* Custom table for compound expandable rows */}
      {isLoading ? (
        <Table aria-label="Loading roles">
          {loadingHeader}
          {loadingBody}
        </Table>
      ) : totalCount === 0 ? (
        <Table aria-label="Empty roles">
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
        <Table isExpandable aria-label={intl.formatMessage(messages.selectRoles)} variant={TableVariant.compact} borders={false}>
          <Thead>
            <Tr>
              <Th className="pf-v5-c-table__check" screenReaderText="Row selection">
                {/* Empty header for row selection column */}
              </Th>
              <Th {...getSortParams(1)}>{columns[1].title}</Th>
              <Th {...getSortParams(2)}>{columns[2].title}</Th>
              <Th {...getSortParams(3)}>{columns[3].title}</Th>
            </Tr>
          </Thead>
          {paginatedRoles.map((role, rowIndex) => {
            const isSelected = isRowSelected(role);
            const expandedCellKey = expandedCells[role.uuid];
            const isRowExpanded = !!expandedCellKey;

            return (
              <Tbody key={role.uuid} isExpanded={isRowExpanded}>
                <Tr>
                  <Td className="pf-v5-c-table__check">
                    <Checkbox
                      id={`select-${role.uuid}`}
                      isChecked={isSelected}
                      onChange={(_event, isChecking) => handleRowSelect(role, isChecking)}
                      aria-label={`Select ${role.display_name || role.name}`}
                    />
                  </Td>

                  <Td dataLabel={columns[1].title} style={{ width: '180px', maxWidth: '180px' }}>
                    {role.display_name || role.name}
                  </Td>

                  <Td
                    dataLabel={columns[2].title}
                    style={{ width: '250px', maxWidth: '250px', wordBreak: 'break-word', whiteSpace: 'normal', overflow: 'hidden' }}
                  >
                    {role.description || '—'}
                  </Td>

                  <Td
                    dataLabel={columns[3].title}
                    style={{ width: '120px', maxWidth: '120px' }}
                    compoundExpand={compoundExpandParams(role, 'permissions', rowIndex, 3)}
                  >
                    {role.accessCount || 0}
                  </Td>
                </Tr>
                <Tr isExpanded={isRowExpanded && expandedCellKey === 'permissions'}>
                  <Td dataLabel="Permissions" noPadding colSpan={columns.length}>
                    <ExpandableRowContent>
                      <PermissionsList role={role} />
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
