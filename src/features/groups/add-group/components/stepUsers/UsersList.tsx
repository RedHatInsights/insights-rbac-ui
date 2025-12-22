import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';
import CloseIcon from '@patternfly/react-icons/dist/js/icons/close-icon';

import { TableView, useTableState } from '../../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../../components/table-view/types';
import { fetchUsers } from '../../../../../redux/users/actions';
import { selectIsUsersLoading, selectUsersPaginationFromMeta, selectUsersRawData } from '../../../../../redux/users/selectors';
import messages from '../../../../../Messages';
import { UsersListEmptyState } from './UsersListEmptyState';
import type { User, UsersListProps } from './types';

// Column definitions
const columns = ['orgAdmin', 'username', 'email', 'firstName', 'lastName', 'status'] as const;
const sortableColumns = ['username'] as const;

export const UsersList: React.FC<UsersListProps> = ({ usesMetaInURL = false, displayNarrow = false, initialSelectedUsers, onSelect }) => {
  const intl = useIntl();
  const dispatch = useDispatch();

  // Redux selectors
  const rawUsers = useSelector(selectUsersRawData);
  const isLoading = useSelector(selectIsUsersLoading);
  const pagination = useSelector(selectUsersPaginationFromMeta);
  const totalCount = pagination.count || 0;

  // Transform raw users to add uuid
  const users: User[] = useMemo(() => {
    return rawUsers?.map?.((data: any) => ({ ...data, uuid: data.username })) || [];
  }, [rawUsers]);

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      orgAdmin: { label: intl.formatMessage(messages.orgAdministrator) },
      username: { label: intl.formatMessage(messages.username), sortable: true },
      email: { label: intl.formatMessage(messages.email) },
      firstName: { label: intl.formatMessage(messages.firstName) },
      lastName: { label: intl.formatMessage(messages.lastName) },
      status: { label: intl.formatMessage(messages.status) },
    }),
    [intl],
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = useMemo(
    () => [
      { id: 'username', label: 'Username', type: 'text', placeholder: 'Filter by username' },
      { id: 'email', label: 'Email', type: 'text', placeholder: 'Filter by email' },
      {
        id: 'status',
        label: 'Status',
        type: 'checkbox',
        placeholder: 'Filter by status',
        options: [
          { id: 'Active', label: 'Active' },
          { id: 'Inactive', label: 'Inactive' },
        ],
      },
    ],
    [],
  );

  // Handle data fetching via onStaleData
  const handleStaleData = useCallback(
    (params: { offset: number; limit: number; orderBy?: string; filters: Record<string, string | string[]> }) => {
      const statusFilter = params.filters.status as string[] | undefined;
      dispatch(
        fetchUsers({
          limit: params.limit,
          offset: params.offset,
          orderBy: params.orderBy,
          filters: {
            username: (params.filters.username as string) || '',
            email: (params.filters.email as string) || '',
            // When status filter is empty, fetch all users (both active and inactive)
            status: statusFilter && statusFilter.length > 0 ? statusFilter : [],
          },
          usesMetaInURL,
        }),
      );
    },
    [dispatch, usesMetaInURL],
  );

  // useTableState for all state management
  const tableState = useTableState<typeof columns, User, 'username'>({
    columns,
    sortableColumns,
    initialPerPage: 50,
    perPageOptions: [10, 20, 50, 100],
    getRowId: (user) => user.uuid || user.username,
    initialSelectedRows: initialSelectedUsers,
    initialFilters: { status: ['Active'] },
    initialSort: { column: 'username', direction: 'asc' },
    onStaleData: handleStaleData,
  });

  // Propagate selection changes to parent
  useEffect(() => {
    onSelect(tableState.selectedRows);
  }, [tableState.selectedRows, onSelect]);

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, User> = useMemo(
    () => ({
      orgAdmin: (user) => (
        <Fragment>
          {user.is_org_admin ? <CheckIcon className="pf-v5-u-mr-sm" /> : <CloseIcon className="pf-v5-u-mr-sm" />}
          <span>{user.is_org_admin ? 'Yes' : 'No'}</span>
        </Fragment>
      ),
      username: (user) => user.username,
      email: (user) => user.email || '—',
      firstName: (user) => user.first_name || '—',
      lastName: (user) => user.last_name || '—',
      status: (user) => intl.formatMessage(user.is_active ? messages.active : messages.inactive),
    }),
    [intl],
  );

  return (
    <Fragment>
      <TableView<typeof columns, User, 'username'>
        columns={columns}
        columnConfig={columnConfig}
        sortableColumns={sortableColumns}
        data={isLoading ? undefined : users}
        totalCount={totalCount}
        getRowId={(user) => user.uuid || user.username}
        cellRenderers={cellRenderers}
        filterConfig={filterConfig}
        selectable
        emptyStateNoData={<UsersListEmptyState hasActiveFilters={false} />}
        emptyStateNoResults={<UsersListEmptyState hasActiveFilters={true} />}
        variant={displayNarrow ? 'compact' : 'default'}
        ariaLabel="Users list table"
        ouiaId="users-list-table"
        {...tableState}
      />
    </Fragment>
  );
};
