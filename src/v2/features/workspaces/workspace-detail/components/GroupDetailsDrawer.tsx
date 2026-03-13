import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Drawer } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerActions } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerCloseButton } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContent } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContentBody } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerHead } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerPanelContent } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';

import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Tab } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Tabs } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import ExternalLinkSquareAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-square-alt-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';

import { type GroupRole, useGroupMembersQuery } from '../../../../../v2/data/queries/groups';
import type { InheritedWorkspaceGroupRow, WorkspaceGroupRow } from '../../../../data/queries/groupAssignments';
import { extractErrorMessage } from '../../../../../shared/utilities/errorUtils';
import messages from '../../../../../Messages';
import { AppLink } from '../../../../../shared/components/navigation/AppLink';
// eslint-disable-next-line rbac-local/require-use-table-state -- display-only drawer, fetches all data with high limit
import { TableView } from '../../../../../shared/components/table-view/TableView';
import type { CellRendererMap, ColumnConfigMap } from '../../../../../shared/components/table-view/types';
import useAppNavigate from '../../../../../shared/hooks/useAppNavigate';
import pathnames from '../../../../utilities/pathnames';

// Extended Role interface to include inheritedFrom data
export interface RoleWithInheritance {
  uuid: string;
  name: string;
  display_name?: string;
  description?: string;
  inheritedFrom?: {
    workspaceId: string;
    workspaceName: string;
  };
}

interface GroupDetailsDrawerProps {
  isOpen: boolean;
  group?: WorkspaceGroupRow | InheritedWorkspaceGroupRow;
  onClose: () => void;
  ouiaId?: string;
  children: React.ReactNode;
  showInheritance?: boolean;
  currentWorkspace?: { id: string; name: string };
  /** Callback to trigger the remove-from-workspace modal for the focused group */
  onRemoveFromWorkspace?: (group: WorkspaceGroupRow) => void;
}

// Column definitions for users tables
const userColumnsWithInheritance = ['username', 'firstName', 'lastName', 'organization'] as const;
const userColumnsWithoutInheritance = ['username', 'firstName', 'lastName'] as const;

// Column definitions for roles tables
const roleColumnsWithInheritance = ['role', 'inheritedFrom'] as const;
const roleColumnsWithoutInheritance = ['role'] as const;

// User type for the table - matches Member type from API
interface UserRow {
  username: string;
  first_name?: string;
  last_name?: string;
}

export const GroupDetailsDrawer: React.FC<GroupDetailsDrawerProps> = ({
  isOpen,
  group,
  onClose,
  ouiaId = 'group-details-drawer',
  children,
  showInheritance = false,
  currentWorkspace,
  onRemoveFromWorkspace,
}) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const [activeTab, setActiveTab] = useState<string | number>(0);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // React Query hooks for group data
  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
  } = useGroupMembersQuery(group?.id || '', { limit: 1000 }, { enabled: !!group?.id && isOpen });

  const members = membersData?.members ?? [];

  const roles: GroupRole[] = useMemo(() => (group?.roles ?? []).map((r) => ({ uuid: r.id, name: r.name, display_name: r.name })), [group?.roles]);

  // Reset to first tab and re-show alert when opening drawer for a new group
  useEffect(() => {
    if (group) {
      setActiveTab(0);
      setIsAlertDismissed(false);
    }
  }, [group]);

  // Column config for users with inheritance
  const userColumnConfigWithInheritance: ColumnConfigMap<typeof userColumnsWithInheritance> = useMemo(
    () => ({
      username: { label: intl.formatMessage(messages.username) },
      firstName: { label: intl.formatMessage(messages.firstName) },
      lastName: { label: intl.formatMessage(messages.lastName) },
      organization: { label: intl.formatMessage(messages.organization) },
    }),
    [intl],
  );

  // Column config for users without inheritance
  const userColumnConfigWithoutInheritance: ColumnConfigMap<typeof userColumnsWithoutInheritance> = useMemo(
    () => ({
      username: { label: intl.formatMessage(messages.username) },
      firstName: { label: intl.formatMessage(messages.firstName) },
      lastName: { label: intl.formatMessage(messages.lastName) },
    }),
    [intl],
  );

  // Column config for roles with inheritance
  const roleColumnConfigWithInheritance: ColumnConfigMap<typeof roleColumnsWithInheritance> = useMemo(
    () => ({
      role: { label: intl.formatMessage(messages.roles) },
      inheritedFrom: { label: intl.formatMessage(messages.inheritedFrom) },
    }),
    [intl],
  );

  // Column config for roles without inheritance
  const roleColumnConfigWithoutInheritance: ColumnConfigMap<typeof roleColumnsWithoutInheritance> = useMemo(
    () => ({
      role: { label: intl.formatMessage(messages.roles) },
    }),
    [intl],
  );

  // Cell renderers for users with inheritance
  const userCellRenderersWithInheritance: CellRendererMap<typeof userColumnsWithInheritance, UserRow> = useMemo(
    () => ({
      username: (row) => row.username,
      firstName: (row) => row.first_name,
      lastName: (row) => row.last_name,
      organization: () => {
        const inherited = group as InheritedWorkspaceGroupRow;
        if (inherited?.inheritedFrom && currentWorkspace) {
          return (
            <Tooltip
              content={intl.formatMessage(messages.workspaceNavigationTooltip, {
                workspaceName: inherited.inheritedFrom.workspaceName,
              })}
            >
              <AppLink to={pathnames['workspace-detail'].link(inherited.inheritedFrom.workspaceId)} className="pf-v6-c-button pf-m-link pf-m-inline">
                {inherited.inheritedFrom.workspaceName}
                <Icon className="pf-v6-u-pl-xs" isInline>
                  <ExternalLinkSquareAltIcon />
                </Icon>
              </AppLink>
            </Tooltip>
          );
        }
        if (currentWorkspace) {
          return (
            <Tooltip
              content={intl.formatMessage(messages.workspaceNavigationTooltip, {
                workspaceName: currentWorkspace.name,
              })}
            >
              <AppLink to={pathnames['workspace-detail'].link(currentWorkspace.id)} className="pf-v6-c-button pf-m-link pf-m-inline">
                {currentWorkspace.name}
                <Icon className="pf-v6-u-pl-xs" isInline>
                  <ExternalLinkSquareAltIcon />
                </Icon>
              </AppLink>
            </Tooltip>
          );
        }
        return <div className="pf-v6-u-color-400">-</div>;
      },
    }),
    [intl, group, currentWorkspace],
  );

  // Cell renderers for users without inheritance
  const userCellRenderersWithoutInheritance: CellRendererMap<typeof userColumnsWithoutInheritance, UserRow> = useMemo(
    () => ({
      username: (row) => row.username,
      firstName: (row) => row.first_name,
      lastName: (row) => row.last_name,
    }),
    [],
  );

  // Cell renderers for roles with inheritance
  const roleCellRenderersWithInheritance: CellRendererMap<typeof roleColumnsWithInheritance, GroupRole> = useMemo(
    () => ({
      role: (row) => (
        <AppLink to={pathnames['role-detail'].link(row.uuid)} className="pf-v6-c-button pf-m-link pf-m-inline">
          {row.display_name || row.name || ''}
        </AppLink>
      ),
      inheritedFrom: () => {
        const inherited = group as InheritedWorkspaceGroupRow;
        if (inherited?.inheritedFrom) {
          return (
            <Tooltip
              content={intl.formatMessage(messages.workspaceNavigationTooltip, {
                workspaceName: inherited.inheritedFrom.workspaceName,
              })}
            >
              <AppLink to={pathnames['workspace-detail'].link(inherited.inheritedFrom.workspaceId)} className="pf-v6-c-button pf-m-link pf-m-inline">
                {inherited.inheritedFrom.workspaceName}
                <Icon className="pf-v6-u-pl-xs" isInline>
                  <ExternalLinkSquareAltIcon />
                </Icon>
              </AppLink>
            </Tooltip>
          );
        }
        return <div className="pf-v6-u-color-400">-</div>;
      },
    }),
    [intl, group],
  );

  // Cell renderers for roles without inheritance
  const roleCellRenderersWithoutInheritance: CellRendererMap<typeof roleColumnsWithoutInheritance, GroupRole> = useMemo(
    () => ({
      role: (row) => (
        <AppLink to={pathnames['role-detail'].link(row.uuid)} className="pf-v6-c-button pf-m-link pf-m-inline">
          {row.display_name || row.name || ''}
        </AppLink>
      ),
    }),
    [],
  );

  // Render users tab content
  const renderUsersTab = useCallback(() => {
    // Show loading state
    if (membersLoading) {
      return (
        <div className="pf-v6-u-pt-md pf-v6-u-text-align-center">
          <Spinner size="lg" aria-label="Loading group members" />
        </div>
      );
    }

    // Show error state
    if (membersError) {
      return (
        <div className="pf-v6-u-pt-md">
          <EmptyState variant="sm" headingLevel="h4" icon={ExclamationCircleIcon} titleText={intl.formatMessage(messages.unableToLoadUsers)}>
            <EmptyStateBody>{extractErrorMessage(membersError)}</EmptyStateBody>
          </EmptyState>
        </div>
      );
    }

    // Show empty state when no users
    if (members.length === 0) {
      return (
        <div className="pf-v6-u-pt-md">
          <EmptyState variant="sm" headingLevel="h4" icon={UsersIcon} titleText={intl.formatMessage(messages.usersEmptyStateTitle)}>
            <EmptyStateBody>{intl.formatMessage(messages.groupNoUsersAssigned)}</EmptyStateBody>
          </EmptyState>
        </div>
      );
    }

    return (
      <div className="pf-v6-u-pt-md">
        {showInheritance ? (
          <TableView<typeof userColumnsWithInheritance, UserRow>
            columns={userColumnsWithInheritance}
            columnConfig={userColumnConfigWithInheritance}
            data={members}
            totalCount={members.length}
            getRowId={(row) => row.username}
            cellRenderers={userCellRenderersWithInheritance}
            page={1}
            perPage={members.length || 10}
            onPageChange={() => {}}
            onPerPageChange={() => {}}
            variant="compact"
            ariaLabel="Group Users Table"
            ouiaId={`${ouiaId}-users-table`}
          />
        ) : (
          <TableView<typeof userColumnsWithoutInheritance, UserRow>
            columns={userColumnsWithoutInheritance}
            columnConfig={userColumnConfigWithoutInheritance}
            data={members}
            totalCount={members.length}
            getRowId={(row) => row.username}
            cellRenderers={userCellRenderersWithoutInheritance}
            page={1}
            perPage={members.length || 10}
            onPageChange={() => {}}
            onPerPageChange={() => {}}
            variant="compact"
            ariaLabel="Group Users Table"
            ouiaId={`${ouiaId}-users-table`}
          />
        )}
      </div>
    );
  }, [
    intl,
    members,
    membersError,
    membersLoading,
    ouiaId,
    showInheritance,
    userColumnConfigWithInheritance,
    userColumnConfigWithoutInheritance,
    userCellRenderersWithInheritance,
    userCellRenderersWithoutInheritance,
  ]);

  // Render roles tab content — roles come from the binding response (already on WorkspaceGroupRow),
  // no separate fetch needed.
  const renderRolesTab = useCallback(() => {
    if (roles.length === 0) {
      return (
        <div className="pf-v6-u-pt-md">
          <EmptyState variant="sm" headingLevel="h4" icon={KeyIcon} titleText={intl.formatMessage(messages.rolesEmptyStateTitle)}>
            <EmptyStateBody>{intl.formatMessage(messages.groupNoRolesAssigned)}</EmptyStateBody>
          </EmptyState>
        </div>
      );
    }

    return (
      <div className="pf-v6-u-pt-md">
        {showInheritance ? (
          <TableView<typeof roleColumnsWithInheritance, GroupRole>
            columns={roleColumnsWithInheritance}
            columnConfig={roleColumnConfigWithInheritance}
            data={roles}
            totalCount={roles.length}
            getRowId={(row) => row.uuid}
            cellRenderers={roleCellRenderersWithInheritance}
            page={1}
            perPage={roles.length || 10}
            onPageChange={() => {}}
            onPerPageChange={() => {}}
            variant="compact"
            ariaLabel="Group Roles Table"
            ouiaId={`${ouiaId}-roles-table`}
          />
        ) : (
          <TableView<typeof roleColumnsWithoutInheritance, GroupRole>
            columns={roleColumnsWithoutInheritance}
            columnConfig={roleColumnConfigWithoutInheritance}
            data={roles}
            totalCount={roles.length}
            getRowId={(row) => row.uuid}
            cellRenderers={roleCellRenderersWithoutInheritance}
            page={1}
            perPage={roles.length || 10}
            onPageChange={() => {}}
            onPerPageChange={() => {}}
            variant="compact"
            ariaLabel="Group Roles Table"
            ouiaId={`${ouiaId}-roles-table`}
          />
        )}
      </div>
    );
  }, [
    intl,
    ouiaId,
    roles,
    showInheritance,
    roleColumnConfigWithInheritance,
    roleColumnConfigWithoutInheritance,
    roleCellRenderersWithInheritance,
    roleCellRenderersWithoutInheritance,
  ]);

  return (
    <Drawer isExpanded={isOpen} style={{ height: '100%' }}>
      <DrawerContent
        panelContent={
          group ? (
            <DrawerPanelContent data-testid="detail-drawer-panel">
              <DrawerHead>
                <Title headingLevel="h2" size="lg">
                  {group.name}
                </Title>
                <DrawerActions>
                  <DrawerCloseButton onClick={onClose} />
                </DrawerActions>
              </DrawerHead>
              {showInheritance && (
                <div className="pf-v6-u-px-md pf-v6-u-pb-sm">
                  <Content component="p" className="pf-v6-u-color-200">
                    {intl.formatMessage(messages.inheritedDrawerSubtitle)}
                  </Content>
                </div>
              )}
              {showInheritance && !isAlertDismissed && (
                <div className="pf-v6-u-px-md pf-v6-u-pb-md">
                  <Alert
                    variant="info"
                    isInline
                    title={intl.formatMessage(messages.inheritedDrawerAlert)}
                    actionClose={<AlertActionCloseButton onClose={() => setIsAlertDismissed(true)} />}
                  />
                </div>
              )}
              {currentWorkspace && !showInheritance && (
                <Flex className="pf-v6-u-px-md pf-v6-u-pb-md" gap={{ default: 'gapSm' }}>
                  <Button
                    variant="secondary"
                    onClick={() => group && navigate(pathnames['workspace-role-access'].link(currentWorkspace.id, group.id))}
                  >
                    {intl.formatMessage(messages.editAccessForThisWorkspace)}
                  </Button>
                  {onRemoveFromWorkspace && (
                    <Button variant="secondary" isDanger onClick={() => group && onRemoveFromWorkspace(group)}>
                      {intl.formatMessage(messages.removeGroupFromWorkspace)}
                    </Button>
                  )}
                </Flex>
              )}
              <Tabs activeKey={activeTab} onSelect={(_, tabIndex) => setActiveTab(tabIndex)} isFilled>
                <Tab eventKey={0} title={intl.formatMessage(messages.roles)}>
                  <div className="pf-v6-u-p-md">{activeTab === 0 && renderRolesTab()}</div>
                </Tab>
                <Tab eventKey={1} title={intl.formatMessage(messages.users)}>
                  <div className="pf-v6-u-p-md">{activeTab === 1 && renderUsersTab()}</div>
                </Tab>
              </Tabs>
            </DrawerPanelContent>
          ) : null
        }
      >
        <DrawerContentBody>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};
