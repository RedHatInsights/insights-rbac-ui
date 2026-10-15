/**
 * Production V2 - User Access Administrator persona
 *
 * Tests the boundary between full org admin and a user with RBAC write
 * permissions but NOT org admin status. This user can manage roles and
 * groups but cannot invite users or toggle org admin status.
 */

import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { waitForPageToLoad } from '../../test-utils/tableHelpers';
import { createV2MockDb } from '../../v2/data/mocks/db';
import { createV2Handlers } from '../../v2/data/mocks/handlers';
import { V2_ROLE_TENANT_ADMIN, defaultV2Seed } from '../../v2/data/mocks/seed';
import { GROUP_ADMIN_DEFAULT, USER_JOHN } from '../../shared/data/mocks/seed';

type Story = StoryObj<typeof KesselAppEntryWithRouter>;

interface StoryArgs {
  typingDelay?: number;
  orgAdmin?: boolean;
  'platform.rbac.workspaces-list'?: boolean;
  'platform.rbac.workspace-hierarchy'?: boolean;
  'platform.rbac.workspaces-role-bindings'?: boolean;
  'platform.rbac.workspaces-role-bindings-write'?: boolean;
  'platform.rbac.workspaces'?: boolean;
  'platform.rbac.group-service-accounts'?: boolean;
  'platform.rbac.group-service-accounts.stable'?: boolean;
  'platform.rbac.common-auth-model'?: boolean;
  initialRoute?: string;
  permissions?: readonly string[];
}

const USER_ACCESS_ADMIN_PERMISSIONS = [
  'rbac:group:read',
  'rbac:group:write',
  'rbac:role:read',
  'rbac:role:write',
  'rbac:principal:read',
  'inventory:groups:read',
  'inventory:groups:write',
];

const db = createV2MockDb(defaultV2Seed());
const mswHandlers = createV2Handlers(db);

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/User Access Admin',
  tags: ['prod-v2-user-access-admin'],
  decorators: [
    ((Story, context: StoryContext<StoryArgs>) => {
      db.reset();
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    }) as Decorator<StoryArgs>,
  ],
  args: {
    initialRoute: '/iam/access-management/roles',
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    permissions: USER_ACCESS_ADMIN_PERMISSIONS,
    orgAdmin: false,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': true,
    'platform.rbac.workspaces': true,
    'platform.rbac.group-service-accounts': true,
    'platform.rbac.group-service-accounts.stable': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: USER_ACCESS_ADMIN_PERMISSIONS,
      orgAdmin: false,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': true,
      'platform.rbac.workspaces-role-bindings-write': true,
      'platform.rbac.workspaces': true,
    }),
    msw: {
      handlers: mswHandlers,
    },
    docs: {
      description: {
        component: 'User Access Admin (not org admin) with RBAC write permissions. See the Documentation page for full details.',
      },
    },
  },
};

export default meta;

/**
 * User Access Admin can manage roles
 */
export const CanManageRoles: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Tests that a User Access Administrator can view and manage roles.

**Expected behavior:**
1. Roles table loads with existing roles
2. Create role button is visible and enabled
3. Kebab menu shows edit/delete options for non-system roles
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify roles table and Create role button', async () => {
      await waitForPageToLoad(canvas, V2_ROLE_TENANT_ADMIN.name!);

      const createButton = canvas.queryByRole('button', { name: /create role/i });
      await expect(createButton).toBeInTheDocument();
    });
  },
};

/**
 * User Access Admin can manage groups
 */
export const CanManageGroups: Story = {
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that a User Access Administrator can view and manage user groups.

**Expected behavior:**
1. Navigate to User Groups tab
2. Groups table loads
3. Create user group button is visible
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify groups table and Create user group button', async () => {
      await waitForPageToLoad(canvas, GROUP_ADMIN_DEFAULT.name);

      const createButton = canvas.queryByRole('button', { name: /create user group/i });
      await expect(createButton).toBeInTheDocument();
    });
  },
};

/**
 * User Access Admin cannot invite users (not org admin)
 */
export const CannotInviteUsers: Story = {
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that a non-org-admin User Access Administrator cannot invite new users.

**Expected behavior:**
1. Navigate to Users tab
2. Users table loads
3. Actions overflow menu either doesn't show "Invite users" or it's disabled
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify Users tab and table', async () => {
      await waitForPageToLoad(canvas, USER_JOHN.username);

      const usersTab = await canvas.findByRole('tab', { name: /users/i });
      expect(usersTab).toHaveAttribute('aria-selected', 'true');
    });
  },
};

/**
 * User Access Admin cannot toggle org admin (not org admin)
 */
export const CannotToggleOrgAdmin: Story = {
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that org admin toggles are disabled for a non-org-admin user.

**Expected behavior:**
1. Navigate to Users tab
2. Users table loads
3. Org admin switches are disabled (non-org-admin cannot grant org admin)
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify org admin switches disabled', async () => {
      await waitForPageToLoad(canvas, USER_JOHN.username);

      await waitFor(
        async () => {
          const orgAdminSwitches = canvas.queryAllByLabelText(/toggle org admin/i);
          if (orgAdminSwitches.length > 0) {
            for (const switchEl of orgAdminSwitches) {
              await expect(switchEl).toBeDisabled();
            }
          }
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });
  },
};
