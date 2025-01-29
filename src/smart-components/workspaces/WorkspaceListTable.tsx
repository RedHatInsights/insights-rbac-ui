import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { fetchWorkspaces } from '../../redux/actions/workspaces-actions';
import {
  BulkSelect,
  BulkSelectValue,
  ErrorState,
  ResponsiveAction,
  ResponsiveActions,
  SkeletonTable,
  SkeletonTableBody,
  SkeletonTableHead,
} from '@patternfly/react-component-groups';
import {
  DataView,
  DataViewState,
  DataViewTable,
  DataViewTh,
  DataViewToolbar,
  DataViewTrTree,
  useDataViewSelection,
} from '@patternfly/react-data-view';
import { Workspace } from '../../redux/reducers/workspaces-reducer';
import { RBACStore } from '../../redux/store';
import AppLink from '../../presentational-components/shared/AppLink';
import pathnames from '../../utilities/pathnames';
import messages from '../../Messages';
import useAppNavigate from '../../hooks/useAppNavigate';
import { EmptyState, EmptyStateHeader, EmptyStateIcon, EmptyStateBody } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { TableVariant } from '@patternfly/react-table';

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

const EmptyWorkspacesTable: React.FunctionComponent<{ titleText: string }> = ({ titleText }) => {
  return (
    <EmptyState>
      <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
      <EmptyStateBody>
        <FormattedMessage
          {...messages['workspaceEmptyStateSubtitle']}
          values={{
            br: <br />,
          }}
        />
      </EmptyStateBody>
    </EmptyState>
  );
};

const WorkspaceListTable = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });

  const { isLoading, workspaces, error } = useSelector((state: RBACStore) => ({
    workspaces: state.workspacesReducer.workspaces || [],
    error: state.workspacesReducer.error,
    isLoading: state.workspacesReducer.isLoading,
  }));

  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);

  const workspacesTree = useMemo(() => mapWorkspacesToHierarchy(workspaces), [workspaces]);
  const rows = useMemo(() => (workspacesTree ? buildRows([workspacesTree]) : []), [workspacesTree]);
  const columns: DataViewTh[] = [intl.formatMessage(messages.name), intl.formatMessage(messages.description)];

  useEffect(() => {
    if (isLoading) {
      setActiveState(DataViewState.loading);
    } else {
      workspaces.length === 0 ? setActiveState(DataViewState.empty) : setActiveState(undefined);
    }
  }, [workspaces, isLoading]);

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
      <DataView selection={selection} activeState={activeState}>
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
              <ResponsiveAction ouiaId="create-workspace-button" isPinned onClick={() => navigate({ pathname: pathnames['create-workspace'].link })}>
                {intl.formatMessage(messages.createWorkspace)}
              </ResponsiveAction>
            </ResponsiveActions>
          }
        />
        {isLoading ? (
          <SkeletonTable rowsCount={10} columns={columns} variant={TableVariant.compact} />
        ) : (
          <DataViewTable
            isTreeTable
            aria-label="Workspaces list table"
            ouiaId="workspaces-list"
            columns={columns}
            rows={rows}
            headStates={{ loading: <SkeletonTableHead columns={columns} /> }}
            bodyStates={{
              loading: <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />,
              empty: <EmptyWorkspacesTable titleText={intl.formatMessage(messages.workspaceEmptyStateTitle)} />,
            }}
          />
        )}
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
