import React, { type ReactNode, createContext, useContext, useMemo } from 'react';

export type Environment = 'production' | 'stage';

/**
 * Mock entitlements for auth.getUser() responses
 */
export interface MockEntitlements {
  [key: string]: {
    is_entitled?: boolean;
    is_trial?: boolean;
  };
}

/**
 * Mock user identity for auth.getUser() responses
 */
export interface MockUserIdentity {
  account_number?: string;
  org_id?: string;
  user?: {
    is_org_admin?: boolean;
    username?: string;
    email?: string;
    is_internal?: boolean;
    first_name?: string;
    last_name?: string;
    is_active?: boolean;
    locale?: string;
  };
  organization?: {
    name?: string;
  };
  internal?: {
    account_id?: string;
    cross_access?: boolean;
  };
  entitlements?: MockEntitlements;
}

/**
 * Kessel workspace permissions shape.
 * Each key is a workspace relation; the value is an array of workspace IDs
 * for which the mocked user has that permission.
 *
 * Role binding keys are optional — when omitted, `checkWorkspacePermission`
 * falls back to the coarse workspace relation (see `kesselAccessCheck.tsx`).
 */
export interface WorkspacePermissionsMap {
  view: string[];
  edit: string[];
  delete: string[];
  create: string[];
  move: string[];
  role_binding_view?: string[];
  role_binding_grant?: string[];
  role_binding_revoke?: string[];
}

/** Default empty workspace permissions (all denied) */
export const EMPTY_WORKSPACE_PERMISSIONS: WorkspacePermissionsMap = {
  view: [],
  edit: [],
  delete: [],
  create: [],
  move: [],
};

/**
 * Kessel tenant permissions shape (V2 domain hooks).
 * Maps tenant-scoped relations to boolean (allowed/denied).
 * Used by useRolesAccess, useGroupsAccess, usePrincipalsAccess, useWorkspaceTenantAccess.
 */
export interface TenantPermissionsMap {
  rbac_roles_read: boolean;
  rbac_roles_write: boolean;
  rbac_groups_read: boolean;
  rbac_groups_write: boolean;
  rbac_principal_read: boolean;
  rbac_workspace_view: boolean;
  rbac_workspace_edit: boolean;
  rbac_workspace_create: boolean;
  rbac_workspace_delete: boolean;
  rbac_workspace_move: boolean;
}

/** Default tenant permissions (all denied) */
export const EMPTY_TENANT_PERMISSIONS: TenantPermissionsMap = {
  rbac_roles_read: false,
  rbac_roles_write: false,
  rbac_groups_read: false,
  rbac_groups_write: false,
  rbac_principal_read: false,
  rbac_workspace_view: false,
  rbac_workspace_edit: false,
  rbac_workspace_create: false,
  rbac_workspace_delete: false,
  rbac_workspace_move: false,
};

export interface MockState {
  environment: Environment;
  isOrgAdmin: boolean;
  permissions: string[];
  workspacePermissions: WorkspacePermissionsMap;
  tenantPermissions: TenantPermissionsMap;
  /** Optional custom user identity for auth.getUser() */
  userIdentity?: MockUserIdentity;
}

/**
 * Storybook story parameters consumed by preview.tsx decorator.
 * Use this type for environment configs and story parameters.
 */
export interface StoryParameters {
  /** Skip preview.tsx provider wrapping - journey stories use Iam directly */
  noWrapping?: boolean;
  /** Explicit permission strings (e.g., 'rbac:group:read', 'inventory:groups:write') */
  permissions?: readonly string[];
  /** Is this user an Org Admin? */
  orgAdmin?: boolean;
  /** Environment: 'stage' or 'production' */
  environment?: 'stage' | 'production';
  /**
   * Workspace permissions for Kessel stories.
   * Maps workspace relations to arrays of workspace IDs the user has that permission on.
   *
   * @example
   * ```ts
   * workspacePermissions: {
   *   view: ['root-1', 'ws-1', 'ws-2'],
   *   edit: ['root-1', 'ws-1'],
   *   delete: ['ws-1'],
   *   create: ['root-1', 'ws-1'],
   *   move: ['ws-1'],
   * }
   * ```
   */
  workspacePermissions?: Partial<WorkspacePermissionsMap>;
  /**
   * Tenant permissions for V2 domain hooks (Kessel tenant-scoped checks).
   * Maps tenant relations to booleans.
   *
   * @example
   * ```ts
   * tenantPermissions: {
   *   rbac_roles_read: true,
   *   rbac_roles_write: true,
   *   rbac_groups_read: true,
   *   rbac_groups_write: false,
   * }
   * ```
   */
  tenantPermissions?: Partial<TenantPermissionsMap>;
  /** User identity for auth.getUser() */
  userIdentity?: MockUserIdentity;
  /** Feature flags */
  featureFlags?: Record<string, boolean>;
  /** MSW handlers */
  msw?: {
    handlers: unknown[];
  };
}

const defaultState: MockState = {
  environment: 'stage',
  isOrgAdmin: false,
  permissions: [],
  workspacePermissions: EMPTY_WORKSPACE_PERMISSIONS,
  tenantPermissions: EMPTY_TENANT_PERMISSIONS,
};

export const StorybookMockContext = createContext<MockState>(defaultState);

interface ProviderProps extends Partial<MockState> {
  children: ReactNode;
}

const EMPTY_PERMISSIONS: string[] = [];

export const StorybookMockProvider: React.FC<ProviderProps> = ({
  children,
  environment = 'stage',
  isOrgAdmin = false,
  permissions = EMPTY_PERMISSIONS,
  workspacePermissions = EMPTY_WORKSPACE_PERMISSIONS,
  tenantPermissions = EMPTY_TENANT_PERMISSIONS,
  userIdentity,
}) => {
  const value = useMemo<MockState>(
    () => ({
      environment,
      isOrgAdmin,
      permissions,
      workspacePermissions: { ...EMPTY_WORKSPACE_PERMISSIONS, ...workspacePermissions },
      tenantPermissions: { ...EMPTY_TENANT_PERMISSIONS, ...tenantPermissions },
      userIdentity,
    }),
    [environment, isOrgAdmin, permissions, workspacePermissions, tenantPermissions, userIdentity],
  );
  return <StorybookMockContext.Provider value={value}>{children}</StorybookMockContext.Provider>;
};

export const useMockState = () => useContext(StorybookMockContext);
