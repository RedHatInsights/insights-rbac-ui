import ContentHeader from '@patternfly/react-component-groups/dist/dynamic/ContentHeader';
import React from 'react';
import { useIntl } from 'react-intl';
import Messages from '../../Messages';
import { PageSection, PageSectionVariants, Tab, TabContent, Tabs } from '@patternfly/react-core';
import UsersTable from './UsersTable';
import UserGroupsTable from './UserGroupsTable';

const UsersAndUserGroups = () => {
  const intl = useIntl();
  const [activeTabKey, setActiveTabKey] = React.useState(0);
  const usersRef = React.createRef();
  const groupsRef = React.createRef();

  return (
    <React.Fragment>
      <ContentHeader title={intl.formatMessage(Messages.usersAndUserGroups)} subtitle={intl.formatMessage(Messages.usersAndUserGroupsDescription)} />
      <PageSection type="tabs" variant={PageSectionVariants.light} isWidthLimited>
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_, key) => setActiveTabKey(key)}
          inset={{
            default: 'insetNone',
            md: 'insetSm',
            xl: 'insetLg',
            '2xl': 'inset2xl',
          }}
          role="region"
        >
          <Tab eventKey={0} title={intl.formatMessage(Messages.users)} tabContentId="usersTab" tabContentRef={usersRef} />
          <Tab eventKey={1} title={intl.formatMessage(Messages.userGroups)} tabContentId="groupsTab" tabContentRef={groupsRef} />
        </Tabs>
      </PageSection>
      <PageSection>
        <TabContent eventKey={0} id="usersTab" ref={usersRef} aria-label="Users tab">
          <UsersTable />
        </TabContent>
        <TabContent eventKey={1} id="groupsTab" ref={groupsRef} aria-label="Groups tab" hidden>
          <UserGroupsTable />
        </TabContent>
      </PageSection>
    </React.Fragment>
  );
};

export default UsersAndUserGroups;
