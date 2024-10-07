import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Role } from '../../redux/reducers/role-reducer';
import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelContent,
  Title,
  Tabs,
  TabTitleText,
  Tab,
  Tooltip,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import Messages from '../../Messages';
import { RolePermissionsTable } from './RolePermissionsTable';
import { AssignedUserGroupsTable } from './AssignedUserGroupsTable';

interface RolesDetailProps {
  selectedRole?: Role;
  setSelectedRole: React.Dispatch<React.SetStateAction<Role | undefined>>;
}

const RolesDetails: React.FunctionComponent<RolesDetailProps> = ({ selectedRole, setSelectedRole }) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const context = useDataViewEventsContext();
  const intl = useIntl();

  const handleTabClick = (_event: any, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  useEffect(() => {
    const unsubscribe = context.subscribe(EventTypes.rowClick, (role: Role) => {
      setSelectedRole(role);
    });
    return () => unsubscribe();
  }, []);

  const tooltipContent = (
    <TextContent>
      <Text component={TextVariants.p}>{intl.formatMessage(Messages.assignedUserGroupsTooltipHeader)}</Text>
      <Text component={TextVariants.small}>{intl.formatMessage(Messages.assignedUserGroupsTooltipBody)}</Text>
    </TextContent>
  );

  const assignedUserGroupsTooltip = (
    <Tooltip content={tooltipContent} style={{ backgroundColor: '#fff' }}>
      <OutlinedQuestionCircleIcon />
    </Tooltip>
  );

  return (
    <DrawerPanelContent>
      <DrawerHead>
        <Title className="pf-v5-u-mb-md" headingLevel="h2" ouiaId="detail-drawer-title">
          {selectedRole?.display_name}
        </Title>
        <DrawerActions>
          <DrawerCloseButton onClick={() => setSelectedRole(undefined)} data-ouia-component-id="detail-drawer-close-btn" />
        </DrawerActions>
      </DrawerHead>
      <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
        <Tab eventKey={0} title={<TabTitleText>Permissions</TabTitleText>}>
          <RolePermissionsTable viewedRole={selectedRole} />
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Assigned user groups {assignedUserGroupsTooltip}</TabTitleText>}>
          <AssignedUserGroupsTable viewedRole={selectedRole} />
        </Tab>
      </Tabs>
    </DrawerPanelContent>
  );
};

export default RolesDetails;
