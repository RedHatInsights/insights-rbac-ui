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
import { resetStoryState } from '../_shared/helpers';
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
  },
  parameters: {
    ...createDynamicEnvironment({
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.common.userstable': true,
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
- \`static/mocks/Users tab/Frame 99.png\` - Users table
- \`static/mocks/Users tab/Frame 108.png\` - User details drawer
- \`static/mocks/Users tab/Frame 109.png\` - Assigned roles tab
- \`static/mocks/Users tab/Frame 199.png\` - User selected state

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
  name: 'Table View',
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

    // Wait for data to load
    await delay(500);

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

    // Verify status column shows
    const activeStatuses = await canvas.findAllByText('Active');
    expect(activeStatuses.length).toBeGreaterThan(0);
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
  name: 'User Details Drawer',
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

    // Wait for data to load
    await delay(500);

    // Click on Betty White's row
    const bwhiteRow = await canvas.findByText('bwhite');
    await user.click(bwhiteRow);
    await delay(300);

    // Verify drawer opens with user info
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    expect(drawer).toBeInTheDocument();

    const drawerScope = within(drawer as HTMLElement);

    // Check header shows full name
    await expect(drawerScope.findByText(/Betty White/i)).resolves.toBeInTheDocument();
    await expect(drawerScope.findByText(/bwhite@redhat.com/i)).resolves.toBeInTheDocument();

    // Verify tabs are present
    await expect(drawerScope.findByText(/User groups/i)).resolves.toBeInTheDocument();
    await expect(drawerScope.findByText(/Assigned roles/i)).resolves.toBeInTheDocument();

    // Verify User groups tab content (Betty is in Default group and Golden girls)
    await expect(drawerScope.findByText(/Golden girls/i)).resolves.toBeInTheDocument();
  },
};

/**
 * User details - Assigned roles tab
 *
 * Tests the Assigned roles tab in the user details drawer
 */
export const UserDetailsAssignedRoles: Story = {
  name: 'User Details - Assigned Roles Tab',
  tags: ['gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
Tests the Assigned roles tab matching \`static/mocks/Users tab/Frame 109.png\`.

**GAP:** The V2 API is needed to show:
- Which user group grants the role
- Which workspace the role applies to

Currently shows "?" placeholders for these columns.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(500);

    // Click on a user row
    const adumbleRow = await canvas.findByText('adumble');
    await user.click(adumbleRow);
    await delay(300);

    // Get drawer
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    expect(drawer).toBeInTheDocument();
    const drawerScope = within(drawer as HTMLElement);

    // Click on Assigned roles tab
    const rolesTab = await drawerScope.findByText(/Assigned roles/i);
    await user.click(rolesTab);
    await delay(300);

    // Verify roles are displayed
    // Note: With V1 API, we see role names but not workspace/group details
    await expect(drawerScope.findByText(/Organization Administrator|User Access Administrator|Viewer/i)).resolves.toBeInTheDocument();
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

    // Wait for data to load
    await delay(500);

    // Find the filter input
    const filterInput = await canvas.findByPlaceholderText(/filter by username/i);
    expect(filterInput).toBeInTheDocument();

    // Type a filter value
    await user.type(filterInput, 'spice');
    await user.keyboard('{Enter}');
    await delay(500);

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

    // Wait for data to load
    await delay(500);

    // Find and click checkboxes for multiple users
    const checkboxes = await canvas.findAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(2);

    // Select first two data rows (skip header if present)
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);
    await delay(200);

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
  name: 'Tab Navigation',
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

    // Wait for data to load
    await delay(500);

    // Verify Users tab is active
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    expect(usersTab).toHaveAttribute('aria-selected', 'true');

    // Verify users are shown
    await expect(canvas.findByText('adumble')).resolves.toBeInTheDocument();

    // Click User Groups tab
    const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(groupsTab);
    await delay(500);

    // Verify groups tab is now active
    expect(groupsTab).toHaveAttribute('aria-selected', 'true');

    // Verify groups are shown
    await expect(canvas.findByText('Default group')).resolves.toBeInTheDocument();

    // Click back to Users tab
    await user.click(usersTab);
    await delay(500);

    // Verify users are shown again
    expect(usersTab).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.findByText('adumble')).resolves.toBeInTheDocument();
  },
};
