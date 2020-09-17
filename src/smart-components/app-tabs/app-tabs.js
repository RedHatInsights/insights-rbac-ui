import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Tabs, Tab } from '@patternfly/react-core';
import './app-tabs.scss';

const AppTabs = ({ history: { push }, location: { pathname }, tabItems, isHeader }) => {
  const activeTab = tabItems.find(({ name }) => pathname.includes(name));
  const handleTabClick = (_event, tabIndex) => push(tabItems[tabIndex].name);

  return (
    <Tabs className={isHeader ? `ins-rbac-page-header__tabs` : ''} activeKey={activeTab ? activeTab.eventKey : 0} onSelect={handleTabClick}>
      {tabItems.map((item) => (
        <Tab title={item.title} key={item.eventKey} eventKey={item.eventKey} name={item.name} />
      ))}
    </Tabs>
  );
};

AppTabs.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }),
  tabItems: PropTypes.array.isRequired,
  isHeader: PropTypes.bool,
};

export default withRouter(AppTabs);
