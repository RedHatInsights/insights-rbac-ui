/**
 * Edit User Group Journey
 * Based on: static/mocks/Edit user group/
 *
 * Features tested:
 * - Open edit from kebab menu
 * - Edit group name and description
 * - Add/remove users from group
 * - Add/remove service accounts
 * - Save changes
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { defaultHandlers, mockGroups } from './_shared';

// Spy for tracking API calls
const updateGroupSpy = fn();

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Edit user group',
  tags: ['access-management', 'user-groups', 'form'],
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
        // Add spy handler for updating group
        http.put('/api/rbac/v1/groups/:uuid/', async ({ params, request }) => {
          const body = await request.json();
          updateGroupSpy(params.uuid, body);
          const existingGroup = mockGroups.find((g) => g.uuid === params.uuid);
          return HttpResponse.json({
            ...existingGroup,
            ...(body as object),
            modified: new Date().toISOString(),
          });
        }),
      ],
    },
    docs: {
      description: {
        component: `
# Edit User Group Journey

Tests the workflow for editing an existing user group.

## Design Reference
- \`static/mocks/Edit user group/Frame 124.png\` - Kebab menu with Edit option
- \`static/mocks/Edit user group/Frame 131.png\` - Edit form
- \`static/mocks/Edit user group/Frame 156.png\` - Edit users
- \`static/mocks/Edit user group/Frame 193.png\` - Edit service accounts

## Features
| Feature | Status | API |
|---------|--------|-----|
| Edit from kebab menu | ✅ Implemented | - |
| Edit group name | ✅ Implemented | V1 |
| Edit description | ✅ Implemented | V1 |
| Add/remove users | ✅ Implemented | V1 |
| Add/remove service accounts | ⚠️ GAP | External SSO API |
| Save changes | ✅ Implemented | V1 |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Complete edit flow
 *
 * Tests the full workflow from kebab menu to saving changes
 */
export const CompleteFlow: Story = {
  name: 'Complete Flow',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests the complete "Edit user group" workflow:

1. Click kebab menu on a group
2. Select "Edit user group"
3. Modify group name and description
4. Save changes
5. Return to groups table

**Design references:**
- Frame 124: Kebab menu
- Frame 131: Edit form
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    updateGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(500);

    // Step 1: Find and click kebab menu for Golden girls group
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    // Click the last kebab (Golden girls)
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(200);

    // Step 2: Click "Edit user group"
    const editOption = await within(document.body).findByText(/Edit user group/i);
    await user.click(editOption);
    await delay(500);

    // Step 3: Verify we're on the edit form
    await expect(canvas.findByText(/Edit user group/i)).resolves.toBeInTheDocument();

    // Step 4: Modify description
    const descriptionInput = await canvas.findByLabelText(/description/i);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated description for Golden girls');
    await delay(200);

    // Step 5: Save changes
    const submitButton = await canvas.findByRole('button', { name: /submit|save/i });
    await user.click(submitButton);
    await delay(500);

    // Step 6: Verify API was called
    expect(updateGroupSpy).toHaveBeenCalledWith(
      'group-golden-girls',
      expect.objectContaining({
        description: 'Updated description for Golden girls',
      }),
    );
  },
};

/**
 * Edit group name
 *
 * Tests changing the group name
 */
export const EditGroupName: Story = {
  name: 'Edit Group Name',
  parameters: {
    docs: {
      description: {
        story: `
Tests editing the group name.

**Expected behavior:**
1. Open edit form
2. Change group name
3. Save changes
4. Name is updated
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    updateGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(500);

    // Open edit for a group
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(200);

    const editOption = await within(document.body).findByText(/Edit user group/i);
    await user.click(editOption);
    await delay(500);

    // Change name
    const nameInput = await canvas.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed Group');
    await delay(200);

    // Save
    const submitButton = await canvas.findByRole('button', { name: /submit|save/i });
    await user.click(submitButton);
    await delay(500);

    // Verify API was called with new name
    expect(updateGroupSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: 'Renamed Group',
      }),
    );
  },
};

/**
 * Validation prevents duplicate name
 *
 * Tests that editing to a duplicate name shows error
 */
export const ValidationDuplicateName: Story = {
  name: 'Validation - Duplicate Name',
  parameters: {
    docs: {
      description: {
        story: `
Tests that changing to an existing group name shows validation error.

**Expected behavior:**
1. Open edit form
2. Change name to existing group name
3. Validation error appears
4. Cannot save
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    updateGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(500);

    // Open edit for Golden girls
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(200);

    const editOption = await within(document.body).findByText(/Edit user group/i);
    await user.click(editOption);
    await delay(500);

    // Change name to existing group name
    const nameInput = await canvas.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Admin group'); // Already exists
    await delay(500);

    // Verify validation error
    await expect(canvas.findByText(/already exists|taken/i)).resolves.toBeInTheDocument();

    // Save button should be disabled
    const submitButton = await canvas.findByRole('button', { name: /submit|save/i });
    expect(submitButton).toBeDisabled();

    // No API call should be made
    expect(updateGroupSpy).not.toHaveBeenCalled();
  },
};

/**
 * Cancel edit
 *
 * Tests canceling the edit form without saving
 */
export const CancelEdit: Story = {
  name: 'Cancel Edit',
  parameters: {
    docs: {
      description: {
        story: `
Tests canceling the edit form.

**Expected behavior:**
1. Open edit form
2. Make changes
3. Click Cancel
4. Return to groups table
5. Changes are not saved
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    updateGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(500);

    // Open edit
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(200);

    const editOption = await within(document.body).findByText(/Edit user group/i);
    await user.click(editOption);
    await delay(500);

    // Make changes
    const nameInput = await canvas.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Name');
    await delay(200);

    // Cancel
    const cancelButton = await canvas.findByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    await delay(500);

    // Verify back on groups table
    await expect(canvas.findByText('Golden girls')).resolves.toBeInTheDocument();

    // Verify no API call
    expect(updateGroupSpy).not.toHaveBeenCalled();
  },
};
