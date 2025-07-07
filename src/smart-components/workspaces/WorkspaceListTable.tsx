import {
  ErrorState,
  ResponsiveAction,
  ResponsiveActions,
  SkeletonTableBody,
  SkeletonTableHead,
  WarningModal,
} from '@patternfly/react-component-groups';
import {
  Button,
  ButtonVariant,
  Divider,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  Modal,
  ModalVariant,
} from '@patternfly/react-core';
import {
  DataView,
  DataViewState,
  DataViewTable,
  DataViewTextFilter,
  DataViewTh,
  DataViewToolbar,
  DataViewTrTree,
  useDataViewFilters,
} from '@patternfly/react-data-view';
import { SearchIcon } from '@patternfly/react-icons';
import { ActionsColumn } from '@patternfly/react-table';
import { useFlag } from '@unleash/proxy-client-react';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Outlet, useSearchParams } from 'react-router-dom';
import useAppNavigate from '../../hooks/useAppNavigate';
import messages from '../../Messages';
import AppLink from '../../presentational-components/shared/AppLink';
import { deleteWorkspace, fetchWorkspaces, moveWorkspace } from '../../redux/actions/workspaces-actions';
import { Workspace } from '../../redux/reducers/workspaces-reducer';
import { RBACStore } from '../../redux/store';
import pathnames from '../../utilities/pathnames';
import paths from '../../utilities/pathnames';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import ManagedSelector from './managed-selector/ManagedSelector';
import { TreeViewWorkspaceItem } from './managed-selector/TreeViewWorkspaceItem';

interface WorkspaceFilters {
  name: string;
}

interface PermissionResource {
  key: string;
  value: string[];
  operation: string;
}

interface PermissionFilter {
  attributeFilter: PermissionResource;
}

interface Permission {
  permission: string;
  resourceDefinitions: PermissionFilter[];
}

const isValidEditType = (workspace: Workspace) => {
  switch (workspace.type) {
    case 'root':
      return false;
    case 'default':
      return true;
    case 'ungrouped-hosts':
      return false;
    case 'standard':
      return true;
  }
};

const isValidMoveType = (workspace: Workspace) => {
  switch (workspace.type) {
    case 'root':
      return false;
    case 'default':
      return false;
    case 'ungrouped-hosts':
      return false;
    case 'standard':
      return true;
  }
};

const isValidDeleteType = (workspace: Workspace) => {
  switch (workspace.type) {
    case 'root':
      return false;
    case 'default':
      return false;
    case 'ungrouped-hosts':
      return false;
    case 'standard':
      return true;
  }
};

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
  const chrome = useChrome();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [currentWorkspaces, setCurrentWorkspaces] = useState<Workspace[]>([]);
  const [currentMoveWorkspace, setCurrentMoveWorkspace] = useState<Workspace | null>(null);
  const [selectedDestinationWorkspace, setSelectedDestinationWorkspace] = useState<any>(null);
  const [initialSelectedWorkspace, setInitialSelectedWorkspace] = useState<TreeViewWorkspaceItem | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission>({
    permission: '',
    resourceDefinitions: [],
  });

  const hideWorkspaceDetails = useFlag('platform.rbac.workspaces-list');
  const globalWs = useFlag('platform.rbac.workspaces');

  // Helper function to convert a workspace to TreeViewWorkspaceItem format
  const convertWorkspaceToTreeViewItem = (workspace: Workspace): TreeViewWorkspaceItem => {
    return {
      name: workspace.name,
      id: workspace.id,
      workspace: workspace as any, // Type casting to resolve workspace type mismatch
      children: [],
    };
  };

  const handleModalToggle = (workspaces: Workspace[]) => {
    setCurrentWorkspaces(workspaces);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const handleMoveModalToggle = (workspace: Workspace | null) => {
    setCurrentMoveWorkspace(workspace);
    setIsMoveModalOpen(!isMoveModalOpen);
    if (!workspace) {
      setSelectedDestinationWorkspace(null);
      setInitialSelectedWorkspace(null);
    } else {
      // Find and set the parent workspace as the initial selection
      const parentWorkspace = workspaces.find((ws) => ws.id === workspace.parent_id);
      if (parentWorkspace) {
        const parentTreeViewItem = convertWorkspaceToTreeViewItem(parentWorkspace);
        setSelectedDestinationWorkspace(parentTreeViewItem);
        setInitialSelectedWorkspace(parentTreeViewItem);
      }
    }
  };

  const canModify = (workspace: Workspace, action: 'edit' | 'move' | 'delete') => {
    if (
      ['inventory:groups:write', 'inventory:groups:*'].includes(userPermissions.permission) &&
      (userPermissions.resourceDefinitions.length === 0 ||
        userPermissions.resourceDefinitions.some((item) => item.attributeFilter.value.includes(workspace.id)))
    ) {
      if (action === 'edit' && isValidEditType(workspace)) {
        return true;
      } else if (action === 'move' && isValidMoveType(workspace)) {
        return true;
      } else if (action === 'delete' && isValidDeleteType(workspace)) {
        return true;
      }
    }
    return false;
  };

  const buildRows = (workspaces: Workspace[]): DataViewTrTree[] =>
    workspaces.map((workspace) => ({
      row: Object.values({
        name:
          hideWorkspaceDetails && !globalWs ? (
            ['standard', 'ungrouped-hosts'].includes(workspace?.type) ? (
              <Link
                replace
                to={`/insights/inventory/workspaces/${workspace.id}`}
                key={`${workspace.id}-inventory-link`}
                className="rbac-m-hide-on-sm"
              >
                {workspace.name}
              </Link>
            ) : (
              workspace.name
            )
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
                  isDisabled: !canModify(workspace, 'edit'),
                },
                {
                  title: 'Move workspace',
                  onClick: () => {
                    handleMoveModalToggle(workspace);
                  },
                  isDisabled: !canModify(workspace, 'move'),
                },
                {
                  title: <Divider component="li" key="divider" />,
                  isSeparator: true,
                },
                {
                  title: 'Delete workspace',
                  onClick: () => {
                    handleModalToggle([workspace]);
                  },
                  isDisabled: (workspace.children && workspace.children.length > 0) || !canModify(workspace, 'delete'),
                  isDanger: !(workspace.children && workspace.children.length > 0) && canModify(workspace, 'delete'),
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

  useEffect(() => {
    chrome.getUserPermissions().then((permissions) => {
      setUserPermissions(permissions.find(({ permission }) => ['inventory:groups:write', 'inventory:groups:*'].includes(permission)));
    });
  }, [chrome.getUserPermissions]);

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
            await Promise.all(currentWorkspaces.map(async ({ id, name }) => await dispatch(deleteWorkspace({ id }, { name }))));
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
      {isMoveModalOpen && currentMoveWorkspace && (
        <Modal
          ouiaId={'move-workspace-modal'}
          isOpen={isMoveModalOpen}
          variant={ModalVariant.medium}
          title={`Move "${currentMoveWorkspace.name}"`}
          onClose={() => handleMoveModalToggle(null)}
          actions={[
            <Button
              key="submit"
              variant="primary"
              onClick={async () => {
                if (currentMoveWorkspace && selectedDestinationWorkspace) {
                  await dispatch(
                    moveWorkspace(
                      {
                        id: currentMoveWorkspace.id,
                        workspacesMoveWorkspaceRequest: {
                          parent_id: selectedDestinationWorkspace.id,
                        },
                      },
                      { name: currentMoveWorkspace.name },
                    ),
                  );
                  dispatch(fetchWorkspaces());
                  setIsMoveModalOpen(false);
                  handleMoveModalToggle(null);
                }
              }}
              isDisabled={!selectedDestinationWorkspace}
            >
              Submit
            </Button>,
            <Button key="cancel" variant="link" onClick={() => handleMoveModalToggle(null)}>
              {intl.formatMessage(messages.cancel)}
            </Button>,
          ]}
        >
          <div>
            <p>
              Moving a workspace may change who is able to access it and their permissions. Make sure you review the differences between each
              workspaces&apos; user groups and roles before clicking Submit.
            </p>

            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Parent workspace</h4>
              <ManagedSelector onSelect={setSelectedDestinationWorkspace} initialSelectedWorkspace={initialSelectedWorkspace || undefined} />
            </div>

            {selectedDestinationWorkspace && initialSelectedWorkspace && selectedDestinationWorkspace.id !== initialSelectedWorkspace.id && (
              <p>
                This will move {currentMoveWorkspace.name} from under{' '}
                <strong>{workspaces.find((ws) => ws.id === currentMoveWorkspace.parent_id)?.name}</strong> to under{' '}
                <strong>{selectedDestinationWorkspace.name}</strong>.
              </p>
            )}
          </div>
        </Modal>
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
