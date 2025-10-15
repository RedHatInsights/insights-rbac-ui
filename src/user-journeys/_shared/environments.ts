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
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    chrome: makeChrome({
      environment: 'prod',
      isOrgAdmin: true,
    }),
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
   * - Read-only RBAC permissions
   * - No workspaces
   */
  PROD_ORG_USER: {
    permissions: {
      orgAdmin: false,
      userAccessAdministrator: false,
    },
    chrome: makeChrome({
      environment: 'prod',
      isOrgAdmin: false,
    }),
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
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    chrome: makeChrome({
      environment: 'prod',
      isOrgAdmin: true,
    }),
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
