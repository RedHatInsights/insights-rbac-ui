import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Tabs, Tab } from '@patternfly/react-core';

const tabItems = [{ eventKey: 0, title: 'Groups', name: '/groups' }];

const AppTabs = ({ history: { push }, location: { pathname }}) => {
  const activeTab = tabItems.find(({ name }) => pathname.includes(name));
  const handleTabClick = (_event, tabIndex) => push(tabItems[tabIndex].name);

  return (
    <Tabs className="pf-u-mt-md" activeKey={ activeTab ? activeTab.eventKey : 0 } onSelect={ handleTabClick }>
      { tabItems.map((item) => <Tab title={ item.title } key={ item.eventKey } eventKey={ item.eventKey } name={ item.name }/>) }
    </Tabs>
  );
};

AppTabs.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired
  }),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  })
};

export default withRouter(AppTabs);
