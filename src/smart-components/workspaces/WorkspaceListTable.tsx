import React, { Suspense, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useSearchParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { fetchWorkspaces } from '../../redux/actions/workspaces-actions';
import { BulkSelect, BulkSelectValue, ErrorState, ResponsiveAction, ResponsiveActions, SkeletonTableBody } from '@patternfly/react-component-groups';
import {
  DataView,
  DataViewTable,
  DataViewTextFilter,
  DataViewTh,
  DataViewToolbar,
  DataViewTrTree,
  useDataViewFilters,
  useDataViewSelection,
} from '@patternfly/react-data-view';
import { Workspace } from '../../redux/reducers/workspaces-reducer';
import { RBACStore } from '../../redux/store';
import AppLink from '../../presentational-components/shared/AppLink';
import pathnames from '../../utilities/pathnames';
import messages from '../../Messages';
import useAppNavigate from '../../hooks/useAppNavigate';

interface WorkspaceFilters {
  name: string;
}

const mapWorkspacesToHierarchy = (workspaceData: Workspace[]): Workspace | undefined => {
  const idMap = new Map();
  let root = undefined;

  workspaceData.forEach((ws) => idMap.set(ws.id, { ...ws, children: [] }));
  workspaceData.forEach((ws) => {
    const node = idMap.get(ws.id);
    if (ws.type === 'root') root = node;
    else idMap.get(ws.parent_id)?.children.push(node);
  });

  return root;
};

const buildRows = (workspaces: Workspace[]): DataViewTrTree[] =>
  workspaces.map((workspace) => ({
    row: [
      <AppLink
        to={pathnames['workspace-detail'].link.replace(':workspaceId', workspace.id)}
        key={`${workspace.id}-detail`}
        className="rbac-m-hide-on-sm"
      >
        {workspace.name}
      </AppLink>,
      workspace.description,
    ],
    id: workspace.id,
    ...(workspace.children && workspace.children.length > 0
      ? {
          children: buildRows(workspace.children),
        }
      : {}),
  }));

const search = (workspaceTree: Workspace[], filter: string): Workspace[] => {
  const matches: Workspace[] = [];
  if (!Array.isArray(workspaceTree)) {
    return matches;
  }

  workspaceTree.forEach((obj) => {
    if (obj.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase())) {
      if (obj.type !== 'root') {
        matches.push(Object.assign({}, obj, { children: [] }));
      } else {
        matches.push(obj);
      }
    } else {
      let childResults: Workspace[] = [];
      if (obj.children) {
        childResults = search(obj.children, filter);
      }
      if (childResults.length) {
        matches.push(Object.assign({}, obj, { children: childResults }));
      }
    }
  });
  return matches;
};

const WorkspaceListTable = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });

  const { isLoading, workspaces, error } = useSelector((state: RBACStore) => state.workspacesReducer);
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<WorkspaceFilters>({
    initialFilters: { name: '' },
    searchParams,
    setSearchParams,
  });

  const workspacesTree = useMemo(() => mapWorkspacesToHierarchy(workspaces), [workspaces]);
  const filteredTree = useMemo(() => (workspacesTree ? search([workspacesTree], filters.name) : []), [workspacesTree, filters]);
  const rows = useMemo(() => (filteredTree ? buildRows(filteredTree) : []), [filteredTree]);
  const columns: DataViewTh[] = [intl.formatMessage(messages.name), intl.formatMessage(messages.description)];

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const handleBulkSelect = (value: BulkSelectValue) => {
    selection.onSelect(value === BulkSelectValue.all, value === BulkSelectValue.all ? workspaces : []);
  };

  if (error) {
    return <ErrorState errorDescription={error} />;
  }

  return (
    <React.Fragment>
      <DataView selection={selection} activeState={isLoading ? 'loading' : undefined}>
        <DataViewToolbar
          bulkSelect={
            <BulkSelect
              canSelectAll
              isDataPaginated={false}
              totalCount={workspaces.length}
              selectedCount={selection.selected.length}
              onSelect={handleBulkSelect}
            />
          }
          clearAllFilters={clearAllFilters}
          filters={
            <DataViewTextFilter
              filterId="name"
              title="Name"
              placeholder="Filter by name"
              ouiaId={`workspace-name-filter`}
              onChange={(_e, value) => {
                onSetFilters({ name: value });
              }}
              value={filters['name']}
            />
          }
          actions={
            <ResponsiveActions>
              <ResponsiveAction ouiaId="create-workspace-button" isPinned onClick={() => navigate({ pathname: pathnames['create-workspace'].link })}>
                {intl.formatMessage(messages.createWorkspace)}
              </ResponsiveAction>
            </ResponsiveActions>
          }
        />
        <DataViewTable
          isTreeTable
          aria-label="Workspaces list table"
          ouiaId="workspaces-list"
          columns={columns}
          rows={rows}
          bodyStates={{ loading: <SkeletonTableBody rowsCount={10} columnsCount={2} /> }}
        />
      </DataView>
      <Suspense>
        <Outlet
          context={{
            [pathnames['create-workspace'].path]: {
              afterSubmit: () => {
                dispatch(fetchWorkspaces());
                navigate({ pathname: pathnames.workspaces.link });
              },
              onCancel: () => navigate({ pathname: pathnames.workspaces.link }),
            },
          }}
        />
      </Suspense>
    </React.Fragment>
  );
};

export default WorkspaceListTable;
