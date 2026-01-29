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
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { TEST_TIMEOUTS, resetStoryState } from '../_shared/helpers';
import { userGroupsMembership as baseUserGroupsMembership, mockGroups, mockUsers } from './_shared/mockData';
import { v1Handlers } from './_shared/handlers';

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
  // Reset state handler for test isolation
  http.post('/api/test/reset-state', () => {
    resetMembershipState();
    return HttpResponse.json({ success: true });
  }),

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

  // Include remaining V1 handlers
  ...v1Handlers.filter(
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
  user: ReturnType<typeof userEvent.setup>,
  canvas: ReturnType<typeof within>,
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
    await delay(TEST_TIMEOUTS.AFTER_DRAWER_OPEN); // Give more time for drawer to open
  }

  // Wait for the drawer panel to appear (not hidden)
  await waitFor(
    () => {
      const panel = document.querySelector('.pf-v6-c-drawer__panel-main, .pf-v6-c-drawer__panel:not([hidden])');
      expect(panel).toBeInTheDocument();
    },
    { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
  );
  const drawerPanel = document.querySelector('.pf-v6-c-drawer__panel-main, .pf-v6-c-drawer__panel:not([hidden])') as HTMLElement;
  const drawerScope = within(drawerPanel);

  // Click on User groups tab if not already selected - look for the tab within the drawer
  const userGroupsTab = await drawerScope.findByRole('tab', { name: /user groups/i });
  await user.click(userGroupsTab);
  await delay(TEST_TIMEOUTS.AFTER_EXPAND);

  // Find the active tab panel to scope our queries
  // This avoids finding duplicate text in other tabs (e.g., "Admin group" in Roles tab's User Group column)
  const tabPanel = drawerPanel.querySelector('[role="tabpanel"]:not([hidden])');
  const tabPanelScope = tabPanel ? within(tabPanel as HTMLElement) : drawerScope;

  // Verify each expected group
  for (const group of expectedGroups) {
    if (group.shouldBePresent) {
      await expect(tabPanelScope.findByText(group.name)).resolves.toBeInTheDocument();
    } else {
      expect(tabPanelScope.queryByText(group.name)).not.toBeInTheDocument();
    }
  }

  if (closeDrawer) {
    // Close the drawer by pressing Escape
    await user.keyboard('{Escape}');
    await delay(TEST_TIMEOUTS.AFTER_CLICK);
  }
}

// =============================================================================
// STORY META
// =============================================================================

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Add to user group',
  tags: ['access-management', 'user-groups', 'modal'],
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
      'platform.rbac.workspaces-organization-management': true,
      'platform.rbac.common.userstable': true,
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
  play: async (context) => {
    // Reset all state
    await resetStoryState();
    resetMembershipState();
    addMembersToGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(TEST_TIMEOUTS.AFTER_DRAWER_OPEN);

    // =========================================================================
    // PRE-CONDITION: Verify "adumble" is NOT in "Powerpuff girls" group
    // Keep drawer open for later verification
    // =========================================================================
    await verifyUserGroupMembership(
      user,
      canvas,
      'adumble',
      [
        { name: 'Default group', shouldBePresent: true }, // adumble IS in Default group
        { name: 'Admin group', shouldBePresent: true }, // adumble IS in Admin group
        { name: 'Powerpuff girls', shouldBePresent: false }, // adumble is NOT in Powerpuff girls
      ],
      { openDrawer: true, closeDrawer: false },
    );

    // =========================================================================
    // ACTION: Add "adumble" to "Powerpuff girls" group
    // =========================================================================

    // Find and select the "adumble" user checkbox
    const adumbleRow = await canvas.findByText('adumble');
    const adumbleRowElement = adumbleRow.closest('tr');
    const adumbleCheckbox = adumbleRowElement?.querySelector('input[type="checkbox"]');
    expect(adumbleCheckbox).toBeInTheDocument();
    await user.click(adumbleCheckbox!);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Click "Add to user group" button
    const addButton = await canvas.findByRole('button', { name: /add to user group/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).not.toBeDisabled();
    await user.click(addButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify modal opens
    const modal = await within(document.body).findByRole('dialog');
    expect(modal).toBeInTheDocument();
    const modalScope = within(modal);

    // Verify modal title
    await expect(modalScope.findByText(/add to user group/i)).resolves.toBeInTheDocument();

    // Find and select "Powerpuff girls" group
    const powerpuffText = await modalScope.findByText('Powerpuff girls');
    const powerpuffRow = powerpuffText.closest('tr');
    const powerpuffCheckbox = powerpuffRow?.querySelector('input[type="checkbox"]');
    expect(powerpuffCheckbox).toBeInTheDocument();
    await user.click(powerpuffCheckbox!);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Click Add button
    const confirmAddButton = await modalScope.findByRole('button', { name: /^add$/i });
    expect(confirmAddButton).not.toBeDisabled();
    await user.click(confirmAddButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // =========================================================================
    // API VERIFICATION: Check the API was called with correct data
    // =========================================================================
    expect(addMembersToGroupSpy).toHaveBeenCalledTimes(1);
    expect(addMembersToGroupSpy).toHaveBeenCalledWith({
      groupId: 'group-powerpuff-girls',
      principals: [{ username: 'adumble' }],
    });

    // Modal should close
    expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();

    // Wait for UI to update
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // =========================================================================
    // POST-CONDITION: Verify "adumble" IS NOW in "Powerpuff girls" group
    // Drawer is already open - just verify the updated data (React Query auto-refreshes)
    // =========================================================================
    await verifyUserGroupMembership(
      user,
      canvas,
      'adumble',
      [
        { name: 'Default group', shouldBePresent: true },
        { name: 'Admin group', shouldBePresent: true },
        { name: 'Powerpuff girls', shouldBePresent: true }, // NOW should be present!
      ],
      { openDrawer: false, closeDrawer: true },
    );
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
  play: async (context) => {
    await resetStoryState();
    resetMembershipState();
    addMembersToGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_DRAWER_OPEN);

    // =========================================================================
    // PRE-CONDITION: Verify both users are NOT in "Powerpuff girls"
    // =========================================================================
    await verifyUserGroupMembership(user, canvas, 'adumble', [{ name: 'Powerpuff girls', shouldBePresent: false }]);
    await verifyUserGroupMembership(user, canvas, 'bbunny', [{ name: 'Powerpuff girls', shouldBePresent: false }]);

    // =========================================================================
    // ACTION: Select both users and add to group
    // =========================================================================

    // Select adumble
    const adumbleRow = await canvas.findByText('adumble');
    const adumbleCheckbox = adumbleRow.closest('tr')?.querySelector('input[type="checkbox"]');
    await user.click(adumbleCheckbox!);

    // Select bbunny
    const bbunnyRow = await canvas.findByText('bbunny');
    const bbunnyCheckbox = bbunnyRow.closest('tr')?.querySelector('input[type="checkbox"]');
    await user.click(bbunnyCheckbox!);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Click Add to user group
    const addButton = await canvas.findByRole('button', { name: /add to user group/i });
    await user.click(addButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Select Powerpuff girls in modal
    const modal = await within(document.body).findByRole('dialog');
    const modalScope = within(modal);
    const powerpuffText = await modalScope.findByText('Powerpuff girls');
    const powerpuffCheckbox = powerpuffText.closest('tr')?.querySelector('input[type="checkbox"]');
    await user.click(powerpuffCheckbox!);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Confirm
    const confirmButton = await modalScope.findByRole('button', { name: /^add$/i });
    await user.click(confirmButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // =========================================================================
    // API VERIFICATION
    // =========================================================================
    expect(addMembersToGroupSpy).toHaveBeenCalledTimes(1);
    expect(addMembersToGroupSpy).toHaveBeenCalledWith({
      groupId: 'group-powerpuff-girls',
      principals: expect.arrayContaining([{ username: 'adumble' }, { username: 'bbunny' }]),
    });

    // =========================================================================
    // POST-CONDITION: Both users now in group
    // =========================================================================
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    await verifyUserGroupMembership(user, canvas, 'adumble', [{ name: 'Powerpuff girls', shouldBePresent: true }]);
    await verifyUserGroupMembership(user, canvas, 'bbunny', [{ name: 'Powerpuff girls', shouldBePresent: true }]);
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
  play: async (context) => {
    await resetStoryState();
    resetMembershipState();
    addMembersToGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_DRAWER_OPEN);

    // Verify pre-condition
    await verifyUserGroupMembership(user, canvas, 'adumble', [{ name: 'Powerpuff girls', shouldBePresent: false }]);

    // Select user and open modal
    const adumbleRow = await canvas.findByText('adumble');
    const adumbleCheckbox = adumbleRow.closest('tr')?.querySelector('input[type="checkbox"]');
    await user.click(adumbleCheckbox!);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const addButton = await canvas.findByRole('button', { name: /add to user group/i });
    await user.click(addButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Select a group
    const modal = await within(document.body).findByRole('dialog');
    const modalScope = within(modal);
    const powerpuffText = await modalScope.findByText('Powerpuff girls');
    const powerpuffCheckbox = powerpuffText.closest('tr')?.querySelector('input[type="checkbox"]');
    await user.click(powerpuffCheckbox!);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // CANCEL instead of confirming
    const cancelButton = await modalScope.findByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // =========================================================================
    // VERIFICATION: No API call, no state change
    // =========================================================================
    expect(addMembersToGroupSpy).not.toHaveBeenCalled();

    // User should still NOT be in the group (drawer is already open from pre-condition check)
    await verifyUserGroupMembership(user, canvas, 'adumble', [{ name: 'Powerpuff girls', shouldBePresent: false }], {
      openDrawer: false,
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
  play: async (context) => {
    await resetStoryState();
    resetMembershipState();
    addMembersToGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_DRAWER_OPEN);

    // Pre-condition: adumble is not in Powerpuff or Spice girls
    await verifyUserGroupMembership(user, canvas, 'adumble', [
      { name: 'Powerpuff girls', shouldBePresent: false },
      // Note: adumble might already be in some groups based on mock data
    ]);

    // Select adumble
    const adumbleRow = await canvas.findByText('adumble');
    const adumbleCheckbox = adumbleRow.closest('tr')?.querySelector('input[type="checkbox"]');
    await user.click(adumbleCheckbox!);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Open modal
    const addButton = await canvas.findByRole('button', { name: /add to user group/i });
    await user.click(addButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Select multiple groups
    const modal = await within(document.body).findByRole('dialog');
    const modalScope = within(modal);

    const powerpuffText = await modalScope.findByText('Powerpuff girls');
    const powerpuffCheckbox = powerpuffText.closest('tr')?.querySelector('input[type="checkbox"]');
    await user.click(powerpuffCheckbox!);

    const goldenText = await modalScope.findByText('Golden girls');
    const goldenCheckbox = goldenText.closest('tr')?.querySelector('input[type="checkbox"]');
    await user.click(goldenCheckbox!);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Confirm
    const confirmButton = await modalScope.findByRole('button', { name: /^add$/i });
    await user.click(confirmButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // =========================================================================
    // API VERIFICATION: Should be called for each group
    // =========================================================================
    expect(addMembersToGroupSpy).toHaveBeenCalledTimes(2);
    expect(addMembersToGroupSpy).toHaveBeenCalledWith({
      groupId: 'group-powerpuff-girls',
      principals: [{ username: 'adumble' }],
    });
    expect(addMembersToGroupSpy).toHaveBeenCalledWith({
      groupId: 'group-golden-girls',
      principals: [{ username: 'adumble' }],
    });

    // =========================================================================
    // POST-CONDITION: User in both groups (drawer is already open from pre-condition check)
    // =========================================================================
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
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
  },
};
