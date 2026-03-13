import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { createV2MockDb } from '../../v2/data/mocks/db';
import { createV2Handlers } from '../../v2/data/mocks/handlers';
import { defaultV2Seed } from '../../v2/data/mocks/seed';

type Story = StoryObj<typeof KesselAppEntryWithRouter>;

interface StoryArgs {
  typingDelay?: number;
  orgAdmin?: boolean;
  'platform.rbac.workspaces-list'?: boolean;
  'platform.rbac.workspace-hierarchy'?: boolean;
  'platform.rbac.workspaces-role-bindings'?: boolean;
  'platform.rbac.workspaces-role-bindings-write'?: boolean;
  'platform.rbac.workspaces'?: boolean;
  'platform.rbac.workspaces-organization-management'?: boolean;
  'platform.rbac.group-service-accounts'?: boolean;
  'platform.rbac.group-service-accounts.stable'?: boolean;
  'platform.rbac.common-auth-model'?: boolean;
  initialRoute?: string;
}

const db = createV2MockDb(defaultV2Seed());
const mswHandlers = createV2Handlers(db);

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/User Viewer',
  tags: ['prod-v2-user-viewer'],
  decorators: [
    ((Story, context: StoryContext<StoryArgs>) => {
      db.reset();
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    }) as Decorator<StoryArgs>,
  ],
  argTypes: {
    typingDelay: {
      control: { type: 'number', min: 0, max: 100, step: 10 },
      description: 'Typing delay in ms for demo mode',
      table: { category: 'Demo', defaultValue: { summary: '0 in CI, 30 otherwise' } },
    },
    'platform.rbac.workspaces-list': {
      control: 'boolean',
      description: 'Kessel M1 - Workspace list view',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspaces-organization-management': {
      control: 'boolean',
      description: 'V2 Navigation - Access Management layout',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
  },
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    permissions: KESSEL_PERMISSIONS.USER_VIEWER,
    orgAdmin: false,
    // V2/Management Fabric flags enabled
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': false,
    'platform.rbac.workspaces': true,
    'platform.rbac.workspaces-organization-management': true,
    'platform.rbac.group-service-accounts': true,
    'platform.rbac.group-service-accounts.stable': true,
    'platform.rbac.common-auth-model': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.USER_VIEWER,
      orgAdmin: false,
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': true,
      'platform.rbac.workspaces-role-bindings-write': false,
      'platform.rbac.workspaces': true,
      'platform.rbac.workspaces-organization-management': true,
      'platform.rbac.group-service-accounts': true,
      'platform.rbac.group-service-accounts.stable': true,
      'platform.rbac.common-auth-model': true,
    }),
    msw: {
      handlers: mswHandlers,
    },
    docs: {
      description: {
        component: 'Minimal viewer with rbac:principal:read only. See the Documentation page for full details.',
      },
    },
  },
};

export default meta;

/**
 * Manual Testing Entry Point
 */
export const ManualTesting: Story = {
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Entry point for manual testing of the V2 User Viewer persona.

**Expected Sidebar:**
- My Access
- Access Management → Users and User Groups only (no Workspaces, no Roles)
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

    await step('Verify Users and Groups page loads', async () => {
      const heading = await canvas.findByRole('heading', {
        level: 1,
        name: /users and (user )?groups/i,
      });
      expect(heading).toBeInTheDocument();
    });
  },
};

/**
 * Sidebar validation - verify correct items visible
 */
export const SidebarValidation: Story = {
  name: 'Correct items visible',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Validates that V2 User Viewer sees the correct sidebar items.

**Checks:**
- ✅ "My Access" link IS present (V2 label)
- ✅ "Access Management" expandable section IS present
- ✅ "Users and Groups" link IS present (has rbac:principal:read)
- ❌ "Workspaces" link is NOT present (no inventory:groups:read)
- ❌ "Roles" link is NOT present (no rbac:role:read)
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

    await step('Verify correct sidebar items visible', async () => {
      const myAccess = await canvas.findByRole('link', { name: /my access/i });
      expect(myAccess).toBeInTheDocument();

      const accessMgmtSection = await canvas.findByRole('button', { name: /access management/i });
      expect(accessMgmtSection).toBeInTheDocument();

      const usersLink = await canvas.findByRole('link', { name: /users and groups/i });
      expect(usersLink).toBeInTheDocument();

      const workspacesLink = canvas.queryByRole('link', { name: /workspaces/i });
      expect(workspacesLink).not.toBeInTheDocument();

      const rolesLink = canvas.queryByRole('link', { name: /roles/i });
      expect(rolesLink).not.toBeInTheDocument();
    });
  },
};

/**
 * Users Tab / Authorized Access
 *
 * Tests that User Viewer can access the Users tab in Users and User Groups page.
 */
export const UsersTabAuthorized: Story = {
  name: 'Authorized access (Users Tab)',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
**KEY VALIDATION**: User Viewer with \`rbac:principal:read\` CAN access the Users tab.

The Users and User Groups page uses OR logic (\`rbac:principal:read\` OR \`rbac:group:read\`),
so a user with either permission can access the page.
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

    await step('Verify Users tab and user data visible', async () => {
      await expect(canvas.findByRole('heading', { name: /users and (user )?groups/i })).resolves.toBeInTheDocument();

      const usersTab = await canvas.findByRole('tab', { name: /users/i });
      expect(usersTab).toBeInTheDocument();

      await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
    });
  },
};

/**
 * User Groups Tab / Access Denied
 *
 * Tests that User Viewer cannot access User Groups tab content.
 */
export const UserGroupsTabDenied: Story = {
  name: 'Access denied (User Groups Tab)',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that User Viewer (only \`rbac:principal:read\`) cannot view User Groups content.

When clicking the User Groups tab, the user should see limited or no data
since they lack \`rbac:group:read\` permission.
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to User Groups tab and verify no group data', async () => {
      const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
      await user.click(userGroupsTab);
      await waitFor(() => expect(userGroupsTab).toHaveAttribute('aria-selected', 'true'), { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

      const table = canvas.queryByRole('grid', { name: /user groups/i });
      if (table) {
        const groupName = within(table).queryByText('Platform Admins');
        expect(groupName).not.toBeInTheDocument();
      }
    });
  },
};

/**
 * Roles Page / Access Denied
 *
 * Tests that User Viewer gets access denied for Roles page via direct URL.
 */
export const RolesPageDenied: Story = {
  name: 'Direct URL - Unauthorized (Roles)',
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that:
1. Roles link is NOT in sidebar (no rbac:role:read)
2. Direct URL navigation shows access denied
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

    await step('Verify Roles link absent and access denied shown', async () => {
      const accessDenied = await canvas.findByText(/you don't have permission to view this page|unauthorized|access denied/i);
      expect(accessDenied).toBeInTheDocument();

      const rolesLink = canvas.queryByRole('link', { name: /^roles$/i });
      expect(rolesLink).not.toBeInTheDocument();
    });
  },
};

/**
 * Workspaces Page / Access Denied
 *
 * Tests that User Viewer gets access denied for Workspaces page via direct URL.
 */
export const WorkspacesPageDenied: Story = {
  name: 'Direct URL - Unauthorized (Workspaces)',
  args: {
    initialRoute: '/iam/access-management/workspaces',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that:
1. Workspaces link is NOT in sidebar (no inventory:groups:read)
2. Direct URL navigation shows access denied
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

    await step('Verify Workspaces link absent and access denied shown', async () => {
      const accessDenied = await canvas.findByText(/you don't have permission to view this page|unauthorized|access denied/i);
      expect(accessDenied).toBeInTheDocument();

      const workspacesLink = canvas.queryByRole('link', { name: /workspaces/i });
      expect(workspacesLink).not.toBeInTheDocument();

      const workspaceName = canvas.queryByText('Root Workspace');
      expect(workspaceName).not.toBeInTheDocument();
    });
  },
};
