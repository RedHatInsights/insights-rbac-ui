import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Role } from '../../redux/roles/reducer';
import { DrawerActions, DrawerCloseButton, DrawerHead, DrawerPanelContent, Popover, Tab, TabTitleText, Tabs, Title } from '@patternfly/react-core';
import { EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import Messages from '../../Messages';
import { RolePermissionsTable } from './RolePermissionsTable';
import { AssignedUserGroupsTable } from './AssignedUserGroupsTable';

interface RolesDetailProps {
  selectedRole?: Role;
  setSelectedRole: React.Dispatch<React.SetStateAction<Role | undefined>>;
}

const ouiaId = 'RolesTable';

const RolesDetails: React.FunctionComponent<RolesDetailProps> = ({ selectedRole, setSelectedRole }) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const context = useDataViewEventsContext();
  const intl = useIntl();

  const handleTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  useEffect(() => {
    const unsubscribe = context.subscribe(EventTypes.rowClick, (role: Role) => {
      setSelectedRole(role);
    });
    return () => unsubscribe();
  }, []);

  const assignedUserGroupsPopover = (
    <Popover
      triggerAction="hover"
      headerContent={intl.formatMessage(Messages.assignedUserGroupsTooltipHeader)}
      bodyContent={intl.formatMessage(Messages.assignedUserGroupsTooltipBody)}
    >
      <OutlinedQuestionCircleIcon />
    </Popover>
  );

  return (
    <DrawerPanelContent minSize="600px">
      <DrawerHead>
        <Title className="pf-v5-u-mb-md" headingLevel="h2" ouiaId={`${ouiaId}-drawer-title`}>
          {selectedRole?.display_name}
        </Title>
        <DrawerActions>
          <DrawerCloseButton onClick={() => setSelectedRole(undefined)} data-ouia-component-id={`${ouiaId}-drawer-close-button`} />
        </DrawerActions>
      </DrawerHead>
      <Tabs activeKey={activeTabKey} onSelect={handleTabClick} ouiaId={`${ouiaId}-drawer-tabs`}>
        <Tab eventKey={0} title={<TabTitleText>Permissions</TabTitleText>} ouiaId={`${ouiaId}-permissions-tab`}>
          <RolePermissionsTable viewedRole={selectedRole} />
        </Tab>
        <Tab
          eventKey={1}
          title={<TabTitleText>Assigned user groups {assignedUserGroupsPopover}</TabTitleText>}
          ouiaId={`${ouiaId}-assigned-groups-tab`}
        >
          <AssignedUserGroupsTable viewedRole={selectedRole} />
        </Tab>
      </Tabs>
    </DrawerPanelContent>
  );
};

export default RolesDetails;
