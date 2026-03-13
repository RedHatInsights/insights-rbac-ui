import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { TableView, useTableState } from '../../../../shared/components/table-view';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../shared/components/table-view/types';
import { useWorkspacesWithPermissions } from '../../workspaces/hooks/useWorkspacesWithPermissions';
import type { WorkspaceWithPermissions } from '../../../data/queries/workspaces';
import { AppLink } from '../../../../shared/components/navigation/AppLink';
import pathnames from '../../../utilities/pathnames';
import messages from '../../../../Messages';
import { MyWorkspaceDrawer } from './MyWorkspaceDrawer';

const columns = ['name', 'role'] as const;
type SortableColumnId = 'name';

const MyWorkspaces: React.FunctionComponent = () => {
  const intl = useIntl();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>();
  const drawerRef = useRef<HTMLDivElement>(null);

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.workspace), sortable: true },
      role: { label: intl.formatMessage(messages.role) },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, WorkspaceWithPermissions> = useMemo(
    () => ({
      name: (ws) => (
        <AppLink to={pathnames['workspace-detail'].link(ws.id)} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          {ws.name}
        </AppLink>
      ),
      role: (ws) => {
        const isAdmin = ws.permissions.delete || ws.permissions.create;
        return <Label color={isAdmin ? 'purple' : 'blue'}>{intl.formatMessage(isAdmin ? messages.adminRole : messages.viewerRole)}</Label>;
      },
    }),
    [intl],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'text' as const,
        id: 'name',
        label: intl.formatMessage(messages.workspace),
        placeholder: `Filter by ${intl.formatMessage(messages.workspace).toLowerCase()}`,
      },
    ],
    [intl],
  );

  const tableState = useTableState<typeof columns, WorkspaceWithPermissions, SortableColumnId>({
    columns,
    sortableColumns: ['name'] as const,
    initialSort: { column: 'name', direction: 'asc' },
    initialFilters: { name: '' },
    getRowId: (ws) => ws.id,
    syncWithUrl: false,
  });

  // Fetch workspaces with API-level sorting via orderBy parameter
  const { workspaces: allWorkspaces, status } = useWorkspacesWithPermissions({
    orderBy: tableState.apiParams.orderBy,
  });

  const nameFilter = (tableState.filters.name as string) || '';

  // Client-side pipeline: filter → paginate (sorting is server-side via apiParams.orderBy)
  const { pageData, totalCount, editableWorkspaces } = useMemo(() => {
    let filtered = allWorkspaces.filter((ws) => ws.permissions.edit);

    if (nameFilter) {
      const term = nameFilter.toLowerCase();
      filtered = filtered.filter((ws) => ws.name.toLowerCase().includes(term));
    }

    const total = filtered.length;
    const start = (tableState.page - 1) * tableState.perPage;
    return {
      pageData: filtered.slice(start, start + tableState.perPage),
      totalCount: total,
      editableWorkspaces: filtered,
    };
  }, [allWorkspaces, nameFilter, tableState.page, tableState.perPage]);

  const selectedWorkspace = useMemo(() => editableWorkspaces.find((ws) => ws.id === selectedWorkspaceId), [editableWorkspaces, selectedWorkspaceId]);

  const handleRowClick = useCallback((ws: WorkspaceWithPermissions) => {
    setSelectedWorkspaceId((prev) => (prev === ws.id ? undefined : ws.id));
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedWorkspaceId(undefined);
  }, []);

  return (
    <MyWorkspaceDrawer
      isOpen={!!selectedWorkspaceId}
      workspaceId={selectedWorkspaceId}
      workspaceName={selectedWorkspace?.name}
      workspaceDescription={selectedWorkspace?.description}
      isAdmin={selectedWorkspace ? selectedWorkspace.permissions.delete || selectedWorkspace.permissions.create : false}
      onClose={handleCloseDrawer}
      drawerRef={drawerRef}
    >
      <TableView<typeof columns, WorkspaceWithPermissions, SortableColumnId>
        {...tableState}
        columns={columns}
        columnConfig={columnConfig}
        sortableColumns={['name'] as const}
        data={status === 'loading' || status === 'settling' ? undefined : pageData}
        totalCount={totalCount}
        getRowId={(ws) => ws.id}
        cellRenderers={cellRenderers}
        filterConfig={filterConfig}
        ariaLabel="My workspaces"
        ouiaId="my-workspaces-table"
        onRowClick={handleRowClick}
        isRowClickable={() => true}
        selectedRows={selectedWorkspace ? [selectedWorkspace] : []}
      />
    </MyWorkspaceDrawer>
  );
};

export { MyWorkspaces };
export default MyWorkspaces;
