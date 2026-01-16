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
import { expect, fn, userEvent, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { defaultHandlers } from './_shared';

// Spy for tracking API calls
const deleteGroupSpy = fn();

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Delete user group',
  tags: ['access-management', 'user-groups', 'modal', 'destructive'],
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
      handlers: [
        ...defaultHandlers,
        // Add spy handler for deleting group
        http.delete('/api/rbac/v1/groups/:uuid/', async ({ params }) => {
          deleteGroupSpy(params.uuid);
          return new HttpResponse(null, { status: 204 });
        }),
      ],
    },
    docs: {
      description: {
        component: `
# Delete User Group Journey

Tests the workflow for deleting a user group.

## Design Reference
- \`static/mocks/Delete user group/Frame 120.png\` - Kebab menu
- \`static/mocks/Delete user group/Frame 121.png\` - Delete confirmation modal
- \`static/mocks/Delete user group/Frame 122.png\` - Checkbox confirmation
- \`static/mocks/Delete user group/Frame 123.png\` - Deleting state

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

1. Click kebab menu on a group
2. Select "Delete user group"
3. Confirmation modal appears
4. Check the acknowledgment checkbox
5. Click Delete button
6. Group is deleted
7. Table refreshes

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
    await resetStoryState();
    deleteGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(500);

    // Step 1: Verify groups are displayed
    await expect(canvas.findByText('Golden girls')).resolves.toBeInTheDocument();

    // Step 2: Find and click kebab menu for Golden girls
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(200);

    // Step 3: Click "Delete user group"
    const deleteOption = await within(document.body).findByText(/Delete user group/i);
    await user.click(deleteOption);
    await delay(300);

    // Step 4: Verify confirmation modal appears
    const modal = await within(document.body).findByRole('dialog');
    expect(modal).toBeInTheDocument();
    const modalScope = within(modal);

    // Verify modal content shows group info
    await expect(modalScope.findByText(/delete.*user group/i)).resolves.toBeInTheDocument();
    await expect(modalScope.findByText(/Golden girls/i)).resolves.toBeInTheDocument();

    // Step 5: Check acknowledgment checkbox
    const checkbox = await modalScope.findByRole('checkbox');
    await user.click(checkbox);
    await delay(200);

    // Step 6: Click Delete button
    const deleteButton = await modalScope.findByRole('button', { name: /delete/i });
    expect(deleteButton).not.toBeDisabled();
    await user.click(deleteButton);
    await delay(500);

    // Step 7: Verify API was called
    expect(deleteGroupSpy).toHaveBeenCalledWith('group-golden-girls');

    // Modal should close
    expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
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
    await resetStoryState();
    deleteGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(500);

    // Open kebab menu and click delete
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(200);

    const deleteOption = await within(document.body).findByText(/Delete user group/i);
    await user.click(deleteOption);
    await delay(300);

    // Click Cancel
    const modal = await within(document.body).findByRole('dialog');
    const cancelButton = await within(modal).findByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    await delay(300);

    // Verify modal is closed
    expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();

    // Verify no API call was made
    expect(deleteGroupSpy).not.toHaveBeenCalled();

    // Verify group still exists
    await expect(canvas.findByText('Golden girls')).resolves.toBeInTheDocument();
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
    await resetStoryState();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(500);

    // Open delete modal
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(200);

    const deleteOption = await within(document.body).findByText(/Delete user group/i);
    await user.click(deleteOption);
    await delay(300);

    // Verify modal is open
    const modal = await within(document.body).findByRole('dialog');
    const modalScope = within(modal);

    // Delete button should be disabled initially
    const deleteButton = await modalScope.findByRole('button', { name: /delete/i });
    expect(deleteButton).toBeDisabled();

    // Check the checkbox
    const checkbox = await modalScope.findByRole('checkbox');
    await user.click(checkbox);
    await delay(200);

    // Delete button should now be enabled
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
    await resetStoryState();
    deleteGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(500);

    // Open delete modal
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(200);

    const deleteOption = await within(document.body).findByText(/Delete user group/i);
    await user.click(deleteOption);
    await delay(300);

    // Click X button
    const modal = await within(document.body).findByRole('dialog');
    const closeButton = await within(modal).findByLabelText(/close/i);
    await user.click(closeButton);
    await delay(300);

    // Verify modal is closed
    expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();

    // Verify no API call
    expect(deleteGroupSpy).not.toHaveBeenCalled();
  },
};
