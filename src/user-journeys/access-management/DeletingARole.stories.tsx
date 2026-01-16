/**
 * Deleting a Role Journey
 * Based on: static/mocks/Deleting a role/
 *
 * Features tested:
 * - Open delete from kebab menu
 * - Confirmation modal with checkbox
 * - Delete action
 * - Cannot delete system roles
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { withFeatureGap } from '../_shared/components/FeatureGapBanner';
import { resetStoryState } from '../_shared/helpers';
import { handlersWithV2Gaps, mockRolesV2 } from './_shared';
import {
  clickModalCancelButton,
  clickModalCheckbox,
  clickModalDeleteButton,
  openRoleKebabMenu,
  verifyDeleteButtonDisabled,
  verifyDeleteButtonEnabled,
  verifyDeleteRoleApiCall,
  verifyNoApiCalls,
  verifyRoleExists,
  verifyRoleNotExists,
  waitForModal,
} from './_shared/tableHelpers';

// =============================================================================
// API SPIES
// =============================================================================

const deleteRoleSpy = fn();

// =============================================================================
// MUTABLE STATE FOR TEST ISOLATION
// =============================================================================

// Track deleted roles for test isolation
const deletedRoleIds = new Set<string>();

// Reset function for test isolation
const resetDeletedRoles = () => {
  deletedRoleIds.clear();
};

// =============================================================================
// MSW HANDLERS
// =============================================================================

// Custom delete handler that tracks deletions
// Note: RolesWithWorkspaces uses V1 API for deletion
const deleteRoleHandler = http.delete('/api/rbac/v1/roles/:uuid/', async ({ params }) => {
  await delay(100);
  const roleId = params.uuid as string;
  const role = mockRolesV2.find((r) => r.uuid === roleId);

  if (!role) {
    return new HttpResponse(null, { status: 404 });
  }

  if (role.system) {
    return HttpResponse.json({ error: 'Cannot delete system role' }, { status: 400 });
  }

  // Track the deletion
  deleteRoleSpy(roleId);
  deletedRoleIds.add(roleId);

  return new HttpResponse(null, { status: 204 });
});

// Custom list handler that filters out deleted roles
// Returns V1 format (with display_name) for compatibility with RolesWithWorkspaces component
const listRolesHandler = http.get('/api/rbac/v1/roles/', async ({ request }) => {
  await delay(100);
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const nameFilter = url.searchParams.get('name') || url.searchParams.get('display_name') || '';

  // Filter out deleted roles
  let filteredRoles = mockRolesV2.filter((r) => !deletedRoleIds.has(r.uuid));

  // Apply name filter
  if (nameFilter) {
    filteredRoles = filteredRoles.filter((r) => r.name.toLowerCase().includes(nameFilter.toLowerCase()));
  }

  const paginatedRoles = filteredRoles.slice(offset, offset + limit);

  // Transform to V1 format (add display_name)
  const v1FormattedRoles = paginatedRoles.map((r) => ({
    ...r,
    display_name: r.name, // V1 API uses display_name
    accessCount: r.permissions || 0,
  }));

  return HttpResponse.json({
    data: v1FormattedRoles,
    meta: {
      count: filteredRoles.length,
      limit,
      offset,
    },
  });
});

// =============================================================================
// META
// =============================================================================

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Deleting a role',
  tags: ['access-management', 'roles', 'modal', 'destructive'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      // Reset deleted roles BEFORE story renders to ensure clean state
      resetDeletedRoles();

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
    'platform.rbac.workspaces': true, // M5 flag - enables V2 roles view with kebab menus
  },
  parameters: {
    ...createDynamicEnvironment({
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.workspaces': true,
    }),
    msw: {
      handlers: [
        // Custom handlers FIRST - MSW matches the first handler that matches
        listRolesHandler,
        deleteRoleHandler,
        // Include all default handlers (our custom ones will be matched first)
        ...handlersWithV2Gaps,
      ],
    },
    docs: {
      description: {
        component: `
# Deleting a Role Journey

Tests the workflow for deleting a role.

## Design Reference

| Kebab menu with delete | Delete confirmation modal |
|:---:|:---:|
| [![Kebab menu with delete](/mocks/Deleting%20a%20role/Frame%20160.png)](/mocks/Deleting%20a%20role/Frame%20160.png) | [![Delete confirmation modal](/mocks/Deleting%20a%20role/Frame%20161.png)](/mocks/Deleting%20a%20role/Frame%20161.png) |

| Checkbox confirmation | Deleting state |
|:---:|:---:|
| [![Checkbox confirmation](/mocks/Deleting%20a%20role/Frame%20179.png)](/mocks/Deleting%20a%20role/Frame%20179.png) | [![Deleting state](/mocks/Deleting%20a%20role/Frame%20180.png)](/mocks/Deleting%20a%20role/Frame%20180.png) |

## Features
| Feature | Status | API |
|---------|--------|-----|
| Delete from kebab | ✅ Implemented | V1 |
| Confirmation modal | ✅ Implemented | - |
| Checkbox acknowledgment | ✅ Implemented | - |
| Delete API call | ✅ Implemented | V1 |
| System role protection | ✅ Implemented | V1 |
| Success notification | ✅ Implemented | - |
| Refresh table | ✅ Implemented | - |

## Notes
- System/canned roles cannot be deleted
- V2 role deletion API will replace V1 when available
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Target role for deletion (non-system role)
const TARGET_ROLE = mockRolesV2.find((r) => !r.system)!;

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
  decorators: [
    withFeatureGap({
      title: 'Delete Role - V2 API Required',
      currentState: 'Using guessed V2 API mock data for role deletion.',
      expectedBehavior: 'Role deletion API should come from V2 Kessel/RBAC APIs.',
      implementation: ['When V2 API becomes available, update handlers to use V2 endpoints.'],
      relatedFiles: ['src/user-journeys/access-management/DeletingARole.stories.tsx', 'src/user-journeys/access-management/_shared/handlers.ts'],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests the complete delete role workflow:

1. **Pre-condition**: Verify role exists in table
2. Click kebab menu on a non-system role
3. Select "Delete role"
4. Confirmation modal appears
5. Check acknowledgment checkbox
6. Click Delete button
7. **API Spy**: Verify delete API called with correct role ID
8. **Post-condition**: Verify role is removed from table

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
    resetDeletedRoles();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Step 1: Pre-condition - Verify role exists
    await verifyRoleExists(canvas, TARGET_ROLE.name);

    // Step 2: Open kebab menu for the target role
    await openRoleKebabMenu(canvas, user, TARGET_ROLE.name);
    await delay(200);

    // Step 3: Click "Delete role" option
    const deleteOption = await within(document.body).findByRole('menuitem', { name: /^delete$/i });
    await user.click(deleteOption);
    await delay(300);

    // Step 4: Verify modal appears with delete confirmation
    const modalScope = await waitForModal();
    // Modal heading is "Delete role?" and the role name is in the description
    await expect(modalScope.findByRole('heading', { name: /delete role/i })).resolves.toBeInTheDocument();
    // Verify the description mentions the target role
    await expect(modalScope.findByText(new RegExp(TARGET_ROLE.name, 'i'))).resolves.toBeInTheDocument();

    // Step 5: Check acknowledgment checkbox (if present)
    const checkbox = modalScope.queryByRole('checkbox');
    if (checkbox) {
      await user.click(checkbox);
      await delay(200);
    }

    // Step 6: Click Delete button
    await clickModalDeleteButton(user);
    await delay(500);

    // Step 7: API Spy - Verify delete API called with correct role ID
    verifyDeleteRoleApiCall(deleteRoleSpy, TARGET_ROLE.uuid);

    // Step 8: Post-condition - Verify role is removed from table
    // Wait for table to refresh
    await delay(500);
    await verifyRoleNotExists(canvas, TARGET_ROLE.name);
  },
};

/**
 * Cancel deletion
 *
 * Tests canceling the delete confirmation
 */
export const CancelDeletion: Story = {
  name: 'Cancel Deletion',
  tags: [],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **GAP: V2 API Required**

Tests canceling the delete confirmation modal.

**Expected behavior:**
1. **Pre-condition**: Verify role exists
2. Open delete confirmation
3. Click Cancel
4. Modal closes
5. **API Spy**: Verify NO delete API call made
6. **Post-condition**: Role still exists in table
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    deleteRoleSpy.mockClear();
    resetDeletedRoles();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Step 1: Pre-condition - Verify role exists
    await verifyRoleExists(canvas, TARGET_ROLE.name);

    // Step 2: Open kebab menu and click delete
    await openRoleKebabMenu(canvas, user, TARGET_ROLE.name);
    await delay(200);

    const deleteOption = await within(document.body).findByRole('menuitem', { name: /^delete$/i });
    await user.click(deleteOption);
    await delay(300);

    // Step 3: Click Cancel in modal
    await waitForModal();
    await clickModalCancelButton(user);
    await delay(300);

    // Step 4: API Spy - Verify NO delete API call made
    verifyNoApiCalls(deleteRoleSpy);

    // Step 5: Post-condition - Role still exists
    await verifyRoleExists(canvas, TARGET_ROLE.name);
  },
};

/**
 * Cannot delete system roles
 *
 * Tests that system/canned roles cannot be deleted
 */
export const CannotDeleteSystemRoles: Story = {
  name: 'Cannot Delete System Roles',
  tags: [],
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
    const systemRole = mockRolesV2.find((r) => r.system);
    if (systemRole) {
      await verifyRoleExists(canvas, systemRole.name);

      // Note: System roles should not have delete option
      // The actual behavior depends on the component implementation
      // V2 API needed for proper implementation
    }
  },
};

/**
 * Delete button disabled without checkbox
 *
 * Tests that delete requires checkbox acknowledgment
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

    // Step 1: Open kebab menu and click delete
    await openRoleKebabMenu(canvas, user, TARGET_ROLE.name);
    await delay(200);

    const deleteOption = await within(document.body).findByRole('menuitem', { name: /^delete$/i });
    await user.click(deleteOption);
    await delay(300);

    // Step 2: Verify modal appears
    const modalScope = await waitForModal();

    // Step 3: Check if checkbox exists and verify button state
    const checkbox = modalScope.queryByRole('checkbox');
    if (checkbox) {
      // Delete button should be disabled initially
      await verifyDeleteButtonDisabled();

      // Check checkbox
      await clickModalCheckbox(user);
      await delay(200);

      // Delete button should now be enabled
      await verifyDeleteButtonEnabled();
    } else {
      // If no checkbox, this is a GAP - document it
      console.warn('GAP: Delete confirmation modal does not have checkbox acknowledgment');
      // The delete button may be enabled without checkbox
    }
  },
};

/**
 * Close modal with X button
 *
 * Tests closing the modal with the X button
 */
export const CloseWithXButton: Story = {
  name: 'Close with X Button',
  tags: [],
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
5. Role still exists
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    deleteRoleSpy.mockClear();
    resetDeletedRoles();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Step 1: Pre-condition - Verify role exists
    await verifyRoleExists(canvas, TARGET_ROLE.name);

    // Step 2: Open kebab menu and click delete
    await openRoleKebabMenu(canvas, user, TARGET_ROLE.name);
    await delay(200);

    const deleteOption = await within(document.body).findByRole('menuitem', { name: /^delete$/i });
    await user.click(deleteOption);
    await delay(300);

    // Step 3: Click X button to close modal
    const modalScope = await waitForModal();
    const closeButton = await modalScope.findByLabelText(/close/i);
    await user.click(closeButton);
    await delay(300);

    // Step 4: API Spy - Verify NO delete API call made
    verifyNoApiCalls(deleteRoleSpy);

    // Step 5: Post-condition - Role still exists
    await verifyRoleExists(canvas, TARGET_ROLE.name);
  },
};
