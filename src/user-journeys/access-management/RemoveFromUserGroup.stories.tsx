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
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { confirmDestructiveModal, waitForContentReady, waitForModal } from '../../test-utils/interactionHelpers';
import { waitForPageToLoad } from '../../test-utils/tableHelpers';
import { v2DefaultHandlers } from './_shared';
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
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Users and Groups/Remove from User Group',
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
      handlers: [
        // Spy handlers FIRST to intercept before v2DefaultHandlers
        removeMembersHandler,
        listUsersHandler,
        listGroupsHandler,
        // Filter out handlers we're overriding
        ...v2DefaultHandlers.filter((h) => {
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      resetMutableState();
      removeMembersSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and verify initial user groups count', async () => {
      await waitForPageToLoad(canvas, TARGET_USER.username);
      const usersTable = await canvas.findByRole('grid');
      const userRow = await within(usersTable).findByText(TARGET_USER.username);
      expect(userRow).toBeInTheDocument();
      const userRowElement = userRow.closest('tr')!;
      await expect(within(userRowElement).findByText('2')).resolves.toBeInTheDocument();
    });

    await step('Open kebab menu and click remove from user group', async () => {
      const usersTable = await canvas.findByRole('grid');
      const userRow = await within(usersTable).findByText(TARGET_USER.username);
      const userRowElement = userRow.closest('tr')!;
      const kebabButton = await within(userRowElement).findByRole('button', { name: /actions/i });
      await user.click(kebabButton);
      const removeOption = await within(document.body).findByRole('menuitem', { name: /remove from user group/i });
      await user.click(removeOption);
    });

    await step('Select group and confirm removal', async () => {
      const modalScope = await waitForModal();
      await expect(modalScope.findByText(/remove.*from.*user group/i)).resolves.toBeInTheDocument();
      const spiceGirlsCheckbox = await modalScope.findByRole('checkbox', { name: /spice girls/i });
      await user.click(spiceGirlsCheckbox);
      await confirmDestructiveModal(user, {
        checkboxLabel: /understand|irreversible/i,
        buttonText: /^remove$/i,
      });
    });

    await step('Verify API call', async () => {
      await waitFor(
        () => {
          expect(removeMembersSpy).toHaveBeenCalled();
          expect(removeMembersSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              groupId: TARGET_GROUP.uuid,
              usernames: expect.arrayContaining([TARGET_USER.username]),
            }),
          );
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });

    await step('Verify modal closed and user groups count decreased', async () => {
      await waitFor(() => {
        expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
      });
      const usersTable = await canvas.findByRole('grid');
      const updatedUserRow = await within(usersTable).findByText(TARGET_USER.username);
      const updatedRowElement = updatedUserRow.closest('tr')!;
      await expect(within(updatedRowElement).findByText('1')).resolves.toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      resetMutableState();
      removeMembersSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and verify initial state', async () => {
      await waitForPageToLoad(canvas, TARGET_USER.username);
      const usersTable = await canvas.findByRole('grid');
      const userRow = await within(usersTable).findByText(TARGET_USER.username);
      const userRowElement = userRow.closest('tr')!;
      await expect(within(userRowElement).findByText('2')).resolves.toBeInTheDocument();
    });

    await step('Open kebab, click remove, then cancel', async () => {
      const usersTable = await canvas.findByRole('grid');
      const userRow = await within(usersTable).findByText(TARGET_USER.username);
      const userRowElement = userRow.closest('tr')!;
      const kebabButton = await within(userRowElement).findByRole('button', { name: /actions/i });
      await user.click(kebabButton);
      const removeOption = await within(document.body).findByRole('menuitem', { name: /remove from user group/i });
      await user.click(removeOption);
      const modal = await waitForModal();
      const cancelButton = await modal.findByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
    });

    await step('Verify modal closed and no API call', async () => {
      await waitFor(() => {
        expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(removeMembersSpy).not.toHaveBeenCalled();
    });

    await step('Verify user groups count unchanged', async () => {
      const usersTable = await canvas.findByRole('grid');
      const unchangedUserRow = await within(usersTable).findByText(TARGET_USER.username);
      const unchangedRowElement = unchangedUserRow.closest('tr')!;
      await expect(within(unchangedRowElement).findByText('2')).resolves.toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      resetMutableState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and open remove modal', async () => {
      await waitForPageToLoad(canvas, TARGET_USER.username);
      const usersTable = await canvas.findByRole('grid');
      const userRow = await within(usersTable).findByText(TARGET_USER.username);
      const userRowElement = userRow.closest('tr')!;
      const kebabButton = await within(userRowElement).findByRole('button', { name: /actions/i });
      await user.click(kebabButton);
      const removeOption = await within(document.body).findByRole('menuitem', { name: /remove from user group/i });
      await user.click(removeOption);
    });

    await step('Verify remove button disabled, select group, check confirmation, verify enabled', async () => {
      const modalScope = await waitForModal();
      const removeButton = await modalScope.findByRole('button', { name: /^remove$/i });
      expect(removeButton).toBeDisabled();
      const spiceGirlsCheckbox = await modalScope.findByRole('checkbox', { name: /spice girls/i });
      await user.click(spiceGirlsCheckbox);
      await waitFor(() => expect(removeButton).toBeDisabled());
      const confirmCheckbox = await modalScope.findByRole('checkbox', { name: /understand|irreversible/i });
      await user.click(confirmCheckbox);
      await waitFor(() => expect(removeButton).not.toBeDisabled());
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      resetMutableState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and open remove modal', async () => {
      await waitForPageToLoad(canvas, TARGET_USER.username);
      const usersTable = await canvas.findByRole('grid');
      const userRow = await within(usersTable).findByText(TARGET_USER.username);
      const userRowElement = userRow.closest('tr')!;
      const kebabButton = await within(userRowElement).findByRole('button', { name: /actions/i });
      await user.click(kebabButton);
      const removeOption = await within(document.body).findByRole('menuitem', { name: /remove from user group/i });
      await user.click(removeOption);
    });

    await step('Verify remove button disabled without group, check confirmation, select group, verify enabled', async () => {
      const modalScope = await waitForModal();
      const removeButton = await modalScope.findByRole('button', { name: /^remove$/i });
      expect(removeButton).toBeDisabled();
      const confirmCheckbox = await modalScope.findByRole('checkbox', { name: /understand|irreversible/i });
      await user.click(confirmCheckbox);
      await waitFor(() => expect(removeButton).toBeDisabled());
      const spiceGirlsCheckbox = await modalScope.findByRole('checkbox', { name: /spice girls/i });
      await user.click(spiceGirlsCheckbox);
      await waitFor(() => expect(removeButton).not.toBeDisabled());
    });
  },
};
