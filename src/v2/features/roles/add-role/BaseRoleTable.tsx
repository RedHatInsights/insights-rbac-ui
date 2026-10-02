import React, { useMemo } from 'react';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Radio } from '@patternfly/react-core/dist/dynamic/components/Radio';
import { TableView } from '@redhat-cloud-services/frontend-components/TableView';
import { useTableState } from '@redhat-cloud-services/frontend-components/TableView';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '@redhat-cloud-services/frontend-components/TableView';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import { useAllRolesV2Query } from '../../../data/queries/roles';
import type { Role } from '../../../data/queries/roles';

import type { ColumnConfigMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';
import { commonMessages } from '../../../../shared/messages/common';

const COLUMNS = ['radio', 'name', 'description'] as const;
const SORTABLE_COLUMNS = ['name'] as const;

type SortableColumnId = (typeof SORTABLE_COLUMNS)[number];

interface BaseRoleTableProps {
  name: string;
  [key: string]: unknown;
}

const BaseRoleTable: React.FC<BaseRoleTableProps> = (props) => {
  const intl = useIntl();
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();

  // Table state
  const tableState = useTableState<typeof COLUMNS, Role, SortableColumnId>({
    columns: COLUMNS,
    sortableColumns: SORTABLE_COLUMNS,
    getRowId: (row: Role) => row.id!,
    initialPerPage: 50,
    initialSort: { column: 'name', direction: 'asc' },
    initialFilters: { name: '' },
  });

  const nameFilter = (typeof tableState.filters.name === 'string' ? tableState.filters.name : '') || '';

  // TanStack Query for roles - V2 uses limit=-1, fetch all and filter/paginate client-side
  const { data: allRolesData = [], isLoading } = useAllRolesV2Query({
    enabled: true,
  });

  // Client-side filtering (V2 API uses exact match; we filter by partial name for UX)
  const filteredRoles = useMemo(() => {
    if (!nameFilter) return allRolesData;
    const lower = nameFilter.toLowerCase();
    return allRolesData.filter((r) => (r.name ?? '').toLowerCase().includes(lower));
  }, [allRolesData, nameFilter]);

  // Client-side pagination and sorting
  const roles = useMemo(() => {
    const filtered = filteredRoles;
    const sorted = [...filtered].sort((a, b) => {
      const aName = a.name ?? '';
      const bName = b.name ?? '';
      return tableState.sort?.direction === 'desc' ? bName.localeCompare(aName) : aName.localeCompare(bName);
    });
    const offset = (tableState.page - 1) * tableState.perPage;
    return sorted.slice(offset, offset + tableState.perPage);
  }, [filteredRoles, tableState.page, tableState.perPage, tableState.sort?.direction]);

  const totalCount = filteredRoles.length;

  // Column config
  const columnConfig: ColumnConfigMap<typeof COLUMNS> = {
    radio: { label: ' ' },
    name: { label: intl.formatMessage(commonMessages.name), sortable: true },
    description: { label: intl.formatMessage(commonMessages.description) },
  };

  // Cell renderers
  const cellRenderers = {
    radio: (role: Role) => (
      <Radio
        id={`${role.id ?? ''}-radio`}
        name={`${role.name ?? ''}-radio`}
        aria-label={`${role.name ?? ''}-radio`}
        ouiaId={`${role.name ?? ''}-radio`}
        value={role.id ?? ''}
        isChecked={(input.value as Role)?.id === role.id}
        onChange={() => {
          formOptions.batch(() => {
            input.onChange(role);
            formOptions.change('role-copy-name', `Copy of ${role.name ?? ''}`);
            formOptions.change('role-copy-description', role.description ?? '');
            formOptions.change('add-permissions-table', []);
            formOptions.change('base-permissions-loaded', false);
            formOptions.change('not-allowed-permissions', []);
          });
        }}
      />
    ),
    name: (role: Role) => role.name ?? '',
    description: (role: Role) => role.description ?? '',
  };

  // Filter config
  const filterConfig: FilterConfig[] = [
    {
      type: 'search',
      id: 'name',
      placeholder: intl.formatMessage(commonMessages.roleName).toLowerCase(),
    },
  ];

  return (
    <div>
      <Alert
        variant="info"
        isInline
        title={intl.formatMessage({
          id: 'granularPermissionsWillBeCopied',
          defaultMessage:
            'Only granular permissions will be copied into a custom role (for example, approval:requests:read). Wildcard permissions will not be copied into a custom role (for example, approval:*:read).',
          description: 'Granular permissions will be copied message',
        })}
        className="pf-v6-u-mb-md"
      />
      <TableView
        columns={COLUMNS}
        columnConfig={columnConfig}
        sortableColumns={SORTABLE_COLUMNS}
        data={isLoading ? undefined : roles}
        totalCount={totalCount}
        getRowId={(row) => row.id!}
        cellRenderers={cellRenderers}
        variant="compact"
        // Pagination
        page={tableState.page}
        perPage={tableState.perPage}
        onPageChange={tableState.onPageChange}
        onPerPageChange={tableState.onPerPageChange}
        // Sorting
        sort={tableState.sort}
        onSortChange={tableState.onSortChange}
        // Filtering
        filterConfig={filterConfig}
        filters={tableState.filters}
        onFiltersChange={tableState.onFiltersChange}
        clearAllFilters={tableState.clearAllFilters}
        // Empty states
        emptyStateNoData={
          <DefaultEmptyStateNoData
            title={intl.formatMessage(commonMessages.noMatchingItemsFound, { items: intl.formatMessage(commonMessages.roles).toLowerCase() })}
          />
        }
        emptyStateNoResults={
          <DefaultEmptyStateNoResults
            title={intl.formatMessage(commonMessages.noMatchingItemsFound, { items: intl.formatMessage(commonMessages.roles).toLowerCase() })}
            body={intl.formatMessage(commonMessages.tryChangingFilters)}
            onClearFilters={tableState.clearAllFilters}
          />
        }
        ouiaId="roles-table"
        ariaLabel={intl.formatMessage(commonMessages.roles)}
      />
    </div>
  );
};

export default BaseRoleTable;
