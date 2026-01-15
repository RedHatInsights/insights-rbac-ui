import { UseFieldApiConfig, useFieldApi, useFormApi } from '@data-driven-forms/react-form-renderer';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import React, { useCallback, useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import messages from '../../../Messages';
import { PER_PAGE_OPTIONS } from '../../../helpers/pagination';
import { usePermissionsQuery } from '../../../data/queries/permissions';
import { TableView } from '../../../components/table-view/TableView';
import { useTableState } from '../../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig, FilterState } from '../../../components/table-view/types';

interface ExtendedUseFieldApiConfig extends UseFieldApiConfig {
  roleId?: string;
  initialValue?: string[];
}

interface Permission {
  permission: string;
  application: string;
  resource_type: string;
  verb: string;
}

// Column definition
const columns = ['application', 'resourceType', 'operation'] as const;

export const EditRolePermissions: React.FC<ExtendedUseFieldApiConfig> = (props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const intl = useIntl();
  const formOptions = useFormApi();
  const { input } = useFieldApi({ ...props, formOptions });

  // Build initial selected rows from prop values (placeholder objects)
  const initialSelectedRows = useMemo(
    () =>
      (props.initialValue || []).map(
        (permission: string) =>
          ({
            permission,
            application: '',
            resource_type: '',
            verb: '',
          }) as Permission,
      ),
    [props.initialValue],
  );

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      application: { label: intl.formatMessage(messages.application) },
      resourceType: { label: intl.formatMessage(messages.resourceType) },
      operation: { label: intl.formatMessage(messages.operation) },
    }),
    [intl],
  );

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, Permission> = useMemo(
    () => ({
      application: (row) => row.application,
      resourceType: (row) => row.resource_type,
      operation: (row) => row.verb,
    }),
    [],
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'application',
        label: intl.formatMessage(messages.application),
        placeholder: intl.formatMessage(messages.searchByApplicationPlaceholder),
      },
      {
        type: 'text',
        id: 'resourceType',
        label: intl.formatMessage(messages.resourceType),
        placeholder: intl.formatMessage(messages.searchByResourceTypePlaceholder),
      },
      {
        type: 'text',
        id: 'operation',
        label: intl.formatMessage(messages.operation),
        placeholder: intl.formatMessage(messages.searchByOperationPlaceholder),
      },
    ],
    [intl],
  );

  // Initialize filter state from URL params (intentionally only on mount)
  const initialFilters: FilterState = useMemo(
    () => ({
      application: searchParams.get('application') || '',
      resourceType: searchParams.get('resourceType') || '',
      operation: searchParams.get('operation') || '',
    }),
    [],
  );

  // useTableState handles ALL state including selection
  const tableState = useTableState<typeof columns, Permission>({
    columns,
    getRowId: (row) => row.permission,
    initialPerPage: 10,
    perPageOptions: PER_PAGE_OPTIONS.map((opt) => opt.value),
    initialFilters,
    initialSelectedRows,
    syncWithUrl: true,
  });

  // TanStack Query for permissions
  const { data: permissionsData, isLoading } = usePermissionsQuery({
    limit: tableState.perPage,
    offset: (tableState.page - 1) * tableState.perPage,
    application: (tableState.filters.application as string) || undefined,
    resourceType: (tableState.filters.resourceType as string) || undefined,
    verb: (tableState.filters.operation as string) || undefined,
    allowedOnly: false,
  });

  const permissions = permissionsData?.data || [];
  const totalCount = permissionsData?.meta?.count || 0;

  // Map permissions data to rows
  const rows: Permission[] = useMemo(() => {
    return permissions.map((permission) => ({
      permission: permission.permission,
      application: permission.application || '',
      resource_type: permission.resource_type || '',
      verb: permission.verb || '',
    }));
  }, [permissions]);

  // Keep ref to input to avoid stale closure
  const inputRef = useRef(input);
  inputRef.current = input;

  // Handle filter change - also sync to URL
  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      tableState.onFiltersChange(newFilters);
      // Sync to URL
      const newParams = new URLSearchParams(searchParams);
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });
      setSearchParams(newParams);
    },
    [tableState, searchParams, setSearchParams],
  );

  // Clear all filters - also clear URL
  const handleClearAllFilters = useCallback(() => {
    tableState.clearAllFilters();
    setSearchParams(new URLSearchParams());
  }, [tableState, setSearchParams]);

  // Wrap selection handlers to also call input.onChange
  const handleSelectRow = useCallback(
    (row: Permission, isSelected: boolean) => {
      tableState.onSelectRow(row, isSelected);
      // Compute new selection
      const currentIds = tableState.selectedRows.map((r) => r.permission);
      const newIds = isSelected ? [...currentIds, row.permission] : currentIds.filter((id) => id !== row.permission);
      inputRef.current.onChange(newIds);
    },
    [tableState],
  );

  const handleSelectAll = useCallback(
    (isSelected: boolean, currentRows: Permission[]) => {
      tableState.onSelectAll(isSelected, currentRows);
      // Compute new selection
      const currentIds = new Set(tableState.selectedRows.map((r) => r.permission));
      const rowIds = currentRows.map((r) => r.permission);
      let newIds: string[];
      if (isSelected) {
        rowIds.forEach((id) => currentIds.add(id));
        newIds = Array.from(currentIds);
      } else {
        newIds = Array.from(currentIds).filter((id) => !rowIds.includes(id));
      }
      inputRef.current.onChange(newIds);
    },
    [tableState],
  );

  return (
    <React.Fragment>
      <FormGroup label="Select permissions" fieldId="role-permissions">
        <TableView<typeof columns, Permission>
          columns={columns}
          columnConfig={columnConfig}
          data={isLoading ? undefined : rows}
          totalCount={totalCount}
          getRowId={(row) => row.permission}
          cellRenderers={cellRenderers}
          filterConfig={filterConfig}
          variant="compact"
          ariaLabel="Permissions Table"
          ouiaId="edit-role-permissions"
          emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(messages.noPermissions)} />}
          emptyStateNoResults={
            <DefaultEmptyStateNoResults title={intl.formatMessage(messages.noPermissions)} onClearFilters={handleClearAllFilters} />
          }
          selectable
          {...tableState}
          // Override filter handlers for URL sync
          onFiltersChange={handleFilterChange}
          clearAllFilters={handleClearAllFilters}
          // Override selection handlers to also call input.onChange
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
        />
      </FormGroup>
    </React.Fragment>
  );
};
