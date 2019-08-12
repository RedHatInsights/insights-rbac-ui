import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Tabs, Tab } from '@patternfly/react-core';
import { Section } from '@redhat-cloud-services/frontend-components';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';

const groupTabs = [{ eventKey: 0, title: 'Members', name: '/members' }, { eventKey: 0, title: 'Policies', name: '/policies' }];
// TODOD - add the current group id in the path

const Group = ({ history: { push }, location: { pathname }, groupName }) => {
  const activeTab = groupTabs.find(({ name }) => pathname.includes(name));
  const handleTabClick = (_event, tabIndex) => push(groupTabs[tabIndex].name);

  const breadcrumbsList = () => [
    { title: 'Groups', to: '/groups' },
    { title: 'Group', isActive: true }
  ];

  const renderToolbar = () => (<TopToolbar breadcrumbs={ breadcrumbsList() } paddingBottom={ true }>
    <TopToolbarTitle title = { `${groupName}` }>
    </TopToolbarTitle>
  </TopToolbar>);

  return (
    <Fragment>
      { renderToolbar() }
      <Section className="data-table-pane">
        <Tabs className="pf-u-mt-md" activeKey={ activeTab ? activeTab.eventKey : 0 } onSelect={ handleTabClick }>
          { groupTabs.map((item) => <Tab title={ item.title } key={ item.eventKey } eventKey={ item.eventKey } name={ item.name }/>) }
        </Tabs>
      </Section>
    </Fragment>
  );
};

Group.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired
  }),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }),
  groupName: PropTypes.string
};

export default withRouter(Group);
