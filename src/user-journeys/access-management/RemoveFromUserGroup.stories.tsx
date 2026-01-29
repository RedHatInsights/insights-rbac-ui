/**
 * Remove from User Group Journey
 * Based on: static/mocks/Remove from user group/
 *
 * Features tested:
 * - Open remove modal from row kebab menu
 * - Select groups to remove user from
 * - Confirm removal
 * - Success notification
 * - Visual verification of user groups count change
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { TEST_TIMEOUTS, resetStoryState, waitForPageToLoad } from '../_shared/helpers';
import { defaultHandlers } from './_shared';
import { mockGroups, mockUsers, userGroupsMembership } from './_shared/mockData';

// =============================================================================
// API SPIES
// =============================================================================
const removeMembersSpy = fn();

// =============================================================================
// MUTABLE STATE FOR TEST ISOLATION
// =============================================================================
// Track removed memberships: Map<groupId, Set<username>>
const removedMemberships: Map<string, Set<string>> = new Map();

const resetMutableState = () => {
  removedMemberships.clear();
};

// Helper to check if user is still in group
const isUserInGroup = (username: string, groupId: string): boolean => {
  const originalGroups = userGroupsMembership[username] || [];
  if (!originalGroups.includes(groupId)) return false;

  const removedFromGroup = removedMemberships.get(groupId);
  if (removedFromGroup?.has(username)) return false;

  return true;
};

// Helper to get user's current groups
const getUserGroups = (username: string): string[] => {
  const originalGroups = userGroupsMembership[username] || [];
  return originalGroups.filter((groupId) => isUserInGroup(username, groupId));
};

// =============================================================================
// MSW HANDLERS WITH SPIES
// =============================================================================

// Handler for removing members from group
const removeMembersHandler = http.delete('/api/rbac/v1/groups/:uuid/principals/', async ({ params, request }) => {
  await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);
  const url = new URL(request.url);
  const usernames = url.searchParams.get('usernames')?.split(',') || [];
  const groupId = params.uuid as string;

  // Call spy with structured data
  removeMembersSpy({
    groupId,
    usernames,
  });

  // Update mutable state
  if (!removedMemberships.has(groupId)) {
    removedMemberships.set(groupId, new Set());
  }
  const removedSet = removedMemberships.get(groupId)!;
  usernames.forEach((username) => removedSet.add(username));

  console.log(`SB: MSW: Removed ${usernames.join(', ')} from group ${groupId}`);
  return new HttpResponse(null, { status: 204 });
});

// Handler for listing users with dynamic group counts
const listUsersHandler = http.get('/api/rbac/v1/principals/', async ({ request }) => {
  await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  // Add dynamic user groups count
  const usersWithGroupCount = mockUsers.map((user) => ({
    ...user,
    user_groups_count: getUserGroups(user.username).length,
  }));

  const paginatedUsers = usersWithGroupCount.slice(offset, offset + limit);

  return HttpResponse.json({
    data: paginatedUsers,
    meta: {
      count: mockUsers.length,
      limit,
      offset,
    },
  });
});

// Handler for listing groups (for modal)
const listGroupsHandler = http.get('/api/rbac/v1/groups/', async ({ request }) => {
  await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const username = url.searchParams.get('username');

  let filteredGroups = [...mockGroups];

  // Filter by username (groups user belongs to)
  if (username) {
    const userGroups = getUserGroups(username);
    filteredGroups = filteredGroups.filter((g) => userGroups.includes(g.uuid));
  }

  const paginatedGroups = filteredGroups.slice(offset, offset + limit);

  return HttpResponse.json({
    data: paginatedGroups,
    meta: {
      count: filteredGroups.length,
      limit,
      offset,
    },
  });
});

// =============================================================================
// STORY META
// =============================================================================

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Remove from user group',
  tags: ['access-management', 'user-groups', 'modal'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      // Reset mutable state BEFORE story renders to ensure clean state
      resetMutableState();

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
      handlers: [
        // Spy handlers FIRST to intercept before defaultHandlers
        removeMembersHandler,
        listUsersHandler,
        listGroupsHandler,
        // Filter out handlers we're overriding
        ...defaultHandlers.filter((h) => {
          const path = h.info?.path?.toString() || '';
          if (path.includes('/principals/') && h.info?.method === 'GET') return false;
          if (path.includes('/user-access/groups/') && h.info?.method === 'GET') return false;
          if (path.includes('/principals/') && h.info?.method === 'DELETE') return false;
          return true;
        }),
      ],
    },
    docs: {
      description: {
        component: `
# Remove from User Group Journey

Tests the workflow for removing users from user groups.

## Design Reference

| Confirmation modal | Kebab menu with Remove | Success notification |
|:---:|:---:|:---:|
| [![Confirmation modal](/mocks/Remove%20from%20user%20group/Frame%20178.png)](/mocks/Remove%20from%20user%20group/Frame%20178.png) | [![Kebab menu with Remove](/mocks/Remove%20from%20user%20group/Frame%20186.png)](/mocks/Remove%20from%20user%20group/Frame%20186.png) | [![Success notification](/mocks/Remove%20from%20user%20group/Frame%20191.png)](/mocks/Remove%20from%20user%20group/Frame%20191.png) |

## Features
| Feature | Status | API |
|---------|--------|-----|
| Open remove from kebab | ✅ Implemented | - |
| Group selection in modal | ✅ Implemented | V1 |
| Confirmation checkbox | ✅ Implemented | - |
| Remove API call | ✅ Implemented | V1 |
| Success notification | ✅ Implemented | - |
| User groups count update | ✅ Implemented | V1 |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// =============================================================================
// SHARED HELPERS
// =============================================================================

const TARGET_USER = mockUsers.find((u) => u.username === 'ginger-spice')!;
const TARGET_GROUP = mockGroups.find((g) => g.uuid === 'group-spice-girls')!;

// =============================================================================
// STORIES
// =============================================================================

/**
 * Complete remove from group flow
 *
 * Tests the full workflow:
 * 1. Visual verification: User is in Spice girls group (2 groups)
 * 2. Open kebab menu for user row
 * 3. Click "Remove from user group"
 * 4. Modal opens with group selection
 * 5. Select group to remove from
 * 6. Check confirmation checkbox
 * 7. Click Remove button
 * 8. API verification: DELETE called with correct params
 * 9. Visual verification: User groups count decreased
 */
export const CompleteFlow: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests the complete "Remove from user group" workflow:

1. Verify initial state (user in 2 groups)
2. Open kebab menu for target user
3. Click "Remove from user group"
4. Select group to remove from
5. Check confirmation checkbox
6. Click Remove button
7. Verify API called with correct parameters
8. Verify success notification
9. Verify user groups count decreased

**Design references:**
- Frame 186: Kebab menu with Remove option
- Frame 178: Confirmation modal
- Frame 191: Success notification
        `,
      },
    },
  },
  play: async (context) => {
    // 1. SETUP
    await resetStoryState();
    resetMutableState();
    removeMembersSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, TARGET_USER.username);

    // 2. VISUAL VERIFICATION: Initial state
    // Find the target user row and verify User groups count is 2
    const usersTable = await canvas.findByRole('grid');
    const userRow = await within(usersTable).findByText(TARGET_USER.username);
    expect(userRow).toBeInTheDocument();

    const userRowElement = userRow.closest('tr')!;
    // Verify initial user groups count is 2
    expect(within(userRowElement).getByText('2')).toBeInTheDocument();

    // 3. OPEN ROW KEBAB MENU
    const kebabButton = within(userRowElement).getByRole('button', { name: /actions/i });
    await user.click(kebabButton);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // 4. CLICK "REMOVE FROM USER GROUP" in row kebab
    const removeOption = await within(document.body).findByRole('menuitem', { name: /remove from user group/i });
    await user.click(removeOption);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // 5. VERIFY MODAL OPENS
    const modal = await within(document.body).findByRole('dialog');
    expect(modal).toBeInTheDocument();
    const modalScope = within(modal);

    // Verify modal title
    await expect(modalScope.findByText(/remove.*from.*user group/i)).resolves.toBeInTheDocument();

    // 6. SELECT GROUP TO REMOVE FROM
    // Find the Spice girls group checkbox
    const spiceGirlsCheckbox = await modalScope.findByRole('checkbox', { name: /spice girls/i });
    await user.click(spiceGirlsCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // 7. CHECK CONFIRMATION CHECKBOX
    const confirmCheckbox = await modalScope.findByRole('checkbox', { name: /understand|irreversible/i });
    await user.click(confirmCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // 8. CLICK REMOVE BUTTON
    const removeButton = await modalScope.findByRole('button', { name: /^remove$/i });
    expect(removeButton).not.toBeDisabled();
    await user.click(removeButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // 9. API VERIFICATION
    expect(removeMembersSpy).toHaveBeenCalled();
    expect(removeMembersSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: TARGET_GROUP.uuid,
        usernames: expect.arrayContaining([TARGET_USER.username]),
      }),
    );

    // 10. VERIFY MODAL CLOSED
    await waitFor(() => {
      expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
    });

    // 11. VISUAL VERIFICATION: User groups count decreased to 1
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    const updatedUserRow = await within(usersTable).findByText(TARGET_USER.username);
    const updatedRowElement = updatedUserRow.closest('tr')!;
    expect(within(updatedRowElement).getByText('1')).toBeInTheDocument();
  },
};

/**
 * Cancel removal
 *
 * Tests canceling the remove from group modal
 */
export const CancelRemoval: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Tests canceling the remove from user group modal.

**Expected behavior:**
1. Open remove modal
2. Click Cancel
3. Modal closes
4. No API call made
5. User groups count unchanged
        `,
      },
    },
  },
  play: async (context) => {
    // 1. SETUP
    await resetStoryState();
    resetMutableState();
    removeMembersSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, TARGET_USER.username);

    // 2. FIND TARGET USER ROW AND VERIFY INITIAL STATE
    const usersTable = await canvas.findByRole('grid');
    const userRow = await within(usersTable).findByText(TARGET_USER.username);
    const userRowElement = userRow.closest('tr')!;
    // Verify initial user groups count is 2
    expect(within(userRowElement).getByText('2')).toBeInTheDocument();

    // 3. OPEN ROW KEBAB AND CLICK REMOVE
    const kebabButton = within(userRowElement).getByRole('button', { name: /actions/i });
    await user.click(kebabButton);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const removeOption = await within(document.body).findByRole('menuitem', { name: /remove from user group/i });
    await user.click(removeOption);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // 4. CLICK CANCEL
    const modal = await within(document.body).findByRole('dialog');
    const cancelButton = await within(modal).findByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // 5. VERIFY MODAL CLOSED
    expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();

    // 6. API VERIFICATION: No call made
    expect(removeMembersSpy).not.toHaveBeenCalled();

    // 7. VISUAL VERIFICATION: User groups count unchanged (still 2)
    const unchangedUserRow = await within(usersTable).findByText(TARGET_USER.username);
    const unchangedRowElement = unchangedUserRow.closest('tr')!;
    expect(within(unchangedRowElement).getByText('2')).toBeInTheDocument();
  },
};

/**
 * Remove button disabled without confirmation
 *
 * Tests that the remove button requires confirmation checkbox
 */
export const RemoveButtonDisabled: Story = {
  name: 'Remove Button Disabled Without Confirmation',
  parameters: {
    docs: {
      description: {
        story: `
Tests that the remove button requires confirmation.

**Expected behavior:**
1. Open remove modal
2. Select a group
3. Remove button is still disabled (no confirmation)
4. Check confirmation checkbox
5. Remove button becomes enabled
        `,
      },
    },
  },
  play: async (context) => {
    // 1. SETUP
    await resetStoryState();
    resetMutableState();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, TARGET_USER.username);

    // 2. OPEN KEBAB AND CLICK REMOVE
    const usersTable = await canvas.findByRole('grid');
    const userRow = await within(usersTable).findByText(TARGET_USER.username);
    const userRowElement = userRow.closest('tr')!;

    const kebabButton = within(userRowElement).getByRole('button', { name: /actions/i });
    await user.click(kebabButton);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const removeOption = await within(document.body).findByRole('menuitem', { name: /remove from user group/i });
    await user.click(removeOption);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // 3. VERIFY MODAL IS OPEN
    const modal = await within(document.body).findByRole('dialog');
    const modalScope = within(modal);

    // 4. VERIFY REMOVE BUTTON IS DISABLED INITIALLY
    const removeButton = await modalScope.findByRole('button', { name: /^remove$/i });
    expect(removeButton).toBeDisabled();

    // 5. SELECT A GROUP
    const spiceGirlsCheckbox = await modalScope.findByRole('checkbox', { name: /spice girls/i });
    await user.click(spiceGirlsCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // 6. VERIFY REMOVE BUTTON IS STILL DISABLED (no confirmation yet)
    expect(removeButton).toBeDisabled();

    // 7. CHECK CONFIRMATION CHECKBOX
    const confirmCheckbox = await modalScope.findByRole('checkbox', { name: /understand|irreversible/i });
    await user.click(confirmCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // 8. VERIFY REMOVE BUTTON IS NOW ENABLED
    expect(removeButton).not.toBeDisabled();
  },
};

/**
 * Remove button disabled without group selection
 *
 * Tests that the remove button requires at least one group selected
 */
export const RemoveButtonDisabledNoGroupSelected: Story = {
  name: 'Remove Button Disabled Without Group Selection',
  parameters: {
    docs: {
      description: {
        story: `
Tests that the remove button requires group selection.

**Expected behavior:**
1. Open remove modal
2. Check confirmation checkbox
3. Remove button is still disabled (no group selected)
4. Select a group
5. Remove button becomes enabled
        `,
      },
    },
  },
  play: async (context) => {
    // 1. SETUP
    await resetStoryState();
    resetMutableState();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, TARGET_USER.username);

    // 2. OPEN KEBAB AND CLICK REMOVE
    const usersTable = await canvas.findByRole('grid');
    const userRow = await within(usersTable).findByText(TARGET_USER.username);
    const userRowElement = userRow.closest('tr')!;

    const kebabButton = within(userRowElement).getByRole('button', { name: /actions/i });
    await user.click(kebabButton);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const removeOption = await within(document.body).findByRole('menuitem', { name: /remove from user group/i });
    await user.click(removeOption);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // 3. VERIFY MODAL IS OPEN
    const modal = await within(document.body).findByRole('dialog');
    const modalScope = within(modal);

    // 4. VERIFY REMOVE BUTTON IS DISABLED INITIALLY
    const removeButton = await modalScope.findByRole('button', { name: /^remove$/i });
    expect(removeButton).toBeDisabled();

    // 5. CHECK CONFIRMATION CHECKBOX (but no group selected)
    const confirmCheckbox = await modalScope.findByRole('checkbox', { name: /understand|irreversible/i });
    await user.click(confirmCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // 6. VERIFY REMOVE BUTTON IS STILL DISABLED (no group selected)
    expect(removeButton).toBeDisabled();

    // 7. SELECT A GROUP
    const spiceGirlsCheckbox = await modalScope.findByRole('checkbox', { name: /spice girls/i });
    await user.click(spiceGirlsCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // 8. VERIFY REMOVE BUTTON IS NOW ENABLED
    expect(removeButton).not.toBeDisabled();
  },
};
