import { ErrorState, PageHeader, SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { DeleteWorkspaceModal } from './DeleteWorkspaceModal';
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
import { ExternalLink } from '../../../../shared/components/navigation/ExternalLink';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import useExternalLink from '../../../../shared/hooks/useExternalLink';
import { useWorkspacesFlag } from '../../../../shared/hooks/useWorkspacesFlag';
import messages from '../../../../Messages';
import { AppLink } from '../../../../shared/components/navigation/AppLink';
import pathnames from '../../../utilities/pathnames';
import type { WorkspaceFilters, WorkspaceWithChildren, WorkspacesWorkspace } from '../types';
import type { WorkspaceRelation, WorkspaceWithPermissions } from '../../../data/queries/workspaces';

interface WorkspaceListTableProps {
  workspaces: WorkspaceWithPermissions[];
  isLoading: boolean;
  error: string | null;

  onDeleteWorkspaces: (workspaces: WorkspacesWorkspace[]) => Promise<void>;
  onMoveWorkspace: (workspace: WorkspacesWorkspace, targetParentId: string) => Promise<void>;

  /**
   * Generic Kessel permission check: (workspaceId, relation) → boolean.
   * Already includes workspace-type constraints (root → view-only, default → no move/delete).
   */
  hasPermission: (workspaceId: string, relation: WorkspaceRelation) => boolean;

  /**
   * Whether the user can create workspaces in at least one workspace.
   * Used for the main "Create workspace" toolbar button.
   */
  canCreateAny: boolean;

  children?: React.ReactNode;
}

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
  hasPermission,
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
  const hasRbacDetailPages = useWorkspacesFlag('m3'); // M3+ or master flag

  const handleModalToggle = (workspacesToDelete: WorkspacesWorkspace[]) => {
    setCurrentWorkspaces(workspacesToDelete);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const buildRows = React.useCallback(
    (workspacesData: WorkspaceWithChildren[]): DataViewTrTree[] =>
      workspacesData.map((workspace) => ({
        id: workspace.id ?? '',
        row: Object.values({
          name:
            hasRbacDetailPages && hasPermission(workspace.id ?? '', 'view') ? (
              <AppLink to={pathnames['workspace-detail'].link(workspace.id ?? '')} key={`${workspace.id}-detail`} className="rbac-m-hide-on-sm">
                {workspace.name}
              </AppLink>
            ) : !hasRbacDetailPages && ['standard', 'ungrouped-hosts'].includes(workspace?.type ?? '') ? (
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
                    isDisabled: !hasPermission(workspace.id ?? '', 'edit'),
                  },
                  {
                    title: 'Create workspace',
                    onClick: () => navigate(pathnames['create-workspace'].link()),
                    isDisabled: !hasPermission(workspace.id ?? '', 'create'),
                  },
                  {
                    title: 'Create subworkspace',
                    onClick: () => navigate(pathnames['create-workspace'].link()),
                    isDisabled: !hasPermission(workspace.id ?? '', 'create'),
                  },
                  {
                    title: 'Move workspace',
                    onClick: () => {
                      onMoveWorkspace(workspace, '');
                    },
                    isDisabled: !hasPermission(workspace.id ?? '', 'move'),
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
                    isDisabled: (workspace.children && workspace.children.length > 0) || !hasPermission(workspace.id ?? '', 'delete'),
                    isDanger: !(workspace.children && workspace.children.length > 0) && hasPermission(workspace.id ?? '', 'delete'),
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
      })),
    [hasRbacDetailPages, hasPermission, navigate, onMoveWorkspace, externalLink],
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<WorkspaceFilters>({
    initialFilters: { name: '' },
    searchParams,
    setSearchParams,
  });

  const workspacesTree = useMemo(() => mapWorkspacesToHierarchy(workspaces), [workspaces]);
  const filteredTree = useMemo(() => (workspacesTree ? search([workspacesTree], filters.name) : []), [workspacesTree, filters]);
  const rows = useMemo(() => (filteredTree ? buildRows(filteredTree) : []), [filteredTree, buildRows]);
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
          <DeleteWorkspaceModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={async () => {
              await onDeleteWorkspaces(currentWorkspaces);
              setIsDeleteModalOpen(false);
            }}
            workspaces={currentWorkspaces}
          />
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
              <Button variant="primary" onClick={() => navigate(pathnames['create-workspace'].link())} isDisabled={!canCreateAny}>
                {intl.formatMessage(messages.createWorkspace)}
              </Button>
            }
          />
          <DataViewTable
            isTreeTable
            expandAll
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
