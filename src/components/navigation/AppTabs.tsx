import React from 'react';
import { Tab, Tabs } from '@patternfly/react-core';
import { useLocation, useNavigate } from 'react-router-dom';
import './AppTabs.scss';

/**
 * Tab item structure for AppTabs component
 *
 * @interface TabItem
 * @description Represents a single tab item in the navigation
 */
export interface TabItem {
  /** Unique event key for the tab */
  eventKey: number;
  /** Display title for the tab */
  title: string;
  /** Route name to match against current pathname */
  name: string;
  /** Route path to navigate to when tab is clicked */
  to: string;
}

/**
 * Props for the AppTabs component
 *
 * @interface AppTabsProps
 * @description Props for rendering a tab navigation component
 */
export interface AppTabsProps {
  /** Array of tab items to display */
  tabItems: TabItem[];
  /** Whether this is a header tab component (affects CSS class) */
  isHeader?: boolean;
}

/**
 * AppTabs Component
 *
 * A presentational component that renders tab navigation using PatternFly components.
 * Automatically determines the active tab based on the current route and handles navigation.
 *
 * @component
 * @param {AppTabsProps} props - The component props
 * @returns {JSX.Element} The rendered tab navigation component
 *
 * @example
 * ```tsx
 * <AppTabs
 *   tabItems={[
 *     { eventKey: 0, title: 'Roles', name: '/groups/test-group-1/roles', to: 'roles' },
 *     { eventKey: 1, title: 'Members', name: '/groups/test-group-1/members', to: 'members' },
 *   ]}
 *   isHeader={true}
 * />
 * ```
 */
const AppTabs: React.FC<AppTabsProps> = ({ tabItems, isHeader = false }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = tabItems.find(({ name }) => pathname.includes(name));

  const handleTabClick = (_event: React.MouseEvent, eventKey: string | number) => {
    const tabIndex = tabItems.findIndex((item) => item.eventKey === eventKey);
    if (tabIndex !== -1) {
      navigate(tabItems[tabIndex].to);
    }
  };

  return (
    <Tabs className={isHeader ? 'rbac-page-header__tabs' : ''} activeKey={activeTab ? activeTab.eventKey : 0} onSelect={handleTabClick}>
      {tabItems.map((item) => (
        <Tab title={item.title} key={item.eventKey} eventKey={item.eventKey} name={item.name} />
      ))}
    </Tabs>
  );
};

export { AppTabs };
