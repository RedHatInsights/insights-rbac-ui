import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkspaces } from '../../redux/actions/workspaces-actions';
import messages from '../../Messages';
import { BulkSelect, BulkSelectValue, ContentHeader } from '@patternfly/react-component-groups';
import { PageSection } from '@patternfly/react-core';
import { DataView, DataViewTable, DataViewTh, DataViewToolbar, DataViewTrTree, useDataViewSelection } from '@patternfly/react-data-view';
import { Workspace } from '../../redux/reducers/workspaces-reducer';
import { RBACStore } from '../../redux/store';

const Workspaces = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
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
      row: [workspace.name, workspace.description],
      id: workspace.id,
      ...(workspace.children && workspace.children.length > 0
        ? {
            children: buildRows(workspace.children),
          }
        : {}),
    }));

  const rows: DataViewTrTree[] = buildRows(hierarchicalWorkspaces);

  const columns: DataViewTh[] = ['Name', 'Description'];

  const handleBulkSelect = (value: BulkSelectValue) => {
    value === BulkSelectValue.none && selection.onSelect(false);
    value === BulkSelectValue.all && selection.onSelect(true, workspaces);
  };

  return (
    <React.Fragment>
      <ContentHeader
        title={intl.formatMessage(messages.workspaces)}
        subtitle={intl.formatMessage(messages.workspacesSubtitle)}
        linkProps={{
          label: intl.formatMessage(messages.workspacesLearnMore),
          isExternal: true,
          href: '#', //TODO: URL to be specified by UX team later
        }}
      />
      <PageSection>
        {isLoading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
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
            />
            <DataViewTable isTreeTable aria-label="Repositories table" ouiaId={'ouiaId'} columns={columns} rows={rows} />
          </DataView>
        )}
      </PageSection>
    </React.Fragment>
  );
};

export default Workspaces;
