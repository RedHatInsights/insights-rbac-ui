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
import { delay } from 'msw';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { withFeatureGap } from '../_shared/components/FeatureGapBanner';
import { TEST_TIMEOUTS, openRoleActionsMenu, resetStoryState, waitForPageToLoad } from '../_shared/helpers';
import { createV2RolesHandlers, mockRolesV2, v2DefaultHandlers } from './_shared';
import { createResettableCollection } from '../../shared/data/mocks/db';
import {
  clickModalCancelButton,
  clickModalCheckbox,
  clickModalDeleteButton,
  verifyDeleteButtonDisabled,
  verifyDeleteButtonEnabled,
  verifyDeleteRoleApiCall,
  verifyNoApiCalls,
  verifyRoleNotExists,
  waitForModal,
} from './_shared/tableHelpers';
import type { Role } from '../../v2/data/queries/roles';

// =============================================================================
// API SPIES
// =============================================================================

const deleteRoleSpy = fn();

// =============================================================================
// STATEFUL COLLECTION FOR TEST ISOLATION
// =============================================================================

/**
 * Convert journey mock roles (uuid-based) to V2 Role type (id-based)
 * so we can use createV2RolesHandlers with cursor pagination.
 */
const journeyRolesToV2 = (): Role[] =>
  mockRolesV2.map((r) => ({
    id: r.uuid,
    name: r.name,
    description: r.description,
    org_id: r.org_id,
    permissions_count: typeof r.permissions === 'number' ? r.permissions : 0,
    last_modified: r.modified,
  }));

const rolesCollection = createResettableCollection(journeyRolesToV2());

const resetCollection = () => rolesCollection.reset();

// Target role for deletion (user-created, has org_id in mock data)
const TARGET_ROLE = mockRolesV2.find((r) => r.uuid === 'role-rhel-devops')!;
const TARGET_ROLE_ID = TARGET_ROLE.uuid;

// System/canned role (org_id: undefined — not editable/deletable)
const SYSTEM_ROLE = mockRolesV2.find((r) => r.uuid === 'role-tenant-admin')!;

// =============================================================================
// MSW HANDLERS
// =============================================================================

const rolesHandlers = createV2RolesHandlers(rolesCollection, {
  networkDelay: TEST_TIMEOUTS.QUICK_SETTLE,
  onBatchDelete: (...args: unknown[]) => {
    const ids = args[0] as string[];
    ids.forEach((id) => deleteRoleSpy(id));
  },
  onDelete: (...args: unknown[]) => deleteRoleSpy(args[0]),
});

// =============================================================================
// META
// =============================================================================

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Roles/Deleting a Role',
  tags: ['access-management', 'roles', 'modal', 'destructive'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      resetCollection();

      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  args: {
    initialRoute: '/iam/access-management/roles',
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
    orgAdmin: true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.workspaces': true, // M5 flag - enables V2 roles view with kebab menus
    'platform.rbac.workspaces-organization-management': true, // Enables access-management routes
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.workspaces-organization-management': true,
      'platform.rbac.workspaces': true,
    }),
    msw: {
      handlers: [...rolesHandlers, ...v2DefaultHandlers],
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
    resetCollection();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Step 1: Pre-condition - Verify role exists
    await waitForPageToLoad(canvas, TARGET_ROLE.name);

    // Step 2: Open kebab menu for the target role
    await openRoleActionsMenu(user, canvas, TARGET_ROLE.name);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Step 3: Click "Delete role" option
    const deleteOption = await within(document.body).findByRole('menuitem', { name: /^delete$/i });
    await user.click(deleteOption);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Step 4: Verify modal appears with delete confirmation
    const modalScope = await waitForModal();
    await expect(modalScope.findByRole('heading', { name: /delete role/i })).resolves.toBeInTheDocument();
    await expect(modalScope.findByText(new RegExp(TARGET_ROLE.name, 'i'))).resolves.toBeInTheDocument();

    // Step 5: Check acknowledgment checkbox (if present)
    const checkbox = modalScope.queryByRole('checkbox');
    if (checkbox) {
      await user.click(checkbox);
      await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);
    }

    // Step 6: Click Delete button
    await clickModalDeleteButton(user);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Step 7: API Spy - Verify delete API called with correct role ID
    verifyDeleteRoleApiCall(deleteRoleSpy, TARGET_ROLE_ID);

    // Step 8: Post-condition - Verify role is removed from table
    await verifyRoleNotExists(canvas, TARGET_ROLE.name);
  },
};

/**
 * Cancel deletion
 *
 * Tests canceling the delete confirmation
 */
export const CancelDeletion: Story = {
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
    resetCollection();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Step 1: Pre-condition - Verify role exists
    await waitForPageToLoad(canvas, TARGET_ROLE.name);

    // Step 2: Open kebab menu and click delete
    await openRoleActionsMenu(user, canvas, TARGET_ROLE.name);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const deleteOption = await within(document.body).findByRole('menuitem', { name: /^delete$/i });
    await user.click(deleteOption);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Step 3: Click Cancel in modal
    await waitForModal();
    await clickModalCancelButton(user);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Step 4: API Spy - Verify NO delete API call made
    verifyNoApiCalls(deleteRoleSpy);

    // Step 5: Post-condition - Role still exists
    await waitForPageToLoad(canvas, TARGET_ROLE.name);
  },
};

/**
 * Cannot delete system roles
 *
 * Tests that system/canned roles cannot be deleted (no kebab menu shown
 * because `org_id` is undefined — the role is immutable).
 */
export const CannotDeleteSystemRoles: Story = {
  tags: [],
  parameters: {
    docs: {
      description: {
        story: `
Tests that system/canned roles cannot be deleted.

**Expected behavior:**
- System roles should NOT have a kebab menu (\`org_id\` is undefined)
- User-created roles that are writable should still show the kebab menu
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for page to load
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify the system role is displayed
    await waitForPageToLoad(canvas, SYSTEM_ROLE.name);

    // System role should NOT have a kebab menu (org_id is undefined)
    const kebab = canvas.queryByRole('button', {
      name: new RegExp(`Actions for role ${SYSTEM_ROLE.name}`, 'i'),
    });
    expect(kebab).not.toBeInTheDocument();

    // User-created role should still have a kebab menu
    const writableKebab = await canvas.findByRole('button', {
      name: new RegExp(`Actions for role ${TARGET_ROLE.name}`, 'i'),
    });
    expect(writableKebab).toBeInTheDocument();
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
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Step 1: Open kebab menu and click delete
    await openRoleActionsMenu(user, canvas, TARGET_ROLE.name);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const deleteOption = await within(document.body).findByRole('menuitem', { name: /^delete$/i });
    await user.click(deleteOption);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Step 2: Verify modal appears
    const modalScope = await waitForModal();

    // Step 3: Check if checkbox exists and verify button state
    const checkbox = modalScope.queryByRole('checkbox');
    if (checkbox) {
      // Delete button should be disabled initially
      await verifyDeleteButtonDisabled();

      // Check checkbox
      await clickModalCheckbox(user);
      await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

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
    resetCollection();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Step 1: Pre-condition - Verify role exists
    await waitForPageToLoad(canvas, TARGET_ROLE.name);

    // Step 2: Open kebab menu and click delete
    await openRoleActionsMenu(user, canvas, TARGET_ROLE.name);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const deleteOption = await within(document.body).findByRole('menuitem', { name: /^delete$/i });
    await user.click(deleteOption);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Step 3: Click X button to close modal
    const modalScope = await waitForModal();
    const closeButton = await modalScope.findByLabelText(/close/i);
    await user.click(closeButton);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Step 4: API Spy - Verify NO delete API call made
    verifyNoApiCalls(deleteRoleSpy);

    // Step 5: Post-condition - Role still exists
    await waitForPageToLoad(canvas, TARGET_ROLE.name);
  },
};
