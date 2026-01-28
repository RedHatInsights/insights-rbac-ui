import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import Messages from '../../../../../Messages';
import { TableView } from '../../../../../components/table-view/TableView';
import { useTableState } from '../../../../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData } from '../../../../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../components/table-view/types';
import { type ServiceAccount, useServiceAccountsQuery } from '../../../../../data/queries/serviceAccounts';
import { TableState } from './EditUserGroupUsersAndServiceAccounts';

interface EditGroupServiceAccountsTableProps {
  onChange: (serviceAccountDiff: TableState) => void;
  groupId: string;
  initialServiceAccountIds: string[];
}

const columns = ['name', 'clientId', 'owner', 'timeCreated', 'description'] as const;

const EditGroupServiceAccountsTable: React.FunctionComponent<EditGroupServiceAccountsTableProps> = ({
  onChange,
  groupId: _groupId,
  initialServiceAccountIds,
}) => {
  const intl = useIntl();
  const { auth } = useChrome();

  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [ssoUrl, setSsoUrl] = useState<string>('');

  useEffect(() => {
    const initAuth = async () => {
      const authToken = (await auth.getToken()) as string;
      setToken(authToken);
      // Get SSO URL from environment - use stage for non-production
      const user = await auth.getUser();
      // Check if internal cross_access exists to determine environment
      const internal = user?.identity?.internal as { cross_access?: boolean } | undefined;
      const env = internal?.cross_access ? 'stage' : 'prod';
      setSsoUrl(env === 'prod' ? 'https://sso.redhat.com' : 'https://sso.stage.redhat.com');
    };
    initAuth();
  }, [auth]);

  // Helper to get consistent service account ID
  const getServiceAccountId = useCallback((sa: ServiceAccount) => sa.clientId || sa.id, []);

  // Build initial selected rows from IDs
  const initialSelectedRows = useMemo(
    () =>
      initialServiceAccountIds.map(
        (clientId) =>
          ({
            id: clientId,
            clientId,
            name: clientId,
          }) as ServiceAccount,
      ),
    [initialServiceAccountIds],
  );

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(Messages.name) },
      clientId: { label: intl.formatMessage(Messages.clientId) },
      owner: { label: intl.formatMessage(Messages.owner) },
      timeCreated: { label: intl.formatMessage(Messages.timeCreated) },
      description: { label: intl.formatMessage(Messages.description) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, ServiceAccount> = useMemo(
    () => ({
      name: (sa) => sa.name,
      clientId: (sa) => sa.clientId,
      owner: (sa) => sa.createdBy || '-',
      timeCreated: (sa) => (sa.createdAt ? new Date(sa.createdAt).toLocaleDateString() : '-'),
      description: (sa) => sa.description || '-',
    }),
    [],
  );

  // useTableState handles ALL state - no duplicate useState needed
  const tableState = useTableState<typeof columns, ServiceAccount>({
    columns,
    getRowId: getServiceAccountId,
    initialPerPage: 20,
    perPageOptions: [5, 10, 20, 50, 100],
    initialSelectedRows,
    syncWithUrl: false, // Modal/edit form tables shouldn't sync with URL
  });

  // Use React Query for service accounts from SSO - using apiParams from tableState
  const {
    data: serviceAccountsData,
    isLoading: isServiceAccountsLoading,
    error: serviceAccountsError,
  } = useServiceAccountsQuery(
    {
      token,
      ssoUrl,
      page: Math.floor(tableState.apiParams.offset / tableState.apiParams.limit) + 1,
      perPage: tableState.apiParams.limit,
    },
    { enabled: !!token && !!ssoUrl },
  );

  // Extract service accounts
  const serviceAccounts: ServiceAccount[] = serviceAccountsData || [];

  // Keep ref to avoid stale closure in wrapped handlers
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Wrap selection handlers to also call onChange
  const handleSelectRow = useCallback(
    (sa: ServiceAccount, selected: boolean) => {
      tableState.onSelectRow(sa, selected);
      const currentIds = tableState.selectedRows.map(getServiceAccountId);
      const saId = getServiceAccountId(sa);
      const newIds = selected ? [...currentIds, saId] : currentIds.filter((id) => id !== saId);
      onChangeRef.current({ initial: initialServiceAccountIds, updated: newIds });
    },
    [tableState, getServiceAccountId, initialServiceAccountIds],
  );

  const handleSelectAll = useCallback(
    (selected: boolean, rows: ServiceAccount[]) => {
      tableState.onSelectAll(selected, rows);
      const currentIds = new Set(tableState.selectedRows.map(getServiceAccountId));
      const rowIds = rows.map(getServiceAccountId);
      let newIds: string[];
      if (selected) {
        rowIds.forEach((id) => currentIds.add(id));
        newIds = Array.from(currentIds);
      } else {
        newIds = Array.from(currentIds).filter((id) => !rowIds.includes(id));
      }
      onChangeRef.current({ initial: initialServiceAccountIds, updated: newIds });
    },
    [tableState, getServiceAccountId, initialServiceAccountIds],
  );

  const hasError = !!serviceAccountsError;

  return (
    <TableView<typeof columns, ServiceAccount>
      columns={columns}
      columnConfig={columnConfig}
      data={isServiceAccountsLoading ? undefined : serviceAccounts}
      totalCount={serviceAccounts.length}
      getRowId={getServiceAccountId}
      cellRenderers={cellRenderers}
      error={hasError ? new Error('Failed to load service accounts') : null}
      emptyStateNoData={
        <DefaultEmptyStateNoData title="No service accounts found" body="There are no service accounts available to add to this group." />
      }
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
      onSelectRow={handleSelectRow}
      onSelectAll={handleSelectAll}
    />
  );
};

export { EditGroupServiceAccountsTable };
