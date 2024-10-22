import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkspaces } from '../../redux/actions/workspaces-actions';
import { DataView, DataViewTable, DataViewTh, DataViewTrTree, useDataViewSelection } from '@patternfly/react-data-view';
import { Workspace } from '../../redux/reducers/workspaces-reducer';
import { RBACStore } from '../../redux/store';
import AppLink from '../../presentational-components/shared/AppLink';
import pathnames from '../../utilities/pathnames';

const WorkspaceListTable = () => {
  const dispatch = useDispatch();
  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });

  const { isLoading, workspaces, error } = useSelector((state: RBACStore) => state.workspacesReducer);

  const [hierarchicalWorkspaces, setHierarchicalWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const mapWorkspacesToHierarchy = (workspaceData: any[]): Workspace[] => {
    const workspaceMap: { [key: string]: Workspace } = {};

    workspaceData.forEach((ws) => {
      workspaceMap[ws.uuid] = {
        id: ws.uuid,
        name: ws.name,
        description: ws.description,
        children: [],
      };
    });

    const hierarchy: Workspace[] = [];
    workspaceData.forEach((ws) => {
      if (ws.parent_id) {
        workspaceMap[ws.parent_id]?.children?.push(workspaceMap[ws.uuid]);
      } else {
        hierarchy.push(workspaceMap[ws.uuid]);
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

  const columns: DataViewTh[] = ['Name', 'Description'];

  return (
    <React.Fragment>
      {isLoading && <p>Loading state...</p>}
      {error && <p>Error state: {error}</p>}
      {!isLoading && !error && (
        <DataView selection={selection}>
          <DataViewTable isTreeTable aria-label="Repositories table" ouiaId={'ouiaId'} columns={columns} rows={rows} />
        </DataView>
      )}
    </React.Fragment>
  );
};

export default WorkspaceListTable;
