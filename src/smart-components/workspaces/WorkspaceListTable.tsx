import React, { Suspense, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { fetchWorkspaces } from '../../redux/actions/workspaces-actions';
import { BulkSelect, BulkSelectValue, ResponsiveAction, ResponsiveActions } from '@patternfly/react-component-groups';
import { DataView, DataViewTable, DataViewTh, DataViewToolbar, DataViewTrTree, useDataViewSelection } from '@patternfly/react-data-view';
import { Workspace } from '../../redux/reducers/workspaces-reducer';
import { RBACStore } from '../../redux/store';
import AppLink from '../../presentational-components/shared/AppLink';
import pathnames from '../../utilities/pathnames';
import messages from '../../Messages';
import useAppNavigate from '../../hooks/useAppNavigate';

const WorkspaceListTable = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });

  const { isLoading, workspaces, error } = useSelector((state: RBACStore) => state.workspacesReducer);

  const [hierarchicalWorkspaces, setHierarchicalWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const mapWorkspacesToHierarchy = (workspaceData: Workspace[]): Workspace[] => {
    const workspaceMap: { [key: string]: Workspace } = {};

    workspaceData.forEach((ws) => {
      workspaceMap[ws.id] = {
        id: ws.id,
        name: ws.name,
        description: ws.description,
        children: [],
      };
    });

    const hierarchy: Workspace[] = [];
    workspaceData.forEach((ws) => {
      if (ws.parent_id) {
        workspaceMap[ws.parent_id]?.children?.push(workspaceMap[ws.id]);
      } else {
        hierarchy.push(workspaceMap[ws.id]);
      }
    });

    return hierarchy;
  };

  useEffect(() => {
    if (workspaces.length > 0) {
      setHierarchicalWorkspaces(mapWorkspacesToHierarchy(workspaces));
    }
  }, [workspaces]);

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

  const rows: DataViewTrTree[] = buildRows(hierarchicalWorkspaces);

  const columns: DataViewTh[] = [intl.formatMessage(messages.name), intl.formatMessage(messages.description)];

  const handleBulkSelect = (value: BulkSelectValue) => {
    value === BulkSelectValue.none && selection.onSelect(false);
    value === BulkSelectValue.all && selection.onSelect(true, workspaces);
  };

  return (
    <React.Fragment>
      {isLoading && <p>Loading state...</p>}
      {error && <p>Error state: {error}</p>}
      {!isLoading && !error && (
        <DataView selection={selection}>
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
            actions={
              <ResponsiveActions>
                <ResponsiveAction
                  ouiaId="create-workspace-button"
                  isPinned
                  onClick={() => navigate({ pathname: pathnames['create-workspace'].link })}
                >
                  {intl.formatMessage(messages.createWorkspace)}
                </ResponsiveAction>
              </ResponsiveActions>
            }
          />
          <DataViewTable isTreeTable aria-label="Workspaces list table" ouiaId={'ouiaId'} columns={columns} rows={rows} />
        </DataView>
      )}
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
