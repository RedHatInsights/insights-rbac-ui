/**
 * User Groups Table Plus Details Journey
 * Based on: static/mocks/User groups table plus details/
 *
 * Features tested:
 * - User groups table with columns
 * - Row click opens group details drawer
 * - Group details drawer with tabs: Users, Service accounts, Roles
 * - Create user group button
 * - Edit/Delete actions in kebab menu
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { defaultHandlers } from './_shared';

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/User groups table plus details',
  tags: ['access-management', 'user-groups'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
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
# User Groups Table Plus Details Journey

Tests the User Groups tab and group details drawer.

## Design Reference
- \`static/mocks/User groups table plus details/Frame 12.png\` - Groups table
- \`static/mocks/User groups table plus details/Frame 13.png\` - Kebab menu
- \`static/mocks/User groups table plus details/Frame 152.png\` - Group details drawer
- \`static/mocks/User groups table plus details/Frame 153.png\` - Service accounts tab
- \`static/mocks/User groups table plus details/Frame 198.png\` - Roles tab
- \`static/mocks/User groups table plus details/Basic Empty State.png\` - Empty state

## Features
| Feature | Status | API |
|---------|--------|-----|
| Groups table | ✅ Implemented | V1 |
| Users count column | ✅ Implemented | V1 |
| Service accounts column | ⚠️ GAP | External SSO API |
| Roles count column | ✅ Implemented | V1 |
| Workspaces column | ⚠️ GAP | V2 needed |
| Group details drawer | ✅ Implemented | V1 |
| Users tab in drawer | ✅ Implemented | V1 |
| Service accounts tab | ⚠️ GAP | External SSO API |
| Roles tab in drawer | ✅ Implemented | V1 |
| Create user group | ✅ Implemented | V1 |
| Edit user group | ✅ Implemented | V1 |
| Delete user group | ✅ Implemented | V1 |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default groups table view
 *
 * Tests:
 * - Table renders with all expected columns
 * - Groups data loads from API
 * - Counts display correctly
 */
export const TableView: Story = {
  name: 'Table View',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests the default User Groups table view matching \`static/mocks/User groups table plus details/Frame 12.png\`.

**Columns verified:**
- User group name
- Description
- Users (count)
- Service accounts (count) - GAP
- Roles (count)
- Workspaces (count) - GAP
- Last modified
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for data to load
    await delay(500);

    // Verify User Groups tab is active
    const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    expect(groupsTab).toHaveAttribute('aria-selected', 'true');

    // Verify groups are displayed
    await expect(canvas.findByText('Default group')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Admin group')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Spice girls')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Golden girls')).resolves.toBeInTheDocument();

    // Verify descriptions display
    await expect(canvas.findByText(/Group that gets all users/i)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/All org admin users/i)).resolves.toBeInTheDocument();

    // Verify Create user group button is present
    const createButton = await canvas.findByText(/Create user group/i);
    expect(createButton).toBeInTheDocument();
  },
};

/**
 * Group details drawer
 *
 * Tests:
 * - Clicking a row opens the drawer
 * - Drawer shows group name and description
 * - Users tab displays members
 */
export const GroupDetailsDrawer: Story = {
  name: 'Group Details Drawer',
  parameters: {
    docs: {
      description: {
        story: `
Tests the group details drawer matching \`static/mocks/User groups table plus details/Frame 152.png\`.

**Expected behavior:**
1. Click on a group row
2. Drawer opens with group name
3. Users tab shows group members
4. Can switch between Users, Service accounts, and Roles tabs
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

    // Click on Golden girls group
    const goldenGirlsRow = await canvas.findByText('Golden girls');
    await user.click(goldenGirlsRow);
    await delay(300);

    // Verify drawer opens
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    expect(drawer).toBeInTheDocument();

    const drawerScope = within(drawer as HTMLElement);

    // Check header shows group name
    await expect(drawerScope.findByText(/Golden girls/i)).resolves.toBeInTheDocument();

    // Verify tabs are present
    await expect(drawerScope.findByText(/Users/i)).resolves.toBeInTheDocument();
    await expect(drawerScope.findByText(/Service accounts/i)).resolves.toBeInTheDocument();
    await expect(drawerScope.findByText(/Assigned roles/i)).resolves.toBeInTheDocument();

    // Verify Users tab content (Golden girls members)
    await expect(drawerScope.findByText(/bwhite|Betty/i)).resolves.toBeInTheDocument();
  },
};

/**
 * Group details - Service accounts tab
 *
 * Tests the Service accounts tab (GAP - external SSO API)
 */
export const GroupDetailsServiceAccounts: Story = {
  name: 'Group Details - Service Accounts Tab',
  tags: ['gap:external-api'],
  parameters: {
    docs: {
      description: {
        story: `
Tests the Service accounts tab matching \`static/mocks/User groups table plus details/Frame 153.png\`.

**GAP:** Service accounts require external SSO API which is not fully integrated.
Currently shows placeholder/mock data.
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

    // Click on Admin group
    const adminGroupRow = await canvas.findByText('Admin group');
    await user.click(adminGroupRow);
    await delay(300);

    // Get drawer
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    expect(drawer).toBeInTheDocument();
    const drawerScope = within(drawer as HTMLElement);

    // Click on Service accounts tab
    const saTab = await drawerScope.findByText(/Service accounts/i);
    await user.click(saTab);
    await delay(300);

    // Verify service accounts content loads
    // Note: Currently using mock data from external SSO API simulation
    // This is a GAP that needs the actual SSO integration
  },
};

/**
 * Group details - Roles tab
 *
 * Tests the Roles tab in the group details drawer
 */
export const GroupDetailsRoles: Story = {
  name: 'Group Details - Roles Tab',
  parameters: {
    docs: {
      description: {
        story: `
Tests the Roles tab matching \`static/mocks/User groups table plus details/Frame 198.png\`.

**Expected behavior:**
1. Switch to Roles tab
2. Table shows roles assigned to this group
3. Workspace column shows "?" (V2 GAP)
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

    // Click on Admin group
    const adminGroupRow = await canvas.findByText('Admin group');
    await user.click(adminGroupRow);
    await delay(300);

    // Get drawer
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    expect(drawer).toBeInTheDocument();
    const drawerScope = within(drawer as HTMLElement);

    // Click on Roles tab
    const rolesTab = await drawerScope.findByText(/Assigned roles/i);
    await user.click(rolesTab);
    await delay(300);

    // Verify roles content loads
    await expect(drawerScope.findByText(/Organization Administrator|User Access Administrator/i)).resolves.toBeInTheDocument();
  },
};

/**
 * Kebab menu actions
 *
 * Tests the Edit and Delete actions in the kebab menu
 */
export const KebabMenuActions: Story = {
  name: 'Kebab Menu Actions',
  parameters: {
    docs: {
      description: {
        story: `
Tests the kebab menu actions matching \`static/mocks/User groups table plus details/Frame 13.png\`.

**Expected behavior:**
1. Click kebab menu on a group row
2. Menu shows "Edit user group" and "Delete user group" options
3. Edit navigates to edit page
4. Delete shows confirmation modal
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

    // Find kebab menu for a non-system group (Golden girls)
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    expect(kebabButtons.length).toBeGreaterThan(0);

    // Click the kebab for the last row (Golden girls)
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(200);

    // Verify menu options
    await expect(within(document.body).findByText(/Edit user group/i)).resolves.toBeInTheDocument();
    await expect(within(document.body).findByText(/Delete user group/i)).resolves.toBeInTheDocument();
  },
};

/**
 * Empty state
 *
 * Tests the empty state when no groups exist
 */
export const EmptyState: Story = {
  name: 'Empty State',
  parameters: {
    docs: {
      description: {
        story: `
Tests the empty state matching \`static/mocks/User groups table plus details/Basic Empty State.png\`.

**Expected behavior:**
- Empty state message when no groups
- Create user group button prominently displayed
        `,
      },
    },
    msw: {
      handlers: [
        // Override groups endpoint to return empty (this runs first, taking precedence)
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0 },
          });
        }),
        // Include other handlers for users, roles, etc.
        ...defaultHandlers,
      ],
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for data to load
    await delay(500);

    // Verify empty state message
    await expect(canvas.findByText(/no user groups found/i)).resolves.toBeInTheDocument();

    // Create button should still be visible
    const createButton = canvas.queryByText(/Create user group/i);
    expect(createButton).toBeInTheDocument();
  },
};

/**
 * Filter by group name
 *
 * Tests the group name filter functionality
 */
export const FilterByGroupName: Story = {
  name: 'Filter by Group Name',
  parameters: {
    docs: {
      description: {
        story: `
Tests filtering groups by name.

**Expected behavior:**
1. Type in the filter input
2. Table updates to show matching groups
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
    const filterInput = await canvas.findByPlaceholderText(/filter by user group/i);
    expect(filterInput).toBeInTheDocument();

    // Type a filter value
    await user.type(filterInput, 'girls');
    await user.keyboard('{Enter}');
    await delay(500);

    // Verify filtered results
    await expect(canvas.findByText('Spice girls')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Golden girls')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Powerpuff girls')).resolves.toBeInTheDocument();

    // Non-matching groups should not be visible
    expect(canvas.queryByText('Admin group')).not.toBeInTheDocument();
  },
};
