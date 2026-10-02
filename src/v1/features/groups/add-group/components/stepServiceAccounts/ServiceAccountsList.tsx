import React, { Fragment, useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';

import { TableView, useTableState } from '@redhat-cloud-services/frontend-components/TableView';
import type { CellRendererMap, ColumnConfigMap } from '@redhat-cloud-services/frontend-components/TableView';
import { useServiceAccountsQuery } from '../../../../../../shared/data/queries/serviceAccounts';
import type { ServiceAccount as ApiServiceAccount } from '../../../../../../shared/data/api/serviceAccounts';
import { getDateFormat } from '../../../../../../shared/helpers/stringUtilities';

import { PER_PAGE_OPTIONS } from '../../../../../../shared/helpers/pagination';
import { commonMessages } from '../../../../../../shared/messages/common';

// Extended ServiceAccount with uuid for row ID and selection
export type ServiceAccount = ApiServiceAccount & {
  uuid: string;
  assignedToSelectedGroup?: boolean;
};

interface ServiceAccountsListProps {
  initialSelectedServiceAccounts: ServiceAccount[];
  onSelect: (selectedServiceAccounts: ServiceAccount[]) => void;
  groupId?: string;
}

// Column definitions
const columns = ['name', 'description', 'clientId', 'owner', 'timeCreated'] as const;

export const ServiceAccountsList: React.FunctionComponent<ServiceAccountsListProps> = ({ initialSelectedServiceAccounts, onSelect }) => {
  const intl = useIntl();

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(commonMessages.name) },
      description: { label: intl.formatMessage(commonMessages.description) },
      clientId: { label: intl.formatMessage({ id: 'clientId', defaultMessage: 'Client ID', description: 'Client ID column label' }) },
      owner: { label: intl.formatMessage({ id: 'owner', defaultMessage: 'Owner', description: 'Owner column label' }) },
      timeCreated: { label: intl.formatMessage({ id: 'timeCreated', defaultMessage: 'Time created', description: 'Time created column label' }) },
    }),
    [intl],
  );

  // useTableState for all state management
  const tableState = useTableState<typeof columns, ServiceAccount>({
    columns,
    initialPerPage: 20,
    perPageOptions: PER_PAGE_OPTIONS.map((opt) => opt.value),
    getRowId: (sa) => sa.uuid,
    initialSelectedRows: initialSelectedServiceAccounts,
    isRowSelectable: (sa) => !sa.assignedToSelectedGroup,
  });

  // Convert offset/limit to page/perPage for the API
  const page = Math.floor(tableState.apiParams.offset / tableState.apiParams.limit) + 1;
  const perPage = tableState.apiParams.limit;

  // Fetch service accounts via React Query
  const { data: serviceAccountsData, isLoading } = useServiceAccountsQuery({ page, perPage });

  // Map API response to add uuid field for row identification
  const serviceAccounts: ServiceAccount[] = useMemo(() => {
    return (serviceAccountsData ?? []).map((sa) => ({
      ...sa,
      uuid: sa.id || sa.clientId,
    }));
  }, [serviceAccountsData]);

  // Service accounts API doesn't return total count, estimate based on whether we have a full page
  const totalCount = serviceAccounts.length === perPage ? (page + 1) * perPage : (page - 1) * perPage + serviceAccounts.length;

  // Propagate selection changes to parent
  useEffect(() => {
    onSelect(tableState.selectedRows);
  }, [tableState.selectedRows, onSelect]);

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, ServiceAccount> = useMemo(
    () => ({
      name: (sa) => sa.name,
      description: (sa) => sa.description || '—',
      clientId: (sa) => sa.clientId,
      owner: (sa) => sa.createdBy,
      timeCreated: (sa) => (sa.createdAt ? <DateFormat date={sa.createdAt} type={getDateFormat(String(sa.createdAt))} /> : '—'),
    }),
    [],
  );

  const ouiaId = 'group-add-service-accounts';

  return (
    <div className="rbac-service-accounts-list">
      <TableView<typeof columns, ServiceAccount>
        columns={columns}
        columnConfig={columnConfig}
        data={isLoading ? undefined : serviceAccounts}
        totalCount={totalCount}
        getRowId={(sa) => sa.uuid}
        cellRenderers={cellRenderers}
        selectable
        isRowSelectable={(sa) => !sa.assignedToSelectedGroup}
        emptyStateNoData={
          <Fragment>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h4>
                {intl.formatMessage({
                  id: 'noServiceAccountsFound',
                  defaultMessage: 'No service accounts found',
                  description: 'No service accounts message',
                })}
              </h4>
              <p>
                {intl.formatMessage({
                  id: 'groupServiceAccountEmptyStateBody',
                  defaultMessage: 'No service accounts found for this group.',
                  description: 'No service accounts for this group message',
                })}
              </p>
            </div>
          </Fragment>
        }
        variant="compact"
        ariaLabel="Service accounts list table"
        ouiaId={ouiaId}
        {...tableState}
      />
    </div>
  );
};

export default ServiceAccountsList;
