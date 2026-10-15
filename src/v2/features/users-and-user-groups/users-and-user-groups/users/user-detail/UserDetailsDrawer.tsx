import React, { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Drawer } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerActions } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerCloseButton } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContent } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContentBody } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerHead } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerPanelContent } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import { Tab } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { TabTitleText } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Tabs } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';

import type { User } from '../../../../../../shared/data/queries/users';
import messages from '../../../../../../Messages';
import { useGroupsAccess, useRolesAccess } from '../../../../../hooks/useRbacAccess';
import { UserDetailsGroupsView } from './UserDetailsGroupsView';
import { UserDetailsRolesView } from './UserDetailsRolesView';

interface UserDetailsDrawerInnerProps {
  focusedUser: User;
  drawerRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  ouiaId: string;
  renderGroupsTab: (userId: string, ouiaId: string) => React.ReactNode;
  renderRolesTab: (userId: string | undefined, ouiaId: string) => React.ReactNode;
}

/**
 * Inner content rendered only when a user is focused. Separated so that
 * useGroupsAccess / useRolesAccess hooks are NOT invoked while the drawer
 * is closed, avoiding unnecessary RBAC API calls on every page load.
 *
 * The outer DrawerPanelContent (with data-testid) is always mounted by
 * UserDetailsDrawer so existing Storybook interaction tests that call
 * waitForDrawer() before a row click continue to find the element.
 */
const UserDetailsDrawerInner: React.FC<UserDetailsDrawerInnerProps> = ({
  focusedUser,
  drawerRef,
  onClose,
  ouiaId,
  renderGroupsTab,
  renderRolesTab,
}) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const intl = useIntl();

  // Check permissions upfront — hide tabs the user cannot access so that
  // the underlying queries never fire and 403 errors are avoided entirely.
  const { canList: canListGroups, isLoading: groupsAccessLoading } = useGroupsAccess();
  const { canList: canListRoles, isLoading: rolesAccessLoading } = useRolesAccess();

  const accessLoading = groupsAccessLoading || rolesAccessLoading;
  const hasTabs = canListGroups || canListRoles;

  // When only the roles tab is visible, switch to it
  React.useEffect(() => {
    if (!canListGroups && canListRoles) {
      setActiveTabKey(1);
    }
  }, [canListGroups, canListRoles]);

  const drawerHeader = (
    <DrawerHead>
      <Title headingLevel="h2">
        <span tabIndex={0} ref={drawerRef}>
          {`${focusedUser.first_name} ${focusedUser.last_name}`}
        </span>
      </Title>
      <Content>
        <Content component="p">{focusedUser.email}</Content>
      </Content>
      <DrawerActions>
        <DrawerCloseButton onClick={onClose} />
      </DrawerActions>
    </DrawerHead>
  );

  // While permissions are loading, show only the header
  if (accessLoading) {
    return <>{drawerHeader}</>;
  }

  return (
    <>
      {drawerHeader}
      {hasTabs && (
        <Tabs isFilled activeKey={activeTabKey} onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}>
          {canListGroups && (
            <Tab eventKey={0} title={intl.formatMessage(messages.userGroups)}>
              {renderGroupsTab(focusedUser.username, `${ouiaId}-user-groups-view`)}
            </Tab>
          )}
          {canListRoles && (
            <Tab
              eventKey={1}
              title={
                <TabTitleText>
                  {intl.formatMessage(messages.assignedRoles)}
                  <Popover
                    triggerAction="hover"
                    position="top-end"
                    headerContent={intl.formatMessage(messages.assignedRoles)}
                    bodyContent={intl.formatMessage(messages.assignedRolesDescription)}
                  >
                    <Icon className="pf-v6-u-pl-sm" isInline>
                      <OutlinedQuestionCircleIcon />
                    </Icon>
                  </Popover>
                </TabTitleText>
              }
            >
              {renderRolesTab(
                focusedUser.external_source_id != null ? String(focusedUser.external_source_id) : undefined,
                `${ouiaId}-assigned-roles-view`,
              )}
            </Tab>
          )}
        </Tabs>
      )}
    </>
  );
};

interface DetailDrawerProps {
  focusedUser?: User;
  setFocusedUser: (user: User | undefined) => void;
  children: React.ReactNode;
  ouiaId: string;
}

const UserDetailsDrawer: React.FunctionComponent<DetailDrawerProps> = ({ focusedUser, setFocusedUser, children, ouiaId }) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const context = useDataViewEventsContext();

  useEffect(() => {
    const unsubscribe = context.subscribe(EventTypes.rowClick, (user: User | undefined) => {
      setFocusedUser(user);
    });

    return () => unsubscribe();
  }, [setFocusedUser]);

  const renderGroupsTab = (userId: string, tabOuiaId: string) => <UserDetailsGroupsView ouiaId={tabOuiaId} userId={userId} />;

  const renderRolesTab = (userId: string | undefined, tabOuiaId: string) => <UserDetailsRolesView userId={userId} ouiaId={tabOuiaId} />;

  useEffect(() => {
    if (focusedUser) {
      drawerRef.current?.focus();
    }
  }, [focusedUser]);

  return (
    <Drawer isExpanded={Boolean(focusedUser)} data-ouia-component-id={ouiaId}>
      <DrawerContent
        panelContent={
          <DrawerPanelContent data-testid="detail-drawer-panel">
            {focusedUser && (
              <UserDetailsDrawerInner
                ouiaId={`${ouiaId}-panel-content`}
                drawerRef={drawerRef}
                focusedUser={focusedUser}
                onClose={() => setFocusedUser(undefined)}
                renderGroupsTab={renderGroupsTab}
                renderRolesTab={renderRolesTab}
              />
            )}
          </DrawerPanelContent>
        }
      >
        <DrawerContentBody hasPadding>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export { UserDetailsDrawer };
