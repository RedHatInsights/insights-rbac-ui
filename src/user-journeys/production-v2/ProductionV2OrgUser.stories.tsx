import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, within } from 'storybook/test';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { createV2MockDb } from '../../v2/data/mocks/db';
import { createV2Handlers } from '../../v2/data/mocks/handlers';
import { defaultV2Seed } from '../../v2/data/mocks/seed';

type Story = StoryObj<typeof KesselAppEntryWithRouter>;

interface StoryArgs {
  typingDelay?: number;
  orgAdmin?: boolean;
  initialRoute?: string;
}

const db = createV2MockDb(defaultV2Seed());
const mswHandlers = createV2Handlers(db);

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org User',
  tags: ['prod-v2-org-user'],
  decorators: [
    ((Story, context: StoryContext<StoryArgs>) => {
      db.reset();
      const dynamicEnv = createDynamicEnvironment({
        ...context.args,
        permissions: KESSEL_PERMISSIONS.NONE,
        'platform.rbac.workspaces': true,
      });
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
    orgAdmin: {
      control: 'boolean',
      description: 'Organization Administrator',
      table: { category: 'Permissions', defaultValue: { summary: 'false' } },
    },
  },
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: false,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.NONE, // No RBAC permissions
      orgAdmin: false,
      'platform.rbac.workspaces': true,
    }),
    msw: {
      handlers: mswHandlers,
    },
    docs: {
      description: {
        component: 'Regular user with no RBAC permissions. See the Documentation page for full details.',
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
Entry point for manual testing of the V2 Org User persona.

**Expected:** "My Access" and "Access Management > Workspaces" in sidebar. Other items require permissions.
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

    await step('Verify unauthorized message shown', async () => {
      await expect(canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i)).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Sidebar validation - verify limited visibility for user with no RBAC permissions
 */
export const SidebarValidation: Story = {
  name: 'My Access and Workspaces visible',
  args: {
    initialRoute: '/iam/access-management/workspaces',
  },
  parameters: {
    docs: {
      description: {
        story: `
Validates that V2 Org User (no permissions) sees "My Access" and "Workspaces" in the sidebar,
but not permission-gated items like "Users and Groups" or "Roles".

**Checks:**
- ✅ "My Access" link IS present (V2 label)
- ✅ "Access Management" expandable section IS present
- ✅ "Workspaces" link IS present (no permission check)
- ❌ "Users and Groups" link is NOT present
- ❌ "Roles" link is NOT present
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

    await step('Verify sidebar items', async () => {
      const myAccess = await canvas.findByRole('link', { name: /my access/i });
      expect(myAccess).toBeInTheDocument();

      const accessMgmtSection = await canvas.findByRole('button', { name: /access management/i });
      expect(accessMgmtSection).toBeInTheDocument();

      const workspacesLink = await canvas.findByRole('link', { name: /^workspaces$/i });
      expect(workspacesLink).toBeInTheDocument();

      const usersLink = canvas.queryByRole('link', { name: /users and groups/i });
      expect(usersLink).not.toBeInTheDocument();

      const rolesLink = canvas.queryByRole('link', { name: /^roles$/i });
      expect(rolesLink).not.toBeInTheDocument();
    });
  },
};

/**
 * Direct navigation to Users and Groups - should show unauthorized
 */
export const UsersAndUserGroupsUnauthorized: Story = {
  name: 'Direct URL - Unauthorized (Users and Groups)',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that direct navigation to Users and Groups shows unauthorized.
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

    await step('Verify unauthorized message shown', async () => {
      const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
      expect(unauthorized).toBeInTheDocument();
    });
  },
};

/**
 * Direct navigation to Workspaces - should render workspace list (no permission check)
 */
export const WorkspacesAccessible: Story = {
  name: 'Direct URL - Workspaces accessible',
  args: {
    initialRoute: '/iam/access-management/workspaces',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that direct navigation to Workspaces renders the workspace list
for users without RBAC permissions (rbac_workspace_view check is disabled).
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

    await step('Verify workspace list renders', async () => {
      const heading = await canvas.findByRole('heading', { name: /workspaces/i });
      expect(heading).toBeInTheDocument();
    });
  },
};

/**
 * Direct navigation to Roles - should show unauthorized
 */
export const RolesUnauthorized: Story = {
  name: 'Direct URL - Unauthorized (Roles)',
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that direct navigation to Roles shows unauthorized.
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

    await step('Verify unauthorized message shown', async () => {
      const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
      expect(unauthorized).toBeInTheDocument();
    });
  },
};
