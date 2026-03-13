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
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { clearAndType, clickTab, waitForContentReady, waitForDrawer } from '../../test-utils/interactionHelpers';
import { waitForPageToLoad } from '../../test-utils/tableHelpers';
import { createGroupsHandlers, mockGroups, v2DefaultHandlers } from './_shared';
import type { Group } from '../../shared/data/mocks/db';
import { createResettableCollection } from '../../shared/data/mocks/db';

// Named alias for the group under test — avoids index-dependent sort-order bugs
const TARGET_GROUP = mockGroups[4]; // Golden girls
const DUPLICATE_NAME_GROUP = mockGroups[1]; // Admin group — used for duplicate-name validation

// Spy for tracking API calls
const updateGroupSpy = fn();

// =============================================================================
// STATEFUL COLLECTION FOR TEST ISOLATION
// =============================================================================

const groupsCollection = createResettableCollection<Group>(mockGroups);
const editGroupHandlers = createGroupsHandlers(groupsCollection, {
  networkDelay: TEST_TIMEOUTS.QUICK_SETTLE,
  onUpdate: (uuid, body) => updateGroupSpy(uuid, body),
});

const resetMutableState = () => {
  groupsCollection.reset();
};

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Users and Groups/Edit User Group',
  tags: ['access-management', 'user-groups', 'form'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      // Reset mutable state before each story renders to ensure test isolation
      resetMutableState();

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
        ...editGroupHandlers,
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      resetMutableState();
      await resetStoryState();
      updateGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and verify original description', async () => {
      await waitForPageToLoad(canvas, TARGET_GROUP.name);
      const originalDescription = await canvas.findByText(new RegExp(TARGET_GROUP.description, 'i'));
      expect(originalDescription).toBeInTheDocument();
    });

    await step('Open edit form from kebab menu', async () => {
      const kebab = await canvas.findByLabelText(`Actions for group ${TARGET_GROUP.name}`);
      await user.click(kebab);
      const editOption = await within(document.body).findByRole('menuitem', { name: /edit user group/i });
      await user.click(editOption);
      await expect(canvas.findByRole('heading', { name: /edit user group/i })).resolves.toBeInTheDocument();
    });

    await step('Edit description and save', async () => {
      // data-driven-forms populates fields asynchronously after render;
      // on slow CI the route-mount + fetch + form-init chain can exceed 10s
      await waitFor(
        () => {
          const input = canvas.queryByRole('textbox', { name: /^name$/i });
          expect(input).toBeInTheDocument();
          expect(input).toHaveValue(TARGET_GROUP.name);
        },
        { timeout: TEST_TIMEOUTS.POST_MUTATION_REFRESH },
      );
      const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });
      await user.tripleClick(descriptionInput);
      await user.keyboard(`Updated description for ${TARGET_GROUP.name}`);
      await user.tab();
      const submitButton = await canvas.findByRole('button', { name: /submit|save/i });
      expect(submitButton).not.toBeDisabled();
      await user.click(submitButton);
    });

    await step('Verify API call', async () => {
      await waitFor(
        () => {
          expect(updateGroupSpy).toHaveBeenCalledWith(
            TARGET_GROUP.uuid,
            expect.objectContaining({
              description: `Updated description for ${TARGET_GROUP.name}`,
            }),
          );
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });

    await step('Verify table shows updated description', async () => {
      const groupsTable = await canvas.findByRole('grid', { name: /user groups table/i });
      expect(groupsTable).toBeInTheDocument();
      await expect(canvas.findByText(/Updated description/i)).resolves.toBeInTheDocument();
    });

    await step('Open drawer and verify tabs', async () => {
      const goldenGirlsRow = await canvas.findByText(TARGET_GROUP.name);
      await user.click(goldenGirlsRow);
      const drawerScope = await waitForDrawer();
      await expect(drawerScope.findByText(TARGET_GROUP.name)).resolves.toBeInTheDocument();
      await clickTab(user, drawerScope, /users/i);
      await expect(drawerScope.findByText('bwhite')).resolves.toBeInTheDocument();
      await clickTab(user, drawerScope, /service accounts/i);
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      resetMutableState();
      await resetStoryState();
      updateGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and open edit form', async () => {
      await waitForPageToLoad(canvas, TARGET_GROUP.name);
      const kebab = await canvas.findByLabelText(`Actions for group ${TARGET_GROUP.name}`);
      await user.click(kebab);
      const editOption = await within(document.body).findByRole('menuitem', { name: /edit user group/i });
      await user.click(editOption);
    });

    await step('Change name and save', async () => {
      // data-driven-forms populates fields asynchronously after render
      await waitFor(
        () => {
          const input = canvas.queryByRole('textbox', { name: /^name$/i });
          expect(input).toBeInTheDocument();
          expect(input).toHaveValue(TARGET_GROUP.name);
        },
        { timeout: TEST_TIMEOUTS.POST_MUTATION_REFRESH },
      );
      await clearAndType(user, () => canvas.getByRole('textbox', { name: /^name$/i }) as HTMLInputElement, 'Renamed Group');
      const submitButton = await canvas.findByRole('button', { name: /submit|save/i });
      await user.click(submitButton);
    });

    await step('Verify API call with new name', async () => {
      await waitFor(
        () => {
          expect(updateGroupSpy).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              name: 'Renamed Group',
            }),
          );
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });
    const targetGroupName = TARGET_GROUP.name;

    await step('Reset state', async () => {
      resetMutableState();
      await resetStoryState();
      updateGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for table and open edit form', async () => {
      await waitForPageToLoad(canvas, targetGroupName);
      const kebab = await canvas.findByLabelText(`Actions for group ${targetGroupName}`);
      await user.click(kebab);
      const editOption = await within(document.body).findByRole('menuitem', { name: /edit user group/i });
      await user.click(editOption);
    });

    await step('Change name to duplicate and trigger validation', async () => {
      // data-driven-forms populates fields asynchronously after render
      await waitFor(
        () => {
          const input = canvas.queryByRole('textbox', { name: /^name$/i });
          expect(input).toBeInTheDocument();
          expect(input).toHaveValue(targetGroupName);
        },
        { timeout: TEST_TIMEOUTS.POST_MUTATION_REFRESH },
      );
      const nameInput = canvas.getByRole('textbox', { name: /^name$/i });
      await user.tripleClick(nameInput);
      await user.keyboard(DUPLICATE_NAME_GROUP.name);
      await user.tab();
    });

    await step('Verify validation error and save disabled', async () => {
      await expect(canvas.findByText(/already exists|taken/i)).resolves.toBeInTheDocument();
      const submitButton = await canvas.findByRole('button', { name: /submit|save/i });
      expect(submitButton).toBeDisabled();
      expect(updateGroupSpy).not.toHaveBeenCalled();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      resetMutableState();
      await resetStoryState();
      updateGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and open edit form', async () => {
      await waitForPageToLoad(canvas, TARGET_GROUP.name);
      const kebab = await canvas.findByLabelText(`Actions for group ${TARGET_GROUP.name}`);
      await user.click(kebab);
      const editOption = await within(document.body).findByRole('menuitem', { name: /edit user group/i });
      await user.click(editOption);
    });

    await step('Make changes and cancel', async () => {
      // data-driven-forms populates fields asynchronously after render
      await waitFor(
        () => {
          const input = canvas.queryByRole('textbox', { name: /^name$/i });
          expect(input).toBeInTheDocument();
          expect(input).toHaveValue(TARGET_GROUP.name);
        },
        { timeout: TEST_TIMEOUTS.POST_MUTATION_REFRESH },
      );
      await clearAndType(user, () => canvas.getByRole('textbox', { name: /^name$/i }) as HTMLInputElement, 'Changed Name');
      const cancelButton = await canvas.findByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
    });

    await step('Verify returned to table and no API call', async () => {
      await expect(canvas.findByText(TARGET_GROUP.name)).resolves.toBeInTheDocument();
      expect(updateGroupSpy).not.toHaveBeenCalled();
    });
  },
};

/**
 * Users All/Selected Toggle
 *
 * Tests the All/Selected toggle in the Users tab of the edit user group form.
 */
export const UsersAllSelectedToggle: Story = {
  name: 'Users All/Selected Toggle',
  args: {
    initialRoute: `/iam/access-management/users-and-user-groups/edit-group/${TARGET_GROUP.uuid}`,
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the All/Selected toggle in the Users tab of the edit user group form.

**Expected behavior:**
1. Edit form loads with Users tab content
2. Click "Selected" toggle - table shows only selected users (or empty if none)
3. Click "All" toggle - all users shown again
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      resetMutableState();
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for edit form and switch to Users tab', async () => {
      await expect(canvas.findByRole('heading', { name: /edit user group/i })).resolves.toBeInTheDocument();
      await waitForPageToLoad(canvas, 'bwhite');
      await clickTab(user, canvas, /users/i);
    });

    await step('Toggle Selected then All and verify', async () => {
      const allButton = await canvas.findByRole('button', { name: /^all$/i });
      const selectedButton = await canvas.findByRole('button', { name: /^selected/i });
      await user.click(selectedButton);
      expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
      await user.click(allButton);
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
      await expect(canvas.findByText('bwhite')).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Service Accounts All/Selected Toggle
 *
 * Tests the All/Selected toggle in the Service Accounts tab of the edit user group form.
 */
export const ServiceAccountsAllSelectedToggle: Story = {
  name: 'Service Accounts All/Selected Toggle',
  args: {
    initialRoute: `/iam/access-management/users-and-user-groups/edit-group/${TARGET_GROUP.uuid}`,
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the All/Selected toggle in the Service Accounts tab of the edit user group form.

**Expected behavior:**
1. Edit form loads
2. Click Service Accounts tab
3. Click "Selected" toggle
4. Click "All" toggle back
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      resetMutableState();
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for edit form and switch to Service Accounts tab', async () => {
      await expect(canvas.findByRole('heading', { name: /edit user group/i })).resolves.toBeInTheDocument();
      await clickTab(user, canvas, /service accounts/i);
    });

    await step('Toggle Selected then All and verify', async () => {
      const allButton = await canvas.findByRole('button', { name: /^all$/i });
      const selectedButton = await canvas.findByRole('button', { name: /^selected/i });
      await user.click(selectedButton);
      expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
      await user.click(allButton);
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });
  },
};
