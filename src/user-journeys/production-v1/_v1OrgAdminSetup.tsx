import type { StoryObj } from '@storybook/react-webpack5';
import { AppEntryWithRouter } from '../_shared/components/AppEntryWithRouter';
import { ENVIRONMENTS, v1Db } from '../_shared/environments';

export type Story = StoryObj<typeof AppEntryWithRouter>;

export { v1Db };

export const meta = {
  component: AppEntryWithRouter,
  title: 'User Journeys/Production/V1 (Current)/Org Admin',
  tags: ['prod-org-admin'],
  argTypes: {
    typingDelay: {
      control: { type: 'number', min: 0, max: 100, step: 10 },
      description: 'Typing delay in ms for demo mode (0 = instant, 30 = realistic)',
      table: { category: 'Demo', defaultValue: { summary: '0 in CI, 30 otherwise' } },
    },
    orgAdmin: {
      control: 'boolean',
      description: 'Organization Administrator - Full RBAC access',
      table: { category: 'Permissions', defaultValue: { summary: 'true' } },
    },
    userAccessAdministrator: {
      control: 'boolean',
      description: 'User Access Administrator - Can manage users and groups',
      table: { category: 'Permissions', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.workspaces-list': {
      control: 'boolean',
      description: 'Show Workspaces page inside User Access',
      table: { category: 'Feature Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.group-service-accounts': {
      control: 'boolean',
      description: 'Legacy service accounts flag (deprecated)',
      table: { category: 'Feature Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.group-service-accounts.stable': {
      control: 'boolean',
      description: 'Current service accounts flag',
      table: { category: 'Feature Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.common-auth-model': {
      control: 'boolean',
      description: 'Common Auth Model - Enables selectable users table',
      table: { category: 'Feature Flags', defaultValue: { summary: 'true' } },
    },
  },
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    permissions: ['rbac:*:*', 'inventory:groups:read', 'inventory:groups:write'],
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspaces-organization-management': false,
    'platform.rbac.group-service-accounts': false,
    'platform.rbac.group-service-accounts.stable': true,
    'platform.rbac.common-auth-model': true,
  },
  parameters: {
    ...ENVIRONMENTS.PROD_ORG_ADMIN,
    docs: {
      description: {
        component: 'V1 Org Admin with full RBAC + inventory permissions. See the Documentation page for full details.',
      },
    },
  },
};

export { navigateToPage, resetStoryState } from '../_shared/helpers';
export { TEST_TIMEOUTS } from '../../test-utils/testUtils';
export { confirmDestructiveModal } from '../../test-utils/interactionHelpers';
export {
  clickMenuItem,
  openDetailPageActionsMenu,
  openRoleActionsMenu,
  openRowActionsMenu,
  verifySuccessNotification,
  waitForPageToLoad,
} from '../../test-utils/tableHelpers';

export {
  DEFAULT_GROUPS,
  DEFAULT_USERS,
  GROUP_ADMIN_DEFAULT,
  GROUP_ENGINEERING,
  GROUP_PLATFORM_ADMINS,
  GROUP_SUPPORT_TEAM,
  GROUP_SYSTEM_DEFAULT,
  USER_BOB,
  USER_JANE,
  USER_JOHN,
} from '../../shared/data/mocks/seed';

export { DEFAULT_V1_ROLES, V1_ROLE_ADMIN, V1_ROLE_CUSTOM, V1_ROLE_VIEWER } from '../../v1/data/mocks/seed';
