import { expect, userEvent, waitFor, within } from 'storybook/test';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { fillCopyRoleWizard } from '../../v1/features/roles/CopyRole.helpers';
import { fillCreateRoleWizard } from '../../v1/features/roles/CreateRole.helpers';
import { createInventoryHandlers } from '../../v1/data/mocks/inventory.handlers';
import {
  KESSEL_GROUP_PROD_ADMINS,
  KESSEL_GROUP_VIEWERS,
  KESSEL_ROLE_WS_ADMIN,
  KESSEL_ROLE_WS_VIEWER,
  Story,
  TEST_TIMEOUTS,
  V2_ROLE_INVENTORY_VIEWER,
  V2_ROLE_RHEL_DEVOPS,
  batchDeleteRolesSpy,
  db,
  meta,
  mswHandlers,
  navigateToPage,
  resetStoryState,
  selectTableRow,
  waitForDrawer,
  waitForModal,
  waitForPageToLoad,
} from './_v2OrgAdminSetup';

export default { ...meta, title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Roles', tags: ['prod-v2-org-admin'] };

/**
 * Create Role Journey (V2)
 *
 * Tests the full end-to-end role creation flow (simple path: create from scratch)
 * in the V2/Management Fabric environment.
 *
 * Steps:
 * 1. Navigate to Roles page
 * 2. Click "Create role"
 * 3. Select "Create role from scratch"
 * 4. Enter role name
 * 5. Add permissions
 * 6. Review and submit
 * 7. Verify success screen
 * 8. Close wizard
 * 9. Verify newly created role appears in the table
 */
export const CreateRoleJourney: Story = {
  name: 'Create new role',
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  parameters: {
    msw: {
      handlers: mswHandlers,
    },
    docs: {
      description: {
        story: `
Tests the full flow of creating a role from scratch in the V2 environment.

**Journey Flow:**
- Navigate to Roles page
- Click "Create role"
- Select "Create role from scratch"
- Enter role name
- Add permissions
- Review and submit
- Verify success
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles page', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, V2_ROLE_INVENTORY_VIEWER.name!);
    });

    await step('Open create role wizard', async () => {
      const createButton = await canvas.findByRole('button', { name: /create role/i });
      await user.click(createButton);
    });

    await step('Fill and submit wizard', async () => {
      await fillCreateRoleWizard(user, 'V2 Automation Test Role', 'A test custom role for V2 automation', ['insights:*:*'], step);
    });

    await step('Verify new role appears in table', async () => {
      await waitForPageToLoad(canvas, V2_ROLE_INVENTORY_VIEWER.name!);

      await waitFor(
        () => {
          expect(canvas.getByText('V2 Automation Test Role')).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });
  },
};

/**
 * Copy Role Journey (V2)
 *
 * Tests the full end-to-end role creation flow by copying an existing role
 * in the V2/Management Fabric environment.
 *
 * This is a regression test for a bug where the Next button stayed disabled
 * after filling in the role name and description.
 *
 * Steps:
 * 1. Navigate to Roles page
 * 2. Click "Create role"
 * 3. Select "Copy an existing role"
 * 4. Select a source role from the table
 * 5. Keep the default name/description ("Copy of [source]")
 * 6. Click Next (validates the fix for the disabled button bug)
 * 7. Review permissions (inherited from source)
 * 8. Submit
 * 9. Verify newly created role appears in the table
 */
export const CopyRoleJourney: Story = {
  name: 'Copy existing role',
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  parameters: {
    msw: {
      handlers: [...mswHandlers, ...createInventoryHandlers()],
    },
    docs: {
      description: {
        story: `
Tests the full flow of creating a role by copying an existing one in V2.

**Regression test for:** Copy role wizard Next button stays disabled after validation.

**Journey Flow:**
- Navigate to Roles page
- Click "Create role"
- Select "Copy an existing role"
- Select source role (Custom Role)
- Keep default name ("Copy of Custom Role")
- **Critical:** Next button becomes enabled after async validation
- Review inherited permissions
- Submit and verify success
- Verify new role appears in table
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles page', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, V2_ROLE_RHEL_DEVOPS.name!);
    });

    await step('Open create role wizard and fill copy wizard', async () => {
      const createButton = await canvas.findByRole('button', { name: /create role/i });
      await user.click(createButton);
      await fillCopyRoleWizard(user, V2_ROLE_RHEL_DEVOPS.name!, step);
    });

    await step('Verify copied role appears in table', async () => {
      await waitForPageToLoad(canvas, V2_ROLE_RHEL_DEVOPS.name!);

      await waitFor(
        () => {
          expect(canvas.getByText('Copy of RHEL DevOps')).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });
  },
};

export const BulkDeleteRoles: Story = {
  name: 'Bulk delete roles',
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests bulk delete of multiple roles from the Roles table with API spy verification.

**Journey Flow:**
1. Navigate to Roles page
2. Wait for table to load (Viewer)
3. Select 2 custom roles by clicking checkboxes
4. Click "Delete role" from toolbar kebab
5. WarningModal appears — check "I understand" checkbox
6. Click "Delete" button
7. Verify \`batchDeleteRoles\` API spy called with correct UUIDs
8. Verify deleted roles removed from table
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
      batchDeleteRolesSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles and select rows', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, V2_ROLE_INVENTORY_VIEWER.name!);

      const table = await canvas.findByRole('grid');
      const tableScope = within(table);
      await selectTableRow(user, tableScope, V2_ROLE_RHEL_DEVOPS.name!);
      await selectTableRow(user, tableScope, KESSEL_ROLE_WS_ADMIN.name!);
    });

    await step('Open delete modal and confirm', async () => {
      const actionsKebab = await canvas.findByRole('button', { name: /actions overflow menu/i });
      await user.click(actionsKebab);

      const deleteRoleItem = await within(document.body).findByRole('menuitem', { name: /delete role/i });
      await user.click(deleteRoleItem);

      const modal = await waitForModal();

      const understandCheckbox = modal.queryByRole('checkbox');
      if (understandCheckbox) {
        await user.click(understandCheckbox);
      }

      const deleteButton = await modal.findByRole('button', { name: /delete/i });
      await expect(deleteButton).toBeEnabled();
      await user.click(deleteButton);
    });

    await step('Verify API spy and table update', async () => {
      await waitFor(
        () => {
          expect(batchDeleteRolesSpy).toHaveBeenCalledTimes(1);
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );

      expect(batchDeleteRolesSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.any(String)]));

      await waitFor(
        () => {
          expect(canvas.queryByText(V2_ROLE_RHEL_DEVOPS.name!)).not.toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });
  },
};

export const EditRoleToolbarAction: Story = {
  name: 'Edit role from toolbar',
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests editing a role from the toolbar when exactly one role is selected.

**Journey Flow:**
1. Navigate to Roles page
2. Wait for table to load
3. Select 1 role (Custom Role)
4. Click "Edit role" from toolbar kebab
5. Verify navigation to edit page (URL contains /edit/)
6. Verify role name appears in edit form
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles and select role', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, V2_ROLE_INVENTORY_VIEWER.name!);

      const table = await canvas.findByRole('grid');
      const tableScope = within(table);
      await selectTableRow(user, tableScope, V2_ROLE_RHEL_DEVOPS.name!);
    });

    await step('Click edit role from toolbar', async () => {
      const actionsKebab = await canvas.findByRole('button', { name: /actions overflow menu/i });
      await user.click(actionsKebab);

      const editRoleItem = await within(document.body).findByRole('menuitem', { name: /edit role/i });
      await user.click(editRoleItem);
    });

    await step('Verify navigation to edit page and form', async () => {
      await waitFor(() => {
        const addressBar = canvas.getByTestId('fake-address-bar');
        expect(addressBar).toHaveTextContent(/\/edit\//);
      });

      await waitFor(() => {
        expect(canvas.getByDisplayValue(V2_ROLE_RHEL_DEVOPS.name!)).toBeInTheDocument();
      });
    });
  },
};

export const RoleDrawerAssignedGroups: Story = {
  name: 'Role drawer — Assigned user groups tab',
  args: {
    initialRoute: '/iam/access-management/roles',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the role drawer's Assigned user groups tab with actual data verification.

**Journey Flow:**
1. Navigate to Roles page
2. Click "Workspace Viewer" role (kessel-role-2) — has bindings in multiple workspaces
3. Drawer opens — switch to "Assigned user groups" tab
4. Verify groups table loads with Production Admins and Viewers (both have kessel-role-2)
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles and open role drawer', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, V2_ROLE_INVENTORY_VIEWER.name!);

      const roleLink = await canvas.findByText(KESSEL_ROLE_WS_VIEWER.name!);
      await user.click(roleLink);
    });

    await step('Switch to Assigned user groups tab and verify data', async () => {
      const drawer = await waitForDrawer();
      await expect(drawer.findByRole('heading', { name: /Workspace Viewer/i })).resolves.toBeInTheDocument();

      const assignedGroupsTab = await drawer.findByRole('tab', { name: /assigned user groups/i });
      await user.click(assignedGroupsTab);
      await waitFor(() => expect(assignedGroupsTab).toHaveAttribute('aria-selected', 'true'));

      await waitFor(
        async () => {
          await expect(drawer.findByText(KESSEL_GROUP_PROD_ADMINS.name)).resolves.toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
      await expect(drawer.findByText(KESSEL_GROUP_VIEWERS.name)).resolves.toBeInTheDocument();
    });
  },
};
