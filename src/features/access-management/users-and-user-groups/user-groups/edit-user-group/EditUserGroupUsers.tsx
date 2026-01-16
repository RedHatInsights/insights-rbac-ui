import React, { useCallback, useMemo, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TableView } from '../../../../../components/table-view/TableView';
import { useTableState } from '../../../../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData } from '../../../../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../components/table-view/types';
import { type User, useUsersQuery } from '../../../../../data/queries/users';
import { TableState } from './EditUserGroupUsersAndServiceAccounts';
import Messages from '../../../../../Messages';

interface EditGroupUsersTableProps {
  onChange: (userDiff: TableState) => void;
  groupId: string;
  initialUserIds: string[];
}

const columns = ['orgAdmin', 'username', 'email', 'firstName', 'lastName', 'status'] as const;

const EditGroupUsersTable: React.FunctionComponent<EditGroupUsersTableProps> = ({ onChange, initialUserIds }) => {
  const intl = useIntl();

  // Helper to get consistent user ID - use username as the unique identifier
  const getUserId = useCallback((user: User) => user.username, []);

  // Build initial selected rows from IDs (placeholder objects until data loads)
  const initialSelectedRows = useMemo(
    () =>
      initialUserIds.map(
        (username) =>
          ({
            username,
            email: '',
            first_name: '',
            last_name: '',
            is_org_admin: false,
            is_active: true,
          }) as User,
      ),
    [initialUserIds],
  );

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      orgAdmin: { label: intl.formatMessage(Messages.orgAdmin) },
      username: { label: intl.formatMessage(Messages.username) },
      email: { label: intl.formatMessage(Messages.email) },
      firstName: { label: intl.formatMessage(Messages.firstName) },
      lastName: { label: intl.formatMessage(Messages.lastName) },
      status: { label: intl.formatMessage(Messages.status) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, User> = useMemo(
    () => ({
      orgAdmin: (user) => (user.is_org_admin ? intl.formatMessage(Messages.yes) : intl.formatMessage(Messages.no)),
      username: (user) => user.username,
      email: (user) => user.email,
      firstName: (user) => user.first_name,
      lastName: (user) => user.last_name,
      status: (user) => (user.is_active ? intl.formatMessage(Messages.active) : intl.formatMessage(Messages.inactive)),
    }),
    [intl],
  );

  // useTableState handles ALL state - no duplicate useState needed
  const tableState = useTableState<typeof columns, User>({
    columns,
    getRowId: getUserId,
    initialPerPage: 20,
    perPageOptions: [5, 10, 20, 50, 100],
    initialSelectedRows,
    syncWithUrl: false, // Modal/edit form tables shouldn't sync with URL
  });

  // Use React Query for data fetching - using apiParams from tableState
  const { data, isLoading, error } = useUsersQuery({
    limit: tableState.apiParams.limit,
    offset: tableState.apiParams.offset,
    orderBy: 'username',
  });

  // Extract users from response
  const users: User[] = (data as any)?.data || [];
  const totalCount = (data as any)?.meta?.count || 0;

  // Keep ref to avoid stale closure in wrapped handlers
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Wrap selection handlers to also call onChange
  const handleSelectRow = useCallback(
    (user: User, selected: boolean) => {
      tableState.onSelectRow(user, selected);
      // Compute new selection (can't rely on tableState.selectedRows being updated yet)
      const currentIds = tableState.selectedRows.map(getUserId);
      const userId = getUserId(user);
      const newIds = selected ? [...currentIds, userId] : currentIds.filter((id) => id !== userId);
      onChangeRef.current({ initial: initialUserIds, updated: newIds });
    },
    [tableState, getUserId, initialUserIds],
  );

  const handleSelectAll = useCallback(
    (selected: boolean, rows: User[]) => {
      tableState.onSelectAll(selected, rows);
      // Compute new selection
      const currentIds = new Set(tableState.selectedRows.map(getUserId));
      const rowIds = rows.map(getUserId);
      let newIds: string[];
      if (selected) {
        rowIds.forEach((id) => currentIds.add(id));
        newIds = Array.from(currentIds);
      } else {
        newIds = Array.from(currentIds).filter((id) => !rowIds.includes(id));
      }
      onChangeRef.current({ initial: initialUserIds, updated: newIds });
    },
    [tableState, getUserId, initialUserIds],
  );

  const hasError = !!error;

  return (
    <TableView<typeof columns, User>
      columns={columns}
      columnConfig={columnConfig}
      data={isLoading ? undefined : users}
      totalCount={totalCount}
      getRowId={getUserId}
      cellRenderers={cellRenderers}
      error={hasError ? new Error('Failed to load users') : null}
      emptyStateNoData={
        <DefaultEmptyStateNoData
          title={intl.formatMessage(Messages.usersEmptyStateTitle)}
          body={
            <FormattedMessage
              {...Messages['usersEmptyStateSubtitle']}
              values={{
                br: <br />,
              }}
            />
          }
        />
      }
      emptyStateError={
        <DefaultEmptyStateNoData title="Failed to load users" body="Please try refreshing the page or contact support if the problem persists." />
      }
      variant="compact"
      ariaLabel="Edit group users table"
      ouiaId="edit-group-users-table"
      selectable
      {...tableState}
      // Override selection handlers to also call onChange
      onSelectRow={handleSelectRow}
      onSelectAll={handleSelectAll}
    />
  );
};

export { EditGroupUsersTable };
