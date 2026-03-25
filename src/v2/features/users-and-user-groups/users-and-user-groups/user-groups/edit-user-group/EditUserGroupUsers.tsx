import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core/dist/dynamic/components/ToggleGroup';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import { TableView } from '../../../../../../shared/components/table-view/TableView';
import { useTableState } from '../../../../../../shared/components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../../../shared/components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../../../shared/components/table-view/types';
import { type User, useUsersQuery } from '../../../../../../shared/data/queries/users';
import type { TableState } from './EditUserGroupTableState';
import Messages from '../../../../../../Messages';

interface EditGroupUsersTableProps {
  onChange: (userDiff: TableState) => void;
  groupId: string;
  initialUserIds: string[];
}

const TOGGLE_ALL = 'all';
const TOGGLE_SELECTED = 'selected';

const columns = ['orgAdmin', 'username', 'email', 'firstName', 'lastName', 'status'] as const;

const EditGroupUsersTable: React.FunctionComponent<EditGroupUsersTableProps> = ({ onChange, initialUserIds }) => {
  const intl = useIntl();
  const [selectedToggle, setSelectedToggle] = useState(TOGGLE_ALL);
  const selectedToggleRef = useRef<HTMLDivElement>(null);

  const getUserId = useCallback((user: User) => user.username, []);

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
      username: { label: intl.formatMessage(Messages.username), sortable: true },
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

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'username',
        label: intl.formatMessage(Messages.username),
        placeholder: intl.formatMessage(Messages.filterByKey, { key: intl.formatMessage(Messages.username) }),
      },
    ],
    [intl],
  );

  const tableState = useTableState<typeof columns, User>({
    columns,
    getRowId: getUserId,
    initialPerPage: 20,
    perPageOptions: [5, 10, 20, 50, 100],
    initialSelectedRows,
    initialFilters: { username: '' },
    syncWithUrl: false,
  });

  const usernameFilter = (tableState.filters.username as string) || '';

  // Server-side query — only runs in "All" mode
  const { data, isLoading, error } = useUsersQuery(
    {
      limit: tableState.apiParams.limit,
      offset: tableState.apiParams.offset,
      orderBy: 'username',
      ...(usernameFilter ? { username: usernameFilter } : {}),
    },
    { enabled: selectedToggle === TOGGLE_ALL },
  );

  // In "Selected" mode, show only selected rows with client-side filtering + pagination
  const { displayData, displayCount, displayLoading } = useMemo(() => {
    if (selectedToggle === TOGGLE_SELECTED) {
      let filtered = tableState.selectedRows;
      if (usernameFilter) {
        const term = usernameFilter.toLowerCase();
        filtered = filtered.filter((u) => u.username.toLowerCase().includes(term));
      }
      const total = filtered.length;
      const start = (tableState.page - 1) * tableState.perPage;
      return {
        displayData: filtered.slice(start, start + tableState.perPage),
        displayCount: total,
        displayLoading: false,
      };
    }
    return {
      displayData: (data?.users ?? []) as User[],
      displayCount: data?.totalCount ?? 0,
      displayLoading: isLoading,
    };
  }, [selectedToggle, tableState.selectedRows, tableState.page, tableState.perPage, usernameFilter, data, isLoading]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleSelectRow = useCallback(
    (user: User, selected: boolean) => {
      tableState.onSelectRow(user, selected);
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

  const selectedCount = tableState.selectedRows.length;

  const handleToggleClick = useCallback(
    (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, isSelected: boolean) => {
      const target = _event.currentTarget as HTMLElement;
      const id = target.id;
      if (id === TOGGLE_SELECTED && selectedCount === 0) return;
      if (isSelected || selectedToggle !== id) {
        setSelectedToggle(id);
        tableState.onPageChange(1);
      }
    },
    [selectedToggle, selectedCount, tableState.onPageChange],
  );

  const hasError = !!error && selectedToggle === TOGGLE_ALL;

  return (
    <TableView<typeof columns, User>
      columns={columns}
      columnConfig={columnConfig}
      data={displayLoading ? undefined : displayData}
      totalCount={displayCount}
      getRowId={getUserId}
      cellRenderers={cellRenderers}
      filterConfig={filterConfig}
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
      emptyStateNoResults={
        <DefaultEmptyStateNoResults title={intl.formatMessage(Messages.usersEmptyStateTitle)} onClearFilters={tableState.clearAllFilters} />
      }
      emptyStateError={
        <DefaultEmptyStateNoData title="Failed to load users" body="Please try refreshing the page or contact support if the problem persists." />
      }
      toolbarActions={
        <>
          <ToggleGroup aria-label="Toggle between all users and selected users">
            <ToggleGroupItem
              text={intl.formatMessage(Messages.all)}
              buttonId={TOGGLE_ALL}
              isSelected={selectedToggle === TOGGLE_ALL}
              onChange={handleToggleClick}
            />
            <span ref={selectedToggleRef}>
              <ToggleGroupItem
                text={`${intl.formatMessage(Messages.selected)} (${selectedCount})`}
                buttonId={TOGGLE_SELECTED}
                isSelected={selectedToggle === TOGGLE_SELECTED}
                onChange={handleToggleClick}
                aria-disabled={selectedCount === 0}
              />
            </span>
          </ToggleGroup>
          {selectedCount === 0 && <Tooltip content={intl.formatMessage(Messages.selectAtLeastOneRowToFilter)} triggerRef={selectedToggleRef} />}
        </>
      }
      variant="compact"
      ariaLabel="Edit group users table"
      ouiaId="edit-group-users-table"
      selectable
      {...tableState}
      onSelectRow={handleSelectRow}
      onSelectAll={handleSelectAll}
    />
  );
};

export { EditGroupUsersTable };
