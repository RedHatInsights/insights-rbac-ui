import { createStatefulHandlers } from '../../../.storybook/helpers/stateful-handlers';
import { defaultGroups } from '../../../.storybook/fixtures/groups';
import { defaultUsers } from '../../../.storybook/fixtures/users';
import { defaultRoles } from '../../../.storybook/fixtures/roles';
import { makeChrome } from './helpers/chrome';

/**
 * Environment configurations for user journey tests
 * Each environment defines feature flags, chrome config, and MSW handlers
 */
export const ENVIRONMENTS = {
  /**
   * Production environment with Org Admin privileges
   * - Full RBAC permissions
   * - No workspaces
   */
  PROD_ORG_ADMIN: {
    // Journey stories use Iam directly - skip preview.tsx provider wrapping
    noWrapping: true,
    // Full admin permissions
    permissions: ['rbac:*:*'],
    // User identity flags
    orgAdmin: true,
    chrome: makeChrome({
      environment: 'prod',
      isOrgAdmin: true,
    }),
    // User identity for auth.getUser() - used by StorybookMockContext
    userIdentity: {
      org_id: '12510751',
      account_number: '123456',
      user: {
        username: 'test-user',
        email: 'test@redhat.com',
        first_name: 'Test',
        last_name: 'User',
        is_org_admin: true,
      },
      entitlements: {
        ansible: { is_entitled: true },
        openshift: { is_entitled: true },
        rhel: { is_entitled: true },
        settings: { is_entitled: true },
      },
    },
    featureFlags: {
      'platform.rbac.group-service-accounts': false, // OLD feature flag, DO NOT USE
      'platform.rbac.group-service-accounts.stable': true, // current feature flag, used after isBeta deprecation
      'platform.rbac.workspaces': false,
      'platform.rbac.common-auth-model': true, // Enables selectable users table for org admins
    },
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
  },

  /**
   * Production environment with Org User (non-admin) privileges
   * - Read-only RBAC permissions (can view but not modify)
   * - No workspaces
   */
  PROD_ORG_USER: {
    // Journey stories use Iam directly - skip preview.tsx provider wrapping
    noWrapping: true,
    // Limited permissions - can view groups but NOT roles (tests access denied)
    permissions: ['rbac:group:read', 'rbac:principal:read'],
    // User identity flags
    orgAdmin: false,
    chrome: makeChrome({
      environment: 'prod',
      isOrgAdmin: false,
    }),
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
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
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
    chrome: makeChrome({
      environment: 'prod',
      isOrgAdmin: true,
    }),
    // User identity for auth.getUser() - used by StorybookMockContext
    userIdentity: {
      org_id: '12510751',
      account_number: '123456',
      user: {
        username: 'test-user',
        email: 'test@redhat.com',
        first_name: 'Test',
        last_name: 'User',
        is_org_admin: true,
      },
      entitlements: {
        ansible: { is_entitled: true },
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
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
        // TODO: Add workspaces fixtures when implementing workspace journeys
      }),
    },
  },
} as const;
