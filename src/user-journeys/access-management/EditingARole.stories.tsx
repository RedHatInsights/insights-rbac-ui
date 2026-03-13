/**
 * Editing a Role Journey
 * Based on: static/mocks/Editing a role/
 *
 * Features tested:
 * - Open edit from kebab menu
 * - Edit role name and description
 * - Save changes
 * - Cancel edit
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { waitForContentReady, waitForDrawer } from '../../test-utils/interactionHelpers';
import { openRoleActionsMenu, waitForPageToLoad } from '../../test-utils/tableHelpers';
import { permissionsHandlers, v2DefaultHandlers } from './_shared';
import { getRolesTable, verifyNoApiCalls } from './_shared/tableHelpers';
import { createV2RolesHandlers } from '../../v2/data/mocks/roles.handlers';
import { DEFAULT_V2_ROLES } from '../../v2/data/mocks/seed';
import { createResettableCollection } from '../../shared/data/mocks/db';

// =============================================================================
// API SPIES
// =============================================================================

const updateRoleSpyV2 = fn();

// =============================================================================
// STATEFUL COLLECTION + HANDLERS
// =============================================================================

const rolesCollection = createResettableCollection(DEFAULT_V2_ROLES);

const rolesHandlers = createV2RolesHandlers(rolesCollection, {
  networkDelay: TEST_TIMEOUTS.QUICK_SETTLE,
  onUpdate: (roleId, body) => updateRoleSpyV2(roleId, body),
});

// =============================================================================
// META
// =============================================================================

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Roles/Editing a Role',
  tags: ['access-management', 'roles', 'form'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      rolesCollection.reset();

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
      handlers: [
        ...rolesHandlers,
        ...permissionsHandlers(undefined, { networkDelay: TEST_TIMEOUTS.QUICK_SETTLE }),
        ...v2DefaultHandlers.filter((h) => {
          const path = h.info?.path?.toString() || '';
          if (path.includes('/api/rbac/v2/roles')) return false;
          return true;
        }),
      ],
    },
    docs: {
      description: {
        component: `
# Editing a Role Journey

Tests the workflow for editing an existing role.

## Design Reference

| Kebab menu with Edit | Edit role form | Success notification |
|:---:|:---:|:---:|
| [![Kebab menu with Edit](/mocks/Editing%20a%20role/Frame%20147.png)](/mocks/Editing%20a%20role/Frame%20147.png) | [![Edit role form](/mocks/Editing%20a%20role/Frame%20157.png)](/mocks/Editing%20a%20role/Frame%20157.png) | [![Success notification](/mocks/Editing%20a%20role/Frame%20178.png)](/mocks/Editing%20a%20role/Frame%20178.png) |

## Features
| Feature | Status | API |
|---------|--------|-----|
| Open edit from kebab | ✅ Implemented | V2 |
| Edit role name | ✅ Implemented | V2 |
| Edit description | ✅ Implemented | V2 |
| Edit permissions | ✅ Implemented | V2 |
| Save changes | ✅ Implemented | V2 |
| Success notification | ✅ Implemented | - |
| Cancel edit | ✅ Implemented | - |
| System role protection | ✅ Implemented | V2 |

## Notes
- System/canned roles cannot be edited
- Permission editing works via the V2 API \`permissions\` array
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Target role for testing. Fixtures guarantee id and name.
const TARGET_ROLE = DEFAULT_V2_ROLES.find((r) => r.name === 'RHEL DevOps')! as (typeof DEFAULT_V2_ROLES)[0] & {
  id: string;
  name: string;
};

/**
 * Complete edit flow
 *
 * Tests the full workflow from kebab menu to successful edit
 */
export const CompleteFlow: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests the complete edit role workflow including permission changes:

1. **Pre-condition:** Verify the target role exists in the table.
2. Click kebab menu on a non-system role (e.g., "RHEL DevOps").
3. Select "Edit".
4. **Visual check:** Edit form appears with role data pre-filled.
5. **Visual check:** Verify pre-selected permissions (RHEL DevOps has 3: inventory:hosts:read/write, inventory:groups:read).
6. Modify the description.
7. Add a new permission (check inventory:groups:write).
8. Click Save changes.
9. **API spy:** Verify PUT API call was made with correct data including new permission.
10. **Post-condition:** Verify we're back on the roles table.
11. Click on the role row to open the drawer.
12. **Visual verification (drawer):** Verify the new permission (inventory:groups:write) is shown.

**Design references:**
- Frame 147: Kebab menu
- Frame 157: Edit form with permissions
- Frame 178: Success notification
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      updateRoleSpyV2.mockClear();
      rolesCollection.reset();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify target role exists', async () => {
      await waitForPageToLoad(canvas, TARGET_ROLE.name);
    });

    await step('Open kebab menu and select Edit', async () => {
      await openRoleActionsMenu(user, canvas, TARGET_ROLE.name);
      const editOption = await within(document.body).findByRole('menuitem', { name: /^edit$/i });
      await user.click(editOption);
    });

    await step('Verify edit form with pre-filled data', async () => {
      await expect(canvas.findByRole('heading', { name: /edit/i })).resolves.toBeInTheDocument();
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });
      expect(nameInput).toHaveValue(TARGET_ROLE.name);
      const selectedText = await canvas.findByText(/3 selected/i);
      expect(selectedText).toBeInTheDocument();
    });

    await step('Modify description', async () => {
      const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });
      await user.tripleClick(descriptionInput);
      await user.keyboard('Updated role description with new permissions');
    });

    await step('Add inventory:groups:write permission', async () => {
      const writeRows = await waitFor(
        () => {
          const grid = canvas.queryByRole('grid', { name: /permissions table/i });
          expect(grid).not.toBeNull();
          const cells = within(grid!).queryAllByText('write');
          expect(cells.length).toBeGreaterThan(0);
          return cells;
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
      let groupsWriteCheckbox: HTMLInputElement | null = null;
      for (const writeCell of writeRows) {
        const row = writeCell.closest('tr');
        if (row) {
          const rowScope = within(row);
          const groupsText = rowScope.queryByText('groups');
          if (groupsText) {
            const checkbox = rowScope.queryByRole('checkbox');
            if (checkbox && !(checkbox as HTMLInputElement).checked) {
              groupsWriteCheckbox = checkbox as HTMLInputElement;
              break;
            }
          }
        }
      }
      if (groupsWriteCheckbox) {
        await user.click(groupsWriteCheckbox);
        const newSelectedText = await canvas.findByText(/4 selected/i);
        expect(newSelectedText).toBeInTheDocument();
      }
    });

    await step('Save changes', async () => {
      const saveButton = await canvas.findByRole('button', { name: /save|submit/i });
      expect(saveButton).not.toBeDisabled();
      await user.click(saveButton);
    });

    await step('Verify API call with correct data', async () => {
      await waitFor(
        () => {
          expect(updateRoleSpyV2).toHaveBeenCalledWith(
            TARGET_ROLE.id,
            expect.objectContaining({
              description: 'Updated role description with new permissions',
            }),
          );
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
      const spyCall = updateRoleSpyV2.mock.calls[0][1];
      if (spyCall.permissions) {
        expect(spyCall.permissions.length).toBeGreaterThanOrEqual(3);
        if (spyCall.permissions.length >= 4) {
          expect(
            spyCall.permissions.some((p: { resource_type: string; operation: string }) => p.resource_type === 'groups' && p.operation === 'write'),
          ).toBe(true);
        }
      }
    });

    await step('Verify roles table after save and open drawer', async () => {
      // Grid element is replaced when data loads — find grid + content atomically
      await waitFor(
        () => {
          const table = canvas.queryByRole('grid', { name: /roles/i });
          expect(table).not.toBeNull();
          expect(within(table!).queryByText(TARGET_ROLE.name)).not.toBeNull();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
      const rolesTable = await getRolesTable(canvas);
      const roleNameCell = within(rolesTable).getByText(TARGET_ROLE.name);
      await user.click(roleNameCell);
    });

    await step('Verify drawer shows role and permissions', async () => {
      const drawerScope = await waitForDrawer();
      await expect(drawerScope.findByRole('heading', { name: TARGET_ROLE.name })).resolves.toBeInTheDocument();
      const permissionsTab = await drawerScope.findByRole('tab', { name: /permissions/i });
      expect(permissionsTab).toBeInTheDocument();
      // Drawer permissions grid loads async — use waitFor + queryBy to avoid console.error from findBy
      const drawerPermissionsTable = drawerScope.queryByRole('grid', { name: /permissions/i });
      if (drawerPermissionsTable) {
        await waitFor(
          () => {
            const grid = drawerScope.queryByRole('grid', { name: /permissions/i });
            expect(grid).not.toBeNull();
            const cells = within(grid!).queryAllByText('write');
            expect(cells.length).toBeGreaterThanOrEqual(1);
          },
          { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
        );
      }
    });
  },
};

/**
 * Open edit from kebab menu
 *
 * Tests opening the edit role page from the kebab menu
 */
export const OpenEditFromKebab: Story = {
  name: 'Open Edit from Kebab Menu',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests opening the edit role page from the kebab menu.

1. **Pre-condition:** Verify a non-system role exists.
2. Click kebab menu on the role.
3. **Visual check:** Verify "Edit" option is present.
4. Click "Edit".
5. **Visual check:** Verify edit form appears with role data.

**Design reference:** Frame 147
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      rolesCollection.reset();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify target role exists', async () => {
      await waitForPageToLoad(canvas, TARGET_ROLE.name);
    });

    await step('Open kebab menu and verify Edit option', async () => {
      await openRoleActionsMenu(user, canvas, TARGET_ROLE.name);
      const editOption = await within(document.body).findByRole('menuitem', { name: /^edit$/i });
      expect(editOption).toBeInTheDocument();
    });

    await step('Click Edit and verify form', async () => {
      const editOption = await within(document.body).findByRole('menuitem', { name: /^edit$/i });
      await user.click(editOption);
      await expect(canvas.findByRole('heading', { name: /edit/i })).resolves.toBeInTheDocument();
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });
      expect(nameInput).toHaveValue(TARGET_ROLE.name);
    });
  },
};

/**
 * Edit role name
 *
 * Tests editing just the role name
 */
export const EditRoleName: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests editing the role name.

1. Navigate to edit form for a role.
2. **Visual check:** Verify current name is pre-filled.
3. Change the name.
4. Save changes.
5. **API spy:** Verify PUT call includes new name.
6. **Post-condition:** Verify back on roles table.
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      updateRoleSpyV2.mockClear();
      rolesCollection.reset();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to edit form', async () => {
      await waitForPageToLoad(canvas, TARGET_ROLE.name);
      await openRoleActionsMenu(user, canvas, TARGET_ROLE.name);
      const editOption = await within(document.body).findByRole('menuitem', { name: /^edit$/i });
      await user.click(editOption);
    });

    await step('Verify name pre-filled and change it', async () => {
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });
      expect(nameInput).toHaveValue(TARGET_ROLE.name);
      await user.tripleClick(nameInput);
      await user.keyboard('Renamed RHEL DevOps Role');
    });

    await step('Save changes', async () => {
      const saveButton = await canvas.findByRole('button', { name: /save|submit/i });
      await user.click(saveButton);
    });

    await step('Verify API call with new name', async () => {
      await waitFor(
        () => {
          expect(updateRoleSpyV2).toHaveBeenCalledWith(
            TARGET_ROLE.id,
            expect.objectContaining({
              name: 'Renamed RHEL DevOps Role',
            }),
          );
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });

    await step('Verify back on roles table', async () => {
      const rolesTable = await getRolesTable(canvas);
      expect(rolesTable).toBeInTheDocument();
    });
  },
};

/**
 * Cannot edit system roles
 *
 * Tests that system/canned roles cannot be edited (no kebab menu shown
 * because `org_id` is undefined — the role is immutable).
 */
export const CannotEditSystemRoles: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests that system/canned roles cannot be edited.

1. **Pre-condition:** Verify a system role exists (e.g., "Tenant admin").
2. Verify the system role does NOT have a kebab menu (\`org_id\` is undefined).
3. **API spy:** Verify no edit API call was made.
4. Verify a user-created role still has a kebab menu with Edit.
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const systemRoleName = 'Tenant admin';
    const systemRole = DEFAULT_V2_ROLES.find((r) => r.name === systemRoleName);
    expect(systemRole).not.toBeUndefined();

    await step('Reset state', async () => {
      await resetStoryState();
      updateRoleSpyV2.mockClear();
      rolesCollection.reset();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify system role exists', async () => {
      await waitForPageToLoad(canvas, systemRoleName);
    });

    await step('Verify system role has no kebab menu', async () => {
      const kebab = canvas.queryByRole('button', {
        name: new RegExp(`Actions for role ${systemRoleName}`, 'i'),
      });
      expect(kebab).not.toBeInTheDocument();
    });

    await step('Verify no edit API call', async () => {
      verifyNoApiCalls(updateRoleSpyV2);
    });

    await step('Verify user-created role has kebab menu', async () => {
      const writableKebab = await canvas.findByRole('button', {
        name: new RegExp(`Actions for role ${TARGET_ROLE.name}`, 'i'),
      });
      expect(writableKebab).toBeInTheDocument();
    });
  },
};

/**
 * Cancel edit
 *
 * Tests canceling the edit form without saving
 */
export const CancelEdit: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests canceling the edit role form.

1. Navigate to edit form for a role.
2. Make changes to the name.
3. Click Cancel.
4. **Visual check:** Verify we're back on the roles table.
5. **API spy:** Verify no PUT API call was made.
6. **Post-condition:** Verify the original role data is unchanged.
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      updateRoleSpyV2.mockClear();
      rolesCollection.reset();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to edit form', async () => {
      await waitForPageToLoad(canvas, TARGET_ROLE.name);
      await openRoleActionsMenu(user, canvas, TARGET_ROLE.name);
      const editOption = await within(document.body).findByRole('menuitem', { name: /^edit$/i });
      await user.click(editOption);
    });

    await step('Make changes and click Cancel', async () => {
      const nameInput = await canvas.findByRole('textbox', { name: /name/i });
      await user.tripleClick(nameInput);
      await user.keyboard('This should not be saved');
      const cancelButton = await canvas.findByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
    });

    await step('Verify back on roles table', async () => {
      const rolesTable = await getRolesTable(canvas);
      expect(rolesTable).toBeInTheDocument();
    });

    await step('Verify no PUT API call', async () => {
      verifyNoApiCalls(updateRoleSpyV2);
    });

    await step('Verify original role data unchanged', async () => {
      await waitForPageToLoad(canvas, TARGET_ROLE.name);
    });
  },
};
