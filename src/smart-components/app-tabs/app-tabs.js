import React from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab } from '@patternfly/react-core';
import './app-tabs.scss';
import { useLocation, useNavigate } from 'react-router-dom';

const AppTabs = ({ tabItems, isHeader }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = tabItems.find(({ name }) => pathname.includes(name));
  const handleTabClick = (_event, tabIndex) => navigate(tabItems[tabIndex].to);

  return (
    <Tabs className={isHeader ? `rbac-page-header__tabs` : ''} activeKey={activeTab ? activeTab.eventKey : 0} onSelect={handleTabClick}>
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

export default AppTabs;
