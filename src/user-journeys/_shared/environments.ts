import { createV1MockDb } from '../../v1/data/mocks/db';
import { defaultV1Seed } from '../../v1/data/mocks/seed';
import { createV1Handlers } from '../../v1/data/mocks/handlers';
import { createInventoryHandlers } from '../../shared/data/mocks/inventory.handlers';
import type { StoryParameters } from '../../../.storybook/contexts/StorybookMockContext';

/**
 * Environment configuration - requires all fields that journey stories need.
 * Extends StoryParameters but makes required fields non-optional.
 */
type EnvironmentConfig = Required<Pick<StoryParameters, 'noWrapping' | 'permissions' | 'orgAdmin' | 'userIdentity' | 'featureFlags' | 'msw'>>;

/** Shared V1 mock database — reset in play functions via resetStoryState(v1Db) */
export const v1Db = createV1MockDb(defaultV1Seed());

const v1Handlers = [...createV1Handlers(v1Db), ...createInventoryHandlers()];

/**
 * Environment configurations for user journey tests.
 * Chrome mock is handled by StorybookMockContext via useChrome.tsx
 */
export const ENVIRONMENTS: Record<string, EnvironmentConfig> = {
  /**
   * Production environment with Org Admin privileges
   * - Full RBAC + inventory permissions
   * - Workspaces enabled in V1 navigation
   */
  PROD_ORG_ADMIN: {
    // Journey stories use Iam directly - skip preview.tsx provider wrapping
    noWrapping: true,
    // Full admin permissions including inventory for workspaces
    permissions: ['rbac:*:*', 'inventory:groups:read', 'inventory:groups:write'],
    // User identity flags
    orgAdmin: true,
    // User identity for auth.getUser() - used by StorybookMockContext
    userIdentity: {
      org_id: '12510751',
      account_number: '123456',
      user: {
        username: 'admin-user',
        email: 'admin@redhat.com',
        first_name: 'Admin',
        last_name: 'User',
        is_org_admin: true,
      },
      entitlements: {
        ansible: { is_entitled: true },
        cost_management: { is_entitled: true },
        insights: { is_entitled: true },
        openshift: { is_entitled: true },
        rhel: { is_entitled: true },
        settings: { is_entitled: true },
      },
    },
    featureFlags: {
      'platform.rbac.group-service-accounts': false, // OLD feature flag, DO NOT USE
      'platform.rbac.group-service-accounts.stable': true, // current feature flag, used after isBeta deprecation
      'platform.rbac.workspaces-list': true, // Show Workspaces page inside V1 User Access
      'platform.rbac.common-auth-model': true, // Enables selectable users table for org admins
    },
    msw: {
      handlers: v1Handlers,
    },
  },

  /**
   * Production environment with User Viewer privileges
   * - Only rbac:principal:read permission
   * - NOT an org admin
   * - Can only view users, nothing else
   * - Tests that granular single-permission access works correctly
   */
  PROD_USER_VIEWER: {
    noWrapping: true,
    // Minimal read permission - can only view users
    permissions: ['rbac:principal:read'],
    orgAdmin: false,
    userIdentity: {
      org_id: '12510751',
      account_number: '123456',
      user: {
        username: 'viewer-user',
        email: 'viewer@example.com',
        first_name: 'Viewer',
        last_name: 'User',
        is_org_admin: false,
      },
      entitlements: {
        ansible: { is_entitled: true },
        cost_management: { is_entitled: true },
        insights: { is_entitled: true },
        openshift: { is_entitled: true },
        rhel: { is_entitled: true },
        settings: { is_entitled: true },
      },
    },
    featureFlags: {
      'platform.rbac.group-service-accounts': false,
      'platform.rbac.group-service-accounts.stable': true,
      'platform.rbac.workspaces': false,
    },
    msw: {
      handlers: v1Handlers,
    },
  },

  /**
   * Production environment with Org User (non-admin) privileges
   * - NO RBAC permissions - can only see "My User Access"
   * - Cannot access User Access section (Users, Groups, Roles)
   * - Tests unauthorized access to admin pages
   */
  PROD_ORG_USER: {
    // Journey stories use Iam directly - skip preview.tsx provider wrapping
    noWrapping: true,
    // NO RBAC permissions - regular user without any User Access privileges
    permissions: [],
    // User identity flags
    orgAdmin: false,
    // User identity for auth.getUser() - used by StorybookMockContext
    userIdentity: {
      org_id: '12510751',
      account_number: '123456',
      user: {
        username: 'regular-user',
        email: 'user@example.com',
        first_name: 'Regular',
        last_name: 'User',
        is_org_admin: false,
      },
      entitlements: {
        ansible: { is_entitled: true },
        cost_management: { is_entitled: true },
        insights: { is_entitled: true },
        openshift: { is_entitled: true },
        rhel: { is_entitled: true },
        settings: { is_entitled: true },
      },
    },
    featureFlags: {
      'platform.rbac.group-service-accounts': false,
      'platform.rbac.group-service-accounts.stable': true,
      'platform.rbac.workspaces': false,
    },
    msw: {
      handlers: v1Handlers,
    },
  },

  /**
   * Workspaces feature enabled environment
   * - Full RBAC permissions
   * - Workspaces feature flag enabled
   */
  WORKSPACES_ENABLED: {
    // Journey stories use Iam directly - skip preview.tsx provider wrapping
    noWrapping: true,
    // Full admin permissions plus workspace permissions
    permissions: ['rbac:*:*', 'inventory:groups:read', 'inventory:groups:write'],
    // User identity flags
    orgAdmin: true,
    // User identity for auth.getUser() - used by StorybookMockContext
    userIdentity: {
      org_id: '12510751',
      account_number: '123456',
      user: {
        username: 'admin-user',
        email: 'admin@redhat.com',
        first_name: 'Admin',
        last_name: 'User',
        is_org_admin: true,
      },
      entitlements: {
        ansible: { is_entitled: true },
        cost_management: { is_entitled: true },
        insights: { is_entitled: true },
        openshift: { is_entitled: true },
        rhel: { is_entitled: true },
        settings: { is_entitled: true },
      },
    },
    featureFlags: {
      'platform.rbac.group-service-accounts.stable': true,
      'platform.rbac.workspaces': true,
    },
    msw: {
      handlers: v1Handlers,
    },
  },
} as const;
