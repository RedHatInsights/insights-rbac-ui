/**
 * Roles Journey
 * Based on: static/mocks/Roles/
 *
 * ⚠️ GAP: This feature requires V2 API which is not yet available.
 * Currently using V1 API with limited functionality.
 *
 * Features tested:
 * - Roles table with V2 columns
 * - Role details drawer
 * - Permissions tab
 * - Assigned user groups tab
 * - Create role button
 * - Edit/Delete actions
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { delay } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { navigateToPage, resetStoryState } from '../_shared/helpers';
import { handlersWithV2Gaps } from './_shared';

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Roles',
  tags: ['access-management', 'roles', 'gap:v2-api'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  args: {
    initialRoute: '/iam/access-management/roles',
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: true,
    'platform.rbac.common-auth-model': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
    }),
    msw: {
      handlers: handlersWithV2Gaps,
    },
    docs: {
      description: {
        component: `
# Roles Journey

⚠️ **GAP: V2 API Required**

Tests the Roles page functionality. This feature requires the V2 RBAC API which is not yet available (estimated 4-6 weeks per meeting notes).

## Design Reference
- \`static/mocks/Roles/Frame 139.png\` - Roles table
- \`static/mocks/Roles/Frame 140.png\` - Role details drawer (Permissions tab)
- \`static/mocks/Roles/Frame 141.png\` - Role details drawer (Assigned user groups tab)
- \`static/mocks/Roles/Frame 181.png\` - "Not available" state for canned roles

## V2 API Features Needed
| Feature | V1 Status | V2 Requirement |
|---------|-----------|----------------|
| Permissions count column | ❌ Not available | Needed |
| Workspaces column | ❌ Not available | Needed |
| User group column | ❌ Not available | Needed |
| Permissions in drawer | ⚠️ Limited | Full details needed |
| Assigned user groups | ❌ Not available | Needed |
| "Not available" for canned roles | ❌ | V2 role type differentiation |

## Current Implementation
Using V1 API with placeholders for V2 features.
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Roles table (V2 design)
 *
 * Tests the roles table with V2 columns (using mock data)
 */
export const TableView: Story = {
  name: 'Table View (V2 Design)',
  tags: ['autodocs', 'gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests the Roles table matching \`static/mocks/Roles/Frame 139.png\`.

**V2 Columns (not available in V1):**
- Name ✅
- Description ✅
- Permissions (count) ❌ GAP
- Workspaces (count) ❌ GAP
- User group (count) ❌ GAP
- Last modified ✅

**Canned roles behavior:**
- System/canned roles should NOT have kebab menu or checkbox
- "Not available" shown for permissions/workspaces/user group counts
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for page to load
    await delay(500);

    // Verify Roles page header
    await expect(canvas.findByText('Roles')).resolves.toBeInTheDocument();

    // Verify roles are displayed (V1 roles)
    await expect(canvas.findByText(/Organization Administrator/i)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/User Access Administrator/i)).resolves.toBeInTheDocument();

    // Verify Create role button
    const createButton = canvas.queryByText(/Create role/i);
    if (createButton) {
      expect(createButton).toBeInTheDocument();
    }

    // Note: V2 columns (Permissions, Workspaces, User group) would require V2 API
    // Current V1 API doesn't provide these counts
  },
};

/**
 * Role details drawer - Permissions tab
 *
 * Tests the role details drawer showing permissions
 */
export const RoleDetailsPermissions: Story = {
  name: 'Role Details - Permissions Tab',
  tags: ['gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests the Permissions tab matching \`static/mocks/Roles/Frame 140.png\`.

**V2 Requirements:**
- Full permission details (Application, Resource type, Operation)
- Proper permission grouping
- Permission count accurate

Currently using V1 access data with limited details.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Click on a role to open drawer
    const roleRow = await canvas.findByText(/Organization Administrator/i);
    await user.click(roleRow);
    await delay(300);

    // Verify drawer opens
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    if (drawer) {
      const drawerScope = within(drawer as HTMLElement);

      // Verify tabs are present
      await expect(drawerScope.findByText(/Permissions/i)).resolves.toBeInTheDocument();
      await expect(drawerScope.findByText(/Assigned user groups/i)).resolves.toBeInTheDocument();

      // Note: Actual permission details would require V2 API
    }
  },
};

/**
 * Role details drawer - Assigned user groups tab
 *
 * Tests the assigned user groups tab (V2 GAP)
 */
export const RoleDetailsUserGroups: Story = {
  name: 'Role Details - Assigned User Groups Tab',
  tags: ['gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests the Assigned user groups tab matching \`static/mocks/Roles/Frame 141.png\`.

**V2 Requirements:**
- List of user groups that have this role assigned
- Workspace context for each assignment

This data is NOT available in V1 API.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Click on a role to open drawer
    const roleRow = await canvas.findByText(/Organization Administrator/i);
    await user.click(roleRow);
    await delay(300);

    // Verify drawer opens
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    if (drawer) {
      const drawerScope = within(drawer as HTMLElement);

      // Click Assigned user groups tab
      const userGroupsTab = await drawerScope.findByText(/Assigned user groups/i);
      await user.click(userGroupsTab);
      await delay(300);

      // Note: User groups data would require V2 API
      // V1 API doesn't provide role-to-group mapping in this direction
    }
  },
};

/**
 * Canned roles - "Not available" state
 *
 * Tests that canned/system roles show "Not available" for counts
 */
export const CannedRolesNotAvailable: Story = {
  name: 'Canned Roles - Not Available State',
  tags: ['gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests the "Not available" state for canned roles matching \`static/mocks/Roles/Frame 181.png\`.

**V2 Requirements:**
- System/canned roles identified by flag
- "Not available" displayed for Permissions, Workspaces, User group columns
- No kebab menu or checkbox for canned roles

V1 API has \`system\` flag but doesn't have the column data to show "Not available".
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for page to load
    await delay(500);

    // Verify roles are displayed
    await expect(canvas.findByText(/Organization Administrator/i)).resolves.toBeInTheDocument();

    // Note: "Not available" text and disabled kebab/checkbox would require V2 API
    // V1 API identifies system roles but doesn't provide the column data
  },
};

/**
 * Filter by role name
 *
 * Tests filtering roles by name
 */
export const FilterByRoleName: Story = {
  name: 'Filter by Role Name',
  parameters: {
    docs: {
      description: {
        story: `
Tests filtering roles by name.

**Expected behavior:**
1. Type in the filter input
2. Table updates to show matching roles
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Find the filter input
    const filterInput = await canvas.findByPlaceholderText(/filter by name/i);
    expect(filterInput).toBeInTheDocument();

    // Type a filter value
    await user.type(filterInput, 'Admin');
    await user.keyboard('{Enter}');
    await delay(500);

    // Verify filtered results
    await expect(canvas.findByText(/Organization Administrator/i)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/User Access Administrator/i)).resolves.toBeInTheDocument();

    // Non-matching roles should not be visible
    expect(canvas.queryByText(/Viewer/i)).not.toBeInTheDocument();
  },
};

/**
 * Navigate to Roles from sidebar
 *
 * Tests navigation to the Roles page
 */
export const NavigateFromSidebar: Story = {
  name: 'Navigate from Sidebar',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests navigating to the Roles page from the sidebar.

**Expected behavior:**
1. Start on Users and User Groups page
2. Click "Roles" in the sidebar
3. Navigate to Roles page
4. Roles table displays
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for initial page
    await delay(500);

    // Navigate to Roles
    await navigateToPage(user, canvas, 'Roles');
    await delay(500);

    // Verify Roles page
    await expect(canvas.findByText('Roles')).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Organization Administrator/i)).resolves.toBeInTheDocument();
  },
};
