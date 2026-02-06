import type { StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { delay } from 'msw';
import { AppEntryWithRouter } from './_shared/components/AppEntryWithRouter';
import { ENVIRONMENTS } from './_shared/environments';
import { TEST_TIMEOUTS, resetStoryState } from './_shared/helpers';

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
        component: `
# Production V1: Org User Persona

This environment simulates a **regular user** with **NO RBAC permissions**.

## Permission Configuration

- **Permissions**: \`[]\` (empty - no RBAC permissions)
- **Org Admin**: false
- **Feature Flags**: V1 navigation (workspaces-organization-management: false)

## Expected Sidebar

- ✅ My User Access (visible)
- ❌ User Access section (NOT visible - requires rbac permissions)

## User Journeys

### What Regular Users Can Do
- View their own access via "My User Access" page

### What Regular Users CANNOT Do
- Access Users, Groups, or Roles pages (no sidebar link, unauthorized if direct URL)
        `,
      },
    },
  },
};

export default meta;

/**
 * Manual Testing Entry Point
 */
export const ManualTesting: Story = {
  tags: ['autodocs'],
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for the permissions section to render - this is the most reliable indicator the page is ready
    await expect(canvas.findByText(/your red hat enterprise linux/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).resolves.toBeInTheDocument();
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // ✅ My User Access should be visible
    const myUserAccess = await canvas.findByRole('link', { name: /my user access/i });
    expect(myUserAccess).toBeInTheDocument();

    // ❌ User Access expandable should NOT be visible
    const userAccessSection = canvas.queryByRole('button', { name: /user access/i });
    expect(userAccessSection).not.toBeInTheDocument();

    // ❌ Individual nav items should NOT be visible
    const usersLink = canvas.queryByRole('link', { name: /^users$/i });
    expect(usersLink).not.toBeInTheDocument();

    const groupsLink = canvas.queryByRole('link', { name: /^groups$/i });
    expect(groupsLink).not.toBeInTheDocument();

    const rolesLink = canvas.queryByRole('link', { name: /^roles$/i });
    expect(rolesLink).not.toBeInTheDocument();
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify the page loaded
    const heading = await canvas.findByRole('heading', { name: /my user access/i });
    expect(heading).toBeInTheDocument();
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Users link should NOT be in sidebar
    const usersLink = canvas.queryByRole('link', { name: /^users$/i });
    expect(usersLink).not.toBeInTheDocument();

    // Should show unauthorized/access denied
    const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
    expect(unauthorized).toBeInTheDocument();
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Groups link should NOT be in sidebar
    const groupsLink = canvas.queryByRole('link', { name: /^groups$/i });
    expect(groupsLink).not.toBeInTheDocument();

    // Should show unauthorized/access denied
    const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
    expect(unauthorized).toBeInTheDocument();
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Roles link should NOT be in sidebar
    const rolesLink = canvas.queryByRole('link', { name: /^roles$/i });
    expect(rolesLink).not.toBeInTheDocument();

    // Should show unauthorized/access denied
    const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
    expect(unauthorized).toBeInTheDocument();
  },
};
