import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
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
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import { User } from '../../../../../redux/reducers/user-reducer';
import messages from '../../../../../Messages';
import UserDetailsGroupsView from './UserDetailsGroupsView';
import UserDetailsRolesView from './UserDetailsRolesView';

interface UserDetailsProps {
  focusedUser?: User;
  drawerRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  ouiaId: string;
}

const UserDetailsDrawerContent: React.FunctionComponent<UserDetailsProps> = ({ focusedUser, drawerRef, onClose, ouiaId }) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const intl = useIntl();

  return (
    <DrawerPanelContent>
      <DrawerHead>
        <Title headingLevel="h2">
          <span tabIndex={focusedUser ? 0 : -1} ref={drawerRef}>{`${focusedUser?.first_name} ${focusedUser?.last_name}`}</span>
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
  focusedUser?: User;
  setFocusedUser: (user: User | undefined) => void;
  children: React.ReactNode;
  ouiaId: string;
}

const UserDetailsDrawer: React.FunctionComponent<DetailDrawerProps> = ({ focusedUser, setFocusedUser, children, ouiaId }) => {
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const context = useDataViewEventsContext();

  useEffect(() => {
    const unsubscribe = context.subscribe(EventTypes.rowClick, (user: User | undefined) => {
      setFocusedUser(user);
      drawerRef.current?.focus();
    });

    return () => unsubscribe();
  }, [drawerRef]);

  return (
    <Drawer isExpanded={Boolean(focusedUser)} data-ouia-component-id={ouiaId}>
      <DrawerContent
        panelContent={
          <UserDetailsDrawerContent
            ouiaId={`${ouiaId}-panel-content`}
            drawerRef={drawerRef}
            focusedUser={focusedUser}
            onClose={() => setFocusedUser(undefined)}
          />
        }
      >
        <DrawerContentBody hasPadding>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default UserDetailsDrawer;
