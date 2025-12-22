import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';

import { TableView, useTableState } from '../../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../components/table-view/types';
import { LAST_PAGE } from '../../../../../redux/service-accounts/constants';
import { ServiceAccount } from '../../../../../redux/service-accounts/types';
import { getDateFormat } from '../../../../../helpers/stringUtilities';
import messages from '../../../../../Messages';
import { fetchServiceAccounts } from '../../../../../redux/service-accounts/actions';
import { selectServiceAccountsFullState, selectServiceAccountsLimit } from '../../../../../redux/service-accounts/selectors';
import { PER_PAGE_OPTIONS } from '../../../../../helpers/pagination';
import './serviceAccountsList.scss';

interface ServiceAccountsListProps {
  initialSelectedServiceAccounts: ServiceAccount[];
  onSelect: (selectedServiceAccounts: ServiceAccount[]) => void;
  groupId?: string;
}

// Column definitions
const columns = ['name', 'description', 'clientId', 'owner', 'timeCreated'] as const;

export const ServiceAccountsList: React.FunctionComponent<ServiceAccountsListProps> = ({ initialSelectedServiceAccounts, onSelect, groupId }) => {
  const { auth, getEnvironmentDetails } = useChrome();
  const dispatch = useDispatch();
  const intl = useIntl();

  // Redux selectors
  const { serviceAccounts, status, offset, isLoading } = useSelector(selectServiceAccountsFullState);
  const limit = useSelector(selectServiceAccountsLimit);

  // Calculate total count - service accounts API doesn't return total, so we estimate
  const totalCount = status === LAST_PAGE ? offset + serviceAccounts.length : offset + serviceAccounts.length + 1;

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

  // Handle data fetching via onStaleData
  const handleStaleData = useCallback(
    async (params: { offset: number; limit: number; orderBy?: string; filters: Record<string, string | string[]> }) => {
      const env = getEnvironmentDetails();
      const token = await auth.getToken();
      dispatch(
        fetchServiceAccounts({
          limit: params.limit,
          offset: params.offset,
          token,
          sso: env?.sso,
          groupId,
        }),
      );
    },
    [auth, getEnvironmentDetails, dispatch, groupId],
  );

  // useTableState for all state management
  const tableState = useTableState<typeof columns, ServiceAccount>({
    columns,
    initialPerPage: limit || 20,
    perPageOptions: PER_PAGE_OPTIONS.map((opt) => opt.value),
    getRowId: (sa) => sa.uuid,
    initialSelectedRows: initialSelectedServiceAccounts,
    isRowSelectable: (sa) => !sa.assignedToSelectedGroup,
    onStaleData: handleStaleData,
  });

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
      timeCreated: (sa) => <DateFormat date={sa.createdAt} type={getDateFormat(String(sa.createdAt))} />,
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
