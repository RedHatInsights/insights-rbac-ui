import type { StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { AppEntryWithRouter } from './_shared/components/AppEntryWithRouter';
import { ENVIRONMENTS, v1Db } from './_shared/environments';
import { resetStoryState } from './_shared/helpers';
import { waitForContentReady } from '../test-utils/interactionHelpers';

type Story = StoryObj<typeof AppEntryWithRouter>;

const meta = {
  component: AppEntryWithRouter,
  title: 'User Journeys/Production/V1 (Current)/User Viewer',
  tags: ['prod-user-viewer'],
  // No custom decorator - preview.tsx reads args directly
  argTypes: {
    typingDelay: {
      control: { type: 'number', min: 0, max: 100, step: 10 },
      description: 'Typing delay in ms for demo mode',
      table: { category: 'Demo', defaultValue: { summary: '0 in CI, 30 otherwise' } },
    },
  },
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    // Minimal permission - can only view users
    permissions: ['rbac:principal:read'],
    orgAdmin: false,
    'platform.rbac.workspaces': false,
    'platform.rbac.workspaces-organization-management': false, // V1 navigation
  },
  parameters: {
    ...ENVIRONMENTS.PROD_USER_VIEWER,
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
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Entry point for manual testing of the User Viewer persona.

**Expected Sidebar:**
- My User Access
- User Access → Users only (no Groups, no Roles)
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page content', async () => {
      // First content after page render
      await expect(canvas.findByText(/your red hat enterprise linux/i)).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Sidebar validation - verify correct items visible
 */
export const SidebarValidation: Story = {
  name: 'Sidebar / Correct items visible',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Validates that User Viewer sees the correct sidebar items.

**Checks:**
- ✅ "My User Access" link IS present
- ✅ "User Access" expandable section IS present
- ✅ "Users" link IS present
- ❌ "Groups" link is NOT present (no rbac:group:read)
- ❌ "Roles" link is NOT present (no rbac:role:read)
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for sidebar to expand', async () => {
      await canvas.findByRole('link', { name: /my user access/i });
    });

    await step('Verify sidebar items visible', async () => {
      const myUserAccess = canvas.getByRole('link', { name: /my user access/i });
      expect(myUserAccess).toBeInTheDocument();

      const userAccessSection = await canvas.findByRole('button', { name: /user access/i });
      expect(userAccessSection).toBeInTheDocument();

      const usersLink = await canvas.findByRole('link', { name: /^users$/i });
      expect(usersLink).toBeInTheDocument();

      const groupsLink = canvas.queryByRole('link', { name: /^groups$/i });
      expect(groupsLink).not.toBeInTheDocument();

      const rolesLink = canvas.queryByRole('link', { name: /^roles$/i });
      expect(rolesLink).not.toBeInTheDocument();
    });
  },
};

/**
 * Users page - authorized access
 */
export const ViewUsersList: Story = {
  name: 'Users / View users list (authorized)',
  args: {
    initialRoute: '/iam/user-access/users',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that User Viewer can access the Users page.

**Scenario:**
1. Navigate to Users page
2. Should see list of users
3. Should NOT see any edit/delete actions
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify users list and no add button', async () => {
      const usersTable = await canvas.findByRole('grid');
      expect(usersTable).toBeInTheDocument();

      const addButton = canvas.queryByRole('button', { name: /add|create|invite/i });
      expect(addButton).not.toBeInTheDocument();
    });
  },
};

/**
 * Groups page - direct URL should show unauthorized
 */
export const GroupsPageUnauthorized: Story = {
  name: 'Groups / Direct URL - Unauthorized',
  args: {
    initialRoute: '/iam/user-access/groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that:
1. Groups link is NOT in sidebar (no rbac:group:read)
2. Direct URL navigation shows unauthorized
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify unauthorized state', async () => {
      const groupsLink = canvas.queryByRole('link', { name: /^groups$/i });
      expect(groupsLink).not.toBeInTheDocument();

      const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
      expect(unauthorized).toBeInTheDocument();
    });
  },
};

/**
 * Roles page - direct URL should show unauthorized
 */
export const RolesPageUnauthorized: Story = {
  name: 'Roles / Direct URL - Unauthorized',
  args: {
    initialRoute: '/iam/user-access/roles',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that:
1. Roles link is NOT in sidebar (no rbac:role:read)
2. Direct URL navigation shows unauthorized
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify unauthorized state', async () => {
      const rolesLink = canvas.queryByRole('link', { name: /^roles$/i });
      expect(rolesLink).not.toBeInTheDocument();

      const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
      expect(unauthorized).toBeInTheDocument();
    });
  },
};
