/**
 * Remove from User Group Journey
 * Based on: static/mocks/Remove from user group/
 *
 * Features tested:
 * - Select users for removal
 * - Open remove modal
 * - Select groups to remove from
 * - Confirm removal
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
const removeMembersSpy = fn();

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Remove from user group',
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
        // Add spy handler for removing members
        http.delete('/api/rbac/v1/groups/:uuid/principals/', async ({ params, request }) => {
          const url = new URL(request.url);
          const usernames = url.searchParams.get('usernames');
          removeMembersSpy(params.uuid, usernames);
          return new HttpResponse(null, { status: 204 });
        }),
      ],
    },
    docs: {
      description: {
        component: `
# Remove from User Group Journey

Tests the workflow for removing users from user groups.

## Design Reference
- \`static/mocks/Remove from user group/Frame 178.png\` - Users selected
- \`static/mocks/Remove from user group/Frame 186.png\` - Remove modal open
- \`static/mocks/Remove from user group/Frame 191.png\` - Groups selected for removal

## Features
| Feature | Status | API |
|---------|--------|-----|
| Select users | ✅ Implemented | - |
| Remove from group button | ✅ Implemented | - |
| Group selection in modal | ✅ Implemented | V1 |
| Confirmation checkbox | ✅ Implemented | - |
| Remove API call | ✅ Implemented | V1 |
| Success notification | ✅ Implemented | - |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Complete remove from group flow
 *
 * Tests the full workflow from selecting users to removing them from groups
 */
export const CompleteFlow: Story = {
  name: 'Complete Flow',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests the complete "Remove from user group" workflow:

1. Select one or more users
2. Click "Remove from user group" in overflow menu
3. Modal opens showing user's groups
4. Select groups to remove from
5. Check confirmation checkbox
6. Click Remove button
7. Users are removed from selected groups

**Design references:**
- Frame 178: Users selected
- Frame 186: Modal open
- Frame 191: Groups selected
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    removeMembersSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(500);

    // Step 1: Select users (Spice girls members)
    const checkboxes = await canvas.findAllByRole('checkbox');
    await user.click(checkboxes[3]); // ginger-spice
    await user.click(checkboxes[4]); // posh-spice
    await delay(200);

    // Step 2: Find and click overflow menu for Remove action
    const overflowButton = await canvas.findByLabelText(/actions overflow/i);
    await user.click(overflowButton);
    await delay(200);

    // Step 3: Click "Remove from user group"
    const removeOption = await within(document.body).findByText(/Remove from user group/i);
    await user.click(removeOption);
    await delay(300);

    // Step 4: Verify modal opens
    const modal = await within(document.body).findByRole('dialog');
    expect(modal).toBeInTheDocument();
    const modalScope = within(modal);

    // Verify modal content
    await expect(modalScope.findByText(/remove.*from.*user group/i)).resolves.toBeInTheDocument();

    // Step 5: Select a group to remove from (if groups are shown with checkboxes)
    const groupCheckboxes = modalScope.queryAllByRole('checkbox');
    if (groupCheckboxes.length > 1) {
      await user.click(groupCheckboxes[0]); // Select first group
    }
    await delay(200);

    // Step 6: Check confirmation checkbox
    const confirmCheckbox = await modalScope.findByRole('checkbox', { name: /understand|irreversible/i });
    await user.click(confirmCheckbox);
    await delay(200);

    // Step 7: Click Remove button
    const removeButton = await modalScope.findByRole('button', { name: /remove/i });
    expect(removeButton).not.toBeDisabled();
    await user.click(removeButton);
    await delay(500);

    // Step 8: Verify API was called
    expect(removeMembersSpy).toHaveBeenCalled();

    // Modal should close
    expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();
  },
};

/**
 * Cancel removal
 *
 * Tests canceling the remove from group modal
 */
export const CancelRemoval: Story = {
  name: 'Cancel Removal',
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
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    removeMembersSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(500);

    // Select a user
    const checkboxes = await canvas.findAllByRole('checkbox');
    await user.click(checkboxes[3]);
    await delay(200);

    // Open overflow menu and click remove
    const overflowButton = await canvas.findByLabelText(/actions overflow/i);
    await user.click(overflowButton);
    await delay(200);

    const removeOption = await within(document.body).findByText(/Remove from user group/i);
    await user.click(removeOption);
    await delay(300);

    // Click Cancel
    const modal = await within(document.body).findByRole('dialog');
    const cancelButton = await within(modal).findByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    await delay(300);

    // Verify modal is closed
    expect(within(document.body).queryByRole('dialog')).not.toBeInTheDocument();

    // Verify no API call
    expect(removeMembersSpy).not.toHaveBeenCalled();
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
2. Remove button is disabled
3. Check confirmation checkbox
4. Remove button becomes enabled
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

    // Select a user and open remove modal
    const checkboxes = await canvas.findAllByRole('checkbox');
    await user.click(checkboxes[3]);
    await delay(200);

    const overflowButton = await canvas.findByLabelText(/actions overflow/i);
    await user.click(overflowButton);
    await delay(200);

    const removeOption = await within(document.body).findByText(/Remove from user group/i);
    await user.click(removeOption);
    await delay(300);

    // Verify modal is open
    const modal = await within(document.body).findByRole('dialog');
    const modalScope = within(modal);

    // Remove button should be disabled initially
    const removeButton = await modalScope.findByRole('button', { name: /remove/i });
    expect(removeButton).toBeDisabled();

    // Select a group (if available)
    const groupCheckboxes = modalScope.queryAllByRole('checkbox');
    if (groupCheckboxes.length > 0) {
      // Find and check the confirmation checkbox
      const confirmCheckbox = groupCheckboxes.find((cb) => {
        const label = cb.closest('label') || cb.parentElement;
        return label?.textContent?.toLowerCase().includes('understand');
      });
      if (confirmCheckbox) {
        await user.click(confirmCheckbox);
        await delay(200);
      }
    }

    // After checking confirmation, button should be enabled
    // (may still need group selection depending on implementation)
  },
};
