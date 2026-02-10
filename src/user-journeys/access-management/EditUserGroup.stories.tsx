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
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { TEST_TIMEOUTS, resetStoryState, waitForPageToLoad } from '../_shared/helpers';
import { defaultHandlers, mockGroups } from './_shared';

// Spy for tracking API calls
const updateGroupSpy = fn();

// =============================================================================
// MUTABLE STATE FOR TEST ISOLATION
// =============================================================================

// Deep copy of mock groups to allow mutations
const mutableGroups = JSON.parse(JSON.stringify(mockGroups)) as typeof mockGroups;

// Reset function for test isolation
const resetMutableState = () => {
  mutableGroups.length = 0;
  mutableGroups.push(...JSON.parse(JSON.stringify(mockGroups)));
};

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
    permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
    orgAdmin: true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.common.userstable': true,
    'platform.rbac.workspaces-organization-management': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.common.userstable': true,
      'platform.rbac.workspaces-organization-management': true,
    }),
    msw: {
      handlers: [
        // Custom list handler that returns mutable state
        http.get('/api/rbac/v1/groups/', async ({ request }) => {
          await delay(TEST_TIMEOUTS.QUICK_SETTLE);
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20', 10);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);
          const nameFilter = url.searchParams.get('name') || '';

          let filteredGroups = mutableGroups;
          if (nameFilter) {
            filteredGroups = mutableGroups.filter((g) => g.name.toLowerCase().includes(nameFilter.toLowerCase()));
          }

          const paginatedGroups = filteredGroups.slice(offset, offset + limit);
          return HttpResponse.json({
            data: paginatedGroups,
            meta: { count: filteredGroups.length, limit, offset },
          });
        }),
        // Custom detail handler that returns mutable state
        http.get('/api/rbac/v1/groups/:uuid/', async ({ params }) => {
          await delay(TEST_TIMEOUTS.QUICK_SETTLE);
          const group = mutableGroups.find((g) => g.uuid === params.uuid);
          if (!group) {
            return new HttpResponse(null, { status: 404 });
          }
          return HttpResponse.json(group);
        }),
        // Spy handler that updates mutable state
        http.put('/api/rbac/v1/groups/:uuid/', async ({ params, request }) => {
          const body = (await request.json()) as { name?: string; description?: string };
          updateGroupSpy(params.uuid, body);

          // Update the mutable state
          const groupIndex = mutableGroups.findIndex((g) => g.uuid === params.uuid);
          if (groupIndex !== -1) {
            mutableGroups[groupIndex] = {
              ...mutableGroups[groupIndex],
              ...body,
              modified: new Date().toISOString(),
            };
          }

          return HttpResponse.json(mutableGroups[groupIndex]);
        }),
        // Keep group members/principals and service accounts handlers from defaults
        ...defaultHandlers.filter((h) => {
          const path = h.info?.path?.toString() || '';
          // Keep non-group handlers
          if (!path.includes('/user-access/groups/')) return true;
          // Keep members/principals and service-accounts sub-routes
          if (path.includes('/principals/') || path.includes('/service-accounts/')) return true;
          // Filter out top-level group handlers (we provide our own)
          return false;
        }),
      ],
    },
    docs: {
      description: {
        component: `
# Edit User Group Journey

Tests the workflow for editing an existing user group.

## Design Reference

| Kebab menu with Edit | Edit form |
|:---:|:---:|
| [![Kebab menu with Edit](/mocks/Edit%20user%20group/Frame%20124.png)](/mocks/Edit%20user%20group/Frame%20124.png) | [![Edit form](/mocks/Edit%20user%20group/Frame%20131.png)](/mocks/Edit%20user%20group/Frame%20131.png) |

| Edit users | Edit service accounts |
|:---:|:---:|
| [![Edit users](/mocks/Edit%20user%20group/Frame%20156.png)](/mocks/Edit%20user%20group/Frame%20156.png) | [![Edit service accounts](/mocks/Edit%20user%20group/Frame%20193.png)](/mocks/Edit%20user%20group/Frame%20193.png) |

## Features
| Feature | Status | API |
|---------|--------|-----|
| Edit from kebab menu | ✅ Implemented | - |
| Edit group name | ✅ Implemented | V1 |
| Edit description | ✅ Implemented | V1 |
| Add/remove users | ✅ Implemented | V1 |
| List service accounts | ✅ Implemented | SSO API |
| Add service accounts to group | ⚠️ GAP | V2 (guessed) |
| Remove service accounts from group | ⚠️ GAP | V2 (guessed) |
| Save changes | ✅ Implemented | V1 |

**Note:** Service account group operations use guessed APIs:
- \`POST /api/rbac/v2/groups/:uuid/service-accounts/\` (add) [guessed V2 API]
- \`DELETE /api/rbac/v2/groups/:uuid/service-accounts/\` (remove) [guessed V2 API]
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
 * Tests the full workflow from kebab menu to saving changes with drawer verification
 */
export const CompleteFlow: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests the complete "Edit user group" workflow:

1. Click kebab menu on a group
2. Select "Edit user group"
3. Modify group description
4. Save changes
5. Verify updated description in table
6. Open drawer to verify all changes

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
    resetMutableState(); // Reset mutable state for test isolation

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, 'Golden girls');

    // ==========================================================================
    // PRE-CONDITION: Verify original state in table
    // ==========================================================================
    const originalDescription = await canvas.findByText(/Classic show members/i);
    expect(originalDescription).toBeInTheDocument();

    // ==========================================================================
    // ACTION: Open edit form from kebab menu
    // ==========================================================================
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    // Click the last kebab (Golden girls)
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const editOption = await within(document.body).findByRole('menuitem', { name: /edit user group/i });
    await user.click(editOption);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD); // Wait for form to fully load

    // Verify we're on the edit form
    await expect(canvas.findByRole('heading', { name: /edit user group/i })).resolves.toBeInTheDocument();

    // ==========================================================================
    // ACTION: Edit description
    // ==========================================================================
    const nameInput = await canvas.findByRole('textbox', { name: /name/i });
    expect(nameInput).toHaveValue('Golden girls');

    const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });
    await user.tripleClick(descriptionInput);
    await user.keyboard('Updated description for Golden girls');
    await delay(TEST_TIMEOUTS.AFTER_CLICK);
    await user.tab();
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // ==========================================================================
    // ACTION: Save changes
    // ==========================================================================
    const submitButton = await canvas.findByRole('button', { name: /submit|save/i });
    expect(submitButton).not.toBeDisabled();
    await user.click(submitButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // ==========================================================================
    // API VERIFICATION
    // ==========================================================================
    expect(updateGroupSpy).toHaveBeenCalledWith(
      'group-golden-girls',
      expect.objectContaining({
        description: 'Updated description for Golden girls',
      }),
    );

    // ==========================================================================
    // POST-CONDITION: Verify we're back on the groups table
    // ==========================================================================
    const groupsTable = await canvas.findByRole('grid', { name: /user groups table/i });
    expect(groupsTable).toBeInTheDocument();

    // ==========================================================================
    // VISUAL VERIFICATION: Verify updated description in table
    // ==========================================================================
    await expect(canvas.findByText(/Updated description/i)).resolves.toBeInTheDocument();

    // ==========================================================================
    // VISUAL VERIFICATION: Open drawer and verify changes
    // ==========================================================================
    // Click on the Golden girls row to open the drawer
    const goldenGirlsRow = await canvas.findByText('Golden girls');
    await user.click(goldenGirlsRow);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Find the drawer panel
    const drawerPanel = document.querySelector('.pf-v6-c-drawer__panel') as HTMLElement | null;
    expect(drawerPanel).toBeInTheDocument();
    const drawerScope = within(drawerPanel!);

    // Verify group name in drawer header
    await expect(drawerScope.findByText('Golden girls')).resolves.toBeInTheDocument();

    // Note: The drawer doesn't display the description, only the group name and tabs

    // Check Users tab in drawer to verify existing members
    const drawerUsersTab = await drawerScope.findByRole('tab', { name: /users/i });
    await user.click(drawerUsersTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    // Verify at least one user is shown (from mock data)
    // Golden girls group has members: bwhite, dzbornak, spetrillo, bdevereaux
    await expect(drawerScope.findByText('bwhite')).resolves.toBeInTheDocument();

    // Check Service accounts tab in drawer
    const drawerServiceAccountsTab = await drawerScope.findByRole('tab', { name: /service accounts/i });
    await user.click(drawerServiceAccountsTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);
  },
};

/**
 * Edit group name
 *
 * Tests changing the group name
 */
export const EditGroupName: Story = {
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

    // Wait for page to load
    await waitForPageToLoad(canvas, 'Golden girls');

    // Open edit for a group
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const editOption = await within(document.body).findByRole('menuitem', { name: /edit user group/i });
    await user.click(editOption);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Change name
    const nameInput = await canvas.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed Group');
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Save
    const submitButton = await canvas.findByRole('button', { name: /submit|save/i });
    await user.click(submitButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

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
3. Move focus away (blur) to trigger validation
4. Validation error appears
5. Cannot save
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    updateGroupSpy.mockClear();
    resetMutableState();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await waitForPageToLoad(canvas, 'Golden girls');

    // Open edit for Golden girls
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const editOption = await within(document.body).findByRole('menuitem', { name: /edit user group/i });
    await user.click(editOption);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD); // Wait for form to load

    // Change name to existing group name
    const nameInput = await canvas.findByRole('textbox', { name: /name/i });
    await user.tripleClick(nameInput);
    await user.keyboard('Admin group'); // Already exists

    // Blur the name field to trigger validation (tab to description)
    await user.tab();
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

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

    // Wait for page to load
    await waitForPageToLoad(canvas, 'Golden girls');

    // Open edit
    const kebabButtons = await canvas.findAllByLabelText(/actions/i);
    await user.click(kebabButtons[kebabButtons.length - 1]);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const editOption = await within(document.body).findByRole('menuitem', { name: /edit user group/i });
    await user.click(editOption);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Make changes
    const nameInput = await canvas.findByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Name');
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Cancel
    const cancelButton = await canvas.findByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify back on groups table
    await expect(canvas.findByText('Golden girls')).resolves.toBeInTheDocument();

    // Verify no API call
    expect(updateGroupSpy).not.toHaveBeenCalled();
  },
};
