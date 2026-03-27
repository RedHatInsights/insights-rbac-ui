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
import { UserDetailsGroupsView } from './UserDetailsGroupsView';
import { UserDetailsRolesView } from './UserDetailsRolesView';

interface UserDetailsDrawerContentProps {
  focusedUser?: User;
  drawerRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  ouiaId: string;
  renderGroupsTab: (userId: string, ouiaId: string) => React.ReactNode;
  renderRolesTab: (userId: string | undefined, ouiaId: string) => React.ReactNode;
}

const UserDetailsDrawerContent: React.FC<UserDetailsDrawerContentProps> = ({
  focusedUser,
  drawerRef,
  onClose,
  ouiaId,
  renderGroupsTab,
  renderRolesTab,
}) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const intl = useIntl();

  return (
    <DrawerPanelContent data-testid="detail-drawer-panel">
      <DrawerHead>
        <Title headingLevel="h2">
          <span tabIndex={focusedUser ? 0 : -1} ref={drawerRef}>
            {`${focusedUser?.first_name} ${focusedUser?.last_name}`}
          </span>
        </Title>
        <Content>
          <Content component="p">{focusedUser?.email}</Content>
        </Content>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <Tabs isFilled activeKey={activeTabKey} onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}>
        <Tab eventKey={0} title={intl.formatMessage(messages.userGroups)}>
          {focusedUser && renderGroupsTab(focusedUser.username, `${ouiaId}-user-groups-view`)}
        </Tab>
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
          {focusedUser &&
            renderRolesTab(
              focusedUser.external_source_id != null ? String(focusedUser.external_source_id) : undefined,
              `${ouiaId}-assigned-users-view`,
            )}
        </Tab>
      </Tabs>
    </DrawerPanelContent>
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
          <UserDetailsDrawerContent
            ouiaId={`${ouiaId}-panel-content`}
            drawerRef={drawerRef}
            focusedUser={focusedUser}
            onClose={() => setFocusedUser(undefined)}
            renderGroupsTab={renderGroupsTab}
            renderRolesTab={renderRolesTab}
          />
        }
      >
        <DrawerContentBody hasPadding>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export { UserDetailsDrawer };
