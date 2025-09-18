import { ContentHeader, ErrorState, SkeletonTableBody, SkeletonTableHead, WarningModal } from '@patternfly/react-component-groups';
import { Button, ButtonVariant, Divider, EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon, PageSection } from '@patternfly/react-core';
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
import { FormattedMessage } from 'react-intl';
import { ActionsColumn } from '@patternfly/react-table';
import { useFlag } from '@unleash/proxy-client-react';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link, Outlet, useSearchParams } from 'react-router-dom';
import useAppNavigate from '../../../hooks/useAppNavigate';
import messages from '../../../Messages';
import { AppLink } from '../../../components/navigation/AppLink';
import { Workspace } from '../../../redux/workspaces/reducer';
import pathnames from '../../../utilities/pathnames';
import paths from '../../../utilities/pathnames';

interface WorkspaceListTableProps {
  // Data props
  workspaces: Workspace[];
  isLoading: boolean;
  error: string;

  // Action callbacks
  onDeleteWorkspaces: (workspaces: Workspace[]) => Promise<void>;
  onMoveWorkspace: (workspace: Workspace, targetParentId: string) => Promise<void>;

  // User permissions
  userPermissions: {
    permission: string;
    resourceDefinitions: any[];
  };

  // Optional children (e.g., modals)
  children?: React.ReactNode;
}

interface WorkspaceFilters {
  name: string;
}

const isValidType = (workspace: Workspace, validTypes: string[]) => validTypes.includes(workspace.type);
const isValidEditType = (workspace: Workspace) => isValidType(workspace, ['default', 'standard']);
const isValidMoveType = (workspace: Workspace) => isValidType(workspace, ['standard']);
const isValidDeleteType = (workspace: Workspace) => isValidType(workspace, ['standard']);

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
      matches.push(obj);
    } else {
      const childResults: Workspace[] = obj.children ? search(obj.children, filter) : [];
      if (childResults.length) {
        matches.push({ ...obj, children: childResults });
      }
    }
  });
  return matches;
};

export const WorkspaceListTable: React.FC<WorkspaceListTableProps> = ({
  workspaces,
  isLoading,
  error,
  onDeleteWorkspaces,
  onMoveWorkspace,
  userPermissions,
  children,
}) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentWorkspaces, setCurrentWorkspaces] = useState<Workspace[]>([]);

  const hideWorkspaceDetails = useFlag('platform.rbac.workspaces-list');
  const globalWs = useFlag('platform.rbac.workspaces');

  const handleModalToggle = (workspaces: Workspace[]) => {
    setCurrentWorkspaces(workspaces);
    setIsDeleteModalOpen(!isDeleteModalOpen);
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
      id: workspace.id,
      row: Object.values({
        name: !hideWorkspaceDetails ? (
          ['standard', 'ungrouped-hosts'].includes(workspace?.type) ? (
            <Link replace to={`/insights/inventory/workspaces/${workspace.id}`} key={`${workspace.id}-inventory-link`} className="rbac-m-hide-on-sm">
              {workspace.name}
            </Link>
          ) : (
            workspace.name
          )
        ) : (
          <AppLink
            to={pathnames['workspace-detail'].path.replace(':workspaceId', workspace.id)}
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
                    navigate(pathnames['edit-workspace'].path.replace(':workspaceId', workspace.id));
                  },
                  isDisabled: !canModify(workspace, 'edit'),
                },
                {
                  title: 'Create workspace',
                  onClick: () => navigate(pathnames['create-workspace'].path.replace(':workspaceId?', workspace.id)),
                },
                {
                  title: 'Create subworkspace',
                  onClick: () => navigate(pathnames['create-workspace'].path.replace(':workspaceId?', workspace.id)),
                },
                {
                  title: 'Move workspace',
                  onClick: () => {
                    // Use the callback instead of setting modal state directly
                    onMoveWorkspace(workspace, ''); // parentId will be set in modal
                  },
                  isDisabled: !canModify(workspace, 'move'),
                },
                {
                  title: 'Manage integrations',
                  onClick: () => navigate(paths.integrations.path),
                },
                {
                  title: 'Manage notifications',
                  onClick: () => navigate(paths.notifications.path),
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
      ...(workspace.children && workspace.children.length > 0
        ? {
            children: buildRows(workspace.children),
          }
        : {}),
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
    } else if (error) {
      setActiveState(DataViewState.error);
    } else {
      workspaces.length === 0 ? setActiveState(DataViewState.empty) : setActiveState(undefined);
    }
  }, [workspaces, isLoading, error]);

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
              await onDeleteWorkspaces(currentWorkspaces);
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
              <>
                <Button variant="primary" onClick={() => navigate(pathnames['create-workspace'].link)}>
                  {intl.formatMessage(messages.createWorkspace)}
                </Button>
                {globalWs && (
                  <Button variant="secondary" onClick={() => handleModalToggle(workspaces)}>
                    {intl.formatMessage(messages.deleteWorkspacesAction)}
                  </Button>
                )}
              </>
            }
          />
          <DataViewTable
            isTreeTable
            aria-label="Workspaces list table"
            ouiaId="workspaces-list"
            columns={columns}
            rows={error ? [] : rows}
            headStates={{ loading: <SkeletonTableHead columns={columns} /> }}
            bodyStates={{
              loading: <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />,
              empty: <EmptyWorkspacesTable titleText={intl.formatMessage(messages.workspaceEmptyStateTitle)} />,
              error: <ErrorState errorTitle="Failed to load workspaces" errorDescription={error} />,
            }}
          />
        </DataView>
        {children}
        <Suspense>
          <Outlet />
        </Suspense>
      </PageSection>
    </React.Fragment>
  );
};
