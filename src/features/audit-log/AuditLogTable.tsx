import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { TableView, useTableState } from '../../components/table-view';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../components/table-view/types';
import messages from '../../Messages';

// ----------------------------------------------------------------------------
// Types (data shape provided by client)
// ----------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  date: string;
  requester: string;
  description: string;
  resource: string;
  action: string;
}

// ----------------------------------------------------------------------------
// Column definition
// ----------------------------------------------------------------------------

const columns = ['date', 'requester', 'description', 'resource', 'action'] as const;

// ----------------------------------------------------------------------------
// Component props
// ----------------------------------------------------------------------------

export interface AuditLogTableProps {
  /** Audit log entries (e.g. current page from client) */
  entries?: AuditLogEntry[];
  /** Total count for pagination (from client) */
  totalCount?: number;
  /** Loading state from client */
  isLoading?: boolean;
  /** Error from client; when set, error state is shown */
  error?: string | null;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ entries = [], totalCount = 0, isLoading = false, error = null }) => {
  const intl = useIntl();

  const tableState = useTableState<typeof columns, AuditLogEntry>({
    columns,
    getRowId: (row) => row.id,
    initialPerPage: 20,
    perPageOptions: [10, 20, 50],
    initialFilters: { requester: '', resource: '', action: '' },
    syncWithUrl: true,
  });

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'requester',
        label: intl.formatMessage({ id: 'auditLogColumnRequester', defaultMessage: 'Requester' }),
        placeholder: intl.formatMessage(messages.filterByKey, {
          key: intl.formatMessage({ id: 'auditLogColumnRequester', defaultMessage: 'Requester' }),
        }),
      },
      {
        type: 'text',
        id: 'resource',
        label: intl.formatMessage({ id: 'auditLogColumnResource', defaultMessage: 'Resource' }),
        placeholder: intl.formatMessage(messages.filterByKey, {
          key: intl.formatMessage({ id: 'auditLogColumnResource', defaultMessage: 'Resource' }),
        }),
      },
      {
        type: 'text',
        id: 'action',
        label: intl.formatMessage({ id: 'auditLogColumnAction', defaultMessage: 'Action' }),
        placeholder: intl.formatMessage(messages.filterByKey, {
          key: intl.formatMessage({ id: 'auditLogColumnAction', defaultMessage: 'Action' }),
        }),
      },
    ],
    [intl],
  );

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      date: { label: intl.formatMessage({ id: 'auditLogColumnDate', defaultMessage: 'Date' }) },
      requester: { label: intl.formatMessage({ id: 'auditLogColumnRequester', defaultMessage: 'Requester' }) },
      action: { label: intl.formatMessage({ id: 'auditLogColumnAction', defaultMessage: 'Action' }) },
      resource: { label: intl.formatMessage({ id: 'auditLogColumnResource', defaultMessage: 'Resource' }) },
      description: { label: intl.formatMessage({ id: 'auditLogColumnDescription', defaultMessage: 'Description' }) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, AuditLogEntry> = useMemo(
    () => ({
      date: (row) => row.date,
      requester: (row) => row.requester,
      action: (row) => row.action,
      resource: (row) => row.resource,
      description: (row) => row.description,
    }),
    [],
  );

  const emptyStateNoData = useMemo(() => <DefaultEmptyStateNoData title={intl.formatMessage(messages.auditLogNoResults)} />, [intl]);

  // Filter (client-side when we have full list) and pagination.
  // Apply Requester, Resource, Action; then slice to current page.
  const { paginatedEntries, total } = useMemo(() => {
    if (isLoading || error) return { paginatedEntries: [] as AuditLogEntry[], total: 0 };
    const f = tableState.filters;
    const requester = ((f.requester as string) || '').trim().toLowerCase();
    const resource = ((f.resource as string) || '').trim().toLowerCase();
    const action = ((f.action as string) || '').trim().toLowerCase();
    const hasFullList = totalCount <= 0 || entries.length >= totalCount;
    if (hasFullList) {
      const filtered = entries.filter((row) => {
        if (requester && !row.requester.toLowerCase().includes(requester)) return false;
        if (resource && !row.resource.toLowerCase().includes(resource)) return false;
        if (action && !row.action.toLowerCase().includes(action)) return false;
        return true;
      });
      const totalItems = filtered.length;
      const startIndex = (tableState.page - 1) * tableState.perPage;
      const paginated = filtered.slice(startIndex, startIndex + tableState.perPage);
      return { paginatedEntries: paginated, total: totalItems };
    }
    return { paginatedEntries: entries, total: totalCount };
  }, [
    entries,
    totalCount,
    tableState.page,
    tableState.perPage,
    tableState.filters.requester,
    tableState.filters.resource,
    tableState.filters.action,
    isLoading,
    error,
  ]);

  const tableData = isLoading ? undefined : error ? [] : paginatedEntries;

  const emptyStateNoResults = useMemo(
    () => <DefaultEmptyStateNoResults title={intl.formatMessage(messages.auditLogNoResults)} onClearFilters={tableState.clearAllFilters} />,
    [intl, tableState.clearAllFilters],
  );

  return (
    <TableView<typeof columns, AuditLogEntry>
      columns={columns}
      columnConfig={columnConfig}
      data={tableData}
      totalCount={total}
      getRowId={(row) => row.id}
      cellRenderers={cellRenderers}
      page={tableState.page}
      perPage={tableState.perPage}
      onPageChange={tableState.onPageChange}
      onPerPageChange={tableState.onPerPageChange}
      perPageOptions={[10, 20, 50]}
      filterConfig={filterConfig}
      filters={tableState.filters}
      onFiltersChange={tableState.onFiltersChange}
      clearAllFilters={tableState.clearAllFilters}
      error={error ? new Error(error) : null}
      emptyStateNoData={emptyStateNoData}
      emptyStateNoResults={emptyStateNoResults}
      ariaLabel={intl.formatMessage({ id: 'auditLogTableAriaLabel', defaultMessage: 'Audit log entries' })}
      ouiaId="audit-log-table"
    />
  );
};
