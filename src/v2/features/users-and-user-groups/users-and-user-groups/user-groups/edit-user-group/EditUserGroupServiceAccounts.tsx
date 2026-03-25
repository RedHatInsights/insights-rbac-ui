import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core/dist/dynamic/components/ToggleGroup';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import Messages from '../../../../../../Messages';
import { TableView } from '../../../../../../shared/components/table-view/TableView';
import { useTableState } from '../../../../../../shared/components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../../../shared/components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../../../shared/components/table-view/types';
import { type ServiceAccount, useServiceAccountsQuery } from '../../../../../../shared/data/queries/serviceAccounts';
import type { TableState } from './EditUserGroupTableState';

interface EditGroupServiceAccountsTableProps {
  onChange: (serviceAccountDiff: TableState) => void;
  groupId: string;
  initialServiceAccountIds: string[];
}

const TOGGLE_ALL = 'all';
const TOGGLE_SELECTED = 'selected';

const columns = ['name', 'clientId', 'owner', 'timeCreated', 'description'] as const;

const EditGroupServiceAccountsTable: React.FunctionComponent<EditGroupServiceAccountsTableProps> = ({
  onChange,
  groupId: _groupId,
  initialServiceAccountIds,
}) => {
  const intl = useIntl();
  const [selectedToggle, setSelectedToggle] = useState(TOGGLE_ALL);
  const selectedToggleRef = useRef<HTMLDivElement>(null);

  const getServiceAccountId = useCallback((sa: ServiceAccount) => sa.clientId || sa.id, []);

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
      name: { label: intl.formatMessage(Messages.name), sortable: true },
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

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text',
        id: 'name',
        label: intl.formatMessage(Messages.name),
        placeholder: intl.formatMessage(Messages.filterByKey, { key: intl.formatMessage(Messages.name) }),
      },
    ],
    [intl],
  );

  const tableState = useTableState<typeof columns, ServiceAccount>({
    columns,
    getRowId: getServiceAccountId,
    initialPerPage: 20,
    perPageOptions: [5, 10, 20, 50, 100],
    initialSelectedRows,
    initialFilters: { name: '' },
    syncWithUrl: false,
  });

  const nameFilter = (tableState.filters.name as string) || '';

  // SSO API doesn't support server-side name filtering, so we fetch a large page and filter client-side
  const {
    data: serviceAccountsData,
    isLoading: isServiceAccountsLoading,
    error: serviceAccountsError,
  } = useServiceAccountsQuery({ page: 1, perPage: 100 }, { enabled: selectedToggle === TOGGLE_ALL });

  const allServiceAccounts: ServiceAccount[] = serviceAccountsData || [];

  // Client-side filtering + pagination pipeline
  const { displayData, displayCount, displayLoading } = useMemo(() => {
    const source = selectedToggle === TOGGLE_SELECTED ? tableState.selectedRows : allServiceAccounts;

    let filtered = source;
    if (nameFilter) {
      const term = nameFilter.toLowerCase();
      filtered = filtered.filter((sa) => (sa.name || '').toLowerCase().includes(term) || (sa.clientId || '').toLowerCase().includes(term));
    }

    const total = filtered.length;
    const start = (tableState.page - 1) * tableState.perPage;
    return {
      displayData: filtered.slice(start, start + tableState.perPage),
      displayCount: total,
      displayLoading: selectedToggle === TOGGLE_ALL && isServiceAccountsLoading,
    };
  }, [selectedToggle, tableState.selectedRows, tableState.page, tableState.perPage, nameFilter, allServiceAccounts, isServiceAccountsLoading]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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

  const hasError = !!serviceAccountsError && selectedToggle === TOGGLE_ALL;

  return (
    <TableView<typeof columns, ServiceAccount>
      columns={columns}
      columnConfig={columnConfig}
      data={displayLoading ? undefined : displayData}
      totalCount={displayCount}
      getRowId={getServiceAccountId}
      cellRenderers={cellRenderers}
      filterConfig={filterConfig}
      error={hasError ? new Error('Failed to load service accounts') : null}
      emptyStateNoData={
        <DefaultEmptyStateNoData title="No service accounts found" body="There are no service accounts available to add to this group." />
      }
      emptyStateNoResults={<DefaultEmptyStateNoResults title="No service accounts found" onClearFilters={tableState.clearAllFilters} />}
      emptyStateError={
        <DefaultEmptyStateNoData
          title="Failed to load service accounts"
          body="Please try refreshing the page or contact support if the problem persists."
        />
      }
      toolbarActions={
        <>
          <ToggleGroup aria-label="Toggle between all service accounts and selected service accounts">
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
