import { ErrorState, PageHeader, SkeletonTableBody, SkeletonTableHead, WarningModal } from '@patternfly/react-component-groups';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ButtonVariant } from '@patternfly/react-core';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
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
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import { FormattedMessage } from 'react-intl';
import { ActionsColumn } from '@patternfly/react-table';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Link, Outlet, useSearchParams } from 'react-router-dom';
import useAppNavigate from '../../../hooks/useAppNavigate';
import { useWorkspacesFlag } from '../../../hooks/useWorkspacesFlag';
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
    <tbody>
      <tr>
        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
          <EmptyState headingLevel="h4" icon={SearchIcon} titleText={titleText}>
            <EmptyStateBody>
              <FormattedMessage
                {...messages['workspaceEmptyStateSubtitle']}
                values={{
                  br: <br />,
                }}
              />
            </EmptyStateBody>
          </EmptyState>
        </td>
      </tr>
    </tbody>
  );
};

const ErrorStateTable: React.FunctionComponent<{ errorTitle: string; errorDescription?: string }> = ({ errorTitle, errorDescription }) => {
  return (
    <tbody>
      <tr>
        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
          <ErrorState titleText={errorTitle} bodyText={errorDescription} />
        </td>
      </tr>
    </tbody>
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

  // Feature flags via custom hook (see WORKSPACE_FEATURE_FLAGS.md for complete documentation)
  // M3: RBAC detail pages with read-only role bindings
  // M5: Master flag that enables all features (including bulk delete)
  const hasRbacDetailPages = useWorkspacesFlag('m3'); // M3+ or master flag
  const hasAllFeatures = useWorkspacesFlag('m5'); // Master flag only

  const handleModalToggle = (workspaces: Workspace[]) => {
    setCurrentWorkspaces(workspaces);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  // Check if user has write permissions at all
  const hasWritePermissions = () => {
    return ['inventory:groups:write', 'inventory:groups:*'].includes(userPermissions.permission);
  };

  const canModify = (workspace: Workspace, action: 'edit' | 'move' | 'delete' | 'create') => {
    if (
      hasWritePermissions() &&
      (userPermissions.resourceDefinitions.length === 0 ||
        userPermissions.resourceDefinitions.some((item) => item.attributeFilter.value.includes(workspace.id)))
    ) {
      if (action === 'edit' && isValidEditType(workspace)) {
        return true;
      } else if (action === 'move' && isValidMoveType(workspace)) {
        return true;
      } else if (action === 'delete' && isValidDeleteType(workspace)) {
        return true;
      } else if (action === 'create') {
        return true;
      }
    }
    return false;
  };

  const buildRows = (workspaces: Workspace[]): DataViewTrTree[] =>
    workspaces.map((workspace) => ({
      id: workspace.id,
      row: Object.values({
        name:
          // Determine where workspace names should link based on milestone:
          // M3+ (or master flag): Link to RBAC detail page
          // M1-M2: Link to Inventory (or plain text in M1)
          hasRbacDetailPages ? (
            <AppLink
              to={pathnames['workspace-detail'].path.replace(':workspaceId', workspace.id)}
              key={`${workspace.id}-detail`}
              className="rbac-m-hide-on-sm"
            >
              {workspace.name}
            </AppLink>
          ) : // M1-M2: Link to Inventory for standard/ungrouped-hosts types
          ['standard', 'ungrouped-hosts'].includes(workspace?.type) ? (
            <Link replace to={`/insights/inventory/workspaces/${workspace.id}`} key={`${workspace.id}-inventory-link`} className="rbac-m-hide-on-sm">
              {workspace.name}
            </Link>
          ) : (
            workspace.name
          ),
        description: workspace.description,
        rowActions: {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: 'Edit workspace',
                  onClick: () => {
                    navigate(pathnames['edit-workspaces-list'].link.replace(':workspaceId', workspace.id));
                  },
                  isDisabled: !canModify(workspace, 'edit'),
                },
                {
                  title: 'Create workspace',
                  onClick: () => navigate(pathnames['create-workspace'].link.replace(':workspaceId?', workspace.id)),
                  isDisabled: !canModify(workspace, 'create'),
                },
                {
                  title: 'Create subworkspace',
                  onClick: () => navigate(pathnames['create-workspace'].link.replace(':workspaceId?', workspace.id)),
                  isDisabled: !canModify(workspace, 'create'),
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
      <PageHeader
        data-codemods
        title={intl.formatMessage(messages.workspaces)}
        subtitle={intl.formatMessage(messages.workspacesSubtitle)}
        linkProps={{
          label: intl.formatMessage(messages.workspacesLearnMore),
          href: 'https://docs.redhat.com/en/documentation/red_hat_insights/1-latest/html/viewing_and_managing_system_inventory/deploying-insights-with-rhca_user-access',
          isExternal: true,
        }}
      />
      <PageSection hasBodyWrapper={false}>
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
                <Button variant="primary" onClick={() => navigate(pathnames['create-workspace'].link)} isDisabled={!hasWritePermissions()}>
                  {intl.formatMessage(messages.createWorkspace)}
                </Button>
                {hasAllFeatures && (
                  <Button variant="secondary" onClick={() => handleModalToggle(workspaces)} isDisabled={!hasWritePermissions()}>
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
              error: <ErrorStateTable errorTitle="Failed to load workspaces" errorDescription={error} />,
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
