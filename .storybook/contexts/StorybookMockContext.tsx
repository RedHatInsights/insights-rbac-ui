import React, { type ReactNode, createContext, useContext } from 'react';

export type Environment = 'production' | 'staging';

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
 */
export interface WorkspacePermissionsMap {
  view: string[];
  edit: string[];
  delete: string[];
  create: string[];
  move: string[];
  rename: string[];
}

/** Default empty workspace permissions (all denied) */
export const EMPTY_WORKSPACE_PERMISSIONS: WorkspacePermissionsMap = {
  view: [],
  edit: [],
  delete: [],
  create: [],
  move: [],
  rename: [],
};

export interface MockState {
  environment: Environment;
  isOrgAdmin: boolean;
  permissions: string[];
  workspacePermissions: WorkspacePermissionsMap;
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
  /** Environment: 'staging' or 'production' */
  environment?: 'staging' | 'production';
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
   *   rename: ['ws-1'],
   * }
   * ```
   */
  workspacePermissions?: Partial<WorkspacePermissionsMap>;
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
  environment: 'staging',
  isOrgAdmin: false,
  permissions: [],
  workspacePermissions: EMPTY_WORKSPACE_PERMISSIONS,
};

export const StorybookMockContext = createContext<MockState>(defaultState);

interface ProviderProps extends Partial<MockState> {
  children: ReactNode;
}

export const StorybookMockProvider: React.FC<ProviderProps> = ({
  children,
  environment = 'staging',
  isOrgAdmin = false,
  permissions = [],
  workspacePermissions = EMPTY_WORKSPACE_PERMISSIONS,
  userIdentity,
}) => {
  // Merge partial workspacePermissions with defaults so all 6 keys are always present
  const mergedWorkspacePermissions: WorkspacePermissionsMap = { ...EMPTY_WORKSPACE_PERMISSIONS, ...workspacePermissions };
  const value: MockState = { environment, isOrgAdmin, permissions, workspacePermissions: mergedWorkspacePermissions, userIdentity };
  return <StorybookMockContext.Provider value={value}>{children}</StorybookMockContext.Provider>;
};

export const useMockState = () => useContext(StorybookMockContext);
