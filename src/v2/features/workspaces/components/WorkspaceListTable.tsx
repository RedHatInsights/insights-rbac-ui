import { ErrorState, PageHeader, SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
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
import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import messages from '../../../../Messages';
import { AppLink } from '../../../../shared/components/navigation/AppLink';
import pathnames from '../../../utilities/pathnames';
import { type WorkspaceActionCallbacks, useWorkspaceActionItems } from './useWorkspaceActionItems';
import type { WorkspaceFilters, WorkspaceWithChildren, WorkspacesWorkspace } from '../types';
import type { WorkspacePermissions, WorkspaceRelation, WorkspaceWithPermissions } from '../../../data/queries/workspaces';

interface WorkspaceListTableProps {
  workspaces: WorkspaceWithPermissions[];
  isLoading: boolean;
  error: string | null;

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

/**
 * Per-row actions component that consumes the shared action items hook.
 * Rendered inside each tree row to map WorkspaceActionItem[] → ActionsColumn items.
 */
const WorkspaceRowActions: React.FC<{
  workspace: WorkspaceWithChildren;
  permissions: WorkspacePermissions;
  callbacks: WorkspaceActionCallbacks;
}> = ({ workspace, permissions, callbacks }) => {
  const items = useWorkspaceActionItems({
    workspace,
    permissions,
    callbacks,
    hasChildren: !!(workspace.children && workspace.children.length > 0),
  });

  return (
    <ActionsColumn
      items={items.map((item) =>
        item.isSeparator
          ? { title: <Divider component="li" key={item.key} />, isSeparator: true }
          : {
              title: item.label,
              onClick: item.onClick,
              isDisabled: item.isDisabled,
              isDanger: item.isDanger,
            },
      )}
    />
  );
};

export const WorkspaceListTable: React.FC<WorkspaceListTableProps> = ({ workspaces, isLoading, error, hasPermission, canCreateAny }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();

  const buildRows = React.useCallback(
    (workspacesData: WorkspaceWithChildren[]): DataViewTrTree[] =>
      workspacesData.map((workspace) => {
        const wsId = workspace.id ?? '';
        const canView = hasPermission(wsId, 'view');
        const permissions: WorkspacePermissions = canView
          ? {
              view: true,
              edit: hasPermission(wsId, 'edit'),
              delete: hasPermission(wsId, 'delete'),
              create: hasPermission(wsId, 'create'),
              move: hasPermission(wsId, 'move'),
            }
          : { view: false, edit: false, delete: false, create: false, move: false };
        const callbacks: WorkspaceActionCallbacks = {
          onEdit: () => navigate(pathnames['edit-workspaces-list'].link(wsId)),
          onCreateSibling: () => navigate(pathnames['create-sibling-workspace'].link(wsId)),
          onCreateSub: () => navigate(pathnames['create-sub-workspace'].link(wsId)),
          onMove: () => navigate(pathnames['move-workspace'].link(wsId)),
          onDelete: () => navigate(pathnames['delete-workspace'].link(wsId)),
        };

        return {
          id: wsId,
          row: Object.values({
            name: canView ? (
              <AppLink to={pathnames['workspace-detail'].link(wsId)} key={`${wsId}-detail`} className="rbac-m-hide-on-sm">
                {workspace.name}
              </AppLink>
            ) : (
              <Tooltip content={intl.formatMessage(messages.workspacePendingTooltip)} key={`${wsId}-pending`}>
                <Button variant="link" isInline isAriaDisabled className="rbac-m-hide-on-sm">
                  {workspace.name}
                </Button>
              </Tooltip>
            ),
            description: workspace.description,
            rowActions: {
              cell: <WorkspaceRowActions workspace={workspace} permissions={permissions} callbacks={callbacks} />,
              props: { isActionCell: true },
            },
          }),
          ...(workspace.children && workspace.children.length > 0
            ? {
                children: buildRows(workspace.children),
              }
            : {}),
        };
      }),
    [hasPermission, navigate],
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
      </PageSection>
    </React.Fragment>
  );
};
