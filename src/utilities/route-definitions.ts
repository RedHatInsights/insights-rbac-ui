/**
 * Route permission definitions - single source of truth
 *
 * This file contains all route paths and their permission requirements.
 * It is imported by:
 * - src/Routing.tsx (for rendering routes with PermissionGuard)
 * - scripts/validate-permissions.ts (for validating against frontend.yaml)
 *
 * Note: Feature flag conditions are handled in Routing.tsx, not here.
 * This file only defines WHAT permissions each route requires.
 */

export interface RouteDefinition {
  /** Route path (relative to /iam basename) */
  path: string;
  /** Required permissions (empty = public route) */
  permissions: string[];
  /** If true, requires orgAdmin platform flag instead of/in addition to permissions */
  requireOrgAdmin?: boolean;
  /** true = AND logic (all permissions required), false = OR logic (any permission) */
  checkAll?: boolean;
  /** true = inherit parent permissions (default), false = own permissions only */
  inheritPermissions?: boolean;
  /** Nested child routes */
  childRoutes?: RouteDefinition[];
}

/**
 * All route definitions with their permission requirements.
 *
 * Routes are organized by section and match the structure in Routing.tsx.
 * Child route paths are relative to their parent.
 */
export const routeDefinitions: RouteDefinition[] = [
  // ===========================================
  // Access Management (V2) - Users & User Groups
  // ===========================================
  {
    path: '/access-management/users-and-user-groups',
    permissions: ['rbac:principal:read', 'rbac:group:read'],
    checkAll: false, // OR logic - can see if has users OR groups permission
    childRoutes: [
      {
        path: 'users',
        permissions: ['rbac:principal:read'],
        inheritPermissions: false,
        childRoutes: [
          {
            path: 'invite',
            permissions: ['rbac:principal:write'],
          },
        ],
      },
      {
        path: 'user-groups',
        permissions: ['rbac:group:read'],
        inheritPermissions: false,
        childRoutes: [
          {
            path: 'create-user-group',
            permissions: ['rbac:group:write'],
          },
        ],
      },
    ],
  },
  {
    path: '/access-management/users-and-user-groups/edit-group/:groupId',
    permissions: ['rbac:group:write'],
  },
  {
    path: '/access-management/users-and-user-groups/create-group',
    permissions: ['rbac:group:write'],
  },

  // ===========================================
  // Access Management (V2) - Workspaces
  // ===========================================
  {
    path: '/access-management/workspaces',
    permissions: ['inventory:groups:read'],
    childRoutes: [
      {
        path: 'create-workspace',
        permissions: ['inventory:groups:write'],
      },
      {
        path: 'edit/:workspaceId',
        permissions: ['inventory:groups:write'],
      },
    ],
  },

  // ===========================================
  // Access Management (V2) - Roles
  // ===========================================
  {
    path: '/access-management/roles',
    permissions: ['rbac:role:read'],
    childRoutes: [
      {
        path: 'add-role',
        permissions: ['rbac:role:write'],
      },
    ],
  },
  {
    path: '/access-management/roles/edit/:roleId',
    permissions: ['rbac:role:write'],
  },

  // ===========================================
  // User Access (V1) - Overview
  // ===========================================
  {
    path: '/user-access/overview',
    permissions: ['rbac:*:read'],
  },

  // ===========================================
  // User Access (V1) - Workspaces
  // ===========================================
  {
    path: '/user-access/workspaces',
    permissions: ['inventory:groups:read'],
    childRoutes: [
      {
        path: 'create-workspace',
        permissions: ['inventory:groups:write'],
      },
      {
        path: 'edit/:workspaceId',
        permissions: ['inventory:groups:write'],
      },
    ],
  },

  // ===========================================
  // User Access (V1) - Workspace Detail
  // ===========================================
  {
    path: '/user-access/workspaces/detail/:workspaceId',
    permissions: ['inventory:groups:read'],
    childRoutes: [
      {
        path: 'edit',
        permissions: ['inventory:groups:write'],
      },
    ],
  },

  // ===========================================
  // Organization Management
  // Requires orgAdmin platform flag (not the same as rbac:*:* permission)
  // ===========================================
  {
    path: '/organization-management/organization-wide-access',
    permissions: [],
    requireOrgAdmin: true,
  },

  // ===========================================
  // User Access (V1) - Users
  // ===========================================
  {
    path: '/user-access/users',
    permissions: ['rbac:principal:read'],
    childRoutes: [
      {
        path: 'invite',
        permissions: ['rbac:principal:write'],
      },
    ],
  },

  // ===========================================
  // User Access (V1) - User Detail
  // ===========================================
  {
    path: '/user-access/users/detail/:username',
    permissions: ['rbac:principal:read'],
    childRoutes: [
      {
        path: 'add-to-group',
        permissions: ['rbac:principal:write'],
      },
      {
        path: 'add-group-roles/:groupId',
        permissions: ['rbac:group:write'],
      },
    ],
  },

  // ===========================================
  // User Access (V1) - Roles
  // ===========================================
  {
    path: '/user-access/roles',
    permissions: ['rbac:role:read'],
    childRoutes: [
      {
        path: ':roleId/add-group-roles/:groupId',
        permissions: [], // Inherits read from parent
      },
      {
        path: 'add-role',
        permissions: ['rbac:role:write'],
      },
      {
        path: 'remove/:roleId',
        permissions: ['rbac:role:write'],
      },
      {
        path: 'edit/:roleId',
        permissions: ['rbac:role:write'],
      },
    ],
  },

  // ===========================================
  // User Access (V1) - Role Detail
  // ===========================================
  {
    path: '/user-access/roles/detail/:roleId',
    permissions: ['rbac:role:read'],
    childRoutes: [
      {
        path: 'remove',
        permissions: ['rbac:role:write'],
      },
      {
        path: 'edit',
        permissions: ['rbac:role:write'],
      },
      {
        path: 'role-add-permission',
        permissions: ['rbac:role:write'],
      },
    ],
  },

  // ===========================================
  // User Access (V1) - Role Permission Detail
  // ===========================================
  {
    path: '/user-access/roles/detail/:roleId/permission/:permissionId',
    permissions: ['rbac:role:read'],
    childRoutes: [
      {
        path: 'edit',
        permissions: ['rbac:role:write'],
      },
    ],
  },

  // ===========================================
  // User Access (V1) - Groups
  // ===========================================
  {
    path: '/user-access/groups',
    permissions: ['rbac:group:read'],
    childRoutes: [
      {
        path: 'add-group',
        permissions: ['rbac:group:write'],
      },
      {
        path: 'edit/:groupId',
        permissions: ['rbac:group:write'],
      },
      {
        path: 'remove-group/:groupId',
        permissions: ['rbac:group:write'],
      },
    ],
  },

  // ===========================================
  // User Access (V1) - Group Detail
  // ===========================================
  {
    path: '/user-access/groups/detail/:groupId',
    permissions: ['rbac:group:read'],
    childRoutes: [
      {
        path: 'roles',
        permissions: [], // Inherits read from parent
        childRoutes: [
          {
            path: 'edit-group',
            permissions: ['rbac:group:write'],
          },
          {
            path: 'remove-group',
            permissions: ['rbac:group:write'],
          },
          {
            path: 'add-roles',
            permissions: ['rbac:group:write'],
          },
        ],
      },
      {
        path: 'members',
        permissions: [], // Inherits read from parent
        childRoutes: [
          {
            path: 'edit-group',
            permissions: ['rbac:group:write'],
          },
          {
            path: 'remove-group',
            permissions: ['rbac:group:write'],
          },
          {
            path: 'add-members',
            permissions: ['rbac:group:write'],
          },
        ],
      },
      {
        path: 'service-accounts',
        permissions: [], // Inherits read from parent
        childRoutes: [
          {
            path: 'edit-group',
            permissions: ['rbac:group:write'],
          },
          {
            path: 'remove',
            permissions: ['rbac:group:write'],
          },
          {
            path: 'add-service-account',
            permissions: ['rbac:group:write'],
          },
        ],
      },
    ],
  },

  // ===========================================
  // User Access (V1) - Group Role Detail (standalone)
  // ===========================================
  {
    path: '/user-access/groups/detail/:groupId/roles/detail/:roleId',
    permissions: ['rbac:role:read'],
  },

  // ===========================================
  // My User Access Section
  // ===========================================
  {
    path: '/my-user-access',
    permissions: [], // Public - users can see their own access
  },

  // ===========================================
  // Quickstarts (dev only - not in frontend.yaml)
  // ===========================================
  {
    path: '/user-access/quickstarts-test',
    permissions: [], // Public
  },
];

/**
 * Permission config for a single route
 */
export interface PermissionConfig {
  permissions: string[];
  requireOrgAdmin?: boolean;
  checkAll?: boolean;
  inheritPermissions?: boolean;
}

/**
 * Flattens the route tree into a map of path -> permissions
 * Used by the validation script and Routing.tsx
 */
export function flattenRouteDefinitions(
  routes: RouteDefinition[] = routeDefinitions,
  parentPath = '',
  parentPermissions: string[] = [],
): Map<string, PermissionConfig> {
  const result = new Map<string, PermissionConfig>();

  for (const route of routes) {
    const fullPath = route.path.startsWith('/') ? route.path : `${parentPath}/${route.path}`;

    // Normalize path: remove trailing /*, trailing slashes
    const normalizedPath = fullPath.replace(/\/\*$/, '').replace(/\/$/, '') || '/';

    // Calculate effective permissions
    const inheritPermissions = route.inheritPermissions !== false;
    const effectivePermissions = inheritPermissions ? [...parentPermissions, ...route.permissions] : route.permissions;

    result.set(normalizedPath, {
      permissions: effectivePermissions,
      requireOrgAdmin: route.requireOrgAdmin,
      checkAll: route.checkAll,
      inheritPermissions: route.inheritPermissions,
    });

    // Recurse into children
    if (route.childRoutes) {
      const childResults = flattenRouteDefinitions(route.childRoutes, normalizedPath, effectivePermissions);
      for (const [path, config] of childResults) {
        result.set(path, config);
      }
    }
  }

  return result;
}

// Pre-computed flat map for fast lookups
const permissionMap = flattenRouteDefinitions();

/**
 * Get permission config for a route path.
 * Used by Routing.tsx to look up permissions from the single source of truth.
 *
 * @param path - Route path (can include wildcards like /user-access/roles/*)
 * @returns Permission config or default (empty permissions, no orgAdmin)
 */
export function getPermissions(path: string): PermissionConfig {
  // Normalize path for lookup
  const normalizedPath = path.replace(/\/\*$/, '').replace(/\/$/, '') || '/';

  const config = permissionMap.get(normalizedPath);
  if (config) {
    return config;
  }

  // Try without trailing wildcard parts (for dynamic segments)
  // e.g., /user-access/users/detail/:username/* -> /user-access/users/detail/:username
  const withoutTrailingWildcard = normalizedPath.replace(/\/\*$/, '');
  const wildcardConfig = permissionMap.get(withoutTrailingWildcard);
  if (wildcardConfig) {
    return wildcardConfig;
  }

  // Default: no permissions required (public)
  console.warn(`[route-definitions] No permissions found for path: ${path}`);
  return { permissions: [] };
}
