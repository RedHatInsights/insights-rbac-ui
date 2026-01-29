import React, { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Outlet, useLocation } from 'react-router-dom';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';

import { Tab } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Tabs } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import PageHeader from '@patternfly/react-component-groups/dist/dynamic/PageHeader';
import useAppNavigate from '../../../hooks/useAppNavigate';
import pathnames from '../../../utilities/pathnames';
import Messages from '../../../Messages';

const UsersAndUserGroups: React.FunctionComponent = () => {
  const intl = useIntl();
  const usersRef = React.createRef<HTMLElement>();
  const groupsRef = React.createRef<HTMLElement>();

  const navigate = useAppNavigate();
  const location = useLocation();
  const activeTabIndex = useMemo(() => Number(location.pathname.endsWith(pathnames['user-groups'].link())), [location.pathname]);

  useEffect(() => {
    location.pathname.endsWith(pathnames['users-and-user-groups'].link()) && navigate(pathnames['users-new'].link(), { replace: true });
  }, [location.pathname, navigate]);

  const handleTabSelect = (_: React.MouseEvent<HTMLElement, MouseEvent>, key: string | number) => {
    activeTabIndex !== Number(key) &&
      navigate((activeTabIndex ? pathnames['users-new'] : pathnames['user-groups']).link(), {
        replace: true,
      });
  };

  return (
    <React.Fragment>
      <PageHeader
        data-codemods
        title={intl.formatMessage(Messages.usersAndUserGroups)}
        subtitle={intl.formatMessage(Messages.usersAndUserGroupsDescription)}
      />
      <PageSection hasBodyWrapper type="tabs" isWidthLimited>
        <Tabs
          activeKey={activeTabIndex}
          onSelect={handleTabSelect}
          inset={{
            default: 'insetNone',
            md: 'insetSm',
            xl: 'insetLg',
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
      <PageSection hasBodyWrapper={false} padding={{ default: 'noPadding' }}>
        <Outlet
          context={{
            [pathnames['users-new'].path]: {
              usersRef,
            },
            [pathnames['user-groups'].path]: {
              groupsRef,
            },
          }}
        />
      </PageSection>
    </React.Fragment>
  );
};

// Export both named and default for feature containers
export { UsersAndUserGroups };
export default UsersAndUserGroups;
