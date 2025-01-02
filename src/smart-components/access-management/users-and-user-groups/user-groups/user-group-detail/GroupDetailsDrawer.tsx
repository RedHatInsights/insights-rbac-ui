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
  Title,
} from '@patternfly/react-core';
import React, { useEffect } from 'react';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { useIntl } from 'react-intl';
import messages from '../../../../../Messages';
import { Group } from '../../../../../redux/reducers/group-reducer';
import GroupDetailsRolesView from './GroupDetailsRolesView';
import GroupDetailsServiceAccountsView from './GroupDetailsServiceAccountsView';
import GroupDetailsUsersView from './GroupDetailsUsersView';
import { EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';

interface GroupDetailsProps {
  focusedGroup?: Group;
  drawerRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  ouiaId: string;
}

const GroupDetailsDrawerContent: React.FunctionComponent<GroupDetailsProps> = ({ focusedGroup, drawerRef, onClose, ouiaId }) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const intl = useIntl();

  return (
    <DrawerPanelContent>
      <DrawerHead>
        <Title headingLevel="h2">
          <span tabIndex={focusedGroup ? 0 : -1} ref={drawerRef}>{`${focusedGroup?.name}`}</span>
        </Title>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <Tabs isFilled activeKey={activeTabKey} onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}>
        <Tab eventKey={0} title={intl.formatMessage(messages.users)}>
          {focusedGroup && <GroupDetailsUsersView groupId={focusedGroup.uuid} ouiaId={`${ouiaId}-users-view`} />}
        </Tab>
        <Tab eventKey={1} title={intl.formatMessage(messages.serviceAccounts)}>
          {focusedGroup && <GroupDetailsServiceAccountsView groupId={focusedGroup.uuid} ouiaId={`${ouiaId}-service-accounts-view`} />}
        </Tab>
        <Tab
          eventKey={2}
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
          {focusedGroup && <GroupDetailsRolesView groupId={focusedGroup.uuid} ouiaId={`${ouiaId}-assigned-roles-view`} />}
        </Tab>
      </Tabs>
    </DrawerPanelContent>
  );
};

interface DetailDrawerProps {
  setFocusedGroup: (group: Group | undefined) => void;
  focusedGroup?: Group;
  children: React.ReactNode;
  ouiaId: string;
}

const GroupDetailsDrawer: React.FunctionComponent<DetailDrawerProps> = ({ focusedGroup, setFocusedGroup, children, ouiaId }) => {
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const context = useDataViewEventsContext();

  useEffect(() => {
    const unsubscribe = context.subscribe(EventTypes.rowClick, (group: Group | undefined) => {
      setFocusedGroup(group);
      drawerRef.current?.focus();
    });

    return () => unsubscribe();
  }, [drawerRef]);

  return (
    <Drawer isExpanded={Boolean(focusedGroup)} onExpand={() => drawerRef.current?.focus()} data-ouia-component-id={ouiaId}>
      <DrawerContent
        panelContent={
          <GroupDetailsDrawerContent
            ouiaId={`${ouiaId}-panel-content`}
            focusedGroup={focusedGroup}
            drawerRef={drawerRef}
            onClose={() => setFocusedGroup(undefined)}
          />
        }
      >
        <DrawerContentBody hasPadding>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default GroupDetailsDrawer;
