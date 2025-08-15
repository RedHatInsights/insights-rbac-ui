import { DataViewEventsProvider } from '@patternfly/react-data-view';
import React from 'react';
import GroupDetailsDrawer from './user-group-detail/GroupDetailsDrawer';
import { TabContent } from '@patternfly/react-core';
import UserGroupsTable from './UserGroupsTable';
import { Group } from '../../../../redux/reducers/group-reducer';

interface UserGroupsViewProps {
  groupsRef?: React.Ref<HTMLElement>;
}

const UserGroupsView: React.FunctionComponent<UserGroupsViewProps> = ({ groupsRef }) => {
  const [focusedGroup, setFocusedGroup] = React.useState<Group | undefined>(undefined);

  return (
    <DataViewEventsProvider>
      <GroupDetailsDrawer ouiaId="groups-details-drawer" focusedGroup={focusedGroup} setFocusedGroup={setFocusedGroup}>
        <TabContent eventKey={1} id="groupsTab" ref={groupsRef} aria-label="Groups tab">
          <UserGroupsTable focusedGroup={focusedGroup} />
        </TabContent>
      </GroupDetailsDrawer>
    </DataViewEventsProvider>
  );
};

export default UserGroupsView;
