/**
 * Add to User Group Journey
 * Based on: static/mocks/Add to user group/
 *
 * Features tested:
 * - Select users from Users tab
 * - Click "Add to user group" button
 * - Modal opens with group selection
 * - Add users to selected groups
 * - Visual verification before and after
 * - API call verification with correct data format
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { type ScopedQueries, selectTableRow, waitForContentReady, waitForDrawer, waitForModal } from '../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS, type UserEvent } from '../../test-utils/testUtils';
import { waitForPageToLoad } from '../../test-utils/tableHelpers';
import { userGroupsMembership as baseUserGroupsMembership, mockGroups, mockUsers } from './_shared/mockData';
import { v2DefaultHandlers } from './_shared';

// =============================================================================
// SPIES FOR API VERIFICATION
// =============================================================================

const addMembersToGroupSpy = fn();

// =============================================================================
// MUTABLE STATE FOR TESTING
// This allows us to verify visual changes after API calls
// =============================================================================

// Mutable state object - handlers capture closure over THIS object
// We must MUTATE it, not reassign, so closures see the changes
const userGroupsMembership: Record<string, string[]> = {};

const resetMembershipState = () => {
  // Clear existing keys (mutate, don't reassign)
  for (const key of Object.keys(userGroupsMembership)) {
    delete userGroupsMembership[key];
  }
  // Copy from base data
  const base = JSON.parse(JSON.stringify(baseUserGroupsMembership)) as Record<string, string[]>;
  for (const key of Object.keys(base)) {
    userGroupsMembership[key] = base[key];
  }
};

// =============================================================================
// CUSTOM HANDLERS WITH STATE MANAGEMENT
// =============================================================================

const createTestHandlers = () => [
  // Override principals endpoint to include dynamic group count
  http.get('/api/rbac/v1/principals/', async ({ request }) => {
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const usersWithGroupCount = mockUsers.map((user) => ({
      ...user,
      user_groups_count: userGroupsMembership[user.username]?.length || 0,
    }));

    return HttpResponse.json({
      data: usersWithGroupCount.slice(offset, offset + limit),
      meta: { count: mockUsers.length, limit, offset },
    });
  }),

  // Override groups for user endpoint (used in drawer)
  http.get('/api/rbac/v1/groups/', async ({ request }) => {
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let filteredGroups = [...mockGroups];

    // Filter by username (groups user belongs to)
    if (username) {
      const userGroups = userGroupsMembership[username] || [];
      filteredGroups = mockGroups.filter((g) => userGroups.includes(g.uuid));
    }

    return HttpResponse.json({
      data: filteredGroups.slice(offset, offset + limit),
      meta: { count: filteredGroups.length, limit, offset },
    });
  }),

  // Add members to group - WITH STATE UPDATE
  http.post('/api/rbac/v1/groups/:uuid/principals/', async ({ request, params }) => {
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);
    const groupId = params.uuid as string;
    const body = (await request.json()) as { principals: Array<{ username: string }> };

    // Record the API call for verification
    addMembersToGroupSpy({
      groupId,
      principals: body.principals,
    });

    // Update the membership state so subsequent reads reflect the change
    body.principals.forEach((principal) => {
      if (!userGroupsMembership[principal.username]) {
        userGroupsMembership[principal.username] = [];
      }
      if (!userGroupsMembership[principal.username].includes(groupId)) {
        userGroupsMembership[principal.username].push(groupId);
      }
    });

    return HttpResponse.json({
      data: body.principals,
      meta: { count: body.principals.length },
    });
  }),

  // Include remaining handlers (excluding overridden ones)
  ...v2DefaultHandlers.filter(
    (h) =>
      !h.info?.path?.toString().includes('/principals/') &&
      !h.info?.path?.toString().includes('/user-access/groups/') &&
      !h.info?.path?.toString().includes('/user-access/groups/:uuid/principals/'),
  ),
];

// =============================================================================
// HELPER FUNCTIONS FOR VISUAL VERIFICATION
// =============================================================================

/**
 * Opens the user details drawer (if not already open) and verifies the user's group membership
 */
async function verifyUserGroupMembership(
  user: UserEvent,
  canvas: ScopedQueries,
  username: string,
  expectedGroups: { name: string; shouldBePresent: boolean }[],
  options: { openDrawer?: boolean; closeDrawer?: boolean } = {},
) {
  const { openDrawer = true, closeDrawer = false } = options;

  if (openDrawer) {
    // Wait for the table to render first
    await canvas.findByRole('grid', { name: /users table/i });

    // Find the username text and click on its parent table cell to trigger the row click handler
    const userText = await canvas.findByText(username);
    const userCell = userText.closest('td');
    if (userCell) {
      await user.click(userCell);
    } else {
      await user.click(userText);
    }
  }

  const drawerScope = await waitForDrawer({ timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT });

  // Click on User groups tab if not already selected - look for the tab within the drawer
  const userGroupsTab = await drawerScope.findByRole('tab', { name: /user groups/i });
  await user.click(userGroupsTab);
  await waitFor(() => expect(userGroupsTab).toHaveAttribute('aria-selected', 'true'));

  // Find the active tab panel to scope our queries
  // This avoids finding duplicate text in other tabs (e.g., "Admin group" in Roles tab's User Group column)
  const tabPanel = await drawerScope.findByRole('tabpanel');
  const tabPanelScope = within(tabPanel);

  // Verify each expected group
  for (const group of expectedGroups) {
    if (group.shouldBePresent) {
      await expect(tabPanelScope.findByText(group.name)).resolves.toBeInTheDocument();
    } else {
      expect(tabPanelScope.queryByText(group.name)).not.toBeInTheDocument();
    }
  }

  if (closeDrawer) {
    // Close the drawer via close button (Drawer has no Escape handler)
    const closeButton = await drawerScope.findByRole('button', { name: /close/i });
    await user.click(closeButton);
    // PF6 sets the `hidden` attribute on DrawerPanelContent when collapsed
    await waitFor(
      () => {
        const panel = within(document.body).queryByTestId('detail-drawer-panel');
        expect(panel).toBeInTheDocument();
        expect(panel).not.toBeVisible();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );
  }
}

// =============================================================================
// STORY META
// =============================================================================

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Users and Groups/Add to User Group',
  tags: ['access-management', 'user-groups', 'modal'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      resetMembershipState();
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
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
      handlers: createTestHandlers(),
    },
    docs: {
      description: {
        component: `
# Add to User Group Journey

Tests the workflow for adding users to user groups with full visual verification.

## Design Reference

| Users selected | Modal opened |
|:---:|:---:|
| [![Users selected](/mocks/Add%20to%20user%20group/Frame%20111.png)](/mocks/Add%20to%20user%20group/Frame%20111.png) | [![Modal opened](/mocks/Add%20to%20user%20group/Frame%20179.png)](/mocks/Add%20to%20user%20group/Frame%20179.png) |

| Group selected | Success state |
|:---:|:---:|
| [![Group selected](/mocks/Add%20to%20user%20group/Frame%20180.png)](/mocks/Add%20to%20user%20group/Frame%20180.png) | [![Success state](/mocks/Add%20to%20user%20group/Frame%20185.png)](/mocks/Add%20to%20user%20group/Frame%20185.png) |

## Test Approach
1. **Pre-condition verification**: Visually verify users are NOT in target group
2. **Action**: Perform the add to group operation
3. **API verification**: Spy on API calls and verify correct data format
4. **Post-condition verification**: Visually verify users ARE now in target group

## API Contract
\`\`\`
POST /api/rbac/v1/groups/:uuid/principals/
Body: { principals: [{ username: string }] }
\`\`\`
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// =============================================================================
// STORIES
// =============================================================================

/**
 * Complete add to user group flow with full visual verification
 *
 * This test:
 * 1. Verifies users are NOT in target group before operation
 * 2. Performs the add to group operation
 * 3. Verifies API was called with correct data
 * 4. Verifies users ARE in target group after operation
 */
export const CompleteFlow: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
## Complete Add to User Group Flow

This test performs full end-to-end verification:

### Pre-conditions
- User "adumble" is verified to NOT be in "Powerpuff girls" group

### Actions
1. Select user "adumble" 
2. Click "Add to user group" button
3. Select "Powerpuff girls" group in modal
4. Click Add button

### API Verification
- Verifies POST to \`/api/rbac/v1/groups/group-powerpuff-girls/principals/\`
- Verifies body contains: \`{ principals: [{ username: "adumble" }] }\`

### Post-conditions
- User "adumble" is verified to BE in "Powerpuff girls" group
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      resetMembershipState();
      addMembersToGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for users table', async () => {
      await waitForPageToLoad(canvas, 'adumble');
    });

    await step('Verify pre-condition: adumble not in Powerpuff girls', async () => {
      await verifyUserGroupMembership(
        user,
        canvas,
        'adumble',
        [
          { name: 'Default group', shouldBePresent: true },
          { name: 'Admin group', shouldBePresent: true },
          { name: 'Powerpuff girls', shouldBePresent: false },
        ],
        { openDrawer: true, closeDrawer: false },
      );
    });

    await step('Select user and open add modal', async () => {
      await selectTableRow(user, canvas, 'adumble');
      const addButton = await canvas.findByRole('button', { name: /add to user group/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton).not.toBeDisabled();
      await user.click(addButton);
    });

    await step('Select group and submit', async () => {
      const modalScope = await waitForModal();
      await expect(modalScope.findByText(/add to user group/i)).resolves.toBeInTheDocument();
      await selectTableRow(user, modalScope, 'Powerpuff girls');
      const confirmAddButton = await modalScope.findByRole('button', { name: /^add$/i });
      await waitFor(() => expect(confirmAddButton).not.toBeDisabled());
      await user.click(confirmAddButton);
    });

    await step('Verify API calls', async () => {
      await waitFor(
        () => {
          expect(addMembersToGroupSpy).toHaveBeenCalledTimes(1);
          expect(addMembersToGroupSpy).toHaveBeenCalledWith({
            groupId: 'group-powerpuff-girls',
            principals: [{ username: 'adumble' }],
          });
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });

    await step('Verify modal closed', async () => {
      await waitFor(() => {
        expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    await step('Verify post-condition: adumble in Powerpuff girls', async () => {
      await verifyUserGroupMembership(
        user,
        canvas,
        'adumble',
        [
          { name: 'Default group', shouldBePresent: true },
          { name: 'Admin group', shouldBePresent: true },
          { name: 'Powerpuff girls', shouldBePresent: true },
        ],
        { openDrawer: false, closeDrawer: true },
      );
    });
  },
};

/**
 * Add multiple users to a group
 *
 * Verifies the API receives multiple usernames
 */
export const MultipleUsers: Story = {
  parameters: {
    docs: {
      description: {
        story: `
## Add Multiple Users to Group

### Pre-conditions
- Users "adumble" and "bbunny" are verified to NOT be in "Powerpuff girls" group

### API Verification
- Verifies body contains: \`{ principals: [{ username: "adumble" }, { username: "bbunny" }] }\`

### Post-conditions  
- Both users are verified to BE in "Powerpuff girls" group
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      resetMembershipState();
      addMembersToGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for users table', async () => {
      await waitForPageToLoad(canvas, 'adumble');
    });

    await step('Verify pre-condition: both users not in Powerpuff girls', async () => {
      await verifyUserGroupMembership(user, canvas, 'adumble', [{ name: 'Powerpuff girls', shouldBePresent: false }]);
      await verifyUserGroupMembership(user, canvas, 'bbunny', [{ name: 'Powerpuff girls', shouldBePresent: false }]);
    });

    await step('Select both users and add to group', async () => {
      await selectTableRow(user, canvas, 'adumble');
      await selectTableRow(user, canvas, 'bbunny');
      const addButton = await canvas.findByRole('button', { name: /add to user group/i });
      await user.click(addButton);
      const modalScope = await waitForModal();
      await selectTableRow(user, modalScope, 'Powerpuff girls');
      const confirmButton = await modalScope.findByRole('button', { name: /^add$/i });
      await user.click(confirmButton);
    });

    await step('Verify API calls', async () => {
      await waitFor(() => expect(addMembersToGroupSpy).toHaveBeenCalledTimes(1));
      expect(addMembersToGroupSpy).toHaveBeenCalledWith({
        groupId: 'group-powerpuff-girls',
        principals: expect.arrayContaining([{ username: 'adumble' }, { username: 'bbunny' }]),
      });
    });

    await step('Verify post-condition: both users in Powerpuff girls', async () => {
      await verifyUserGroupMembership(user, canvas, 'adumble', [{ name: 'Powerpuff girls', shouldBePresent: true }]);
      await verifyUserGroupMembership(user, canvas, 'bbunny', [{ name: 'Powerpuff girls', shouldBePresent: true }]);
    });
  },
};

/**
 * Cancel flow - verifies no changes are made
 */
export const CancelFlow: Story = {
  parameters: {
    docs: {
      description: {
        story: `
## Cancel Add to User Group

Verifies that canceling the modal:
1. Does NOT call the API
2. Does NOT change user's group membership
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      resetMembershipState();
      addMembersToGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for users table', async () => {
      await waitForPageToLoad(canvas, 'adumble');
    });

    await step('Verify pre-condition: adumble not in Powerpuff girls', async () => {
      await verifyUserGroupMembership(user, canvas, 'adumble', [{ name: 'Powerpuff girls', shouldBePresent: false }]);
    });

    await step('Select user, open modal, select group, then cancel', async () => {
      const adumbleRow = await canvas.findByText('adumble');
      const adumbleCheckbox = adumbleRow.closest('tr')?.querySelector('input[type="checkbox"]');
      await user.click(adumbleCheckbox!);
      const addButton = await canvas.findByRole('button', { name: /add to user group/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await user.click(addButton);
      const modalScope = await waitForModal();
      const powerpuffText = await modalScope.findByText('Powerpuff girls');
      const powerpuffCheckbox = powerpuffText.closest('tr')?.querySelector('input[type="checkbox"]');
      await user.click(powerpuffCheckbox!);
      const cancelButton = await modalScope.findByRole('button', { name: /cancel/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await user.click(cancelButton);
    });

    await step('Verify modal closed', async () => {
      await waitFor(() => {
        expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    await step('Verify no API call and no state change', async () => {
      expect(addMembersToGroupSpy).not.toHaveBeenCalled();
      await verifyUserGroupMembership(user, canvas, 'adumble', [{ name: 'Powerpuff girls', shouldBePresent: false }], {
        openDrawer: false,
      });
    });
  },
};

/**
 * Add to multiple groups at once
 */
export const MultipleGroups: Story = {
  parameters: {
    docs: {
      description: {
        story: `
## Add User to Multiple Groups

Verifies:
1. Multiple API calls are made (one per group)
2. User ends up in all selected groups
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      resetMembershipState();
      addMembersToGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for users table', async () => {
      await waitForPageToLoad(canvas, 'adumble');
    });

    await step('Verify pre-condition: adumble not in Powerpuff girls', async () => {
      await verifyUserGroupMembership(user, canvas, 'adumble', [{ name: 'Powerpuff girls', shouldBePresent: false }]);
    });

    await step('Select user, open modal, select multiple groups, and submit', async () => {
      await selectTableRow(user, canvas, 'adumble');
      const addButton = await canvas.findByRole('button', { name: /add to user group/i });
      await user.click(addButton);
      const modalScope = await waitForModal();
      await selectTableRow(user, modalScope, 'Powerpuff girls');
      await selectTableRow(user, modalScope, 'Golden girls');
      const confirmButton = await modalScope.findByRole('button', { name: /^add$/i });
      await user.click(confirmButton);
    });

    await step('Verify API calls for each group', async () => {
      await waitFor(
        () => {
          expect(addMembersToGroupSpy).toHaveBeenCalledTimes(2);
          expect(addMembersToGroupSpy).toHaveBeenCalledWith({
            groupId: 'group-powerpuff-girls',
            principals: [{ username: 'adumble' }],
          });
          expect(addMembersToGroupSpy).toHaveBeenCalledWith({
            groupId: 'group-golden-girls',
            principals: [{ username: 'adumble' }],
          });
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });

    await step('Verify post-condition: user in both groups', async () => {
      await verifyUserGroupMembership(
        user,
        canvas,
        'adumble',
        [
          { name: 'Powerpuff girls', shouldBePresent: true },
          { name: 'Golden girls', shouldBePresent: true },
        ],
        { openDrawer: false },
      );
    });
  },
};
