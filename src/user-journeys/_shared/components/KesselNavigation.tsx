import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nav, NavExpandable, NavItem, NavList } from '@patternfly/react-core';

/**
 * Left navigation panel component for Management Fabric journey tests
 * Uses PatternFly 6 Nav components for proper styling
 * Reflects the new Access Management navigation structure
 */
export const KesselNavigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Nav aria-label="Identity & Access Management Navigation">
      <NavList>
        <NavItem isActive={isActive('/iam/my-user-access')}>
          <Link to="/iam/my-user-access">My User Access</Link>
        </NavItem>

        <NavExpandable title="Access Management" isExpanded={true} isActive={isActive('/iam/access-management') || isActive('/iam/user-access')}>
          <NavItem isActive={isActive('/iam/access-management/overview') || isActive('/iam/user-access/overview')}>
            <Link to="/iam/access-management/overview">Overview</Link>
          </NavItem>
          <NavItem isActive={isActive('/iam/access-management/workspaces') || isActive('/iam/user-access/workspaces')}>
            <Link to="/iam/access-management/workspaces">Workspaces</Link>
          </NavItem>
          <NavItem isActive={isActive('/iam/access-management/users-and-user-groups')}>
            <Link to="/iam/access-management/users-and-user-groups">Users and User Groups</Link>
          </NavItem>
          <NavItem isActive={isActive('/iam/access-management/roles') || isActive('/iam/user-access/roles')}>
            <Link to="/iam/access-management/roles">Roles</Link>
          </NavItem>
          {/* External app - not linked */}
          <NavItem isActive={false}>
            <span style={{ color: 'var(--pf-v6-global--disabled-color--100)', cursor: 'default' }}>Red Hat Access Requests</span>
          </NavItem>
        </NavExpandable>
      </NavList>
    </Nav>
  );
};
