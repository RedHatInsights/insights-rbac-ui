import React, { Fragment, Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { debounce } from '../../utilities/debounce';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { fetchRoleForPrincipal, fetchRoles } from '../../redux/roles/actions';
import messages from '../../Messages';

import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewCheckboxFilter, DataViewTextFilter, useDataViewFilters } from '@patternfly/react-data-view';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyStateActions } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import PlusCircleIcon from '@patternfly/react-icons/dist/js/icons/plus-circle-icon';
import { ExpandableRowContent } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Table } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tbody } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Td } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Th } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Thead } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { EmptyWithAction } from '../../components/ui-states/EmptyState';

const ResourceDefinitionsModal = lazy(() =>
  import('./components/ResourceDefinitionsModal').then((module) => ({ default: module.ResourceDefinitionsModal })),
);

import { TableVariant } from '@patternfly/react-table';
import { cellWidth } from '@patternfly/react-table';
import { compoundExpand } from '@patternfly/react-table';
import { sortable } from '@patternfly/react-table';
import { ResourceDefinitionsLink } from './components/ResourceDefinitionsLink';
import { ResourceDefinitionsConfig, SortByState } from './types';

interface RolesTableProps {
  apps: string[];
  showResourceDefinitions?: boolean;
}

interface RoleData {
  uuid: string;
  display_name?: string;
  name: string;
  description: string;
  accessCount: number;
}

interface RoleAccess {
  permission: string;
  resourceDefinitions: any[];
}

interface ExpandedCells {
  [roleUuid: string]: string; // Maps role UUID to expanded column key
}

// TableContent component for compound expansion
const TableContent: React.FC<{
  roles: RoleData[];
  rolesWithAccess: any;
  showResourceDefinitions: boolean;
  onRdClick: (permission: string, resourceDefinitions: any[]) => void;
  expandedCells: ExpandedCells;
  setExpandedCells: (cells: ExpandedCells) => void;
  columns: Array<{ title: string; key?: string }>;
  sortByState: SortByState;
  onSort: (event: any, index: number, direction: 'asc' | 'desc') => void;
  dispatch: any;
}> = ({ roles, rolesWithAccess, showResourceDefinitions, onRdClick, expandedCells, setExpandedCells, columns, sortByState, onSort, dispatch }) => {
  const intl = useIntl();

  const compoundPermissionsCells = [
    intl.formatMessage(messages.application),
    intl.formatMessage(messages.resourceType),
    intl.formatMessage(messages.operation),
    ...(showResourceDefinitions ? [intl.formatMessage(messages.resourceDefinitions)] : []),
  ];

  const setCellExpanded = (role: RoleData, columnKey: string, isExpanding = true) => {
    const newExpandedCells: ExpandedCells = { ...expandedCells };
    if (isExpanding) {
      newExpandedCells[role.uuid] = columnKey;
      // Fetch role permissions when expanding
      if (columnKey === 'permissions') {
        dispatch(fetchRoleForPrincipal(role.uuid) as any);
      }
    } else {
      delete newExpandedCells[role.uuid];
    }
    setExpandedCells(newExpandedCells);
  };

  const compoundExpandParams = (role: RoleData, columnKey: string, rowIndex: number, columnIndex: number) => ({
    isExpanded: expandedCells[role.uuid] === columnKey,
    onToggle: () => setCellExpanded(role, columnKey, expandedCells[role.uuid] !== columnKey),
    expandId: 'roles-compound-expansion',
    rowIndex,
    columnIndex,
  });

  const getSortParams = (columnIndex: number) => ({
    sort: {
      sortBy: {
        index: sortByState.index,
        direction: sortByState.direction,
      },
      onSort,
      columnIndex,
    },
  });

  const PermissionsTable: React.FC<{ role: RoleData }> = ({ role }) => {
    const rolePermissions = rolesWithAccess?.[role.uuid];

    if (!rolePermissions) {
      return (
        <Table ouiaId="permissions-in-role-nested-table" aria-label="Permissions Table" borders={false} variant={TableVariant.compact}>
          <Thead>
            <Tr>
              {compoundPermissionsCells.map((cell, index) => (
                <Th key={index}>{cell}</Th>
              ))}
            </Tr>
          </Thead>
          <SkeletonTableBody rowsCount={role.accessCount || 3} columnsCount={compoundPermissionsCells.length} />
        </Table>
      );
    }

    return (
      <Table ouiaId="permissions-in-role-nested-table" aria-label="Permissions Table" borders={false} variant={TableVariant.compact}>
        <Thead>
          <Tr>
            {compoundPermissionsCells.map((cell, index) => (
              <Th key={index}>{cell}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {rolePermissions.access.map((access: RoleAccess, index: number) => (
            <Tr key={`${role.uuid}-permission-${access.permission || index}`}>
              {access.permission.split(':').map((part, partIndex) => (
                <Td key={partIndex}>{part}</Td>
              ))}
              {showResourceDefinitions && (
                <Td>
                  <ResourceDefinitionsLink onClick={() => onRdClick(access.permission, access.resourceDefinitions)} access={access} />
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  };

  return (
    <Table aria-label={intl.formatMessage(messages.roles)}>
      <Thead>
        <Tr>
          <Th {...(columns[0].key ? getSortParams(0) : {})}>{columns[0].title}</Th>
          <Th>{columns[1].title}</Th>
          <Th>{columns[2].title}</Th>
        </Tr>
      </Thead>
      {roles.map((role, rowIndex) => {
        const expandedCellKey = expandedCells[role.uuid];
        const isRowExpanded = !!expandedCellKey;

        return (
          <Tbody key={role.uuid} isExpanded={isRowExpanded}>
            <Tr>
              <Td dataLabel={columns[0].title} component="th">
                {role.display_name || role.name}
              </Td>
              <Td dataLabel={columns[1].title}>{role.description}</Td>
              <Td dataLabel={columns[2].title} compoundExpand={compoundExpandParams(role, 'permissions', rowIndex, 2)}>
                {role.accessCount}
              </Td>
            </Tr>

            <Tr isExpanded={isRowExpanded && expandedCellKey === 'permissions'}>
              <Td dataLabel="Permissions" noPadding colSpan={3}>
                <ExpandableRowContent>
                  <PermissionsTable role={role} />
                </ExpandableRowContent>
              </Td>
            </Tr>
          </Tbody>
        );
      })}
    </Table>
  );
};

export const RolesTable: React.FC<RolesTableProps> = ({ apps, showResourceDefinitions = false }) => {
  const intl = useIntl();
  const [{ rdOpen, rdPermission, resourceDefinitions }, setRdConfig] = useState<ResourceDefinitionsConfig>({
    rdOpen: false,
    rdPermission: undefined,
    resourceDefinitions: undefined,
  });

  // Use DataView filters hook
  const filters = useDataViewFilters({
    initialFilters: {
      role: '',
      application: [] as string[],
    },
  });

  const [expandedCells, setExpandedCells] = useState<ExpandedCells>({});

  const columns = useMemo(
    () => [
      {
        title: intl.formatMessage(messages.roles),
        key: 'display_name',
        transforms: [sortable],
      },
      { title: intl.formatMessage(messages.description) },
      {
        title: intl.formatMessage(messages.permissions),
        cellTransforms: [compoundExpand, cellWidth(20)],
      },
    ],
    [intl],
  );

  const { roles, isLoading, rolesWithAccess } = useSelector(
    ({ roleReducer: { roles, isLoading, rolesWithAccess } }: any) => ({
      roles,
      isLoading,
      rolesWithAccess,
    }),
    shallowEqual,
  );

  const [sortByState, setSortByState] = useState<SortByState>({ index: 0, direction: 'asc' });
  const orderBy = `${sortByState?.direction === 'desc' ? '-' : ''}${columns[sortByState?.index].key}`;
  const dispatch = useDispatch();

  const emptyFilters = { name: '', application: [] };

  const fetchData = useCallback(
    ({ application, ...apiProps }: { application?: string[] } & Record<string, string | number | string[]>) => {
      const applicationParam = application?.length ? application.join(',') : apps.join(',');
      return dispatch(
        fetchRoles({
          ...apiProps,
          scope: 'principal',
          application: applicationParam,
        }) as any,
      );
    },
    [dispatch, apps],
  );

  // Debounced version for filter changes to prevent excessive API calls
  const debouncedFetchData = useMemo(() => debounce(fetchData), [fetchData]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedFetchData.cancel();
    };
  }, [debouncedFetchData]);

  useEffect(() => {
    fetchData({
      limit: 20,
      offset: 0,
      orderBy,
      ...(filters.filters.role ? { name: filters.filters.role } : {}),
      ...(filters.filters.application.length > 0 ? { application: filters.filters.application } : {}),
    });
  }, [fetchData, orderBy, filters.filters]);

  const handleRdClick = useCallback((permission: string, resourceDefinitions: any[]) => {
    setRdConfig({
      rdOpen: true,
      rdPermission: permission,
      resourceDefinitions,
    });
  }, []);

  const handleFilterChange = useCallback(
    (_event: any, newFilters: any) => {
      // Update filter state immediately for UI responsiveness
      filters.onSetFilters(newFilters);

      // Merge new filters with existing ones to preserve all filter values
      // This is needed because PatternFly DataViewFilters only passes the active filter
      // when switching between filter types, losing other filter values
      const mergedFilters = {
        ...filters.filters,
        ...newFilters,
      };

      // Debounce API calls to prevent excessive requests
      debouncedFetchData({
        limit: 20,
        offset: 0,
        orderBy,
        ...(mergedFilters.role ? { name: mergedFilters.role } : {}),
        ...(mergedFilters.application?.length > 0 ? { application: mergedFilters.application } : {}),
      });
    },
    [filters.onSetFilters, debouncedFetchData, orderBy, filters.filters],
  );

  // Custom clear all filters function that also triggers API call
  const handleClearAllFilters = useCallback(() => {
    filters.clearAllFilters();
    // Trigger API call with default parameters after clearing filters
    debouncedFetchData({
      limit: 20,
      offset: 0,
      orderBy,
      application: apps, // Reset to all apps
    });
  }, [filters.clearAllFilters, debouncedFetchData, orderBy, apps]);

  const handleSort = useCallback(
    (_event: any, index: number, direction: 'asc' | 'desc') => {
      setSortByState({ index, direction });
      // fetchData will be triggered by useEffect when orderBy changes
    },
    [columns],
  );

  const filteredRows = roles?.data || [];

  // Check if any filters are active
  const hasActiveFilters = filters.filters.role.length > 0 || filters.filters.application.length > 0;

  // Column headers for loading and empty states
  const columnHeaders = [intl.formatMessage(messages.roles), intl.formatMessage(messages.description), intl.formatMessage(messages.permissions)];

  // Loading states following DataView pattern
  const loadingHeader = <SkeletonTableHead columns={columnHeaders} />;
  const loadingBody = <SkeletonTableBody rowsCount={10} columnsCount={columnHeaders.length} />;

  // Empty states matching the original TableToolbarView behavior
  const EmptyNoDataTable = (
    <Tbody>
      <Tr ouiaId="roles-tr-empty-nodata">
        <Td colSpan={columnHeaders.length}>
          <EmptyWithAction
            title={intl.formatMessage(messages.configureItems, { items: 'roles' })}
            icon={PlusCircleIcon}
            description={[intl.formatMessage(messages.toConfigureUserAccess), intl.formatMessage(messages.createAtLeastOneItem, { item: 'role' })]}
            actions={undefined}
          />
        </Td>
      </Tr>
    </Tbody>
  );

  const EmptyWithFiltersTable = (
    <Tbody>
      <Tr ouiaId="roles-tr-empty-filters">
        <Td colSpan={columnHeaders.length}>
          <EmptyWithAction
            title={intl.formatMessage(messages.noMatchingItemsFound, { items: 'roles' })}
            description={[intl.formatMessage(messages.filterMatchesNoItems, { items: 'roles' }), intl.formatMessage(messages.tryChangingFilters)]}
            actions={[
              <EmptyStateActions key="clear-filters">
                <Button
                  variant="link"
                  ouiaId="clear-filters-button"
                  onClick={() => {
                    filters.clearAllFilters();
                    fetchData({
                      ...roles?.meta,
                      offset: 0,
                      orderBy,
                      ...emptyFilters,
                    });
                  }}
                >
                  {intl.formatMessage(messages.clearAllFilters)}
                </Button>
              </EmptyStateActions>,
            ]}
          />
        </Td>
      </Tr>
    </Tbody>
  );

  // DataView state management
  const activeState = isLoading ? DataViewState.loading : filteredRows.length === 0 ? DataViewState.empty : undefined;

  return (
    <Fragment>
      <DataView activeState={activeState}>
        <DataViewToolbar
          filters={
            <DataViewFilters onChange={handleFilterChange} values={filters.filters}>
              <DataViewTextFilter filterId="role" title="Role name" placeholder="Filter by role name..." />
              <DataViewCheckboxFilter
                filterId="application"
                title="Application"
                placeholder="Filter by application..."
                options={apps.map((app) => ({ label: app, value: app }))}
              />
            </DataViewFilters>
          }
          clearAllFilters={handleClearAllFilters}
        />
        {/* Custom table with compound expansion */}
        {isLoading ? (
          <Table aria-label={intl.formatMessage(messages.roles)}>
            {loadingHeader}
            {loadingBody}
          </Table>
        ) : filteredRows.length === 0 ? (
          <Table aria-label={intl.formatMessage(messages.roles)}>
            <Thead>
              <Tr>
                {columns.map((column, index) => (
                  <Th key={index}>{column.title}</Th>
                ))}
              </Tr>
            </Thead>
            {hasActiveFilters ? EmptyWithFiltersTable : EmptyNoDataTable}
          </Table>
        ) : (
          <TableContent
            roles={filteredRows}
            rolesWithAccess={rolesWithAccess}
            showResourceDefinitions={showResourceDefinitions}
            onRdClick={handleRdClick}
            expandedCells={expandedCells}
            setExpandedCells={setExpandedCells}
            columns={columns}
            sortByState={sortByState}
            onSort={handleSort}
            dispatch={dispatch}
          />
        )}
      </DataView>
      <Suspense fallback={<Fragment />}>
        {rdOpen && (
          <ResourceDefinitionsModal
            resourceDefinitions={resourceDefinitions!}
            isOpen={rdOpen}
            handleClose={() => setRdConfig({ rdOpen: false })}
            permission={rdPermission!}
          />
        )}
      </Suspense>
    </Fragment>
  );
};
