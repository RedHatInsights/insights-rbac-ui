import React, { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Radio } from '@patternfly/react-core/dist/dynamic/components/Radio';
import { TableView } from '../../../components/table-view/TableView';
import { useTableState } from '../../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../components/table-view/components/TableViewEmptyState';
import { fetchRolesForWizard } from '../../../redux/roles/actions';
import { mappedProps } from '../../../helpers/dataUtilities';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import type { RBACStore } from '../../../redux/store.d';
import type { ColumnConfigMap, FilterConfig } from '../../../components/table-view/types';

interface Role {
  uuid: string;
  name: string;
  display_name?: string;
  description?: string;
}

const COLUMNS = ['radio', 'name', 'description'] as const;
const SORTABLE_COLUMNS = ['name'] as const;

type SortableColumnId = (typeof SORTABLE_COLUMNS)[number];

const selector = ({ roleReducer: { rolesForWizard, isWizardLoading } }: RBACStore) => ({
  roles: (rolesForWizard?.data || []) as Role[],
  pagination: rolesForWizard?.meta,
  isWizardLoading,
});

interface BaseRoleTableProps {
  name: string;
  [key: string]: unknown;
}

const BaseRoleTable: React.FC<BaseRoleTableProps> = (props) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { roles, pagination, isWizardLoading } = useSelector(selector, shallowEqual);
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();

  const fetchData = (options: Record<string, unknown>) => dispatch(fetchRolesForWizard(options) as unknown as { type: string });

  // Table state
  const tableState = useTableState<typeof COLUMNS, Role, SortableColumnId>({
    columns: COLUMNS,
    sortableColumns: SORTABLE_COLUMNS,
    getRowId: (row: Role) => row.uuid,
    initialPerPage: 50,
    initialSort: { column: 'name', direction: 'asc' },
    initialFilters: { name: '' },
    onStaleData: ({ filters, limit, offset, orderBy }) => {
      fetchData(
        mappedProps({
          limit,
          offset,
          name: filters.name,
          orderBy,
        }),
      );
    },
  });

  useEffect(() => {
    fetchData({
      limit: 50,
      offset: 0,
      itemCount: 0,
      orderBy: 'display_name',
    });
  }, []);

  // Column config
  const columnConfig: ColumnConfigMap<typeof COLUMNS> = {
    radio: { label: '' },
    name: { label: intl.formatMessage(messages.name), sortable: true },
    description: { label: intl.formatMessage(messages.description) },
  };

  // Cell renderers
  const cellRenderers = {
    radio: (role: Role) => (
      <Radio
        id={`${role.uuid}-radio`}
        name={`${role.name}-radio`}
        aria-label={`${role.name}-radio`}
        ouiaId={`${role.name}-radio`}
        value={role.uuid}
        isChecked={(input.value as Role)?.uuid === role.uuid}
        onChange={() => {
          formOptions.batch(() => {
            input.onChange(role);
            formOptions.change('role-copy-name', `Copy of ${role.display_name || role.name}`);
            formOptions.change('role-copy-description', role.description);
            formOptions.change('add-permissions-table', []);
            formOptions.change('base-permissions-loaded', false);
            formOptions.change('not-allowed-permissions', []);
          });
        }}
      />
    ),
    name: (role: Role) => role.display_name || role.name,
    description: (role: Role) => role.description || '',
  };

  // Filter config
  const filterConfig: FilterConfig[] = [
    {
      type: 'search',
      id: 'name',
      placeholder: intl.formatMessage(messages.roleName).toLowerCase(),
    },
  ];

  // Handle sort change - map internal column name to API field name
  const handleSortChange = (column: SortableColumnId, direction: 'asc' | 'desc') => {
    tableState.onSortChange(column, direction);
    const orderBy = `${direction === 'desc' ? '-' : ''}display_name`;
    fetchData({
      ...pagination,
      offset: 0,
      orderBy,
    });
  };

  return (
    <div>
      <Alert variant="info" isInline title={intl.formatMessage(messages.granularPermissionsWillBeCopied)} />
      <TableView
        columns={COLUMNS}
        columnConfig={columnConfig}
        sortableColumns={SORTABLE_COLUMNS}
        data={isWizardLoading ? undefined : roles}
        totalCount={pagination?.count || 0}
        getRowId={(row) => row.uuid}
        cellRenderers={cellRenderers}
        variant="compact"
        // Pagination
        page={tableState.page}
        perPage={tableState.perPage}
        onPageChange={tableState.onPageChange}
        onPerPageChange={tableState.onPerPageChange}
        // Sorting
        sort={tableState.sort}
        onSortChange={handleSortChange}
        // Filtering
        filterConfig={filterConfig}
        filters={tableState.filters}
        onFiltersChange={tableState.onFiltersChange}
        clearAllFilters={tableState.clearAllFilters}
        hasActiveFilters={tableState.hasActiveFilters}
        // Empty states
        emptyStateNoData={
          <DefaultEmptyStateNoData
            title={intl.formatMessage(messages.noMatchingItemsFound, { items: intl.formatMessage(messages.roles).toLowerCase() })}
          />
        }
        emptyStateNoResults={
          <DefaultEmptyStateNoResults
            title={intl.formatMessage(messages.noMatchingItemsFound, { items: intl.formatMessage(messages.roles).toLowerCase() })}
            body={intl.formatMessage(messages.tryChangingFilters)}
            onClearFilters={tableState.clearAllFilters}
          />
        }
        ouiaId="roles-table"
        ariaLabel={intl.formatMessage(messages.roles)}
      />
    </div>
  );
};

export default BaseRoleTable;
