import { Tab as PFTab, Tabs as PFTabs, TabsProps } from '@patternfly/react-core';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './app-tabs.scss';

type AppTabsProps = {
  tabItems: { title: string; name: string; to: string; eventKey?: any }[];
  isHeader: boolean;
};

const AppTabs: React.FC<AppTabsProps> = ({ tabItems, isHeader }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = tabItems.find(({ name }) => pathname.includes(name));

  const handleTabClick: TabsProps['onSelect'] = (_event, tabIndex) =>
    navigate(tabItems[typeof tabIndex === 'string' ? parseInt(tabIndex, 10) : tabIndex].to);

  return (
    <PFTabs className={isHeader ? `rbac-page-header__tabs` : ''} activeKey={activeTab?.eventKey || 0} onSelect={handleTabClick}>
      {tabItems.map((item) => (
        <PFTab title={item.title} key={item.eventKey} eventKey={item.eventKey} name={item.name} />
      ))}
    </PFTabs>
  );
};

export default AppTabs;
