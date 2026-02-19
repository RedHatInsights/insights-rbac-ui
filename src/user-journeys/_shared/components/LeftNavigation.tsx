import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nav, NavExpandable, NavItem, NavList } from '@patternfly/react-core';

/**
 * Left navigation panel component for Storybook journeys
 * Uses PatternFly 6 Nav components for proper styling
 */
export const LeftNavigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Nav aria-label="User Access Navigation">
      <NavList>
        <NavItem isActive={isActive('/iam/my-user-access')}>
          <Link to="/iam/my-user-access">My User Access</Link>
        </NavItem>

        <NavExpandable title="User Access" isExpanded={true} isActive={isActive('/iam/user-access')}>
          <NavItem isActive={isActive('/iam/user-access/overview')}>
            <Link to="/iam/user-access/overview">Overview</Link>
          </NavItem>
          <NavItem isActive={isActive('/iam/user-access/users')}>
            <Link to="/iam/user-access/users">Users</Link>
          </NavItem>
          <NavItem isActive={isActive('/iam/user-access/roles')}>
            <Link to="/iam/user-access/roles">Roles</Link>
          </NavItem>
          <NavItem isActive={isActive('/iam/user-access/groups')}>
            <Link to="/iam/user-access/groups">Groups</Link>
          </NavItem>
          <NavItem isActive={isActive('/iam/user-access/audit-log')}>
            <Link to="/iam/user-access/audit-log">Audit Log</Link>
          </NavItem>
        </NavExpandable>
      </NavList>
    </Nav>
  );
};
