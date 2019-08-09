import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Tabs, Tab } from '@patternfly/react-core';

const groupTabs = [{ eventKey: 0, title: 'Members', name: '/members' }, { eventKey: 0, title: 'Policies', name: '/policies' }];

const Group = ({ history: { push }, location: { pathname }}) => {
  const activeTab = groupTabs.find(({ name }) => pathname.includes(name));
  const handleTabClick = (_event, tabIndex) => push(groupTabs[tabIndex].name);

  return (
    <Tabs className="pf-u-mt-md" activeKey={ activeTab ? activeTab.eventKey : 0 } onSelect={ handleTabClick }>
      { groupTabs.map((item) => <Tab title={ item.title } key={ item.eventKey } eventKey={ item.eventKey } name={ item.name }/>) }
    </Tabs>
  );
};

Group.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired
  }),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  })
};

export default withRouter(Group);
