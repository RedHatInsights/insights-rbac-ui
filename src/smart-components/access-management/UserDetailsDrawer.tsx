import {
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Icon,
  Popover,
  Tab,
  TabTitleText,
  Tabs,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';
import React from 'react';
import { User } from '../../redux/reducers/user-reducer';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import UserDetailsGroupsView from './UserDetailsGroupsView';
import UserDetailsRolesView from './UserDetailsRolesView';

interface UserDetailsProps {
  focusedUser?: User;
  onClose: () => void;
  ouiaId: string;
}

const UserDetailsDrawerContent: React.FunctionComponent<UserDetailsProps> = ({ focusedUser, onClose, ouiaId }) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const intl = useIntl();

  return (
    <DrawerPanelContent>
      <DrawerHead>
        <Title headingLevel="h2">{`${focusedUser?.first_name} ${focusedUser?.last_name}`}</Title>
        <TextContent>
          <Text>{focusedUser?.email}</Text>
        </TextContent>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <Tabs isFilled activeKey={activeTabKey} onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}>
        <Tab eventKey={0} title={intl.formatMessage(messages.userGroups)}>
          {focusedUser && <UserDetailsGroupsView ouiaId={`${ouiaId}-user-groups-view`} userId={focusedUser.username} />}
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
          {focusedUser && <UserDetailsRolesView userId={focusedUser.username} ouiaId={`${ouiaId}-assigned-users-view`} />}
        </Tab>
      </Tabs>
    </DrawerPanelContent>
  );
};

interface DetailDrawerProps {
  isOpen: boolean;
  focusedUser?: User;
  onClose: () => void;
  children: React.ReactNode;
  ouiaId: string;
}

const UserDetailsDrawer: React.FunctionComponent<DetailDrawerProps> = ({ isOpen, focusedUser, onClose, children, ouiaId }) => {
  const drawerRef = React.useRef<HTMLDivElement>(null);

  return (
    <Drawer isExpanded={isOpen} onExpand={() => drawerRef.current?.focus()} data-ouia-component-id={ouiaId}>
      <DrawerContent
        panelContent={<UserDetailsDrawerContent ouiaId={`${ouiaId}-panel-content`} focusedUser={focusedUser} onClose={onClose} />}
        ref={drawerRef}
      >
        <DrawerContentBody hasPadding>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default UserDetailsDrawer;
