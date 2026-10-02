import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import PageHeader from '@patternfly/react-component-groups/dist/dynamic/PageHeader';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import { TableView, useTableState } from '@redhat-cloud-services/frontend-components/TableView';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '@redhat-cloud-services/frontend-components/TableView';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '@redhat-cloud-services/frontend-components/TableView';
import { GetAuditlogsActionEnum as ActionEnum, GetAuditlogsResourceTypeEnum as ResourceTypeEnum, useAuditLogsQuery } from '../../data/queries/audit';
import type { AuditLog as ApiAuditLog } from '../../data/queries/audit';
import { getDateFormat } from '../../../shared/helpers/stringUtilities';
import { commonMessages } from '../../../shared/messages/common';

const VALID_RESOURCE_TYPES = new Set<string>(Object.values(ResourceTypeEnum));
const VALID_ACTIONS = new Set<string>(Object.values(ActionEnum));

function filterValidEnumValues<T extends string>(values: string[], validSet: Set<string>): T[] | undefined {
  const filtered = values.filter((v) => validSet.has(v)) as T[];
  return filtered.length > 0 ? filtered : undefined;
}

export type { AuditLogEntry } from './AuditLogTable';

interface AuditLogRow {
  id: string;
  date: string;
  requester: string;
  description: string;
  resource: string;
  action: string;
}

const columns = ['date', 'requester', 'description', 'resource', 'action'] as const;

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function mapApiEntry(entry: ApiAuditLog, index: number, offset: number): AuditLogRow {
  return {
    id: String(offset + index),
    date: entry.created ?? '',
    requester: entry.principal_username ?? '',
    description: entry.description ?? '',
    resource: capitalize(entry.resource_type ?? ''),
    action: capitalize(entry.action ?? ''),
  };
}

export const AuditLog: React.FC = () => {
  const intl = useIntl();

  const tableState = useTableState<typeof columns, AuditLogRow>({
    columns,
    getRowId: (row) => row.id,
    initialPerPage: 20,
    perPageOptions: [10, 20, 50],
    initialFilters: { requester: '', resource: [] as string[], action: [] as string[] },
    syncWithUrl: true,
  });

  const queryParams = useMemo(() => {
    const { limit, offset, filters } = tableState.apiParams;
    const requester = (filters?.requester as string | undefined) ?? '';
    const resource = (filters?.resource as string[] | undefined) ?? [];
    const action = (filters?.action as string[] | undefined) ?? [];
    return {
      limit,
      offset,
      orderBy: '-created' as const,
      principalUsername: requester || undefined,
      nameMatch: requester ? ('partial' as const) : undefined,
      resourceType: filterValidEnumValues<ResourceTypeEnum>(resource, VALID_RESOURCE_TYPES),
      action: filterValidEnumValues<ActionEnum>(action, VALID_ACTIONS),
    };
  }, [tableState.apiParams]);

  const { data: auditData, isLoading, isError, error } = useAuditLogsQuery(queryParams);
  const offset = tableState.apiParams.offset;
  const entries = useMemo(() => (auditData?.data ?? []).map((entry, i) => mapApiEntry(entry, i, offset)), [auditData, offset]);
  const totalCount = auditData?.meta?.count ?? 0;
  const errorMessage = isError ? (error instanceof Error ? error.message : 'Failed to load audit log') : null;

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      date: { label: intl.formatMessage({ id: 'auditLogColumnDate', defaultMessage: 'Date', description: 'Audit log date column header' }) },
      requester: { label: intl.formatMessage({ id: 'requester', defaultMessage: 'Requester', description: 'Requester label' }) },
      action: { label: intl.formatMessage({ id: 'auditLogColumnAction', defaultMessage: 'Action', description: 'Audit log action column header' }) },
      resource: {
        label: intl.formatMessage({ id: 'auditLogColumnResource', defaultMessage: 'Resource', description: 'Audit log resource column header' }),
      },
      description: {
        label: intl.formatMessage({
          id: 'auditLogColumnDescription',
          defaultMessage: 'Description',
          description: 'Audit log description column header',
        }),
      },
    }),
    [intl],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'requester',
        label: intl.formatMessage({ id: 'requester', defaultMessage: 'Requester', description: 'Requester label' }),
        placeholder: intl.formatMessage({
          id: 'filterByRequester',
          defaultMessage: 'Filter by requester',
          description: 'Audit log filter placeholder for requester',
        }),
      },
      {
        type: 'checkbox',
        id: 'resource',
        label: intl.formatMessage({ id: 'resource', defaultMessage: 'Resource', description: 'Resource label' }),
        options: [
          { id: 'group', label: intl.formatMessage({ id: 'group', defaultMessage: 'Group', description: 'Group singular' }) },
          { id: 'role', label: intl.formatMessage(commonMessages.role) },
          { id: 'user', label: intl.formatMessage({ id: 'userCapitalized', defaultMessage: 'User', description: 'User singular (capitalized)' }) },
        ],
      },
      {
        type: 'checkbox',
        id: 'action',
        label: intl.formatMessage({ id: 'action', defaultMessage: 'Action', description: 'Action label' }),
        options: [
          { id: 'add', label: intl.formatMessage({ id: 'add', defaultMessage: 'Add', description: 'Add label' }) },
          { id: 'create', label: intl.formatMessage({ id: 'create', defaultMessage: 'Create', description: 'Create label' }) },
          { id: 'delete', label: intl.formatMessage(commonMessages.delete) },
          { id: 'edit', label: intl.formatMessage(commonMessages.edit) },
          { id: 'remove', label: intl.formatMessage(commonMessages.remove) },
        ],
      },
    ],
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

  const emptyStateNoData = useMemo(
    () => (
      <DefaultEmptyStateNoData
        title={intl.formatMessage({
          id: 'auditLogNoResults',
          defaultMessage: 'No audit log entries found',
          description: 'Audit log empty state when filters match no results',
        })}
      />
    ),
    [intl],
  );
  const emptyStateNoResults = useMemo(
    () => (
      <DefaultEmptyStateNoResults
        title={intl.formatMessage({
          id: 'auditLogNoResults',
          defaultMessage: 'No audit log entries found',
          description: 'Audit log empty state when filters match no results',
        })}
        onClearFilters={tableState.clearAllFilters}
      />
    ),
    [intl, tableState.clearAllFilters],
  );

  return (
    <>
      <PageHeader
        title={intl.formatMessage({ id: 'auditLog', defaultMessage: 'Audit Log', description: 'Audit Log page title' })}
        subtitle={intl.formatMessage({
          id: 'auditLogSubtitle',
          defaultMessage:
            'The user access audit log tracks admin actions, such as adding/removing users from groups, adding/removing roles from groups, create/editing/deleting roles, or creating/editing/deleting groups. Logs can be filtered by requester, resource or action.',
          description: 'Audit Log page subtitle',
        })}
      />
      <PageSection hasBodyWrapper={false}>
        <TableView<typeof columns, AuditLogRow>
          columns={columns}
          columnConfig={columnConfig}
          data={isLoading ? undefined : errorMessage ? [] : entries}
          totalCount={totalCount}
          getRowId={(row) => row.id}
          cellRenderers={cellRenderers}
          filterConfig={filterConfig}
          error={errorMessage ? new Error(errorMessage) : null}
          emptyStateNoData={emptyStateNoData}
          emptyStateNoResults={emptyStateNoResults}
          ariaLabel={intl.formatMessage({
            id: 'auditLogTableAriaLabel',
            defaultMessage: 'Audit log entries',
            description: 'Accessible label for the audit log table',
          })}
          ouiaId="audit-log-table"
          {...tableState}
        />
      </PageSection>
    </>
  );
};

export default AuditLog;
