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
import {} from '@patternfly/react-core';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import { useIntl } from 'react-intl';
import React from 'react';
import messages from '../../../../../Messages';

interface GroupDetailsDrawerProps {
  isOpen: boolean;
  groupName?: string;
  onClose: () => void;
  children: React.ReactNode;
  drawerRef: React.RefObject<HTMLDivElement>;
  ouiaId: string;
  activeTabKey: string | number;
  onTabSelect: (tabIndex: string | number) => void;
  renderUsersTab: () => React.ReactNode;
  renderServiceAccountsTab: () => React.ReactNode;
  renderRolesTab: () => React.ReactNode;
}

/**
 * Pure presentational drawer component for displaying group details.
 * Uses render props pattern for flexible content rendering.
 */
const GroupDetailsDrawer: React.FunctionComponent<GroupDetailsDrawerProps> = ({
  isOpen,
  groupName,
  onClose,
  children,
  drawerRef,
  ouiaId,
  activeTabKey,
  onTabSelect,
  renderUsersTab,
  renderServiceAccountsTab,
  renderRolesTab,
}) => {
  const intl = useIntl();

  return (
    <Drawer isExpanded={isOpen} onExpand={() => drawerRef.current?.focus()} data-ouia-component-id={ouiaId}>
      <DrawerContent
        panelContent={
          <DrawerPanelContent>
            <DrawerHead>
              <Title headingLevel="h2">
                <span tabIndex={isOpen ? 0 : -1} ref={drawerRef}>
                  {groupName}
                </span>
              </Title>
              <DrawerActions>
                <DrawerCloseButton onClick={onClose} />
              </DrawerActions>
            </DrawerHead>
            <Tabs isFilled activeKey={activeTabKey} onSelect={(_, tabIndex) => onTabSelect(tabIndex)}>
              <Tab eventKey={0} title={intl.formatMessage(messages.users)}>
                {activeTabKey === 0 && renderUsersTab()}
              </Tab>
              <Tab eventKey={1} title={intl.formatMessage(messages.serviceAccounts)}>
                {activeTabKey === 1 && renderServiceAccountsTab()}
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
                {activeTabKey === 2 && renderRolesTab()}
              </Tab>
            </Tabs>
          </DrawerPanelContent>
        }
      >
        <DrawerContentBody hasPadding>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

// Component uses named export only
export { GroupDetailsDrawer };
