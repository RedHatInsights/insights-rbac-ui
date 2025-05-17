import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Outlet, useSearchParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { deleteWorkspace, fetchWorkspaces } from '../../redux/actions/workspaces-actions';
import {
  ErrorState,
  ResponsiveAction,
  ResponsiveActions,
  SkeletonTableBody,
  SkeletonTableHead,
  WarningModal,
} from '@patternfly/react-component-groups';
import {
  DataView,
  DataViewState,
  DataViewTextFilter,
  useDataViewFilters,
  DataViewTable,
  DataViewTh,
  DataViewToolbar,
  DataViewTrTree,
} from '@patternfly/react-data-view';
import { Workspace } from '../../redux/reducers/workspaces-reducer';
import { RBACStore } from '../../redux/store';
import AppLink from '../../presentational-components/shared/AppLink';
import pathnames from '../../utilities/pathnames';
import paths from '../../utilities/pathnames';
import messages from '../../Messages';
import useAppNavigate from '../../hooks/useAppNavigate';
import { EmptyState, EmptyStateHeader, EmptyStateIcon, EmptyStateBody, ButtonVariant, Divider } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { ActionsColumn } from '@patternfly/react-table';
import { useFlag } from '@unleash/proxy-client-react';

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentWorkspaces, setCurrentWorkspaces] = useState<Workspace[]>([]);

  const hideWorkspaceDetails = useFlag('platform.rbac.workspaces-list');
  const globalWs = useFlag('platform.rbac.workspaces');

  const handleModalToggle = (workspaces: Workspace[]) => {
    setCurrentWorkspaces(workspaces);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const buildRows = (workspaces: Workspace[]): DataViewTrTree[] =>
    workspaces.map((workspace) => ({
      row: Object.values({
        name: hideWorkspaceDetails && !globalWs ? (
          <Link replace to={`/insights/inventory/workspaces/${workspace.id}`} key={`${workspace.id}-inventory-link`} className="rbac-m-hide-on-sm">
            {workspace.name}
          </Link>
        ) : (
          <AppLink
            to={pathnames['workspace-detail'].link.replace(':workspaceId', workspace.id)}
            key={`${workspace.id}-detail`}
            className="rbac-m-hide-on-sm"
          >
            {workspace.name}
          </AppLink>
        ),
        description: workspace.description,
        rowActions: {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: 'Edit workspace',
                  onClick: () => {
                    navigate(paths['edit-workspaces-list'].link.replace(':workspaceId', workspace.id));
                  },
                },
                { title: <Divider component="li" key="divider" /> },
                {
                  title: 'Delete workspace',
                  onClick: () => {
                    handleModalToggle([workspace]);
                  },
                  isDisabled: workspace.children && workspace.children.length > 0,
                  isDanger: !(workspace.children && workspace.children.length > 0),
                },
              ]}
            />
          ),
          props: { isActionCell: true },
        },
      }),
      id: workspace.id,
      ...(workspace.children && workspace.children.length > 0
        ? {
            children: buildRows(workspace.children),
          }
        : {}),
    }));

  const { isLoading, workspaces, error } = useSelector((state: RBACStore) => ({
    workspaces: state.workspacesReducer.workspaces || [],
    error: state.workspacesReducer.error,
    isLoading: state.workspacesReducer.isLoading,
  }));

  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);
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
    if (isLoading) {
      setActiveState(DataViewState.loading);
    } else {
      workspaces.length === 0 ? setActiveState(DataViewState.empty) : setActiveState(undefined);
    }
  }, [workspaces, isLoading]);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  if (error) {
    return <ErrorState errorDescription={error} />;
  }

  return (
    <React.Fragment>
      {isDeleteModalOpen && (
        <WarningModal
          ouiaId={'remove-workspaces-modal'}
          isOpen={isDeleteModalOpen}
          title={intl.formatMessage(messages.deleteWorkspaceModalHeader)}
          confirmButtonLabel={intl.formatMessage(messages.delete)}
          confirmButtonVariant={ButtonVariant.danger}
          withCheckbox={true}
          checkboxLabel={intl.formatMessage(messages.understandActionIrreversible)}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={async () => {
            await Promise.all(currentWorkspaces.map(async ({ id, name }) => await dispatch(deleteWorkspace({ uuid: id }, { name }))));
            dispatch(fetchWorkspaces());
            setIsDeleteModalOpen(false);
          }}
          cancelButtonLabel={intl.formatMessage(messages.cancel)}
        >
          <FormattedMessage
            {...messages.deleteWorkspaceModalBody}
            values={{
              b: (text) => <b>{text}</b>,
              count: currentWorkspaces.length,
              plural: currentWorkspaces.length > 1 ? intl.formatMessage(messages.workspaces) : intl.formatMessage(messages.workspace),
              name: currentWorkspaces[0]?.name,
            }}
          />
        </WarningModal>
      )}
      <DataView activeState={activeState}>
        <DataViewToolbar
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
          headStates={{ loading: <SkeletonTableHead columns={columns} /> }}
          bodyStates={{
            loading: <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />,
            empty: <EmptyWorkspacesTable titleText={intl.formatMessage(messages.workspaceEmptyStateTitle)} />,
          }}
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
            [pathnames['edit-workspaces-list'].path]: {
              afterSubmit: () => {
                dispatch(fetchWorkspaces());
                navigate({ pathname: pathnames.workspaces.link });
              },
              onCancel: () => {
                navigate({ pathname: pathnames.workspaces.link });
              },
            },
          }}
        />
      </Suspense>
    </React.Fragment>
  );
};

export default WorkspaceListTable;
