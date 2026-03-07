import React, { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Outlet, useLocation } from 'react-router-dom';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Tab } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Tabs } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import PageHeader from '@patternfly/react-component-groups/dist/dynamic/PageHeader';
import useAppNavigate from '../../../shared/hooks/useAppNavigate';
import pathnames from '../../utilities/pathnames';
import messages from '../../../Messages';

const MyAccess: React.FunctionComponent = () => {
  const intl = useIntl();
  const groupsRef = React.createRef<HTMLElement>();
  const workspacesRef = React.createRef<HTMLElement>();

  const navigate = useAppNavigate();
  const location = useLocation();
  const activeTabIndex = useMemo(() => Number(location.pathname.includes(pathnames['my-access-workspaces'].link())), [location.pathname]);

  useEffect(() => {
    if (location.pathname.endsWith(pathnames['my-access'].link())) {
      navigate(pathnames['my-access-groups'].link(), { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleTabSelect = (_: React.MouseEvent<HTMLElement, MouseEvent>, key: string | number) => {
    if (activeTabIndex !== Number(key)) {
      navigate((activeTabIndex ? pathnames['my-access-groups'] : pathnames['my-access-workspaces']).link(), {
        replace: true,
      });
    }
  };

  return (
    <React.Fragment>
      <PageHeader title={intl.formatMessage(messages.myAccess)} subtitle={intl.formatMessage(messages.myAccessDescription)} />
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
          <Tab
            eventKey={0}
            title={intl.formatMessage(messages.myGroups)}
            tabContentId="myGroupsTab"
            tabContentRef={groupsRef}
            ouiaId="my-groups-tab-button"
          />
          <Tab
            eventKey={1}
            title={intl.formatMessage(messages.myWorkspaces)}
            tabContentId="myWorkspacesTab"
            tabContentRef={workspacesRef}
            ouiaId="my-workspaces-tab-button"
          />
        </Tabs>
      </PageSection>
      <PageSection hasBodyWrapper={false} padding={{ default: 'noPadding' }}>
        <Outlet
          context={{
            [pathnames['my-access-groups'].path]: {
              groupsRef,
            },
            [pathnames['my-access-workspaces'].path]: {
              workspacesRef,
            },
          }}
        />
      </PageSection>
    </React.Fragment>
  );
};

export { MyAccess };
export default MyAccess;
