import type { StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { AppEntryWithRouter } from './_shared/components/AppEntryWithRouter';
import { ENVIRONMENTS, v1Db } from './_shared/environments';
import { resetStoryState } from './_shared/helpers';
import { waitForContentReady } from '../test-utils/interactionHelpers';

type Story = StoryObj<typeof AppEntryWithRouter>;

const meta = {
  component: AppEntryWithRouter,
  title: 'User Journeys/Production/V1 (Current)/Org User',
  tags: ['prod-org-user'],
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
    // NO permissions - regular user without RBAC access
    permissions: [],
    orgAdmin: false,
    'platform.rbac.workspaces': false,
    'platform.rbac.workspaces-organization-management': false, // V1 navigation
  },
  parameters: {
    ...ENVIRONMENTS.PROD_ORG_USER,
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
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Entry point for manual testing of the Org User persona.

**Expected:** Only "My User Access" in sidebar - NO "User Access" section.
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
      await expect(canvas.findByText(/your red hat enterprise linux/i)).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Verify sidebar shows only My User Access
 */
export const SidebarValidation: Story = {
  name: 'Sidebar / Only My User Access visible',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Validates that Org User (no permissions) only sees "My User Access" in the sidebar.

**Checks:**
- ✅ "My User Access" link IS present
- ❌ "User Access" expandable section is NOT present
- ❌ "Users" link is NOT present
- ❌ "Groups" link is NOT present
- ❌ "Roles" link is NOT present
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

    await step('Verify sidebar shows only My User Access', async () => {
      const myUserAccess = canvas.getByRole('link', { name: /my user access/i });
      expect(myUserAccess).toBeInTheDocument();

      const userAccessSection = canvas.queryByRole('button', { name: /user access/i });
      expect(userAccessSection).not.toBeInTheDocument();

      const usersLink = canvas.queryByRole('link', { name: /^users$/i });
      expect(usersLink).not.toBeInTheDocument();

      const groupsLink = canvas.queryByRole('link', { name: /^groups$/i });
      expect(groupsLink).not.toBeInTheDocument();

      const rolesLink = canvas.queryByRole('link', { name: /^roles$/i });
      expect(rolesLink).not.toBeInTheDocument();
    });
  },
};

/**
 * My User Access / View own permissions
 */
export const ViewMyUserAccess: Story = {
  name: 'My User Access / View own permissions',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that Org User can view their own access page.

**What this tests:**
- My User Access page loads correctly
- User sees their (empty) permissions
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

    await step('Wait for page and verify heading', async () => {
      const heading = await canvas.findByRole('heading', { name: /my user access/i });
      expect(heading).toBeInTheDocument();
    });
  },
};

/**
 * Direct navigation to Users page - should show unauthorized
 */
export const UsersPageUnauthorized: Story = {
  name: 'Users / Direct URL - Unauthorized',
  args: {
    initialRoute: '/iam/user-access/users',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that direct navigation to Users page shows unauthorized.

**Scenario:**
1. User navigates directly to /iam/user-access/users via URL
2. Should see "Unauthorized" or "Access denied" message
3. "Users" link should NOT be in sidebar
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
      const usersLink = canvas.queryByRole('link', { name: /^users$/i });
      expect(usersLink).not.toBeInTheDocument();

      const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
      expect(unauthorized).toBeInTheDocument();
    });
  },
};

/**
 * Direct navigation to Groups page - should show unauthorized
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
Tests that direct navigation to Groups page shows unauthorized.
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
 * Direct navigation to Roles page - should show unauthorized
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
Tests that direct navigation to Roles page shows unauthorized.
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
