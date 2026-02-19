import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { ErrorState, PageHeader, SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import type { ThProps } from '@patternfly/react-table';
import {
  DataView,
  DataViewState,
  DataViewTable,
  DataViewTextFilter,
  DataViewTh,
  DataViewToolbar,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSort,
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

export interface AuditLogFilters {
  search: string;
}

const AUDIT_LOG_COLUMN_KEYS = ['date', 'requester', 'action', 'resource', 'description'] as const;

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

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<AuditLogFilters>({
    initialFilters: { search: '' },
    searchParams,
    setSearchParams,
  });

  const { sortBy, direction, onSort } = useDataViewSort({
    searchParams,
    setSearchParams,
    initialSort: { sortBy: 'date', direction: 'desc' },
    defaultDirection: 'desc',
  });

  const pagination = useDataViewPagination({
    perPage: 20,
    searchParams,
    setSearchParams,
  });
  const { page, perPage, onPerPageSelect, onSetPage } = pagination;

  // Client-side filter for search (basic structure; can be moved to API later)
  const filteredEntries = useMemo(() => {
    const term = (filters.search ?? '').trim().toLowerCase();
    if (!term) return entries;
    return entries.filter(
      (e: AuditLogEntry) =>
        e.requester?.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.resource?.toLowerCase().includes(term) ||
        e.action?.toLowerCase().includes(term)
    );
  }, [entries, filters.search]);

  const sortByIndex = useMemo(
    () => AUDIT_LOG_COLUMN_KEYS.indexOf((sortBy as (typeof AUDIT_LOG_COLUMN_KEYS)[number]) ?? 'date'),
    [sortBy]
  );
  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: sortByIndex >= 0 ? sortByIndex : 0,
      direction,
      defaultDirection: 'desc',
    },
    onSort: (_event, index, dir) => onSort(undefined, AUDIT_LOG_COLUMN_KEYS[index], dir),
    columnIndex,
  });

  const columns: DataViewTh[] = useMemo(
    () => [
      { cell: intl.formatMessage({ id: 'auditLogColumnDate', defaultMessage: 'Date' }), props: { sort: getSortParams(0) } },
      { cell: intl.formatMessage({ id: 'auditLogColumnRequester', defaultMessage: 'Requester' }), props: { sort: getSortParams(1) } },
      { cell: intl.formatMessage({ id: 'auditLogColumnAction', defaultMessage: 'Action' }), props: { sort: getSortParams(2) } },
      { cell: intl.formatMessage({ id: 'auditLogColumnResource', defaultMessage: 'Resource' }), props: { sort: getSortParams(3) } },
      { cell: intl.formatMessage({ id: 'auditLogColumnDescription', defaultMessage: 'Description' }), props: { sort: getSortParams(4) } },
    ],
    [intl, sortByIndex, direction]
  );

  const rows: DataViewTr[] = useMemo(
    () =>
      filteredEntries.map((entry) => ({
        id: entry.id,
        row: [entry.date, entry.requester, entry.action, entry.resource, entry.description],
      })),
    [filteredEntries]
  );

  const activeState: DataViewState | undefined = isLoading
    ? DataViewState.loading
    : error
      ? DataViewState.error
      : filteredEntries.length === 0
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
            clearAllFilters={clearAllFilters}
            filters={
              <DataViewTextFilter
                filterId="search"
                title={intl.formatMessage({ id: 'auditLogFilterSearch', defaultMessage: 'Search' })}
                placeholder={intl.formatMessage({
                  id: 'auditLogFilterSearchPlaceholder',
                  defaultMessage: 'Filter by requester, action, resource, or description',
                })}
                ouiaId="audit-log-search-filter"
                onChange={(_e, value) => onSetFilters({ search: value })}
                value={filters.search}
              />
            }
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
