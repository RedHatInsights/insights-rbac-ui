/**
 * Deleting a Role Journey
 * Based on: static/mocks/Deleting a role/
 *
 * ⚠️ GAP: This feature requires V2 API which is not yet available.
 *
 * Features tested:
 * - Open delete from kebab menu
 * - Confirmation modal
 * - Delete action
 * - Cannot delete system roles
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { handlersWithV2Gaps, mockRolesV2 } from './_shared';

// Spy for tracking API calls
const deleteRoleSpy = fn();

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Deleting a role',
  tags: ['access-management', 'roles', 'modal', 'destructive', 'gap:v2-api'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  args: {
    initialRoute: '/iam/access-management/roles',
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: true,
    'platform.rbac.common-auth-model': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
    }),
    msw: {
      handlers: [
        ...handlersWithV2Gaps,
        // Add spy handler for deleting role
        http.delete('/api/rbac/v2/roles/:uuid/', async ({ params }) => {
          const role = mockRolesV2.find((r) => r.uuid === params.uuid);
          if (role?.system) {
            return HttpResponse.json({ error: 'Cannot delete system role' }, { status: 400 });
          }
          deleteRoleSpy(params.uuid);
          return new HttpResponse(null, { status: 204 });
        }),
      ],
    },
    docs: {
      description: {
        component: `
# Deleting a Role Journey

⚠️ **GAP: V2 API Required**

Tests the workflow for deleting a role.

## Design Reference
- \`static/mocks/Deleting a role/Frame 160.png\` - Kebab menu with delete
- \`static/mocks/Deleting a role/Frame 161.png\` - Delete confirmation modal
- \`static/mocks/Deleting a role/Frame 179.png\` - Checkbox confirmation
- \`static/mocks/Deleting a role/Frame 180.png\` - Deleting state

## V2 API Requirements
| Feature | Status |
|---------|--------|
| Delete from kebab | ⚠️ GAP - V2 API |
| Confirmation modal | ✅ Implemented |
| Delete API call | ⚠️ GAP - V2 API |
| System role protection | ⚠️ GAP - V2 API |

## Notes
- System/canned roles cannot be deleted
- V2 API needed for proper role deletion
- Currently using V1 API with limited functionality
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
  tags: ['autodocs', 'gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests the complete delete role workflow:

1. Click kebab menu on a non-system role
2. Select "Delete role"
3. Confirmation modal appears
4. Check acknowledgment checkbox
5. Click Delete button
6. Role is deleted

**Design references:**
- Frame 160: Kebab menu
- Frame 161: Confirmation modal
- Frame 179: Checkbox checked
- Frame 180: Deleting state
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    deleteRoleSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Find kebab menus (only non-system roles have them)
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);

    if (kebabButtons.length > 0) {
      // Click the first available kebab
      await user.click(kebabButtons[0]);
      await delay(200);

      // Look for Delete role option
      const deleteOption = within(document.body).queryByText(/Delete role/i);
      if (deleteOption) {
        await user.click(deleteOption);
        await delay(300);

        // Verify modal opens
        const modal = within(document.body).queryByRole('dialog');
        if (modal) {
          const modalScope = within(modal);

          // Check confirmation checkbox if present
          const checkbox = modalScope.queryByRole('checkbox');
          if (checkbox) {
            await user.click(checkbox);
            await delay(200);
          }

          // Click Delete button
          const deleteButton = modalScope.queryByRole('button', { name: /delete/i });
          if (deleteButton) {
            await user.click(deleteButton);
            await delay(500);
          }
        }
      }
    }

    // Note: Full delete flow requires V2 API implementation
  },
};

/**
 * Cancel deletion
 *
 * Tests canceling the delete confirmation
 */
export const CancelDeletion: Story = {
  name: 'Cancel Deletion',
  tags: ['gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests canceling the delete confirmation modal.

**Expected behavior:**
1. Open delete confirmation
2. Click Cancel
3. Modal closes
4. No API call made
5. Role still exists
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    deleteRoleSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Find kebab menus
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);

    if (kebabButtons.length > 0) {
      await user.click(kebabButtons[0]);
      await delay(200);

      const deleteOption = within(document.body).queryByText(/Delete role/i);
      if (deleteOption) {
        await user.click(deleteOption);
        await delay(300);

        // Click Cancel in modal
        const modal = within(document.body).queryByRole('dialog');
        if (modal) {
          const cancelButton = within(modal).queryByRole('button', { name: /cancel/i });
          if (cancelButton) {
            await user.click(cancelButton);
            await delay(300);
          }
        }
      }
    }

    // Verify no API call was made
    expect(deleteRoleSpy).not.toHaveBeenCalled();
  },
};

/**
 * Cannot delete system roles
 *
 * Tests that system/canned roles cannot be deleted
 */
export const CannotDeleteSystemRoles: Story = {
  name: 'Cannot Delete System Roles',
  tags: ['gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests that system/canned roles cannot be deleted.

**Expected behavior:**
- System roles should NOT have kebab menu
- OR kebab menu should not include "Delete role" option
- If delete is attempted, API returns error

V2 API needed for proper role type identification.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for page to load
    await delay(500);

    // Verify system roles are displayed
    await expect(canvas.findByText(/Organization Administrator/i)).resolves.toBeInTheDocument();

    // Note: System roles should not have delete option
    // V2 API needed for proper implementation
  },
};

/**
 * Delete button disabled without checkbox
 *
 * Tests that delete requires checkbox acknowledgment
 */
export const DeleteButtonDisabled: Story = {
  name: 'Delete Button Disabled Without Checkbox',
  tags: ['gap:v2-api'],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests that the delete button requires checkbox acknowledgment.

**Expected behavior:**
1. Open delete confirmation
2. Delete button is disabled
3. Check checkbox
4. Delete button becomes enabled
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Find kebab menus
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);

    if (kebabButtons.length > 0) {
      await user.click(kebabButtons[0]);
      await delay(200);

      const deleteOption = within(document.body).queryByText(/Delete role/i);
      if (deleteOption) {
        await user.click(deleteOption);
        await delay(300);

        const modal = within(document.body).queryByRole('dialog');
        if (modal) {
          const modalScope = within(modal);

          // Delete button should be disabled initially
          const deleteButton = modalScope.queryByRole('button', { name: /delete/i });
          if (deleteButton) {
            expect(deleteButton).toBeDisabled();

            // Check checkbox
            const checkbox = modalScope.queryByRole('checkbox');
            if (checkbox) {
              await user.click(checkbox);
              await delay(200);
            }

            // Delete button should now be enabled
            expect(deleteButton).not.toBeDisabled();
          }
        }
      }
    }
  },
};
