import React, { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { getPrincipalAccess } from '../../redux/access-management/actions';
import { defaultSettings } from '../../helpers/pagination';
import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewCheckboxFilter, useDataViewFilters } from '@patternfly/react-data-view';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import { ResourceDefinitionsModal } from './components/ResourceDefinitionsModal';
import { ResourceDefinitionsLink } from './components/ResourceDefinitionsLink';
import { sortable } from '@patternfly/react-table';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import type { ResourceDefinition, ResourceDefinitionsConfig, SortByState } from './types';
import { Tbody } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Td } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tr } from '@patternfly/react-table/dist/dynamic/components/Table';

const EmptyWithFilters: React.FC = () => (
  <EmptyState>
    <EmptyStateHeader titleText="No permissions found" headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
    <EmptyStateBody>No permissions match the filter criteria. Remove all filters or clear all to show results.</EmptyStateBody>
  </EmptyState>
);

const EmptyNoData: React.FC = () => {
  const intl = useIntl();
  const first = intl.formatMessage(messages.toConfigureUserAccess);
  const second = intl.formatMessage(messages.createAtLeastOneItem, { item: intl.formatMessage(messages.permission).toLowerCase() });
  return (
    <EmptyState>
      <EmptyStateHeader titleText="Configure permissions" headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
      <EmptyStateBody>
        {first} {second}.
      </EmptyStateBody>
    </EmptyState>
  );
};

// Local interface for permission items from API
interface PermissionAccess {
  permission: string;
  resourceDefinitions: ResourceDefinition[];
}

// Local interface for API response structure
interface PermissionData {
  data: PermissionAccess[];
  meta: {
    limit: number;
    offset: number;
    count: number;
  };
}

// Local typing for access reducer slice
interface AccessReducerState {
  access: PermissionData;
  isLoading: boolean;
}

// Local typing for root Redux state (for useSelector)
interface RootState {
  accessReducer: AccessReducerState;
}

// Component props (minimal, as per usage in MyUserAccess.tsx)
interface AccessTableProps {
  apps: string[];
  showResourceDefinitions?: boolean;
}

// Local typing for table rows
interface TableRow {
  cells: React.ReactNode[];
}

// Helper function to create table rows from permissions data
const createRows = (data: PermissionAccess[], showResourceDefinitions?: boolean, onRdClick?: (index: number) => void): TableRow[] =>
  data.reduce<TableRow[]>((acc, { permission, ...access }, index) => {
    const [appName, type, operation] = permission.split(':');
    return [
      ...acc,
      {
        cells: [
          appName,
          type,
          operation,
          ...(showResourceDefinitions
            ? [
                <Fragment key="rd">
                  <ResourceDefinitionsLink onClick={() => onRdClick?.(index)} access={access} />
                </Fragment>,
              ]
            : []),
        ],
      },
    ];
  }, []);

export const AccessTable: React.FC<AccessTableProps> = ({ apps, showResourceDefinitions }) => {
  const intl = useIntl();
  const [{ rdOpen, rdPermission, resourceDefinitions }, setRdConfig] = useState<ResourceDefinitionsConfig>({ rdOpen: false });
  // Use DataView filters hook for consistent filter management
  const filters = useDataViewFilters({
    initialFilters: {
      application: [] as string[],
    },
  });

  const { current: columns } = useRef([
    { title: intl.formatMessage(messages.application), key: 'application', transforms: [sortable] },
    { title: intl.formatMessage(messages.resourceType), key: 'resource_type', transforms: [sortable] },
    { title: intl.formatMessage(messages.operation), key: 'verb', transforms: [sortable] },
    ...(showResourceDefinitions ? [{ title: intl.formatMessage(messages.resourceDefinitions), key: 'resource_definitions' }] : []),
  ]);

  const dispatch = useDispatch();
  const { permissions, isLoading } = useSelector(
    (state: RootState) => ({
      permissions: state.accessReducer.access,
      isLoading: state.accessReducer.isLoading,
    }),
    shallowEqual,
  );

  const fetchData = useCallback(
    ({ application, ...apiProps }: { application?: string[] } & Record<string, string | number | string[]>) => {
      const applicationParam = application?.length ? application.join(',') : apps.join(',');
      dispatch(getPrincipalAccess({ application: applicationParam, ...apiProps }));
    },
    [dispatch, apps],
  );

  // Debounced version for filter changes to prevent excessive API calls
  const debouncedFetchData = useMemo(() => debounce(fetchData, 500), [fetchData]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedFetchData.cancel();
    };
  }, [debouncedFetchData]);

  const handleRdClick = (index: number) =>
    setRdConfig({
      rdOpen: true,
      rdPermission: permissions.data[index].permission,
      resourceDefinitions: permissions.data[index].resourceDefinitions,
    });

  const [sortByState, setSortByState] = useState<SortByState>({ index: 0, direction: 'asc' });

  const orderBy = useMemo(() => `${sortByState?.direction === 'desc' ? '-' : ''}${columns[sortByState?.index].key}`, [sortByState, columns]);

  // Handle filter changes with DataView filters integration
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
        ...defaultSettings,
        orderBy,
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
      ...defaultSettings,
      orderBy,
      application: apps, // Reset to all apps
    });
  }, [filters.clearAllFilters, debouncedFetchData, orderBy, apps]);

  // Handle sorting
  const handleSort = useCallback(
    (_event: any, index: number, direction: 'asc' | 'desc') => {
      const column = columns[index];
      if (!column?.key) {
        return; // Don't sort if column doesn't have a key
      }
      setSortByState({ index, direction });
      // fetchData will be triggered by useEffect when orderBy changes
    },
    [columns],
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
        cell: column.title,
        props: column.transforms ? { sort: getSortParams(index) } : {},
      })),
    [columns, getSortParams],
  );

  // Initial data fetch and refetch on orderBy change
  useEffect(() => {
    fetchData({ ...defaultSettings, orderBy, ...(filters.filters.application?.length > 0 ? { application: filters.filters.application } : {}) });
  }, [fetchData, orderBy, filters.filters]); // Fetch on mount, when fetchData, orderBy, or filters change

  const filteredRows = permissions?.data || [];

  // Check if any filters are active
  const hasActiveFilters = filters.filters.application?.length > 0;

  // Loading and empty states
  const columnHeaders = [
    intl.formatMessage(messages.application),
    intl.formatMessage(messages.resourceType),
    intl.formatMessage(messages.operation),
    ...(showResourceDefinitions ? [intl.formatMessage(messages.resourceDefinitions)] : []),
  ];

  const loadingHeader = <SkeletonTableHead columns={columnHeaders} />;
  const loadingBody = <SkeletonTableBody rowsCount={10} columnsCount={columnHeaders.length} />;

  // Wrap empty states in proper table markup so DataViewTable displays them correctly
  const EmptyNoDataTable = (
    <Tbody>
      <Tr ouiaId="permissions-tr-empty-nodata">
        <Td colSpan={columnHeaders.length}>
          <EmptyNoData />
        </Td>
      </Tr>
    </Tbody>
  );

  const EmptyWithFiltersTable = (
    <Tbody>
      <Tr ouiaId="permissions-tr-empty-filters">
        <Td colSpan={columnHeaders.length}>
          <EmptyWithFilters />
        </Td>
      </Tr>
    </Tbody>
  );

  const activeState = isLoading ? DataViewState.loading : filteredRows.length === 0 ? DataViewState.empty : undefined;

  // Choose the correct empty state
  const emptyStateComponent = !isLoading && !hasActiveFilters && filteredRows.length === 0 ? EmptyNoDataTable : EmptyWithFiltersTable;

  return (
    <Fragment>
      <DataView activeState={activeState}>
        <DataViewToolbar
          filters={
            <DataViewFilters onChange={handleFilterChange} values={filters.filters}>
              <DataViewCheckboxFilter
                filterId="application"
                title={intl.formatMessage(messages.application)}
                placeholder={intl.formatMessage(messages.filterByApplication)}
                options={apps.map((app: string) => ({ label: app, value: app }))}
              />
            </DataViewFilters>
          }
          clearAllFilters={handleClearAllFilters}
        />
        <DataViewTable
          aria-label={intl.formatMessage(messages.permissions)}
          columns={dataViewColumns}
          rows={createRows(filteredRows, showResourceDefinitions, handleRdClick).map((row, index) => ({
            id: index.toString(),
            row: row.cells,
          }))}
          headStates={{ loading: loadingHeader }}
          bodyStates={{
            loading: loadingBody,
            empty: emptyStateComponent,
          }}
        />
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

export default AccessTable;
