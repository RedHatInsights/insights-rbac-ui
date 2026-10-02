import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
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

import { AppLink } from '../../../../../shared/components/navigation/AppLink';
// eslint-disable-next-line experience-ui/require-use-table-state -- display-only drawer, fetches all data with high limit
import { TableView } from '@redhat-cloud-services/frontend-components/TableView';
import type { CellRendererMap, ColumnConfigMap } from '@redhat-cloud-services/frontend-components/TableView';
import pathnames from '../../../../utilities/pathnames';
import { ActionDropdown, type ActionDropdownItem } from '../../../../../shared/components/ActionDropdown/ActionDropdown';
import { commonMessages } from '../../../../../shared/messages/common';

const messages = defineMessages({
  allOrgAdmins: { id: 'allOrgAdmins', defaultMessage: 'All org admins', description: 'All org admins label for admin default groups' },
  allUsers: { id: 'allUsers', defaultMessage: 'All users', description: 'All users label for default groups' },
  allOrgAdminsAreMembers: {
    id: 'allOrgAdminsAreMembers',
    defaultMessage: 'All organization administrators in this organization are members of this group.',
    description: 'All org. admins are members of this group message',
  },
  allUsersAreMembers: {
    id: 'allUsersAreMembers',
    defaultMessage: 'All users in this organization are members of this group.',
    description: 'All users are members of this group message',
  },
  editAccess: { id: 'editAccess', defaultMessage: 'Edit access', description: 'Edit access action text' },
  editAccessForThisWorkspace: {
    id: 'editAccessForThisWorkspace',
    defaultMessage: 'Edit access for this workspace',
    description: 'Edit access for this workspace button text',
  },
});

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
  currentWorkspace?: { id: string; name: string; type?: 'workspace' | 'tenant' };
  /** Whether the user has permission to edit role bindings (Kessel `create` relation, MVP proxy). */
  canEditAccess?: boolean;
  /** Whether the user has permission to revoke role bindings (Kessel `delete` relation, MVP proxy). */
  canRevokeAccess?: boolean;
  /** Callback to trigger the remove-from-workspace modal for the focused group */
  onRemoveFromWorkspace?: (group: WorkspaceGroupRow) => void;
  /** Callback to trigger edit-access navigation for the focused group */
  onEditAccess?: (group: WorkspaceGroupRow) => void;
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
  canEditAccess = false,
  canRevokeAccess = false,
  onRemoveFromWorkspace,
  onEditAccess,
}) => {
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState<string | number>(0);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // React Query hooks for group data
  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
  } = useGroupMembersQuery(group?.id || '', { limit: 1000 }, { enabled: !!group?.id && isOpen && !group?.isDefaultGroup });

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
      username: { label: intl.formatMessage(commonMessages.username) },
      firstName: { label: intl.formatMessage(commonMessages.firstName) },
      lastName: { label: intl.formatMessage(commonMessages.lastName) },
      organization: { label: intl.formatMessage({ id: 'organization', defaultMessage: 'Organization', description: 'Organization label' }) },
    }),
    [intl],
  );

  // Column config for users without inheritance
  const userColumnConfigWithoutInheritance: ColumnConfigMap<typeof userColumnsWithoutInheritance> = useMemo(
    () => ({
      username: { label: intl.formatMessage(commonMessages.username) },
      firstName: { label: intl.formatMessage(commonMessages.firstName) },
      lastName: { label: intl.formatMessage(commonMessages.lastName) },
    }),
    [intl],
  );

  // Column config for roles with inheritance
  const roleColumnConfigWithInheritance: ColumnConfigMap<typeof roleColumnsWithInheritance> = useMemo(
    () => ({
      role: { label: intl.formatMessage(commonMessages.roles) },
      inheritedFrom: {
        label: intl.formatMessage({ id: 'inheritedFrom', defaultMessage: 'Inherited from', description: 'Inherited from column label' }),
      },
    }),
    [intl],
  );

  // Column config for roles without inheritance
  const roleColumnConfigWithoutInheritance: ColumnConfigMap<typeof roleColumnsWithoutInheritance> = useMemo(
    () => ({
      role: { label: intl.formatMessage(commonMessages.roles) },
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
              content={intl.formatMessage(
                {
                  id: 'workspaceNavigationTooltip',
                  defaultMessage: 'You will be taken to {workspaceName}',
                  description: 'Tooltip shown when hovering over workspace links in drawer',
                },
                {
                  workspaceName: inherited.inheritedFrom.workspaceName,
                },
              )}
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
              content={intl.formatMessage(
                {
                  id: 'workspaceNavigationTooltip',
                  defaultMessage: 'You will be taken to {workspaceName}',
                  description: 'Tooltip shown when hovering over workspace links in drawer',
                },
                {
                  workspaceName: currentWorkspace.name,
                },
              )}
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
              content={intl.formatMessage(
                {
                  id: 'workspaceNavigationTooltip',
                  defaultMessage: 'You will be taken to {workspaceName}',
                  description: 'Tooltip shown when hovering over workspace links in drawer',
                },
                {
                  workspaceName: inherited.inheritedFrom.workspaceName,
                },
              )}
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
    if (group?.isDefaultGroup) {
      const isAdmin = group.isAdminDefault;
      return (
        <div className="pf-v6-u-pt-md">
          <EmptyState
            variant="sm"
            headingLevel="h4"
            icon={UsersIcon}
            titleText={intl.formatMessage(isAdmin ? messages.allOrgAdmins : messages.allUsers)}
          >
            <EmptyStateBody>{intl.formatMessage(isAdmin ? messages.allOrgAdminsAreMembers : messages.allUsersAreMembers)}</EmptyStateBody>
          </EmptyState>
        </div>
      );
    }

    if (membersLoading) {
      return (
        <div className="pf-v6-u-pt-md pf-v6-u-text-align-center">
          <Spinner size="lg" aria-label="Loading group members" />
        </div>
      );
    }

    if (membersError) {
      return (
        <div className="pf-v6-u-pt-md">
          <EmptyState
            variant="sm"
            headingLevel="h4"
            icon={ExclamationCircleIcon}
            titleText={intl.formatMessage({
              id: 'unableToLoadUsers',
              defaultMessage: 'Unable to load users',
              description: 'Unable to load users error title',
            })}
          >
            <EmptyStateBody>{extractErrorMessage(membersError)}</EmptyStateBody>
          </EmptyState>
        </div>
      );
    }

    if (members.length === 0) {
      return (
        <div className="pf-v6-u-pt-md">
          <EmptyState
            variant="sm"
            headingLevel="h4"
            icon={UsersIcon}
            titleText={intl.formatMessage({ id: 'usersEmptyStateTitle', defaultMessage: 'No users found', description: 'Empty state title Users' })}
          >
            <EmptyStateBody>
              {intl.formatMessage({
                id: 'groupNoUsersAssigned',
                defaultMessage: 'This group currently has no users assigned to it.',
                description: 'Message when group has no users assigned',
              })}
            </EmptyStateBody>
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
    group,
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
          <EmptyState
            variant="sm"
            headingLevel="h4"
            icon={KeyIcon}
            titleText={intl.formatMessage({ id: 'rolesEmptyStateTitle', defaultMessage: 'No roles found', description: 'Empty state title Roles' })}
          >
            <EmptyStateBody>
              {intl.formatMessage({
                id: 'groupNoRolesAssigned',
                defaultMessage: 'This group currently has no roles assigned to it.',
                description: 'Message when group has no roles assigned',
              })}
            </EmptyStateBody>
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
                <div>
                  <Title headingLevel="h2" size="lg">
                    {group.name}
                  </Title>
                  {group.description && (
                    <Content component="p" className="pf-v6-u-color-200 pf-v6-u-pt-sm">
                      {group.description}
                    </Content>
                  )}
                </div>
                <DrawerActions>
                  {currentWorkspace &&
                    !showInheritance &&
                    (() => {
                      const items: ActionDropdownItem[] = [
                        {
                          key: 'edit-access',
                          label: intl.formatMessage({ id: 'editAccess', defaultMessage: 'Edit access', description: 'Edit access action text' }),
                          onClick: () => onEditAccess?.(group),
                          isDisabled: !canEditAccess || group.isDefaultGroup,
                        },
                        {
                          key: 'remove-access',
                          label: intl.formatMessage({
                            id: 'removeAccess',
                            defaultMessage: 'Remove access',
                            description: 'Remove access action label',
                          }),
                          isDanger: canRevokeAccess && !group.isDefaultGroup,
                          onClick: () => onRemoveFromWorkspace?.(group),
                          isDisabled: !canRevokeAccess || group.isDefaultGroup,
                        },
                      ];
                      return <ActionDropdown items={items} ariaLabel={`Actions for ${group.name}`} ouiaId={`${ouiaId}-drawer-actions`} />;
                    })()}
                  <DrawerCloseButton onClick={onClose} />
                </DrawerActions>
              </DrawerHead>
              {showInheritance && (
                <div className="pf-v6-u-px-md pf-v6-u-pb-sm">
                  <Content component="p" className="pf-v6-u-color-200">
                    {intl.formatMessage({
                      id: 'inheritedDrawerSubtitle',
                      defaultMessage: 'The roles listed here were granted in a parent workspace.',
                      description: 'Subtitle in the drawer when showing inherited group roles',
                    })}
                  </Content>
                </div>
              )}
              {showInheritance && !isAlertDismissed && (
                <div className="pf-v6-u-px-md pf-v6-u-pb-md">
                  <Alert
                    variant="info"
                    isInline
                    title={intl.formatMessage({
                      id: 'inheritedDrawerAlert',
                      defaultMessage: 'Editing access to a parent workspace must be done within that workspace.',
                      description: 'Warning alert in the drawer when showing inherited group roles',
                    })}
                    actionClose={<AlertActionCloseButton onClose={() => setIsAlertDismissed(true)} />}
                  />
                </div>
              )}
              <Tabs activeKey={activeTab} onSelect={(_, tabIndex) => setActiveTab(tabIndex)} isFilled>
                <Tab eventKey={0} title={intl.formatMessage(commonMessages.roles)}>
                  <div className="pf-v6-u-p-md">{activeTab === 0 && renderRolesTab()}</div>
                </Tab>
                <Tab eventKey={1} title={intl.formatMessage(commonMessages.users)}>
                  <div className="pf-v6-u-p-md">{activeTab === 1 && renderUsersTab()}</div>
                </Tab>
              </Tabs>
              {currentWorkspace && !showInheritance && (
                <Flex className="pf-v6-u-px-md pf-v6-u-pt-md pf-v6-u-pb-md" gap={{ default: 'gapSm' }}>
                  <Button variant="secondary" isDisabled={!canEditAccess || group?.isDefaultGroup} onClick={() => group && onEditAccess?.(group)}>
                    {intl.formatMessage(currentWorkspace.type === 'tenant' ? messages.editAccess : messages.editAccessForThisWorkspace)}
                  </Button>
                  {/* TODO: re-enable when removal flow is confirmed
                  {onRemoveFromWorkspace && (
                    <Button variant="secondary" isDanger isDisabled={!canRevokeAccess} onClick={() => group && onRemoveFromWorkspace?.(group)}>
                      {intl.formatMessage({
                        id: 'removeGroupFromWorkspace',
                        defaultMessage: 'Remove from workspace',
                        description: 'Remove group from workspace action label',
                      })}
                    </Button>
                  )} */}
                </Flex>
              )}
            </DrawerPanelContent>
          ) : null
        }
      >
        <DrawerContentBody>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};
