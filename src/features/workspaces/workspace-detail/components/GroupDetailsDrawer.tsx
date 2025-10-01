import React, { useCallback, useEffect, useState } from 'react';
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
import {} from '@patternfly/react-core';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import { DataView, DataViewTable } from '@patternfly/react-data-view';

import { Group } from '../../../../redux/groups/reducer';
import { fetchMembersForGroup, fetchRolesForGroup } from '../../../../redux/groups/actions';
import { RBACStore } from '../../../../redux/store';
import { extractErrorMessage } from '../../../../utilities/errorUtils';
import { Role } from '../../../../redux/roles/reducer';
import messages from '../../../../Messages';

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
}

export const GroupDetailsDrawer: React.FC<GroupDetailsDrawerProps> = ({
  isOpen,
  group,
  onClose,
  ouiaId = 'group-details-drawer',
  children,
  showInheritance = false,
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<string | number>(0);

  // Redux state for group data
  const members = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.members?.data || []);
  const membersLoading = useSelector(
    (state: RBACStore) => (state.groupReducer?.selectedGroup?.members as { isLoading?: boolean })?.isLoading || false,
  );
  const membersError = useSelector(
    (state: RBACStore) => state.groupReducer?.selectedGroup?.error || (state.groupReducer?.selectedGroup?.members as { error?: unknown })?.error,
  );

  const roles = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.roles?.data || []);
  const rolesLoading = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.roles?.isLoading || false);
  const rolesError = useSelector(
    (state: RBACStore) => state.groupReducer?.selectedGroup?.error || (state.groupReducer?.selectedGroup?.roles as { error?: unknown })?.error,
  );

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

  // Users tab columns (same for both drawer types)
  const GROUP_USERS_COLUMNS: string[] = [
    intl.formatMessage(messages.username),
    intl.formatMessage(messages.firstName),
    intl.formatMessage(messages.lastName),
  ];

  // Roles tab columns - conditionally includes "Inherited from" column
  const GROUP_ROLES_COLUMNS: string[] = showInheritance
    ? [intl.formatMessage(messages.roles), intl.formatMessage(messages.inheritedFrom)]
    : [intl.formatMessage(messages.roles)];

  // Render users tab content (same for both drawer types)
  const renderUsersTab = useCallback(() => {
    // Show loading state
    if (membersLoading) {
      return (
        <div className="pf-v5-u-pt-md pf-v5-u-text-align-center">
          <Spinner size="lg" aria-label="Loading group members" />
        </div>
      );
    }

    // Show error state
    if (membersError) {
      return (
        <div className="pf-v5-u-pt-md">
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
        <div className="pf-v5-u-pt-md">
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

    const userRows = members.map((user) => ({
      key: user.username,
      row: [user.username, user.first_name, user.last_name],
      props: {},
    }));

    return (
      <div className="pf-v5-u-pt-md">
        <DataView ouiaId={`${ouiaId}-users-view`}>
          <DataViewTable
            variant="compact"
            aria-label="Group Users Table"
            ouiaId={`${ouiaId}-users-table`}
            columns={GROUP_USERS_COLUMNS}
            rows={userRows}
          />
        </DataView>
      </div>
    );
  }, [intl, members, membersError, membersLoading, ouiaId]);

  // Render roles tab content - conditionally shows inheritance information
  const renderRolesTab = useCallback(() => {
    // Show loading state
    if (rolesLoading) {
      return (
        <div className="pf-v5-u-pt-md pf-v5-u-text-align-center">
          <Spinner size="lg" aria-label="Loading roles" />
        </div>
      );
    }

    // Show error state
    if (rolesError) {
      return (
        <div className="pf-v5-u-pt-md">
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
        <div className="pf-v5-u-pt-md">
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

    // Map roles to rows with conditional inheritance information
    const roleRows = roles.map((role) => {
      const baseRow: (string | React.ReactElement)[] = [role.display_name || role.name || ''];

      if (showInheritance) {
        // Use the group's inheritance info since roles inherit from the same workspace
        const groupWithInheritance = group as GroupWithInheritance;
        const inheritanceCell = groupWithInheritance?.inheritedFrom ? (
          <a href={`#/workspaces/${groupWithInheritance.inheritedFrom.workspaceId}`} className="pf-v5-c-button pf-m-link pf-m-inline">
            {groupWithInheritance.inheritedFrom.workspaceName}
          </a>
        ) : (
          <div className="pf-v5-u-color-400">-</div>
        );
        baseRow.push(inheritanceCell);
      }

      return {
        key: role.uuid,
        row: baseRow,
        props: {},
      };
    });

    return (
      <div className="pf-v5-u-pt-md">
        <DataView ouiaId={`${ouiaId}-roles-view`}>
          <DataViewTable
            variant="compact"
            aria-label="Group Roles Table"
            ouiaId={`${ouiaId}-roles-table`}
            columns={GROUP_ROLES_COLUMNS}
            rows={roleRows}
          />
        </DataView>
      </div>
    );
  }, [intl, ouiaId, roles, rolesError, rolesLoading, showInheritance, group]);

  return (
    <Drawer isExpanded={isOpen}>
      <DrawerContent
        panelContent={
          group ? (
            <DrawerPanelContent>
              <DrawerHead>
                <Title headingLevel="h2" size="lg">
                  {group.name}
                </Title>
                <DrawerActions>
                  <Button variant="secondary" isDisabled>
                    {intl.formatMessage(messages.editAccessForThisWorkspace)}
                  </Button>
                  <DrawerCloseButton onClick={onClose} />
                </DrawerActions>
              </DrawerHead>
              <Tabs activeKey={activeTab} onSelect={(_, tabIndex) => setActiveTab(tabIndex)} isFilled>
                <Tab eventKey={0} title={intl.formatMessage(messages.roles)}>
                  <div className="pf-v5-u-p-md">{activeTab === 0 && renderRolesTab()}</div>
                </Tab>
                <Tab eventKey={1} title={intl.formatMessage(messages.users)}>
                  <div className="pf-v5-u-p-md">{activeTab === 1 && renderUsersTab()}</div>
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
