import React, { useEffect } from 'react';
import { Role } from '../../redux/reducers/role-reducer';
import { DrawerActions, DrawerCloseButton, DrawerHead, DrawerPanelContent, Title, Tabs, TabTitleText, Tab } from '@patternfly/react-core';
import { EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';

import { RolePermissionsTable } from './RolePermissionsTable';

interface RolesDetailProps {
  selectedRole?: Role;
  setSelectedRole: React.Dispatch<React.SetStateAction<Role | undefined>>;
}

const RolesDetails: React.FunctionComponent<RolesDetailProps> = ({ selectedRole, setSelectedRole }) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const context = useDataViewEventsContext();

  const handleTabClick = (_event: any, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  useEffect(() => {
    const unsubscribe = context.subscribe(EventTypes.rowClick, (role: Role) => {
      setSelectedRole(role);
    });
    return () => unsubscribe();
  }, []);

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
        <Tab eventKey={1} title={<TabTitleText>Assigned user groups</TabTitleText>}>
          Assigned user groups table here
        </Tab>
      </Tabs>
    </DrawerPanelContent>
  );
};

export default RolesDetails;
