import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';

import { TableView, useTableState } from '../../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../components/table-view/types';
import { useServiceAccountsQuery } from '../../../../../data/queries/serviceAccounts';
import type { ServiceAccount as ApiServiceAccount } from '../../../../../data/api/serviceAccounts';
import { getDateFormat } from '../../../../../helpers/stringUtilities';
import messages from '../../../../../Messages';
import { PER_PAGE_OPTIONS } from '../../../../../helpers/pagination';

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
  const { auth, getEnvironmentDetails } = useChrome();
  const intl = useIntl();

  // Get auth token and SSO URL
  const [token, setToken] = useState<string | undefined>();
  const ssoUrl = getEnvironmentDetails()?.sso;

  useEffect(() => {
    auth.getToken().then(setToken);
  }, [auth]);

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.name) },
      description: { label: intl.formatMessage(messages.description) },
      clientId: { label: intl.formatMessage(messages.clientId) },
      owner: { label: intl.formatMessage(messages.owner) },
      timeCreated: { label: intl.formatMessage(messages.timeCreated) },
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
  const { data: serviceAccountsData, isLoading } = useServiceAccountsQuery(
    {
      token: token ?? '',
      ssoUrl: ssoUrl ?? '',
      page,
      perPage,
    },
    { enabled: !!token && !!ssoUrl },
  );

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
              <h4>{intl.formatMessage(messages.noServiceAccountsFound)}</h4>
              <p>{intl.formatMessage(messages.groupServiceAccountEmptyStateBody)}</p>
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
