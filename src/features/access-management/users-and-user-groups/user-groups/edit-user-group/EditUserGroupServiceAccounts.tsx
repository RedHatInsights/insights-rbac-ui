import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { TableView } from '../../../../../components/table-view/TableView';
import { useTableState } from '../../../../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData } from '../../../../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../components/table-view/types';
import { ERROR, LAST_PAGE } from '../../../../../redux/service-accounts/constants';
import { ServiceAccount } from '../../../../../redux/service-accounts/types';
import { mappedProps } from '../../../../../helpers/dataUtilities';
import Messages from '../../../../../Messages';
import { fetchServiceAccountsForGroup } from '../../../../../redux/groups/actions';
import { fetchServiceAccounts } from '../../../../../redux/service-accounts/actions';
import { selectServiceAccountsFullState } from '../../../../../redux/service-accounts/selectors';
import { TableState } from './EditUserGroupUsersAndServiceAccounts';

interface EditGroupServiceAccountsTableProps {
  groupId?: string;
  onChange: (serviceAccounts: TableState) => void;
  initialServiceAccountIds: string[];
}

const columns = ['name', 'description', 'clientId', 'owner', 'timeCreated'] as const;

const EditGroupServiceAccountsTable: React.FunctionComponent<EditGroupServiceAccountsTableProps> = ({
  groupId,
  onChange,
  initialServiceAccountIds,
}) => {
  const dispatch = useDispatch();
  const { auth, getEnvironmentDetails } = useChrome();
  const intl = useIntl();

  const { serviceAccounts, status, isLoading } = useSelector(selectServiceAccountsFullState);

  // Build initial selected rows from IDs (placeholder objects until data loads)
  const initialSelectedRows = useMemo(
    () =>
      initialServiceAccountIds.map(
        (uuid) =>
          ({
            uuid,
            name: '',
            description: '',
            clientId: '',
            createdBy: '',
            createdAt: 0,
          }) as ServiceAccount,
      ),
    [initialServiceAccountIds],
  );

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(Messages.name) },
      description: { label: intl.formatMessage(Messages.description) },
      clientId: { label: intl.formatMessage(Messages.clientId) },
      owner: { label: intl.formatMessage(Messages.owner) },
      timeCreated: { label: intl.formatMessage(Messages.timeCreated) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, ServiceAccount> = useMemo(
    () => ({
      name: (account) => account.name,
      description: (account) => account.description,
      clientId: (account) => account.clientId,
      owner: (account) => account.createdBy,
      timeCreated: (account) => <DateFormat date={account.createdAt} />,
    }),
    [],
  );

  // useTableState handles ALL state including selection
  const tableState = useTableState<typeof columns, ServiceAccount>({
    columns,
    getRowId: (account) => account.uuid,
    initialPerPage: 20,
    perPageOptions: [5, 10, 20, 50, 100],
    initialSelectedRows,
    onStaleData: async (params) => {
      const env = getEnvironmentDetails();
      const token = await auth.getToken();
      dispatch(
        fetchServiceAccounts({
          ...mappedProps({ count: 0, limit: params.limit, offset: params.offset, orderBy: 'username', token, sso: env?.sso }),
        }),
      );
    },
  });

  // Fetch group's service accounts once on mount (only if editing existing group)
  // This is a one-time fetch for existing group data, not state-watching
  useEffect(() => {
    if (groupId) {
      dispatch(fetchServiceAccountsForGroup(groupId, {}));
    }
  }, [dispatch, groupId]);

  const totalCount = useMemo(() => {
    if (!serviceAccounts) return 0;
    const currentCount = (tableState.page - 1) * tableState.perPage + serviceAccounts.length;
    return status === LAST_PAGE ? currentCount : currentCount + 1;
  }, [serviceAccounts, tableState.page, tableState.perPage, status]);

  // Keep ref to onChange to avoid stale closure
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Wrap selection handlers to also call onChange
  const handleSelectRow = useCallback(
    (account: ServiceAccount, selected: boolean) => {
      tableState.onSelectRow(account, selected);
      // Compute new selection
      const currentIds = tableState.selectedRows.map((sa) => sa.uuid);
      const newIds = selected ? [...currentIds, account.uuid] : currentIds.filter((id) => id !== account.uuid);
      onChangeRef.current({ initial: initialServiceAccountIds, updated: newIds });
    },
    [tableState, initialServiceAccountIds],
  );

  const handleSelectAll = useCallback(
    (selected: boolean, rows: ServiceAccount[]) => {
      tableState.onSelectAll(selected, rows);
      // Compute new selection
      const currentIds = new Set(tableState.selectedRows.map((sa) => sa.uuid));
      const rowIds = rows.map((sa) => sa.uuid);
      let newIds: string[];
      if (selected) {
        rowIds.forEach((id) => currentIds.add(id));
        newIds = Array.from(currentIds);
      } else {
        newIds = Array.from(currentIds).filter((id) => !rowIds.includes(id));
      }
      onChangeRef.current({ initial: initialServiceAccountIds, updated: newIds });
    },
    [tableState, initialServiceAccountIds],
  );

  const processedServiceAccounts = serviceAccounts ? serviceAccounts.slice(0, tableState.perPage) : [];
  const hasError = status === ERROR;

  return (
    <TableView<typeof columns, ServiceAccount>
      columns={columns}
      columnConfig={columnConfig}
      data={isLoading ? undefined : processedServiceAccounts}
      totalCount={totalCount}
      getRowId={(account) => account.uuid}
      cellRenderers={cellRenderers}
      error={hasError ? new Error('Failed to load service accounts') : null}
      emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(Messages.noServiceAccountsFound)} />}
      emptyStateError={
        <DefaultEmptyStateNoData
          title="Failed to load service accounts"
          body="Please try refreshing the page or contact support if the problem persists."
        />
      }
      variant="compact"
      ariaLabel="Edit group service accounts table"
      ouiaId="edit-group-service-accounts-table"
      selectable
      {...tableState}
      // Override selection handlers to also call onChange
      onSelectRow={handleSelectRow}
      onSelectAll={handleSelectAll}
    />
  );
};

export { EditGroupServiceAccountsTable };
