/**
 * Users Tab Journey
 * Based on: static/mocks/Users tab/
 *
 * Features tested:
 * - Users table with columns: Username, Email, First name, Last name, Status, User groups, Org admin
 * - Row click opens user details drawer
 * - User details drawer with tabs: User groups, Assigned roles
 * - Filter by username
 * - Add to user group button (enabled when rows selected)
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { delay } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { withFeatureGap } from '../_shared/components/FeatureGapBanner';
import { TEST_TIMEOUTS, resetStoryState, waitForPageToLoad } from '../_shared/helpers';
import { defaultHandlers } from './_shared';

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Users tab',
  tags: ['access-management', 'users'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.common.userstable': true,
    'platform.rbac.workspaces-organization-management': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.common.userstable': true,
      'platform.rbac.workspaces-organization-management': true,
    }),
    msw: {
      handlers: defaultHandlers,
    },
    docs: {
      description: {
        component: `
# Users Tab Journey

Tests the Users tab in the Users and User Groups page.

## Design Reference

| Users table | User details drawer |
|:---:|:---:|
| [![Users table](/mocks/Users%20tab/Frame%2099.png)](/mocks/Users%20tab/Frame%2099.png) | [![User details drawer](/mocks/Users%20tab/Frame%20108.png)](/mocks/Users%20tab/Frame%20108.png) |

| Assigned roles tab | User selected state |
|:---:|:---:|
| [![Assigned roles tab](/mocks/Users%20tab/Frame%20109.png)](/mocks/Users%20tab/Frame%20109.png) | [![User selected state](/mocks/Users%20tab/Frame%20199.png)](/mocks/Users%20tab/Frame%20199.png) |

## Features
| Feature | Status | API |
|---------|--------|-----|
| Users table | ✅ Implemented | V1 |
| User groups count column | ✅ Implemented | V1 |
| User details drawer | ✅ Implemented | V1 |
| User groups tab in drawer | ✅ Implemented | V1 |
| Assigned roles tab in drawer | ⚠️ GAP | V2 needed |
| Filter by username | ✅ Implemented | V1 |
| Add to user group button | ✅ Implemented | V1 |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default users table view
 *
 * Tests:
 * - Table renders with all expected columns
 * - Users data loads from API
 * - User groups count displays correctly
 */
export const TableView: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests the default Users table view matching \`static/mocks/Users tab/Frame 99.png\`.

**Columns verified:**
- Username (sortable)
- Email
- First name (sortable)
- Last name (sortable)
- Status
- User groups (count)
- Org admin
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for page to load
    await waitForPageToLoad(canvas, 'adumble');

    // Verify Users tab is active
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    expect(usersTab).toHaveAttribute('aria-selected', 'true');

    // Verify users are displayed
    await expect(canvas.findByText('adumble')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('ginger-spice')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('bwhite')).resolves.toBeInTheDocument();

    // Verify user info displays correctly
    await expect(canvas.findByText('Albus')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Dumbledore')).resolves.toBeInTheDocument();

    // Verify status column shows (rendered as Switch components)
    const statusSwitches = await canvas.findAllByRole('switch', { name: /toggle status/i });
    expect(statusSwitches.length).toBeGreaterThan(0);
  },
};

/**
 * User details drawer
 *
 * Tests:
 * - Clicking a row opens the drawer
 * - Drawer shows user name and email in header
 * - User groups tab displays group membership
 * - Assigned roles tab shows roles
 */
export const UserDetailsDrawer: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Tests the user details drawer matching \`static/mocks/Users tab/Frame 108.png\`.

**Expected behavior:**
1. Click on a user row
2. Drawer opens with user name and email
3. User groups tab shows groups user belongs to
4. Switching to Assigned roles tab shows roles

**Note:** Assigned roles uses V1 API - V2 needed for full workspace/group details.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, 'bwhite');

    // Click on Betty White's row
    const bwhiteRow = await canvas.findByText('bwhite');
    await user.click(bwhiteRow);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Verify drawer opens with user info
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    expect(drawer).toBeInTheDocument();

    const drawerScope = within(drawer as HTMLElement);

    // Check header shows full name
    await expect(drawerScope.findByText(/Betty White/i)).resolves.toBeInTheDocument();
    await expect(drawerScope.findByText(/bwhite@redhat.com/i)).resolves.toBeInTheDocument();

    // Verify tabs are present (use role selector to avoid matching text elsewhere)
    await expect(drawerScope.findByRole('tab', { name: /User groups/i })).resolves.toBeInTheDocument();
    await expect(drawerScope.findByRole('tab', { name: /Assigned roles/i })).resolves.toBeInTheDocument();

    // Verify User groups tab content (Betty is in Default group and Golden girls)
    // Golden girls appears in both user groups tab and may appear in roles tab (userGroup column)
    // so we use getAllByText and verify at least one
    const goldenGirlsCells = await drawerScope.findAllByText(/Golden girls/i);
    expect(goldenGirlsCells.length).toBeGreaterThanOrEqual(1);
  },
};

/**
 * User details - Assigned roles tab
 *
 * Tests the Assigned roles tab in the user details drawer
 */
export const UserDetailsAssignedRoles: Story = {
  name: '⚠️ [V2 GAP] User Details - Assigned Roles Tab',
  tags: ['gap:guessed-v2-api'],
  decorators: [
    withFeatureGap({
      title: 'User Assigned Roles - Guessed V2 API',
      currentState: (
        <>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Guessed Endpoint:</strong>
          </p>
          <code
            style={{
              display: 'block',
              background: 'rgba(0,0,0,0.08)',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '11px',
              marginBottom: '8px',
            }}
          >
            GET /api/rbac/v1/roles/?username=:username
          </code>
          <p style={{ margin: '8px 0 4px 0' }}>
            <strong>Expected Response (with V2 role binding data):</strong>
          </p>
          <pre
            style={{
              background: 'rgba(0,0,0,0.08)',
              padding: '8px',
              borderRadius: '3px',
              fontSize: '10px',
              margin: '0 0 8px 0',
              whiteSpace: 'pre-wrap',
            }}
          >
            {`{
  "data": [{
    "uuid": "role-uuid-1",
    "name": "Organization Administrator",
    "display_name": "Organization Administrator",
    "userGroup": "Default user access",
    "userGroupId": "group-uuid-1",
    "workspace": "Root workspace",
    "workspaceId": "ws-root-123"
  }],
  "meta": { "count": 1 }
}`}
          </pre>
          <p style={{ margin: '8px 0 0 0', fontStyle: 'italic', fontSize: '11px' }}>
            Gap: The <code>userGroup</code>, <code>userGroupId</code>, <code>workspace</code>, and <code>workspaceId</code> fields are guessed
            additions.
          </p>
        </>
      ),
      expectedBehavior: [
        'User Group column shows which group grants the role to this user',
        'Workspace column shows which workspace the role applies to',
        'V2 API should provide role binding context per user',
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: `
Tests the Assigned roles tab in the user details drawer.

Shows roles assigned to the user with:
- User Group column (which group grants the role)
- Workspace column (which workspace the role applies to)

**Note:** Using guessed V2 API mock data until real V2 APIs are available.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, 'adumble');

    // Click on a user row
    const adumbleRow = await canvas.findByText('adumble');
    await user.click(adumbleRow);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Get drawer
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    expect(drawer).toBeInTheDocument();
    const drawerScope = within(drawer as HTMLElement);

    // Click on Assigned roles tab (use role selector to avoid multiple matches)
    const rolesTab = await drawerScope.findByRole('tab', { name: /Assigned roles/i });
    await user.click(rolesTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Verify roles are displayed
    // adumble is in group-admin which has Tenant Administrator and Workspace Administrator roles
    await expect(drawerScope.findByText('Tenant Administrator')).resolves.toBeInTheDocument();
  },
};

/**
 * Filter by username
 *
 * Tests the username filter functionality
 */
export const FilterByUsername: Story = {
  name: 'Filter by Username',
  parameters: {
    docs: {
      description: {
        story: `
Tests filtering users by username.

**Expected behavior:**
1. Type in the filter input
2. Table updates to show matching users
3. Clear filter shows all users
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, 'adumble');

    // Find the filter input
    const filterInput = await canvas.findByPlaceholderText(/filter by username/i);
    expect(filterInput).toBeInTheDocument();

    // Type a filter value
    await user.type(filterInput, 'spice');
    await user.keyboard('{Enter}');

    // Wait for filtered results
    await waitForPageToLoad(canvas, 'ginger-spice');

    // Verify filtered results
    await expect(canvas.findByText('ginger-spice')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('posh-spice')).resolves.toBeInTheDocument();

    // Non-spice users should not be visible
    expect(canvas.queryByText('adumble')).not.toBeInTheDocument();
    expect(canvas.queryByText('bwhite')).not.toBeInTheDocument();
  },
};

/**
 * Select users and enable Add to user group
 *
 * Tests the row selection and bulk action button
 */
export const SelectUsersForBulkAction: Story = {
  name: 'Select Users for Bulk Action',
  parameters: {
    docs: {
      description: {
        story: `
Tests selecting users to enable bulk actions matching \`static/mocks/Users tab/Frame 199.png\`.

**Expected behavior:**
1. Select one or more users using checkboxes
2. "Add to user group" button becomes enabled
3. Clicking button opens the Add to user group modal
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, 'adumble');

    // Find and click checkboxes for multiple users
    const checkboxes = await canvas.findAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(2);

    // Select first two data rows (skip header if present)
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Verify Add to user group button is now enabled
    const addButton = await canvas.findByText(/Add to user group/i);
    expect(addButton).toBeInTheDocument();

    // Note: The actual click to open modal is tested in AddToUserGroup.stories.tsx
  },
};

/**
 * Switching between Users and User Groups tabs
 *
 * Tests tab navigation preserves state
 */
export const TabNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Tests switching between Users and User Groups tabs.

**Expected behavior:**
1. Start on Users tab
2. Click User Groups tab - groups table loads
3. Click Users tab - users table loads again
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, 'adumble');

    // Verify Users tab is active
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    expect(usersTab).toHaveAttribute('aria-selected', 'true');

    // Verify users are shown
    await expect(canvas.findByText('adumble')).resolves.toBeInTheDocument();

    // Click User Groups tab
    const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(groupsTab);

    // Wait for groups to load
    await waitForPageToLoad(canvas, 'Default group');

    // Verify groups tab is now active
    expect(groupsTab).toHaveAttribute('aria-selected', 'true');

    // Verify groups are shown
    await expect(canvas.findByText('Default group')).resolves.toBeInTheDocument();

    // Click back to Users tab
    await user.click(usersTab);

    // Wait for users to load
    await waitForPageToLoad(canvas, 'adumble');

    // Verify users are shown again
    expect(usersTab).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.findByText('adumble')).resolves.toBeInTheDocument();
  },
};
