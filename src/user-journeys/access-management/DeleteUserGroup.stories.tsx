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
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import {
  type ScopedQueries,
  confirmDestructiveModal,
  waitForContentReady,
  waitForModal,
  waitForNotification,
} from '../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS, type UserEvent } from '../../test-utils/testUtils';
import { waitForPageToLoad } from '../../test-utils/tableHelpers';
import { createGroupsHandlers, findGroupRow, getUserGroupsTable, mockGroups, v2DefaultHandlers } from './_shared';
import type { Group } from '../../shared/data/mocks/db';
import { createResettableCollection } from '../../shared/data/mocks/db';

// =============================================================================
// API SPIES
// =============================================================================

const deleteGroupSpy = fn();
const listGroupsSpy = fn();

// =============================================================================
// STATEFUL COLLECTION + HANDLERS
// =============================================================================

const groupsCollection = createResettableCollection<Group>(mockGroups);
const deleteGroupHandlers = createGroupsHandlers(groupsCollection, {
  networkDelay: TEST_TIMEOUTS.AFTER_MENU_OPEN,
  onList: () => listGroupsSpy(),
  onDelete: (uuid) => deleteGroupSpy(uuid),
});

const resetDeletedGroups = () => {
  groupsCollection.reset();
};

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Users and Groups/Delete User Group',
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
    permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
    orgAdmin: true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.workspaces': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.workspaces': true,
    }),
    msw: {
      handlers: [
        ...deleteGroupHandlers,
        ...v2DefaultHandlers.filter((h) => {
          const path = h.info?.path?.toString() || '';
          if (!path.includes('/api/rbac/v1/groups') && !path.includes('/api/rbac/v2/groups')) return true;
          if (path.includes('/principals/') || path.includes('/service-accounts/')) return true;
          return false;
        }),
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
const openDeleteModalForGroup = async (canvas: ScopedQueries, user: UserEvent, groupName: string): Promise<void> => {
  // Find the group row
  const row = await findGroupRow(canvas, groupName);
  const rowScope = within(row);

  // Click kebab menu
  const kebabButton = await rowScope.findByLabelText(/actions/i);
  await user.click(kebabButton);

  // Click "Delete user group"
  const deleteOption = await within(document.body).findByText(/Delete user group/i);
  await user.click(deleteOption);
};

/**
 * Verifies the confirmation modal is displayed with correct content
 */
const verifyDeleteModal = async (groupName: string): Promise<ScopedQueries> => {
  const modalScope = await waitForModal();

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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });
    const targetGroup = mockGroups[4].name;
    const targetGroupId = mockGroups[4].uuid;

    await step('Reset state', async () => {
      await resetStoryState();
      resetDeletedGroups();
      deleteGroupSpy.mockClear();
      listGroupsSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page with target group', async () => {
      await waitForPageToLoad(canvas, targetGroup);
    });

    await step('Open delete modal and confirm deletion', async () => {
      await openDeleteModalForGroup(canvas, user, targetGroup);
      await verifyDeleteModal(targetGroup);
      await confirmDestructiveModal(user, { buttonText: /delete/i });
    });

    await step('Verify API call', async () => {
      await waitFor(
        () => {
          expect(deleteGroupSpy).toHaveBeenCalled();
          expect(deleteGroupSpy).toHaveBeenCalledWith(targetGroupId);
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });

    await step('Verify success notification', async () => {
      await waitForNotification(/group deleted successfully/i);
    });

    await step('Verify modal closed and group removed from table', async () => {
      await waitFor(() => {
        expect(within(document.body).queryByRole('dialog')).toBeNull();
      });
      expect(listGroupsSpy).toHaveBeenCalled();
      await waitFor(
        async () => {
          const tableAfter = await getUserGroupsTable(canvas);
          expect(within(tableAfter).queryByText(targetGroup)).not.toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });
  },
};

/**
 * Cancel deletion
 *
 * Tests canceling the delete confirmation
 */
export const CancelDeletion: Story = {
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });
    const targetGroup = mockGroups[4].name;

    await step('Reset state', async () => {
      await resetStoryState();
      resetDeletedGroups();
      deleteGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page with target group', async () => {
      await waitForPageToLoad(canvas, targetGroup);
    });

    await step('Open modal and cancel', async () => {
      await openDeleteModalForGroup(canvas, user, targetGroup);
      const modal = await waitForModal();
      const cancelButton = await modal.findByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
    });

    await step('Verify modal closed and no API call', async () => {
      await waitFor(() => {
        expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(deleteGroupSpy).not.toHaveBeenCalled();
    });

    await step('Verify group still exists in table', async () => {
      const table = await canvas.findByRole('grid', { name: /user groups table/i });
      await waitFor(() => expect(within(table).queryByText(targetGroup)).toBeInTheDocument(), { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });
    const targetGroup = mockGroups[4].name;

    await step('Reset state', async () => {
      await resetStoryState();
      resetDeletedGroups();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and open delete modal', async () => {
      await waitForPageToLoad(canvas, targetGroup);
      await openDeleteModalForGroup(canvas, user, targetGroup);
    });

    await step('Verify delete button disabled, check checkbox, verify enabled', async () => {
      const modalScope = await verifyDeleteModal(targetGroup);
      const deleteButton = await modalScope.findByRole('button', { name: /delete/i });
      expect(deleteButton).toBeDisabled();
      const checkbox = await modalScope.findByRole('checkbox');
      await user.click(checkbox);
      expect(deleteButton).not.toBeDisabled();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });
    const targetGroup = mockGroups[4].name;

    await step('Reset state', async () => {
      await resetStoryState();
      resetDeletedGroups();
      deleteGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and open delete modal', async () => {
      await waitForPageToLoad(canvas, targetGroup);
      await openDeleteModalForGroup(canvas, user, targetGroup);
    });

    await step('Close modal with X button', async () => {
      const modal = await waitForModal();
      const closeButton = await modal.findByLabelText(/close/i);
      await user.click(closeButton);
    });

    await step('Verify modal closed, no API call, group still exists', async () => {
      expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
      expect(deleteGroupSpy).not.toHaveBeenCalled();
      await expect(canvas.findByText(targetGroup)).resolves.toBeInTheDocument();
    });
  },
};
