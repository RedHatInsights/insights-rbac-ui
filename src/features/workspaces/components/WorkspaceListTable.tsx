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
import React, { Suspense, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Outlet, useSearchParams } from 'react-router-dom';
import { ExternalLink } from '../../../components/navigation/ExternalLink';
import useAppNavigate from '../../../hooks/useAppNavigate';
import useExternalLink from '../../../hooks/useExternalLink';
import { useWorkspacesFlag } from '../../../hooks/useWorkspacesFlag';
import messages from '../../../Messages';
import { AppLink } from '../../../components/navigation/AppLink';
import pathnames from '../../../utilities/pathnames';
import type { WorkspaceFilters, WorkspaceWithChildren, WorkspacesWorkspace } from '../types';

interface WorkspaceListTableProps {
  // Data props
  workspaces: WorkspacesWorkspace[];
  isLoading: boolean;
  error: string | null;

  // Action callbacks
  onDeleteWorkspaces: (workspaces: WorkspacesWorkspace[]) => Promise<void>;
  onMoveWorkspace: (workspace: WorkspacesWorkspace, targetParentId: string) => Promise<void>;

  /**
   * Function to check if user can edit a specific workspace.
   * Used for edit, move, delete actions.
   */
  canEdit: (workspaceId: string) => boolean;

  /**
   * Function to check if user can create workspaces within a parent.
   * Used for "Create workspace" and "Create subworkspace" row actions.
   */
  canCreateIn: (workspaceId: string) => boolean;

  /**
   * Whether the user can edit at least one workspace.
   * Used for enabling/disabling bulk actions like "Delete workspaces".
   */
  canEditAny: boolean;

  /**
   * Whether the user can create workspaces in at least one workspace.
   * Used for the main "Create workspace" toolbar button.
   * The button is enabled if ANY workspace allows creation.
   */
  canCreateAny: boolean;

  // Optional children (e.g., modals)
  children?: React.ReactNode;
}

const isValidType = (workspace: WorkspacesWorkspace, validTypes: string[]) => validTypes.includes(workspace.type ?? '');
const isValidEditType = (workspace: WorkspacesWorkspace) => isValidType(workspace, ['default', 'standard']);
const isValidMoveType = (workspace: WorkspacesWorkspace) => isValidType(workspace, ['standard']);
const isValidDeleteType = (workspace: WorkspacesWorkspace) => isValidType(workspace, ['standard']);

const mapWorkspacesToHierarchy = (workspaceData: WorkspacesWorkspace[]): WorkspaceWithChildren | undefined => {
  const idMap = new Map<string, WorkspaceWithChildren>();
  let root: WorkspaceWithChildren | undefined = undefined;

  workspaceData.forEach((ws) => idMap.set(ws.id ?? '', { ...ws, children: [] }));
  workspaceData.forEach((ws) => {
    const node = idMap.get(ws.id ?? '');
    if (ws.type === 'root') root = node;
    else if (ws.parent_id && node) {
      const parent = idMap.get(ws.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    }
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

const ErrorStateTable: React.FunctionComponent<{ errorTitle: string; errorDescription?: string | null }> = ({ errorTitle, errorDescription }) => {
  return (
    <tbody>
      <tr>
        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
          <ErrorState titleText={errorTitle} bodyText={errorDescription ?? undefined} />
        </td>
      </tr>
    </tbody>
  );
};

const search = (workspaceTree: WorkspaceWithChildren[], filter: string): WorkspaceWithChildren[] => {
  const matches: WorkspaceWithChildren[] = [];
  if (!Array.isArray(workspaceTree)) {
    return matches;
  }

  workspaceTree.forEach((obj) => {
    if (obj.name?.toLocaleLowerCase().includes(filter.toLocaleLowerCase())) {
      matches.push(obj);
    } else {
      const childResults: WorkspaceWithChildren[] = obj.children ? search(obj.children, filter) : [];
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
  canEdit,
  canCreateIn,
  canEditAny,
  canCreateAny,
  children,
}) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const externalLink = useExternalLink();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentWorkspaces, setCurrentWorkspaces] = useState<WorkspacesWorkspace[]>([]);

  // Feature flags via custom hook (see WORKSPACE_FEATURE_FLAGS.md for complete documentation)
  // M3: RBAC detail pages with read-only role bindings
  // M5: Master flag that enables all features (including bulk delete)
  const hasRbacDetailPages = useWorkspacesFlag('m3'); // M3+ or master flag
  const hasAllFeatures = useWorkspacesFlag('m5'); // Master flag only

  const handleModalToggle = (workspacesToDelete: WorkspacesWorkspace[]) => {
    setCurrentWorkspaces(workspacesToDelete);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  /**
   * Check if user can perform an action on a workspace.
   * Combines Kessel permission check with workspace type constraints.
   */
  const canModify = (workspace: WorkspacesWorkspace, action: 'edit' | 'move' | 'delete' | 'create') => {
    const workspaceId = workspace.id ?? '';

    // For 'create' action (creating children), check 'create' permission on this workspace
    if (action === 'create') {
      return canCreateIn(workspaceId);
    }

    // For edit/move/delete, check 'edit' permission first
    if (!canEdit(workspaceId)) {
      return false;
    }

    // Then check workspace type constraints (e.g., can't delete root workspace)
    switch (action) {
      case 'edit':
        return isValidEditType(workspace);
      case 'move':
        return isValidMoveType(workspace);
      case 'delete':
        return isValidDeleteType(workspace);
      default:
        return false;
    }
  };

  const buildRows = (workspacesData: WorkspaceWithChildren[]): DataViewTrTree[] =>
    workspacesData.map((workspace) => ({
      id: workspace.id ?? '',
      row: Object.values({
        name:
          // Determine where workspace names should link based on milestone:
          // M3+ (or master flag): Link to RBAC detail page
          // M1-M2: Link to Inventory (or plain text in M1)
          hasRbacDetailPages ? (
            <AppLink
              to={pathnames['workspace-detail'].path.replace(':workspaceId', workspace.id ?? '')}
              key={`${workspace.id}-detail`}
              className="rbac-m-hide-on-sm"
            >
              {workspace.name}
            </AppLink>
          ) : // M1-M2: Link to Inventory for standard/ungrouped-hosts types
          ['standard', 'ungrouped-hosts'].includes(workspace?.type ?? '') ? (
            <ExternalLink
              replace
              to={`/insights/inventory/workspaces/${workspace.id}`}
              key={`${workspace.id}-inventory-link`}
              className="rbac-m-hide-on-sm"
            >
              {workspace.name}
            </ExternalLink>
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
                    navigate(pathnames['edit-workspaces-list'].link(workspace.id ?? ''));
                  },
                  isDisabled: !canModify(workspace, 'edit'),
                },
                {
                  title: 'Create workspace',
                  onClick: () => navigate(pathnames['create-workspace'].link()),
                  isDisabled: !canModify(workspace, 'create'),
                },
                {
                  title: 'Create subworkspace',
                  onClick: () => navigate(pathnames['create-workspace'].link()),
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
                  onClick: () => externalLink.navigate('/settings/integrations'),
                },
                {
                  title: 'Manage notifications',
                  onClick: () => externalLink.navigate('/settings/notifications'),
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

  // Derived: Calculate active state directly from props (no useEffect sync needed)
  const activeState: DataViewState | undefined = isLoading
    ? DataViewState.loading
    : error
      ? DataViewState.error
      : workspaces.length === 0
        ? DataViewState.empty
        : undefined;

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
                <Button variant="primary" onClick={() => navigate(pathnames['create-workspace'].link())} isDisabled={!canCreateAny}>
                  {intl.formatMessage(messages.createWorkspace)}
                </Button>
                {hasAllFeatures && (
                  <Button variant="secondary" onClick={() => handleModalToggle(workspaces)} isDisabled={!canEditAny}>
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
