import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { TableView, useTableState } from '../../../../shared/components/table-view';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../shared/components/table-view/types';
import { type Group, useGroupsQuery } from '../../../../shared/data/queries/groups';
import useUserData from '../../../../shared/hooks/useUserData';
import messages from '../../../../Messages';
import { MyGroupDrawer } from './MyGroupDrawer';

const columns = ['name', 'description'] as const;
type SortableColumnId = 'name';

const MyGroups: React.FunctionComponent = () => {
  const intl = useIntl();
  const { identity } = useUserData();
  const username = identity?.user?.username;

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const drawerRef = useRef<HTMLDivElement>(null);

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.groupName), sortable: true },
      description: { label: intl.formatMessage(messages.description) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, Group> = useMemo(
    () => ({
      name: (group) => group.name,
      description: (group) => group.description || '—',
    }),
    [],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text' as const,
        id: 'name',
        label: intl.formatMessage(messages.groupName),
        placeholder: `Filter by ${intl.formatMessage(messages.groupName).toLowerCase()}`,
      },
    ],
    [intl],
  );

  const tableState = useTableState<typeof columns, Group, SortableColumnId>({
    columns,
    sortableColumns: ['name'] as const,
    initialSort: { column: 'name', direction: 'asc' },
    initialFilters: { name: '' },
    getRowId: (group) => group.uuid,
    syncWithUrl: false,
  });

  const { data, isLoading } = useGroupsQuery(
    {
      limit: tableState.apiParams.limit,
      offset: tableState.apiParams.offset,
      orderBy: tableState.apiParams.orderBy,
      name: (tableState.apiParams.filters?.name as string) || undefined,
      username,
    },
    { enabled: !!username },
  );

  const groups = (data?.data ?? []) as Group[];
  const totalCount = data?.meta?.count ?? 0;

  const selectedGroup = useMemo(() => groups.find((g) => g.uuid === selectedGroupId), [groups, selectedGroupId]);

  const handleRowClick = useCallback((group: Group) => {
    setSelectedGroupId((prev) => (prev === group.uuid ? undefined : group.uuid));
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedGroupId(undefined);
  }, []);

  return (
    <MyGroupDrawer
      isOpen={!!selectedGroupId}
      groupId={selectedGroupId}
      groupName={selectedGroup?.name}
      groupDescription={selectedGroup?.description}
      onClose={handleCloseDrawer}
      drawerRef={drawerRef}
    >
      <TableView<typeof columns, Group, SortableColumnId>
        {...tableState}
        columns={columns}
        columnConfig={columnConfig}
        sortableColumns={['name'] as const}
        data={isLoading ? undefined : groups}
        totalCount={totalCount}
        getRowId={(group) => group.uuid}
        cellRenderers={cellRenderers}
        filterConfig={filterConfig}
        ariaLabel="My groups"
        ouiaId="my-groups-table"
        onRowClick={handleRowClick}
        isRowClickable={() => true}
        selectedRows={selectedGroup ? [selectedGroup] : []}
      />
    </MyGroupDrawer>
  );
};

export { MyGroups };
export default MyGroups;
