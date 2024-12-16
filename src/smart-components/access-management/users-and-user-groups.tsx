import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { PageSection, PageSectionVariants, Tab, Tabs } from '@patternfly/react-core';
import ContentHeader from '@patternfly/react-component-groups/dist/dynamic/ContentHeader';
import Messages from '../../Messages';
// import UsersTable from './UsersTable';
// import UserGroupsTable from './UserGroupsTable';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User } from '../../redux/reducers/user-reducer';
// import { Group } from '../../redux/reducers/group-reducer';
// import GroupDetailsDrawer from './GroupDetailsDrawer';
// import { DataViewEventsProvider } from '@patternfly/react-data-view';
// import UserDetailsDrawer from './UserDetailsDrawer';
import AddUserToGroupModal from './AddUserToGroupModal';

const TAB_NAMES = ['users', 'user-groups'];

const UsersAndUserGroups: React.FunctionComponent = () => {
  const intl = useIntl();
  const [activeTabKey, setActiveTabKey] = React.useState<number>(0);
  const [isAddUserToGroupModalOpen, setIsAddUserToGroupModalOpen] = React.useState<boolean>(false);
  const [selectedUsers] = React.useState<User[]>([]);
  // const [focusedUser, setFocusedUser] = React.useState<User | undefined>(undefined);
  // const [focusedGroup, setFocusedGroup] = React.useState<Group | undefined>(undefined);
  const usersRef = React.createRef<HTMLElement>();
  const groupsRef = React.createRef<HTMLElement>();

  const navigate = useNavigate();
  const location = useLocation();

  const updateURL = (tabKey: string) => {
    const params = new URLSearchParams(location.search);
    params.set('activeTab', tabKey.toString());
    navigate({ search: params.toString() });
  };

  const handleTabSelect = (_: React.MouseEvent<HTMLElement, MouseEvent>, key: string | number) => {
    const activeTab = Number(key);
    setActiveTabKey(activeTab);
    updateURL(TAB_NAMES[activeTab]);
  };

  // const handleOpenAddUserToGroupModal = (selected: User[]) => {
  //   if (selected.length > 0) {
  //     setSelectedUsers(selected);
  //     setIsAddUserToGroupModalOpen(true);
  //   }
  // };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabKey = params.get('activeTab');
    tabKey && setActiveTabKey(Number(TAB_NAMES.findIndex((val) => val === tabKey)));
  }, [location.search]);

  return (
    <React.Fragment>
      <AddUserToGroupModal isOpen={isAddUserToGroupModalOpen} setIsOpen={setIsAddUserToGroupModalOpen} selectedUsers={selectedUsers} />
      <ContentHeader title={intl.formatMessage(Messages.usersAndUserGroups)} subtitle={intl.formatMessage(Messages.usersAndUserGroupsDescription)} />
      <PageSection type="tabs" variant={PageSectionVariants.light} isWidthLimited>
        <Tabs
          activeKey={activeTabKey}
          onSelect={handleTabSelect}
          inset={{
            default: 'insetNone',
            md: 'insetSm',
            xl: 'insetLg',
            '2xl': 'inset2xl',
          }}
          role="region"
        >
          <Tab eventKey={0} title={intl.formatMessage(Messages.users)} tabContentId="usersTab" tabContentRef={usersRef} ouiaId="users-tab-button" />
          <Tab
            eventKey={1}
            title={intl.formatMessage(Messages.userGroups)}
            tabContentId="groupsTab"
            tabContentRef={groupsRef}
            ouiaId="user-groups-tab-button"
          />
        </Tabs>
      </PageSection>
      <PageSection padding={{ default: 'noPadding' }}>
        {/* {activeTabKey === 0 && (
          <DataViewEventsProvider>
            <UserDetailsDrawer ouiaId="user-details-drawer" setFocusedUser={setFocusedUser} focusedUser={focusedUser}>
              <TabContent eventKey={0} id="usersTab" ref={usersRef} aria-label="Users tab">
                <UsersTable onAddUserClick={handleOpenAddUserToGroupModal} focusedUser={focusedUser} />
              </TabContent>
            </UserDetailsDrawer>
          </DataViewEventsProvider>
        )}
        {activeTabKey === 1 && (
          <DataViewEventsProvider>
            <GroupDetailsDrawer ouiaId="groups-details-drawer" focusedGroup={focusedGroup} setFocusedGroup={setFocusedGroup}>
              <TabContent eventKey={1} id="groupsTab" ref={groupsRef} aria-label="Groups tab">
                <UserGroupsTable focusedGroup={focusedGroup} />
              </TabContent>
            </GroupDetailsDrawer>
          </DataViewEventsProvider>
        )} */}
        <Outlet />
      </PageSection>
    </React.Fragment>
  );
};

export default UsersAndUserGroups;
