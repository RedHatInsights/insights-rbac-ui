import React, { useRef } from 'react';
import { useIntl } from 'react-intl';
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
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import {} from '@patternfly/react-core';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import messages from '../../../Messages';
import { User } from '../../../redux/users/reducer';

// Re-export removed due to module resolution issues
// The User type is imported above and available within this module

interface UserDetailsDrawerContentProps {
  focusedUser?: User;
  drawerRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  ouiaId: string;
  renderGroupsTab: (userId: string, ouiaId: string) => React.ReactNode;
  renderRolesTab: (userId: string, ouiaId: string) => React.ReactNode;
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
    <DrawerPanelContent>
      <DrawerHead>
        <Title headingLevel="h2">
          <span tabIndex={focusedUser ? 0 : -1} ref={drawerRef}>
            {`${focusedUser?.first_name} ${focusedUser?.last_name}`}
          </span>
        </Title>
        <TextContent>
          <Text>{focusedUser?.email}</Text>
        </TextContent>
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
                <Icon className="pf-v5-u-pl-sm" isInline>
                  <OutlinedQuestionCircleIcon />
                </Icon>
              </Popover>
            </TabTitleText>
          }
        >
          {focusedUser && renderRolesTab(focusedUser.username, `${ouiaId}-assigned-users-view`)}
        </Tab>
      </Tabs>
    </DrawerPanelContent>
  );
};

interface UserDetailsDrawerProps {
  focusedUser?: User;
  onUserClick?: (user: User | undefined) => void;
  onClose: () => void;
  children: React.ReactNode;
  ouiaId: string;
  renderGroupsTab: (userId: string, ouiaId: string) => React.ReactNode;
  renderRolesTab: (userId: string, ouiaId: string) => React.ReactNode;
}

export const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({
  focusedUser,
  onUserClick,
  onClose,
  children,
  ouiaId,
  renderGroupsTab,
  renderRolesTab,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Allow parent to trigger focus when user is selected
  React.useEffect(() => {
    if (focusedUser && onUserClick) {
      drawerRef.current?.focus();
    }
  }, [focusedUser, onUserClick]);

  return (
    <Drawer isExpanded={Boolean(focusedUser)} data-ouia-component-id={ouiaId}>
      <DrawerContent
        panelContent={
          <UserDetailsDrawerContent
            ouiaId={`${ouiaId}-panel-content`}
            drawerRef={drawerRef}
            focusedUser={focusedUser}
            onClose={onClose}
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
