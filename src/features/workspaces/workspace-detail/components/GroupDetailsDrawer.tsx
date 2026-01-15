import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Drawer } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerActions } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerCloseButton } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContent } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContentBody } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerHead } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerPanelContent } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Tab } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Tabs } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';

import { Group } from '../../../../redux/groups/reducer';
import { fetchMembersForGroup, fetchRolesForGroup } from '../../../../redux/groups/actions';
import {
  selectGroupMembers,
  selectGroupMembersError,
  selectGroupRoles,
  selectGroupRolesError,
  selectIsGroupMembersLoading,
  selectIsGroupRolesLoading,
} from '../../../../redux/groups/selectors';
import { extractErrorMessage } from '../../../../utilities/errorUtils';
import { Role } from '../../../../redux/roles/reducer';
import type { RoleWithAccess } from '@redhat-cloud-services/rbac-client/types';
import messages from '../../../../Messages';
import { AppLink } from '../../../../components/navigation/AppLink';
import { RoleAccessModal } from './RoleAccessModal';
import { TableView } from '../../../../components/table-view/TableView';
import type { CellRendererMap, ColumnConfigMap } from '../../../../components/table-view/types';

// Extended Group interface to optionally include inheritedFrom data
export interface GroupWithInheritance extends Group {
  inheritedFrom?: {
    workspaceId: string;
    workspaceName: string;
  };
}

// Extended Role interface to include inheritedFrom data
export interface RoleWithInheritance extends Role {
  inheritedFrom?: {
    workspaceId: string;
    workspaceName: string;
  };
}

interface GroupDetailsDrawerProps {
  isOpen: boolean;
  group?: Group | GroupWithInheritance;
  onClose: () => void;
  ouiaId?: string;
  children: React.ReactNode;
  showInheritance?: boolean; // New prop to control inheritance column display
  currentWorkspace?: { id: string; name: string }; // Current workspace context for organization links
}

// Column definitions for users tables
const userColumnsWithInheritance = ['username', 'firstName', 'lastName', 'organization'] as const;
const userColumnsWithoutInheritance = ['username', 'firstName', 'lastName'] as const;

// Column definitions for roles tables
const roleColumnsWithInheritance = ['role', 'inheritedFrom'] as const;
const roleColumnsWithoutInheritance = ['role'] as const;

// User type for the table
interface UserRow {
  username: string;
  first_name: string;
  last_name: string;
}

export const GroupDetailsDrawer: React.FC<GroupDetailsDrawerProps> = ({
  isOpen,
  group,
  onClose,
  ouiaId = 'group-details-drawer',
  children,
  showInheritance = false,
  currentWorkspace,
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<string | number>(0);
  const [isRoleAccessModalOpen, setIsRoleAccessModalOpen] = useState(false);

  // Redux state for group data - using memoized selectors
  const members = useSelector(selectGroupMembers);
  const membersLoading = useSelector(selectIsGroupMembersLoading);
  const membersError = useSelector(selectGroupMembersError);

  const roles = useSelector(selectGroupRoles);
  const rolesLoading = useSelector(selectIsGroupRolesLoading);
  const rolesError = useSelector(selectGroupRolesError);

  // Fetch data when group changes
  useEffect(() => {
    if (group) {
      // Reset to first tab when opening drawer
      setActiveTab(0);
      // Fetch members and roles data
      dispatch(fetchMembersForGroup(group.uuid, undefined, { limit: 1000 }));
      dispatch(fetchRolesForGroup(group.uuid, { limit: 1000 }));
    }
  }, [dispatch, group]);

  // Reset modal state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsRoleAccessModalOpen(false);
    }
  }, [isOpen]);

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
        const groupWithInheritance = group as GroupWithInheritance;
        if (groupWithInheritance?.inheritedFrom && currentWorkspace) {
          return (
            <Tooltip
              content={intl.formatMessage(messages.workspaceNavigationTooltip, {
                workspaceName: groupWithInheritance.inheritedFrom.workspaceName,
              })}
            >
              <AppLink
                to={`/workspaces/detail/${groupWithInheritance.inheritedFrom.workspaceId}`}
                linkBasename="/iam/access-management"
                className="pf-v6-c-button pf-m-link pf-m-inline"
              >
                {groupWithInheritance.inheritedFrom.workspaceName}
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
              <AppLink
                to={`/workspaces/detail/${currentWorkspace.id}`}
                linkBasename="/iam/access-management"
                className="pf-v6-c-button pf-m-link pf-m-inline"
              >
                {currentWorkspace.name}
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
  const roleCellRenderersWithInheritance: CellRendererMap<typeof roleColumnsWithInheritance, RoleWithAccess> = useMemo(
    () => ({
      role: (row) => (
        <AppLink to={`/roles/detail/${row.uuid}`} className="pf-v6-c-button pf-m-link pf-m-inline">
          {row.display_name || row.name || ''}
        </AppLink>
      ),
      inheritedFrom: () => {
        const groupWithInheritance = group as GroupWithInheritance;
        if (groupWithInheritance?.inheritedFrom) {
          return (
            <Tooltip
              content={intl.formatMessage(messages.workspaceNavigationTooltip, {
                workspaceName: groupWithInheritance.inheritedFrom.workspaceName,
              })}
            >
              <a href={`#/workspaces/${groupWithInheritance.inheritedFrom.workspaceId}`} className="pf-v6-c-button pf-m-link pf-m-inline">
                {groupWithInheritance.inheritedFrom.workspaceName}
              </a>
            </Tooltip>
          );
        }
        return <div className="pf-v6-u-color-400">-</div>;
      },
    }),
    [intl, group],
  );

  // Cell renderers for roles without inheritance
  const roleCellRenderersWithoutInheritance: CellRendererMap<typeof roleColumnsWithoutInheritance, RoleWithAccess> = useMemo(
    () => ({
      role: (row) => (
        <AppLink to={`/roles/detail/${row.uuid}`} className="pf-v6-c-button pf-m-link pf-m-inline">
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
          <EmptyState variant="sm">
            <EmptyStateHeader titleText="Unable to load users" icon={<EmptyStateIcon icon={ExclamationCircleIcon} />} headingLevel="h4" />
            <EmptyStateBody>{extractErrorMessage(membersError)}</EmptyStateBody>
          </EmptyState>
        </div>
      );
    }

    // Show empty state when no users
    if (members.length === 0) {
      return (
        <div className="pf-v6-u-pt-md">
          <EmptyState variant="sm">
            <EmptyStateHeader
              titleText={intl.formatMessage(messages.usersEmptyStateTitle)}
              icon={<EmptyStateIcon icon={UsersIcon} />}
              headingLevel="h4"
            />
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

  // Render roles tab content
  const renderRolesTab = useCallback(() => {
    // Show loading state
    if (rolesLoading) {
      return (
        <div className="pf-v6-u-pt-md pf-v6-u-text-align-center">
          <Spinner size="lg" aria-label="Loading roles" />
        </div>
      );
    }

    // Show error state
    if (rolesError) {
      return (
        <div className="pf-v6-u-pt-md">
          <EmptyState variant="sm">
            <EmptyStateHeader titleText="Unable to load roles" icon={<EmptyStateIcon icon={ExclamationCircleIcon} />} headingLevel="h4" />
            <EmptyStateBody>{extractErrorMessage(rolesError)}</EmptyStateBody>
          </EmptyState>
        </div>
      );
    }

    // Show empty state when no roles
    if (roles.length === 0) {
      return (
        <div className="pf-v6-u-pt-md">
          <EmptyState variant="sm">
            <EmptyStateHeader
              titleText={intl.formatMessage(messages.rolesEmptyStateTitle)}
              icon={<EmptyStateIcon icon={KeyIcon} />}
              headingLevel="h4"
            />
            <EmptyStateBody>{intl.formatMessage(messages.groupNoRolesAssigned)}</EmptyStateBody>
          </EmptyState>
        </div>
      );
    }

    return (
      <div className="pf-v6-u-pt-md">
        {showInheritance ? (
          <TableView<typeof roleColumnsWithInheritance, RoleWithAccess>
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
          <TableView<typeof roleColumnsWithoutInheritance, RoleWithAccess>
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
    rolesError,
    rolesLoading,
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
            <DrawerPanelContent>
              <DrawerHead>
                <Title headingLevel="h2" size="lg">
                  {group.name}
                </Title>
                <DrawerActions>
                  <Button variant="secondary" onClick={() => setIsRoleAccessModalOpen(true)} isDisabled={!currentWorkspace}>
                    {intl.formatMessage(messages.editAccessForThisWorkspace)}
                  </Button>
                  <DrawerCloseButton onClick={onClose} />
                </DrawerActions>
              </DrawerHead>
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
      {group && currentWorkspace && (
        <RoleAccessModal
          isOpen={isRoleAccessModalOpen}
          onClose={() => setIsRoleAccessModalOpen(false)}
          group={group}
          workspaceId={currentWorkspace.id}
          workspaceName={currentWorkspace.name}
          onUpdate={(selectedRoleIds) => {
            // TODO: Implement role binding update logic when API is available
            console.log('Selected role IDs:', selectedRoleIds);
            // After update, you may want to refetch group roles
            if (group) {
              dispatch(fetchRolesForGroup(group.uuid, { limit: 1000 }));
            }
          }}
        />
      )}
    </Drawer>
  );
};
