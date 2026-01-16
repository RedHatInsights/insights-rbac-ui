/**
 * Delete User Group Journey
 * Based on: static/mocks/Delete user group/
 *
 * Features tested:
 * - Open delete from kebab menu
 * - Confirmation modal with group details
 * - Checkbox acknowledgment
 * - Delete action
 * - Success state
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { defaultHandlers, findGroupRow, getUserGroupsTable } from './_shared';
import { mockGroups } from './_shared/mockData';

// =============================================================================
// API SPIES
// =============================================================================

const deleteGroupSpy = fn();
const listGroupsSpy = fn();

// =============================================================================
// MUTABLE STATE FOR TEST ISOLATION
// =============================================================================

// Track deleted groups to update the list
const deletedGroupIds: Set<string> = new Set();

const resetDeletedGroups = () => {
  deletedGroupIds.clear();
};

// =============================================================================
// MSW HANDLERS
// =============================================================================

// Spy handler for deleting a group
const deleteGroupHandler = http.delete('/api/rbac/v1/groups/:uuid/', async ({ params }) => {
  const uuid = params.uuid as string;
  deleteGroupSpy(uuid);
  deletedGroupIds.add(uuid);
  await delay(200);
  return new HttpResponse(null, { status: 204 });
});

// Override list groups to exclude deleted groups
const listGroupsHandler = http.get('/api/rbac/v1/groups/', async ({ request }) => {
  listGroupsSpy();
  await delay(200);
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const nameFilter = url.searchParams.get('name');

  // Filter out deleted groups
  let filteredGroups = mockGroups.filter((g) => !deletedGroupIds.has(g.uuid));

  // Apply name filter
  if (nameFilter) {
    filteredGroups = filteredGroups.filter((g) => g.name.toLowerCase().includes(nameFilter.toLowerCase()));
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

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Delete user group',
  tags: ['access-management', 'user-groups', 'modal', 'destructive'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      // Reset deleted groups BEFORE story renders to ensure clean state
      resetDeletedGroups();

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
      handlers: [
        // Spy handlers FIRST to intercept before defaultHandlers
        deleteGroupHandler,
        listGroupsHandler,
        // Default handlers (excluding the ones we're overriding)
        ...defaultHandlers.filter((h) => !h.info?.path?.toString().includes('/groups/')),
      ],
    },
    docs: {
      description: {
        component: `
# Delete User Group Journey

Tests the workflow for deleting a user group.

## Design Reference

| Kebab menu | Delete confirmation modal |
|:---:|:---:|
| [![Kebab menu](/mocks/Delete%20user%20group/Frame%20120.png)](/mocks/Delete%20user%20group/Frame%20120.png) | [![Delete confirmation modal](/mocks/Delete%20user%20group/Frame%20121.png)](/mocks/Delete%20user%20group/Frame%20121.png) |

| Checkbox confirmation | Deleting state |
|:---:|:---:|
| [![Checkbox confirmation](/mocks/Delete%20user%20group/Frame%20122.png)](/mocks/Delete%20user%20group/Frame%20122.png) | [![Deleting state](/mocks/Delete%20user%20group/Frame%20123.png)](/mocks/Delete%20user%20group/Frame%20123.png) |

## Features
| Feature | Status | API |
|---------|--------|-----|
| Delete from kebab menu | ✅ Implemented | - |
| Confirmation modal | ✅ Implemented | - |
| Checkbox acknowledgment | ✅ Implemented | - |
| Delete API call | ✅ Implemented | V1 |
| Success notification | ✅ Implemented | - |
| Refresh table | ✅ Implemented | - |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Opens the kebab menu for a specific group and clicks delete
 */
const openDeleteModalForGroup = async (
  canvas: ReturnType<typeof within>,
  user: ReturnType<typeof userEvent.setup>,
  groupName: string,
): Promise<void> => {
  // Find the group row
  const row = await findGroupRow(canvas, groupName);
  const rowScope = within(row);

  // Click kebab menu
  const kebabButton = await rowScope.findByLabelText(/actions/i);
  await user.click(kebabButton);
  await delay(200);

  // Click "Delete user group"
  const deleteOption = await within(document.body).findByText(/Delete user group/i);
  await user.click(deleteOption);
  await delay(300);
};

/**
 * Verifies the confirmation modal is displayed with correct content
 */
const verifyDeleteModal = async (groupName: string): Promise<ReturnType<typeof within>> => {
  const modal = await within(document.body).findByRole('dialog');
  expect(modal).toBeInTheDocument();
  const modalScope = within(modal);

  // Verify modal content shows group info
  await expect(modalScope.findByText(/delete.*user group/i)).resolves.toBeInTheDocument();
  await expect(modalScope.findByText(groupName)).resolves.toBeInTheDocument();

  return modalScope;
};

// =============================================================================
// STORIES
// =============================================================================

/**
 * Complete delete flow
 *
 * Tests the full workflow from kebab menu to successful deletion
 */
export const CompleteFlow: Story = {
  name: 'Complete Flow',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests the complete "Delete user group" workflow:

1. Verify group exists in the table
2. Click kebab menu on a group
3. Select "Delete user group"
4. Confirmation modal appears
5. Check the acknowledgment checkbox
6. Click Delete button
7. Verify API was called with correct group ID
8. Verify success notification
9. Verify group is removed from table

**Design references:**
- Frame 120: Kebab menu
- Frame 121: Confirmation modal
- Frame 122: Checkbox checked
- Frame 123: Deleting state
        `,
      },
    },
  },
  play: async (context) => {
    // ==========================================================================
    // SETUP
    // ==========================================================================
    await resetStoryState();
    resetDeletedGroups();
    deleteGroupSpy.mockClear();
    listGroupsSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });
    const targetGroup = 'Golden girls';
    const targetGroupId = 'group-golden-girls';

    // ==========================================================================
    // PRE-CONDITION: Verify group exists
    // ==========================================================================
    await delay(500);
    const table = await getUserGroupsTable(canvas);
    await expect(within(table).findByText(targetGroup)).resolves.toBeInTheDocument();

    // ==========================================================================
    // ACTION: Open delete modal and confirm deletion
    // ==========================================================================

    // Step 1: Open kebab menu and click delete
    await openDeleteModalForGroup(canvas, user, targetGroup);

    // Step 2: Verify modal appears with correct content
    const modalScope = await verifyDeleteModal(targetGroup);

    // Step 3: Delete button should be disabled until checkbox is checked
    const deleteButton = await modalScope.findByRole('button', { name: /delete/i });
    expect(deleteButton).toBeDisabled();

    // Step 4: Check the acknowledgment checkbox
    const checkbox = await modalScope.findByRole('checkbox');
    await user.click(checkbox);
    await delay(200);

    // Step 5: Delete button should now be enabled
    expect(deleteButton).not.toBeDisabled();

    // Step 6: Click Delete button
    await user.click(deleteButton);
    await delay(500);

    // ==========================================================================
    // API CALL VERIFICATION
    // ==========================================================================
    expect(deleteGroupSpy).toHaveBeenCalled();
    expect(deleteGroupSpy).toHaveBeenCalledWith(targetGroupId);

    // ==========================================================================
    // NOTIFICATION VERIFICATION
    // ==========================================================================
    const body = within(document.body);
    await waitFor(
      async () => {
        const notification = body.getByText(/group deleted successfully/i);
        await expect(notification).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // ==========================================================================
    // UI STATE VERIFICATION
    // ==========================================================================

    // Modal should close
    expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();

    // List should refresh - spy should be called again
    expect(listGroupsSpy).toHaveBeenCalled();

    // Group should no longer be in the table
    await waitFor(
      async () => {
        const tableAfter = await getUserGroupsTable(canvas);
        expect(within(tableAfter).queryByText(targetGroup)).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

/**
 * Cancel deletion
 *
 * Tests canceling the delete confirmation
 */
export const CancelDeletion: Story = {
  name: 'Cancel Deletion',
  parameters: {
    docs: {
      description: {
        story: `
Tests canceling the delete confirmation modal.

**Expected behavior:**
1. Open delete confirmation
2. Click Cancel
3. Modal closes
4. No API call made
5. Group still exists in table
        `,
      },
    },
  },
  play: async (context) => {
    // ==========================================================================
    // SETUP
    // ==========================================================================
    await resetStoryState();
    resetDeletedGroups();
    deleteGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });
    const targetGroup = 'Golden girls';

    // ==========================================================================
    // PRE-CONDITION: Verify group exists
    // ==========================================================================
    await delay(500);
    await expect(canvas.findByText(targetGroup)).resolves.toBeInTheDocument();

    // ==========================================================================
    // ACTION: Open modal and cancel
    // ==========================================================================
    await openDeleteModalForGroup(canvas, user, targetGroup);

    const modal = await within(document.body).findByRole('dialog');
    const cancelButton = await within(modal).findByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    await delay(300);

    // ==========================================================================
    // VERIFICATION
    // ==========================================================================

    // Modal should be closed
    expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();

    // No API call should be made
    expect(deleteGroupSpy).not.toHaveBeenCalled();

    // Group should still exist
    await expect(canvas.findByText(targetGroup)).resolves.toBeInTheDocument();
  },
};

/**
 * Delete button disabled without checkbox
 *
 * Tests that the delete button is disabled until checkbox is checked
 */
export const DeleteButtonDisabled: Story = {
  name: 'Delete Button Disabled Without Checkbox',
  parameters: {
    docs: {
      description: {
        story: `
Tests that the delete button requires checkbox acknowledgment.

**Expected behavior:**
1. Open delete confirmation
2. Delete button is disabled
3. Check the checkbox
4. Delete button becomes enabled
        `,
      },
    },
  },
  play: async (context) => {
    // ==========================================================================
    // SETUP
    // ==========================================================================
    await resetStoryState();
    resetDeletedGroups();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });
    const targetGroup = 'Golden girls';

    await delay(500);

    // ==========================================================================
    // ACTION: Open delete modal
    // ==========================================================================
    await openDeleteModalForGroup(canvas, user, targetGroup);

    const modalScope = await verifyDeleteModal(targetGroup);

    // ==========================================================================
    // VERIFICATION: Delete button disabled initially
    // ==========================================================================
    const deleteButton = await modalScope.findByRole('button', { name: /delete/i });
    expect(deleteButton).toBeDisabled();

    // ==========================================================================
    // ACTION: Check the checkbox
    // ==========================================================================
    const checkbox = await modalScope.findByRole('checkbox');
    await user.click(checkbox);
    await delay(200);

    // ==========================================================================
    // VERIFICATION: Delete button now enabled
    // ==========================================================================
    expect(deleteButton).not.toBeDisabled();
  },
};

/**
 * Close modal with X button
 *
 * Tests closing the modal using the X button
 */
export const CloseWithXButton: Story = {
  name: 'Close with X Button',
  parameters: {
    docs: {
      description: {
        story: `
Tests closing the delete modal with the X button.

**Expected behavior:**
1. Open delete confirmation
2. Click X button
3. Modal closes
4. No API call made
        `,
      },
    },
  },
  play: async (context) => {
    // ==========================================================================
    // SETUP
    // ==========================================================================
    await resetStoryState();
    resetDeletedGroups();
    deleteGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });
    const targetGroup = 'Golden girls';

    await delay(500);

    // ==========================================================================
    // ACTION: Open modal and close with X
    // ==========================================================================
    await openDeleteModalForGroup(canvas, user, targetGroup);

    const modal = await within(document.body).findByRole('dialog');
    const closeButton = await within(modal).findByLabelText(/close/i);
    await user.click(closeButton);
    await delay(300);

    // ==========================================================================
    // VERIFICATION
    // ==========================================================================

    // Modal should be closed
    expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();

    // No API call
    expect(deleteGroupSpy).not.toHaveBeenCalled();

    // Group should still exist
    await expect(canvas.findByText(targetGroup)).resolves.toBeInTheDocument();
  },
};
