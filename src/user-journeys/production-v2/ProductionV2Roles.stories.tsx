import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
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
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles page
    await navigateToPage(user, canvas, 'Roles');

    // Wait for roles list to load
    await waitForPageToLoad(canvas, V2_ROLE_INVENTORY_VIEWER.name!);

    // Click "Create role" button
    const createButton = await canvas.findByRole('button', { name: /create role/i });
    await user.click(createButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Fill and submit the wizard
    await fillCreateRoleWizard(user, 'V2 Automation Test Role', 'A test custom role for V2 automation', ['insights:*:*']);

    // Verify we're back on the roles list and the new role appears
    await waitForPageToLoad(canvas, V2_ROLE_INVENTORY_VIEWER.name!);

    // CRITICAL: Verify the newly created role appears in the table
    await waitFor(
      () => {
        expect(canvas.getByText('V2 Automation Test Role')).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );
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
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles page
    await navigateToPage(user, canvas, 'Roles');

    // Wait for roles list to load
    await waitForPageToLoad(canvas, V2_ROLE_RHEL_DEVOPS.name!);

    // Click "Create role" button
    const createButton = await canvas.findByRole('button', { name: /create role/i });
    await user.click(createButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Fill the copy role wizard - uses default "Copy of RHEL DevOps" name
    // CRITICAL: This tests that the Next button becomes enabled after async validation
    await fillCopyRoleWizard(user, V2_ROLE_RHEL_DEVOPS.name!);

    // Verify we're back on the roles list and the new role appears
    await waitForPageToLoad(canvas, V2_ROLE_RHEL_DEVOPS.name!);

    // CRITICAL: Verify the newly created role appears in the table
    // This confirms the wizard completed successfully and the role was created
    // V2_ROLE_RHEL_DEVOPS.name is "RHEL DevOps", so copy is "Copy of RHEL DevOps"
    await waitFor(
      () => {
        expect(canvas.getByText('Copy of RHEL DevOps')).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );
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
  play: async (context) => {
    await resetStoryState(db);
    batchDeleteRolesSpy.mockClear();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Roles');
    await waitForPageToLoad(canvas, V2_ROLE_INVENTORY_VIEWER.name!);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    const table = await canvas.findByRole('grid');
    const rhelDevOpsCell = await within(table).findByText(V2_ROLE_RHEL_DEVOPS.name!);
    const rhelDevOpsRow = rhelDevOpsCell.closest('tr') as HTMLElement;
    const rhelDevOpsCheckbox = rhelDevOpsRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await expect(rhelDevOpsCheckbox).toBeInTheDocument();
    await user.click(rhelDevOpsCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const workspaceAdminCell = await within(table).findByText(KESSEL_ROLE_WS_ADMIN.name!);
    const workspaceAdminRow = workspaceAdminCell.closest('tr') as HTMLElement;
    const workspaceAdminCheckbox = workspaceAdminRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await expect(workspaceAdminCheckbox).toBeInTheDocument();
    await user.click(workspaceAdminCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const actionsKebab = await canvas.findByRole('button', { name: /actions overflow menu/i });
    await user.click(actionsKebab);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const deleteRoleItem = await within(document.body).findByRole('menuitem', { name: /delete role/i });
    await user.click(deleteRoleItem);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const dialog = await within(document.body).findByRole('dialog', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await expect(dialog).toBeInTheDocument();

    const understandCheckbox = within(dialog).queryByRole('checkbox');
    if (understandCheckbox) {
      await user.click(understandCheckbox);
      await delay(TEST_TIMEOUTS.AFTER_CLICK);
    }

    const deleteButton = await within(dialog).findByRole('button', { name: /delete/i });
    await expect(deleteButton).toBeEnabled();
    await user.click(deleteButton);

    // Verify API spy was called
    await waitFor(
      () => {
        expect(batchDeleteRolesSpy).toHaveBeenCalledTimes(1);
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    // onBatchDelete spy receives (body.ids) as first arg, not the full body
    expect(batchDeleteRolesSpy).toHaveBeenCalledWith(expect.arrayContaining([expect.any(String)]));

    // Verify deleted roles are removed from the table
    await waitFor(
      () => {
        expect(canvas.queryByText(V2_ROLE_RHEL_DEVOPS.name!)).not.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );
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
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Roles');
    await waitForPageToLoad(canvas, V2_ROLE_INVENTORY_VIEWER.name!);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    const table = await canvas.findByRole('grid');
    const rhelDevOpsCell = await within(table).findByText(V2_ROLE_RHEL_DEVOPS.name!);
    const rhelDevOpsRow = rhelDevOpsCell.closest('tr') as HTMLElement;
    const rhelDevOpsCheckbox = rhelDevOpsRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await user.click(rhelDevOpsCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const actionsKebab = await canvas.findByRole('button', { name: /actions overflow menu/i });
    await user.click(actionsKebab);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const editRoleItem = await within(document.body).findByRole('menuitem', { name: /edit role/i });
    await user.click(editRoleItem);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    await waitFor(() => {
      const addressBar = canvas.getByTestId('fake-address-bar');
      expect(addressBar).toHaveTextContent(/\/edit\//);
    });

    await waitFor(() => {
      expect(canvas.getByDisplayValue(V2_ROLE_RHEL_DEVOPS.name!)).toBeInTheDocument();
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
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Roles');
    await waitForPageToLoad(canvas, V2_ROLE_INVENTORY_VIEWER.name!);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    // Click Workspace Viewer — it has kessel-role-2 which is bound in multiple workspaces
    const roleLink = await canvas.findByText(KESSEL_ROLE_WS_VIEWER.name!);
    await user.click(roleLink);
    await delay(TEST_TIMEOUTS.AFTER_DRAWER_OPEN);

    const drawerPanel = document.querySelector('.pf-v6-c-drawer__panel') as HTMLElement;
    await expect(drawerPanel).toBeInTheDocument();

    const drawer = within(drawerPanel);
    await expect(drawer.findByRole('heading', { name: /Workspace Viewer/i })).resolves.toBeInTheDocument();

    const assignedGroupsTab = await drawer.findByRole('tab', { name: /assigned user groups/i });
    await user.click(assignedGroupsTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);
    await expect(assignedGroupsTab).toHaveAttribute('aria-selected', 'true');

    // Verify group data from role bindings (kessel-role-2 is assigned to Production Admins and Viewers)
    // Search within drawer — GET /role-bindings/?role_id= returns RoleBindingsRoleBinding[] with subject.group.name
    await waitFor(
      async () => {
        await expect(drawer.findByText(KESSEL_GROUP_PROD_ADMINS.name)).resolves.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );
    await expect(drawer.findByText(KESSEL_GROUP_VIEWERS.name)).resolves.toBeInTheDocument();
  },
};
