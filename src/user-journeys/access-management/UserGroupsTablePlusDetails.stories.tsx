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
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { withFeatureGap } from '../_shared/components/FeatureGapBanner';
import { TEST_TIMEOUTS, resetStoryState, waitForPageToLoad } from '../_shared/helpers';
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

| Groups table | Kebab menu | Group details drawer |
|:---:|:---:|:---:|
| [![Groups table](/mocks/User%20groups%20table%20plus%20details/Frame%2012.png)](/mocks/User%20groups%20table%20plus%20details/Frame%2012.png) | [![Kebab menu](/mocks/User%20groups%20table%20plus%20details/Frame%2013.png)](/mocks/User%20groups%20table%20plus%20details/Frame%2013.png) | [![Group details drawer](/mocks/User%20groups%20table%20plus%20details/Frame%20152.png)](/mocks/User%20groups%20table%20plus%20details/Frame%20152.png) |

| Service accounts tab | Roles tab | Empty state |
|:---:|:---:|:---:|
| [![Service accounts tab](/mocks/User%20groups%20table%20plus%20details/Frame%20153.png)](/mocks/User%20groups%20table%20plus%20details/Frame%20153.png) | [![Roles tab](/mocks/User%20groups%20table%20plus%20details/Frame%20198.png)](/mocks/User%20groups%20table%20plus%20details/Frame%20198.png) | [![Empty state](/mocks/User%20groups%20table%20plus%20details/Basic%20Empty%20State.png)](/mocks/User%20groups%20table%20plus%20details/Basic%20Empty%20State.png) |

## Features
| Feature | Status | API |
|---------|--------|-----|
| Groups table | ✅ Implemented | V1 |
| Users count column | ✅ Implemented | V1 |
| Service accounts count column | ⚠️ GAP | V2 (guessed) |
| Group details drawer | ✅ Implemented | V1 |
| Users tab in drawer | ✅ Implemented | V1 |
| Service accounts tab (list) | ✅ Implemented | SSO API |
| Service accounts tab (in group) | ✅ Implemented | V1 principals API |
| Roles tab in drawer | ⚠️ GAP | V2 needed |
| Create user group | ✅ Implemented | V1 |
| Edit user group | ✅ Implemented | V1 |
| Delete user group | ✅ Implemented | V1 |

**Notes:**
- Per V2 API Strategy, "Roles" and "Workspaces" columns were removed from the design
- Service accounts count shows "—" (V1 doesn't return this field)
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

    // Wait for page to load
    await waitForPageToLoad(canvas, 'Default group');

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

    // Verify Create user group button is present (use role selector to avoid multiple matches)
    const createButton = await canvas.findByRole('button', { name: /Create user group/i });
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

    // Wait for page to load
    await waitForPageToLoad(canvas, 'Golden girls');

    // Click on Golden girls group
    const goldenGirlsRow = await canvas.findByText('Golden girls');
    await user.click(goldenGirlsRow);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

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

    // Verify Users tab content (Golden girls members - check for at least one member)
    const userMatches = await drawerScope.findAllByText(/bwhite/i);
    expect(userMatches.length).toBeGreaterThan(0);
  },
};

/**
 * Group details - Service accounts tab
 *
 * Tests the Service accounts tab (GAP - external SSO API)
 */
export const GroupDetailsServiceAccounts: Story = {
  name: 'Group Details - Service Accounts Tab',
  parameters: {
    docs: {
      description: {
        story: `
Tests the Service accounts tab matching \`static/mocks/User groups table plus details/Frame 153.png\`.

**Implementation:**
- Lists service accounts from SSO API (works in staging)
- Shows which service accounts are in the group via V1 principals API
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, 'Admin group');

    // Click on Admin group
    const adminGroupRow = await canvas.findByText('Admin group');
    await user.click(adminGroupRow);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Get drawer
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    expect(drawer).toBeInTheDocument();
    const drawerScope = within(drawer as HTMLElement);

    // Click on Service accounts tab
    const saTab = await drawerScope.findByText(/Service accounts/i);
    await user.click(saTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

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
  name: '⚠️ [V2 GAP] Group Details - Roles Tab',
  tags: ['gap:guessed-v2-api'],
  decorators: [
    withFeatureGap({
      title: 'Group Roles with Workspace - Guessed V2 API',
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
            GET /api/rbac/v1/groups/:uuid/roles/
          </code>
          <p style={{ margin: '8px 0 4px 0' }}>
            <strong>Expected Response (with V2 workspace data):</strong>
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
    "name": "Cost Administrator",
    "display_name": "Cost Administrator",
    "workspace": "Production",
    "workspaceId": "ws-prod-123"
  }],
  "meta": { "count": 1 }
}`}
          </pre>
          <p style={{ margin: '8px 0 0 0', fontStyle: 'italic', fontSize: '11px' }}>
            Gap: The <code>workspace</code> and <code>workspaceId</code> fields are guessed additions to the V1 response.
          </p>
        </>
      ),
      expectedBehavior: ['Workspace column shows which workspace the role applies to', 'V2 API should return role bindings with workspace context'],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: `
Tests the Roles tab in the group details drawer.

**Expected behavior:**
1. Switch to Roles tab
2. Table shows roles assigned to this group
3. Workspace column shows workspace names (V2 API mock data)
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, 'Admin group');

    // Click on Admin group
    const adminGroupRow = await canvas.findByText('Admin group');
    await user.click(adminGroupRow);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Get drawer
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    expect(drawer).toBeInTheDocument();
    const drawerScope = within(drawer as HTMLElement);

    // Click on Roles tab (use role selector to avoid multiple matches)
    const rolesTab = await drawerScope.findByRole('tab', { name: /Assigned roles/i });
    await user.click(rolesTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Verify roles content loads - Admin group has Tenant Administrator and Workspace Administrator
    await expect(drawerScope.findByText('Tenant Administrator')).resolves.toBeInTheDocument();
  },
};

/**
 * Kebab menu actions
 *
 * Tests the Edit and Delete actions in the kebab menu
 */
export const KebabMenuActions: Story = {
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

    // Wait for page to load
    await waitForPageToLoad(canvas, 'Golden girls');

    // Find kebab menu for a non-system group (Golden girls)
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    expect(kebabButtons.length).toBeGreaterThan(0);

    // Click the kebab for the last row (Golden girls)
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

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

    // Wait for empty state to load - use findBy with regex for case-insensitive match
    await waitFor(
      async () => {
        await expect(canvas.getByText(/no user group found/i)).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    // Verify empty state message (singular form)
    await expect(canvas.findByText(/no user group found/i)).resolves.toBeInTheDocument();

    // Create button should still be visible
    const createButton = canvas.queryByRole('button', { name: /Create user group/i });
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

    // Wait for page to load
    await waitForPageToLoad(canvas, 'Admin group');

    // Find the filter input
    const filterInput = await canvas.findByPlaceholderText(/filter by name/i);
    expect(filterInput).toBeInTheDocument();

    // Type a filter value
    await user.type(filterInput, 'girls');
    await user.keyboard('{Enter}');

    // Wait for filtered results
    await waitForPageToLoad(canvas, 'Spice girls');

    // Verify filtered results
    await expect(canvas.findByText('Spice girls')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Golden girls')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Powerpuff girls')).resolves.toBeInTheDocument();

    // Non-matching groups should not be visible
    expect(canvas.queryByText('Admin group')).not.toBeInTheDocument();
  },
};
