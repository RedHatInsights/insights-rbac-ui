import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { PageHeader } from '@patternfly/react-component-groups';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import { TableView, useTableState } from '../../components/table-view';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap } from '../../components/table-view/types';
import { type GetAuditlogsParams, useAuditLogsQuery } from '../../data/queries/audit';
import type { AuditLog as ApiAuditLog } from '../../data/queries/audit';
import { getDateFormat } from '../../helpers/stringUtilities';
import messages from '../../Messages';

export type { AuditLogEntry } from './AuditLogTable';

interface AuditLogRow {
  id: string;
  date: string;
  requester: string;
  description: string;
  resource: string;
  action: string;
}

const columns = ['date', 'requester', 'action', 'resource', 'description'] as const;

function mapApiEntry(entry: ApiAuditLog, index: number): AuditLogRow {
  return {
    id: String(index),
    date: entry.created ?? '',
    requester: entry.principal_username ?? '',
    description: entry.description ?? '',
    resource: entry.resource_type ?? '',
    action: entry.action ?? '',
  };
}

const AuditLog: React.FC = () => {
  const intl = useIntl();

  const tableState = useTableState<typeof columns, AuditLogRow>({
    columns,
    getRowId: (row) => row.id,
    initialPerPage: 20,
    perPageOptions: [10, 20, 50],
    syncWithUrl: true,
  });

  const queryParams: GetAuditlogsParams = useMemo(
    () => ({
      limit: tableState.perPage,
      offset: (tableState.page - 1) * tableState.perPage,
      orderBy: 'id' as const,
    }),
    [tableState.perPage, tableState.page],
  );

  const { data: auditData, isLoading, isError, error } = useAuditLogsQuery(queryParams);

  const entries = useMemo(() => (auditData?.data ?? []).map(mapApiEntry), [auditData]);
  const totalCount = auditData?.meta?.count ?? 0;
  const errorMessage = isError ? (error instanceof Error ? error.message : 'Failed to load audit log') : null;

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

  const cellRenderers: CellRendererMap<typeof columns, AuditLogRow> = useMemo(
    () => ({
      date: (row) => (row.date ? <DateFormat date={row.date} type={getDateFormat(row.date)} /> : '—'),
      requester: (row) => row.requester || '—',
      action: (row) => row.action || '—',
      resource: (row) => row.resource || '—',
      description: (row) => row.description || '—',
    }),
    [],
  );

  const emptyStateNoData = useMemo(() => <DefaultEmptyStateNoData title={intl.formatMessage(messages.auditLogNoResults)} />, [intl]);
  const emptyStateNoResults = useMemo(
    () => <DefaultEmptyStateNoResults title={intl.formatMessage(messages.auditLogNoResults)} onClearFilters={tableState.clearAllFilters} />,
    [intl, tableState.clearAllFilters],
  );

  return (
    <>
      <PageHeader title={intl.formatMessage(messages.auditLog)} subtitle={intl.formatMessage(messages.auditLogSubtitle)} />
      <PageSection hasBodyWrapper={false}>
        <TableView<typeof columns, AuditLogRow>
          columns={columns}
          columnConfig={columnConfig}
          data={isLoading ? undefined : errorMessage ? [] : entries}
          totalCount={totalCount}
          getRowId={(row) => row.id}
          cellRenderers={cellRenderers}
          error={errorMessage ? new Error(errorMessage) : null}
          emptyStateNoData={emptyStateNoData}
          emptyStateNoResults={emptyStateNoResults}
          ariaLabel={intl.formatMessage({ id: 'auditLogTableAriaLabel', defaultMessage: 'Audit log entries' })}
          ouiaId="audit-log-table"
          {...tableState}
        />
      </PageSection>
    </>
  );
};

export default AuditLog;
