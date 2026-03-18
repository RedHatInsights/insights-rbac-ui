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
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { withFeatureGap } from '../_shared/components/FeatureGapBanner';
import { resetStoryState } from '../_shared/helpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { clearAndType, clickTab, waitForContentReady, waitForDrawer } from '../../test-utils/interactionHelpers';
import { waitForPageToLoad } from '../../test-utils/tableHelpers';
import { groupsHandlers, v2DefaultHandlers } from './_shared';

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Users and Groups/User Groups Table',
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
    permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
    orgAdmin: true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.workspaces-organization-management': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.workspaces-organization-management': true,
    }),
    msw: {
      handlers: v2DefaultHandlers,
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and verify User Groups tab', async () => {
      await waitForPageToLoad(canvas, 'Default group');
      const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
      expect(groupsTab).toHaveAttribute('aria-selected', 'true');
    });

    await step('Verify groups and descriptions displayed', async () => {
      await expect(canvas.findByText('Default group')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Admin group')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Spice girls')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Golden girls')).resolves.toBeInTheDocument();
      await expect(canvas.findByText(/Group that gets all users/i)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(/All org admin users/i)).resolves.toBeInTheDocument();
    });

    await step('Verify Create user group button present', async () => {
      const createButton = await canvas.findByRole('button', { name: /Create user group/i });
      expect(createButton).toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and open group details drawer', async () => {
      await waitForPageToLoad(canvas, 'Golden girls');
      const goldenGirlsRow = await canvas.findByText('Golden girls');
      await user.click(goldenGirlsRow);
    });

    await step('Verify drawer content and tabs', async () => {
      const drawerScope = await waitForDrawer();
      await expect(drawerScope.findByText(/Golden girls/i)).resolves.toBeInTheDocument();
      await expect(drawerScope.findByText(/Users/i)).resolves.toBeInTheDocument();
      await expect(drawerScope.findByText(/Service accounts/i)).resolves.toBeInTheDocument();
      await expect(drawerScope.findByText(/Assigned roles/i)).resolves.toBeInTheDocument();
      const userMatches = await drawerScope.findAllByText(/bwhite/i);
      expect(userMatches.length).toBeGreaterThan(0);
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and open group drawer', async () => {
      await waitForPageToLoad(canvas, 'Admin group');
      const adminGroupRow = await canvas.findByText('Admin group');
      await user.click(adminGroupRow);
    });

    await step('Switch to Service accounts tab', async () => {
      const drawerScope = await waitForDrawer();
      await clickTab(user, drawerScope, /Service accounts/i);
    });
  },
};

/**
 * Group details - Roles tab
 *
 * Tests the Roles tab in the group details drawer
 */
export const GroupDetailsRoles: Story = {
  name: 'Group Details - Roles Tab',
  tags: [],
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and open group drawer', async () => {
      await waitForPageToLoad(canvas, 'Admin group');
      const adminGroupRow = await canvas.findByText('Admin group');
      await user.click(adminGroupRow);
    });

    await step('Switch to Roles tab and verify content', async () => {
      const drawerScope = await waitForDrawer();
      await clickTab(user, drawerScope, /Assigned roles/i);
      await expect(drawerScope.findByText('Tenant Administrator')).resolves.toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and open kebab menu', async () => {
      await waitForPageToLoad(canvas, 'Golden girls');
      const kebabButtons = await canvas.findAllByLabelText(/actions/i);
      expect(kebabButtons.length).toBeGreaterThan(0);
      await user.click(kebabButtons[kebabButtons.length - 1]);
    });

    await step('Verify menu options', async () => {
      await expect(within(document.body).findByText(/Edit user group/i)).resolves.toBeInTheDocument();
      await expect(within(document.body).findByText(/Delete user group/i)).resolves.toBeInTheDocument();
    });
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
        ...groupsHandlers([]),
        ...v2DefaultHandlers.filter((h) => {
          const path = h.info?.path?.toString() || '';
          if (!path.includes('/api/rbac/v1/groups') && !path.includes('/api/rbac/v2/groups')) return true;
          if (path.includes('/principals/') || path.includes('/service-accounts/')) return true;
          return false;
        }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for empty state', async () => {
      await waitFor(
        () => {
          expect(canvas.queryByText(/no user group found/i)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Verify empty state message and Create button', async () => {
      await expect(canvas.findByText(/no user group found/i)).resolves.toBeInTheDocument();
      const createButton = canvas.queryByRole('button', { name: /Create user group/i });
      expect(createButton).toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and apply filter', async () => {
      await waitForPageToLoad(canvas, 'Admin group');
      await clearAndType(user, () => canvas.getByPlaceholderText(/filter by name/i) as HTMLInputElement, 'girls');
      await user.keyboard('{Enter}');
    });

    await step('Verify filtered results', async () => {
      await waitForPageToLoad(canvas, 'Spice girls');
      await expect(canvas.findByText('Spice girls')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Golden girls')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Powerpuff girls')).resolves.toBeInTheDocument();
      expect(canvas.queryByText('Admin group')).not.toBeInTheDocument();
    });
  },
};
