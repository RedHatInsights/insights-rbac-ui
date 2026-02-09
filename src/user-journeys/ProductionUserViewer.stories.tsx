import type { StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { delay } from 'msw';
import { AppEntryWithRouter } from './_shared/components/AppEntryWithRouter';
import { ENVIRONMENTS } from './_shared/environments';
import { TEST_TIMEOUTS, resetStoryState } from './_shared/helpers';

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
        component: `
# Production V1: User Viewer Persona

This environment simulates a user with **minimal read permission** - only \`rbac:principal:read\`.

## Permission Configuration

- **Permissions**: \`['rbac:principal:read']\`
- **Org Admin**: false
- **Feature Flags**: V1 navigation

## Expected Sidebar

- ✅ My User Access (visible)
- ✅ User Access section (visible - has rbac:principal:read)
  - ✅ Users (visible - has rbac:principal:read)
  - ❌ Groups (NOT visible - no rbac:group:read)
  - ❌ Roles (NOT visible - no rbac:role:read)

## User Journeys

### What User Viewer Can Do
- View "My User Access" page
- View Users list (read-only)

### What User Viewer CANNOT Do
- Access Groups page (no permission)
- Access Roles page (no permission)
- Create/Edit/Delete anything
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
Entry point for manual testing of the User Viewer persona.

**Expected Sidebar:**
- My User Access
- User Access → Users only (no Groups, no Roles)
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // ✅ My User Access should be visible
    const myUserAccess = await canvas.findByRole('link', { name: /my user access/i });
    expect(myUserAccess).toBeInTheDocument();

    // ✅ User Access expandable should be visible (user has rbac:principal:read)
    const userAccessSection = await canvas.findByRole('button', { name: /user access/i });
    expect(userAccessSection).toBeInTheDocument();

    // ✅ Users link should be visible (has rbac:principal:read)
    const usersLink = await canvas.findByRole('link', { name: /^users$/i });
    expect(usersLink).toBeInTheDocument();

    // ❌ Groups link should NOT be visible (no rbac:group:read)
    const groupsLink = canvas.queryByRole('link', { name: /^groups$/i });
    expect(groupsLink).not.toBeInTheDocument();

    // ❌ Roles link should NOT be visible (no rbac:role:read)
    const rolesLink = canvas.queryByRole('link', { name: /^roles$/i });
    expect(rolesLink).not.toBeInTheDocument();
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Should see users table
    const usersTable = await canvas.findByRole('grid');
    expect(usersTable).toBeInTheDocument();

    // Should NOT see add/create button
    const addButton = canvas.queryByRole('button', { name: /add|create|invite/i });
    expect(addButton).not.toBeInTheDocument();
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Groups link should NOT be in sidebar
    const groupsLink = canvas.queryByRole('link', { name: /^groups$/i });
    expect(groupsLink).not.toBeInTheDocument();

    // Should show unauthorized
    const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
    expect(unauthorized).toBeInTheDocument();
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Roles link should NOT be in sidebar
    const rolesLink = canvas.queryByRole('link', { name: /^roles$/i });
    expect(rolesLink).not.toBeInTheDocument();

    // Should show unauthorized
    const unauthorized = await canvas.findByText(/unauthorized|access denied|not authorized|you do not have access/i);
    expect(unauthorized).toBeInTheDocument();
  },
};
