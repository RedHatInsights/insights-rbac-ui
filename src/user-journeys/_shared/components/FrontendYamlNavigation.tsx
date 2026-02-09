import React, { useContext, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nav, NavExpandable, NavItem, NavList } from '@patternfly/react-core';
import yaml from 'yaml';
import { useMockState } from '../../../../.storybook/contexts/StorybookMockContext';
import { FeatureFlagsContext } from '../../../../.storybook/context-providers';

// Import frontend.yaml as raw text

// @ts-ignore - Webpack raw loader
import frontendYamlRaw from '../../../../deploy/frontend.yaml?raw';

// =============================================================================
// Types matching frontend.yaml structure
// =============================================================================

interface NavPermission {
  method: 'loosePermissions' | 'isOrgAdmin' | 'featureFlag';
  args?: (string | string[] | boolean)[];
}

interface NavItemConfig {
  id: string;
  title: string;
  href?: string;
  expandable?: boolean;
  permissions?: NavPermission[];
  routes?: NavItemConfig[];
  segmentRef?: { frontendName: string; segmentId: string };
}

interface FrontendYamlStructure {
  objects: Array<{
    spec: {
      bundleSegments: Array<{
        navItems: NavItemConfig[];
      }>;
    };
  }>;
}

// =============================================================================
// Permission Matching Logic
// =============================================================================

/**
 * Match a single permission against user's permissions
 *
 * Wildcard logic:
 * - User with rbac:*:* CAN access routes requiring rbac:group:read (wildcard covers specific)
 * - User with rbac:group:read CANNOT access routes requiring rbac:*:* (specific doesn't cover wildcard)
 *
 * This means wildcards in USER permissions expand access, but wildcards in REQUIRED
 * permissions mean "user must have wildcard access".
 */
function matchPermission(required: string, userPermissions: string[]): boolean {
  // Direct match
  if (userPermissions.includes(required)) return true;

  // Check if any user permission (with wildcards) covers the required permission
  const requiredParts = required.split(':');
  for (const userPerm of userPermissions) {
    const userParts = userPerm.split(':');
    if (userParts.length !== requiredParts.length) continue;

    // User's wildcards can match any required value, but required wildcards
    // can ONLY match user's wildcards (not specific values)
    const matches = requiredParts.every((reqPart, i) => {
      const userPart = userParts[i];
      // User has wildcard - matches anything
      if (userPart === '*') return true;
      // Exact match
      if (userPart === reqPart) return true;
      // Required is wildcard but user doesn't have wildcard - no match
      return false;
    });

    if (matches) return true;
  }

  return false;
}

/**
 * Evaluate loosePermissions - OR logic across inner arrays
 * Format: [['perm1'], ['perm2']] means perm1 OR perm2
 * Format: [['perm1', 'perm2']] means perm1 AND perm2
 */
function evaluateLoosePermissions(args: (string | string[])[], userPermissions: string[]): boolean {
  // args is array of arrays: [['perm1'], ['perm2']]
  const permGroups = args.filter((arg): arg is string[] => Array.isArray(arg));

  if (permGroups.length === 0) return true;

  // OR logic across groups
  return permGroups.some((group) =>
    // AND logic within each group
    group.every((perm) => matchPermission(perm, userPermissions)),
  );
}

// =============================================================================
// Navigation Context Hook
// =============================================================================

interface NavigationContext {
  userPermissions: string[];
  isOrgAdmin: boolean;
  featureFlags: Record<string, boolean>;
}

/**
 * Check if a nav item should be visible based on permissions
 */
function canAccessNavItem(item: NavItemConfig, ctx: NavigationContext): boolean {
  if (!item.permissions || item.permissions.length === 0) return true;

  // All permissions must pass (AND logic)
  return item.permissions.every((perm) => {
    switch (perm.method) {
      case 'isOrgAdmin':
        return ctx.isOrgAdmin;

      case 'featureFlag': {
        const [flagName, expectedValue] = perm.args as [string, boolean];
        return (ctx.featureFlags[flagName] ?? false) === expectedValue;
      }

      case 'loosePermissions':
        return evaluateLoosePermissions(perm.args as (string | string[])[], ctx.userPermissions);

      default:
        return true;
    }
  });
}

/**
 * Filter nav items based on permissions and feature flags
 */
function filterNavItems(items: NavItemConfig[], ctx: NavigationContext, depth = 0): NavItemConfig[] {
  return items
    .filter((item) => {
      // Skip external segment refs
      if (item.segmentRef) return false;
      return canAccessNavItem(item, ctx);
    })
    .map((item) => ({
      ...item,
      routes: item.routes ? filterNavItems(item.routes, ctx, depth + 1) : undefined,
    }))
    .filter((item) => {
      // Remove expandable items with no visible routes
      if (item.expandable && (!item.routes || item.routes.length === 0)) {
        return false;
      }
      return true;
    });
}

// =============================================================================
// Parse YAML
// =============================================================================

function parseNavItems(): NavItemConfig[] {
  try {
    const parsed = yaml.parse(frontendYamlRaw) as FrontendYamlStructure;
    const navItems = parsed.objects?.[0]?.spec?.bundleSegments?.[0]?.navItems;
    return navItems || [];
  } catch (e) {
    console.error('Failed to parse frontend.yaml:', e);
    return [];
  }
}

// Parse once at module load
const allNavItems = parseNavItems();

// =============================================================================
// Navigation Component
// =============================================================================

/**
 * Dynamic navigation component that reads from frontend.yaml
 * and filters based on current user permissions and feature flags.
 *
 * This ensures Storybook navigation always matches the production config.
 */
export const FrontendYamlNavigation: React.FC = () => {
  const location = useLocation();
  const { permissions, isOrgAdmin } = useMockState();
  const featureFlags = useContext(FeatureFlagsContext);

  // Filter nav items based on current context
  // All dependencies are stable values (not hooks), so useMemo is safe
  const visibleItems = useMemo(() => {
    const ctx: NavigationContext = {
      userPermissions: permissions,
      isOrgAdmin,
      featureFlags,
    };
    return filterNavItems(allNavItems, ctx);
  }, [permissions, isOrgAdmin, featureFlags]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  // Render a single nav item
  const renderNavItem = (item: NavItemConfig) => {
    if (item.expandable && item.routes) {
      // Check if any child routes match current path
      const isExpandableActive = item.routes.some((route) => route.href && isActive(route.href));

      return (
        <NavExpandable key={item.id} title={item.title} isExpanded={true} isActive={isExpandableActive}>
          {item.routes.map(renderNavItem)}
        </NavExpandable>
      );
    }

    if (item.href) {
      return (
        <NavItem key={item.id} isActive={isActive(item.href)}>
          <Link to={item.href}>{item.title}</Link>
        </NavItem>
      );
    }

    return null;
  };

  return (
    <Nav aria-label="Identity & Access Management Navigation">
      <NavList>{visibleItems.map(renderNavItem)}</NavList>
    </Nav>
  );
};

export default FrontendYamlNavigation;
