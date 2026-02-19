import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { ErrorState, PageHeader, SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import {
  DataView,
  DataViewState,
  DataViewTable,
  DataViewTh,
  DataViewToolbar,
  useDataViewPagination,
} from '@patternfly/react-data-view';
import type { DataViewTr } from '@patternfly/react-data-view';
import { Pagination } from '@patternfly/react-core';
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
// Empty / Error table body components
// ----------------------------------------------------------------------------

const EmptyAuditLogTable: React.FC<{ titleText: string; description?: string }> = ({ titleText, description }) => (
  <tbody>
    <tr>
      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
        <EmptyState headingLevel="h4" icon={SearchIcon} titleText={titleText}>
          {description && <EmptyStateBody>{description}</EmptyStateBody>}
        </EmptyState>
      </td>
    </tr>
  </tbody>
);

const ErrorStateTable: React.FC<{ errorTitle: string; errorDescription?: string | null }> = ({
  errorTitle,
  errorDescription,
}) => (
  <tbody>
    <tr>
      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
        <ErrorState titleText={errorTitle} bodyText={errorDescription ?? undefined} />
      </td>
    </tr>
  </tbody>
);

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export interface AuditLogProps {
  /** Audit log entries (e.g. current page from client) */
  entries?: AuditLogEntry[];
  /** Total count for pagination (from client) */
  totalCount?: number;
  /** Loading state from client */
  isLoading?: boolean;
  /** Error from client; when set, error state is shown */
  error?: string | null;
}

const AuditLog: React.FC<AuditLogProps> = ({
  entries = [],
  totalCount = 0,
  isLoading = false,
  error = null,
}) => {
  const intl = useIntl();
  const [searchParams, setSearchParams] = useSearchParams();

  const pagination = useDataViewPagination({
    perPage: 20,
    searchParams,
    setSearchParams,
  });
  const { page, perPage, onPerPageSelect, onSetPage } = pagination;

  const columns: DataViewTh[] = useMemo(
    () => [
      { cell: intl.formatMessage({ id: 'auditLogColumnDate', defaultMessage: 'Date' }) },
      { cell: intl.formatMessage({ id: 'auditLogColumnRequester', defaultMessage: 'Requester' }) },
      { cell: intl.formatMessage({ id: 'auditLogColumnAction', defaultMessage: 'Action' }) },
      { cell: intl.formatMessage({ id: 'auditLogColumnResource', defaultMessage: 'Resource' }) },
      { cell: intl.formatMessage({ id: 'auditLogColumnDescription', defaultMessage: 'Description' }) },
    ],
    [intl]
  );

  const rows: DataViewTr[] = useMemo(
    () =>
      entries.map((entry) => ({
        id: entry.id,
        row: [entry.date, entry.requester, entry.action, entry.resource, entry.description],
      })),
    [entries]
  );

  const activeState: DataViewState | undefined = isLoading
    ? DataViewState.loading
    : error
      ? DataViewState.error
      : entries.length === 0
        ? DataViewState.empty
        : undefined;

  const perPageOptions = [
    { title: '10', value: 10 },
    { title: '20', value: 20 },
    { title: '50', value: 50 },
  ];

  return (
    <>
      <PageHeader
        title={intl.formatMessage(messages.auditLog)}
        subtitle={intl.formatMessage(messages.auditLogSubtitle)}
      />
      <PageSection hasBodyWrapper={false}>
        <DataView activeState={activeState}>
          <DataViewToolbar
            pagination={
              <Pagination
                perPageOptions={perPageOptions.map((o) => ({ title: o.title, value: o.value }))}
                itemCount={totalCount}
                page={page}
                perPage={perPage}
                onPerPageSelect={(_e, newPerPage) => onPerPageSelect(undefined, newPerPage)}
                onSetPage={(_e, newPage) => onSetPage(undefined, newPage)}
              />
            }
          />
          <DataViewTable
            aria-label={intl.formatMessage({ id: 'auditLogTableAriaLabel', defaultMessage: 'Audit log entries' })}
            ouiaId="audit-log-table"
            columns={columns}
            rows={error ? [] : rows}
            headStates={{ loading: <SkeletonTableHead columns={columns} /> }}
            bodyStates={{
              loading: <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />,
              empty: (
                <EmptyAuditLogTable
                  titleText={intl.formatMessage(messages.auditLogNoResults)}
                  description={intl.formatMessage(messages.auditLogNoResultsDescription)}
                />
              ),
              error: (
                <ErrorStateTable
                  errorTitle={intl.formatMessage({ id: 'auditLogErrorTitle', defaultMessage: 'Failed to load audit log' })}
                  errorDescription={error}
                />
              ),
            }}
          />
          <DataViewToolbar
            pagination={
              <Pagination
                isCompact
                perPageOptions={perPageOptions.map((o) => ({ title: o.title, value: o.value }))}
                itemCount={totalCount}
                page={page}
                perPage={perPage}
                onPerPageSelect={(_e, newPerPage) => onPerPageSelect(undefined, newPerPage)}
                onSetPage={(_e, newPage) => onSetPage(undefined, newPage)}
              />
            }
          />
        </DataView>
      </PageSection>
    </>
  );
};

export default AuditLog;
