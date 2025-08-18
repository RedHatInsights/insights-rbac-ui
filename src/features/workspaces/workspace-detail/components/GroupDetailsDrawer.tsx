import React, { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import {
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  Spinner,
  Tab,
  Tabs,
  Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, KeyIcon, UsersIcon } from '@patternfly/react-icons';
import { DataView, DataViewTable } from '@patternfly/react-data-view';

import { Group } from '../../../../redux/groups/reducer';
import { fetchMembersForGroup, fetchRolesForGroup } from '../../../../redux/groups/actions';
import { RBACStore } from '../../../../redux/store';
import { extractErrorMessage } from '../../../../utilities/errorUtils';
import { User } from '../../../../redux/users/reducer';
import { Role } from '../../../../redux/roles/reducer';
import messages from '../../../../Messages';

interface GroupDetailsDrawerProps {
  isOpen: boolean;
  group?: Group;
  onClose: () => void;
  ouiaId?: string;
  children: React.ReactNode;
}

export const GroupDetailsDrawer: React.FC<GroupDetailsDrawerProps> = ({ isOpen, group, onClose, ouiaId = 'group-details-drawer', children }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<string | number>(0);

  // Redux state for group data
  const members = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.members?.data || []);
  const membersLoading = useSelector((state: RBACStore) => (state.groupReducer?.selectedGroup?.members as any)?.isLoading || false);
  const membersError = useSelector(
    (state: RBACStore) => state.groupReducer?.selectedGroup?.error || (state.groupReducer?.selectedGroup?.members as any)?.error,
  );

  const roles = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.roles?.data || []);
  const rolesLoading = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.roles?.isLoading || false);
  const rolesError = useSelector(
    (state: RBACStore) => state.groupReducer?.selectedGroup?.error || (state.groupReducer?.selectedGroup?.roles as any)?.error,
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

  // Users tab columns
  const GROUP_USERS_COLUMNS: string[] = [
    intl.formatMessage(messages.username),
    intl.formatMessage(messages.firstName),
    intl.formatMessage(messages.lastName),
  ];

  // Roles tab columns
  const GROUP_ROLES_COLUMNS: string[] = [intl.formatMessage(messages.roles)];

  // Render users tab content
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

    const userRows = members.map((user: User) => ({
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

  // Render roles tab content
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

    const roleRows = roles.map((role: Role) => ({
      key: role.uuid,
      row: [role.display_name],
      props: {},
    }));

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
  }, [intl, ouiaId, roles, rolesError, rolesLoading]);

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
