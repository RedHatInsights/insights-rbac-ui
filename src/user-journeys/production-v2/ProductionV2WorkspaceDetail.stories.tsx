import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
import {
  KESSEL_GROUP_DEV_TEAM,
  KESSEL_GROUP_MARKETING,
  KESSEL_GROUP_PROD_ADMINS,
  KESSEL_GROUP_VIEWERS,
  KESSEL_PROD_ADMINS_MEMBERS,
  KESSEL_ROLE_WS_ADMIN,
  KESSEL_ROLE_WS_EDITOR,
  KESSEL_ROLE_WS_VIEWER,
  KESSEL_VIEWERS_MEMBERS,
  Story,
  TEST_TIMEOUTS,
  WS_DEFAULT,
  WS_ROOT,
  batchCreateRoleBindingsSpy,
  db,
  expandWorkspaceRow,
  meta,
  navigateToPage,
  navigateToProductionWorkspaceDetail,
  resetStoryState,
  updateRoleBindingsSpy,
  waitForPageToLoad,
} from './_v2OrgAdminSetup';

export default {
  ...meta,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Workspaces/Detail',
  tags: ['prod-v2-org-admin'],
};

export const ViewWorkspaceDetailWithRoles: Story = {
  name: 'View workspace detail with Roles tab',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## View Workspace Detail with Roles Tab

Tests workspace detail pages with the Roles tab, including group drawer and parent workspace inheritance.

### Journey Flow
1. Navigate to **Workspaces**, expand hierarchy, click **Production** link
2. Verify detail page loads with "Roles assigned in this workspace" sub-tab
3. Verify **Production Admins** and **Viewers** groups in the table; **Development Team** is absent
4. Click **Production Admins** → drawer opens with Roles tab (Workspace Administrator, Workspace Viewer)
5. Switch to Users tab in drawer (john.doe, Jane, Wilson)
6. Switch to "Roles assigned in parent workspaces" sub-tab — drawer closes
7. Verify **Viewers** inherited from root; **Production Admins** absent
8. Click **Viewers** → drawer shows Workspace Viewer role and viewer.user member

### Design References

<img src="/mocks/workspaces/Workspace details.png" alt="Workspace detail page" width="400" />
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, WS_ROOT.name);

    await expandWorkspaceRow(user, canvas, WS_ROOT.name);
    await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

    const productionLink = await canvas.findByRole('link', { name: /^production$/i });
    await user.click(productionLink);

    await waitFor(async () => {
      await expect(canvas.findByText(/roles assigned in this workspace/i)).resolves.toBeInTheDocument();
    });

    const assetsTab = await canvas.findByRole('tab', { name: /^assets$/i });
    expect(assetsTab).toBeInTheDocument();

    await canvas.findByText(/roles assigned in this workspace/i);
    await canvas.findByText(/roles assigned in parent workspaces/i);

    await canvas.findByLabelText('Role Assignments Table', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    await waitFor(
      async () => {
        const loadingElements = canvas.queryAllByText(/loading/i);
        const hasData = canvas.queryByText(KESSEL_GROUP_PROD_ADMINS.name) || canvas.queryByText(KESSEL_GROUP_VIEWERS.name);
        expect(loadingElements.length === 0 || hasData).toBe(true);
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name);
    await canvas.findByText(KESSEL_GROUP_VIEWERS.name);
    expect(canvas.queryByText(KESSEL_GROUP_DEV_TEAM.name)).not.toBeInTheDocument();

    const productionAdminsText = await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name);
    await user.click(productionAdminsText);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await delay(TEST_TIMEOUTS.AFTER_CLICK);
    const drawerPanel = document.querySelector('.pf-v6-c-drawer__panel') as HTMLElement;
    expect(drawerPanel).toBeInTheDocument();
    const drawer = within(drawerPanel);

    await drawer.findByRole('heading', { name: KESSEL_GROUP_PROD_ADMINS.name });

    // Workspace context → drawer should show workspace-specific action buttons
    await expect(drawer.findByRole('button', { name: /edit access for this workspace/i })).resolves.toBeInTheDocument();

    const rolesTab = await drawer.findByRole('tab', { name: /^roles$/i });
    const usersTab = await drawer.findByRole('tab', { name: /^users$/i });
    expect(rolesTab).toBeInTheDocument();
    expect(usersTab).toBeInTheDocument();

    await drawer.findByText(KESSEL_ROLE_WS_ADMIN.name!);
    await drawer.findByText(KESSEL_ROLE_WS_VIEWER.name!);

    await user.click(usersTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await drawer.findByText(KESSEL_PROD_ADMINS_MEMBERS[0].username);
    await drawer.findByText(KESSEL_PROD_ADMINS_MEMBERS[1].first_name!);
    await drawer.findByText(KESSEL_PROD_ADMINS_MEMBERS[2].last_name!);

    const parentWorkspacesTab = await canvas.findByRole('tab', { name: /roles assigned in parent workspaces/i });
    await user.click(parentWorkspacesTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    const drawerAfterSwitch = document.querySelector('.pf-v6-c-drawer__panel');
    expect(drawerAfterSwitch).not.toBeInTheDocument();

    const viewersText = await canvas.findByText(KESSEL_GROUP_VIEWERS.name);
    expect(canvas.queryByText(KESSEL_GROUP_PROD_ADMINS.name)).not.toBeInTheDocument();

    await user.click(viewersText);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    const viewersDrawerPanel = document.querySelector('.pf-v6-c-drawer__panel') as HTMLElement;
    expect(viewersDrawerPanel).toBeInTheDocument();
    const viewersDrawer = within(viewersDrawerPanel);

    await viewersDrawer.findByRole('heading', { name: KESSEL_GROUP_VIEWERS.name });

    const viewersRolesTab = await viewersDrawer.findByRole('tab', { name: /^roles$/i });
    const viewersUsersTab = await viewersDrawer.findByRole('tab', { name: /^users$/i });
    expect(viewersRolesTab).toBeInTheDocument();
    expect(viewersUsersTab).toBeInTheDocument();

    await viewersDrawer.findByText(KESSEL_ROLE_WS_VIEWER.name!);

    await user.click(viewersUsersTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await viewersDrawer.findByText(KESSEL_VIEWERS_MEMBERS[0].username);
    await viewersDrawer.findByText(KESSEL_VIEWERS_MEMBERS[0].first_name!);
    await viewersDrawer.findByText(KESSEL_VIEWERS_MEMBERS[0].last_name!);
  },
};

// ---------------------------------------------------------------------------
// Role bindings write stories (consolidated from M4)
// ---------------------------------------------------------------------------

export const GrantAccessWizard: Story = {
  name: 'Grant access wizard',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Grant Access Wizard

End-to-end flow for granting access to a workspace via the 3-step wizard.

### Journey Flow
1. Navigate to **Workspaces** → expand hierarchy → click **Production**
2. Click **Grant access** button
3. **Step 1 — Select user groups**: Select "Development Team"
4. Click **Next**
5. **Step 2 — Select roles**: Select "Workspace Editor"
6. Click **Next**
7. **Step 3 — Review**: Verify selected groups and roles
8. Click **Submit**
9. Verify \`batchCreateRoleBindings\` API spy called with group-2 and a role

### API Verification
- \`batchCreateRoleBindingsSpy\` asserts the request contains group-2 (Development Team) as subject

### Design References

<img src="/mocks/workspaces/Grant access.png" alt="Grant Access Wizard" width="400" />
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    batchCreateRoleBindingsSpy.mockClear();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToProductionWorkspaceDetail(user, canvas);

    const grantAccessButton = await canvas.findByRole('button', { name: /grant access/i });
    await expect(grantAccessButton).toBeEnabled();
    await user.click(grantAccessButton);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    const body = within(document.body);
    await body.findByText(/grant access in workspace/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    await waitFor(
      async () => {
        await expect(body.findByText(KESSEL_GROUP_DEV_TEAM.name)).resolves.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    const devTeamText = await body.findByText(KESSEL_GROUP_DEV_TEAM.name);
    const devTeamRow = devTeamText.closest('tr') as HTMLElement;
    const devTeamCheckbox = devTeamRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await user.click(devTeamCheckbox);
    await delay(TEST_TIMEOUTS.QUICK_SETTLE);

    const wizardDialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const wizardScope = within(wizardDialog);
    const nextButton = await wizardScope.findByRole('button', { name: /^next$/i });
    await user.click(nextButton);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    await waitFor(
      async () => {
        await expect(body.findByText(KESSEL_ROLE_WS_EDITOR.name!)).resolves.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    const editorText = await body.findByText(KESSEL_ROLE_WS_EDITOR.name!);
    const editorRow = editorText.closest('tr') as HTMLElement;
    const editorCheckbox = editorRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await user.click(editorCheckbox);
    await delay(TEST_TIMEOUTS.QUICK_SETTLE);

    const nextButton2 = within(document.querySelector('[role="dialog"]') as HTMLElement).getByRole('button', { name: /^next$/i });
    await user.click(nextButton2);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    await waitFor(
      async () => {
        await expect(body.findByText(KESSEL_GROUP_DEV_TEAM.name)).resolves.toBeInTheDocument();
        await expect(body.findByText(KESSEL_ROLE_WS_EDITOR.name!)).resolves.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    const submitButton = await body.findByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await delay(TEST_TIMEOUTS.LONG_OPERATION);

    await waitFor(() => {
      const addressBar = canvas.getByTestId('fake-address-bar');
      expect(addressBar).toHaveTextContent(/workspaces/i);
    });

    expect(batchCreateRoleBindingsSpy).toHaveBeenCalledTimes(1);
    expect(batchCreateRoleBindingsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requests: expect.arrayContaining([
          expect.objectContaining({
            subject: expect.objectContaining({ id: 'group-2', type: 'group' }),
            role: expect.objectContaining({ id: expect.any(String) }),
            resource: expect.objectContaining({ type: 'workspace' }),
          }),
        ]),
      }),
    );
  },
};

export const RemoveGroupFromWorkspace: Story = {
  name: 'Remove group from workspace',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Remove Group from Workspace

End-to-end flow for removing a group's access via the kebab menu.

### Journey Flow
1. Navigate to **Production** workspace detail
2. Verify **Production Admins** and **Viewers** are present
3. Open **Viewers** row kebab → **Remove from workspace**
4. Confirmation modal appears — click **Remove from workspace**
5. Verify \`updateRoleBindings\` API spy called with empty roles array (removal)

### API Verification
- \`updateRoleBindingsSpy\` asserts the request body contains \`{ roles: [] }\`
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    updateRoleBindingsSpy.mockClear();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToProductionWorkspaceDetail(user, canvas);

    await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name);
    await canvas.findByText(KESSEL_GROUP_VIEWERS.name);

    const viewersText = await canvas.findByText(KESSEL_GROUP_VIEWERS.name);
    const viewersRow = viewersText.closest('tr') as HTMLElement;
    const rowScope = within(viewersRow);

    const kebabButton = await rowScope.findByLabelText(/actions for viewers/i);
    await user.click(kebabButton);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const body = within(document.body);
    const removeItem = await body.findByText(/remove from workspace/i);
    await user.click(removeItem);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await waitFor(
      async () => {
        const dialog = body.queryByRole('dialog');
        await expect(dialog).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    const modal = document.querySelector('[role="dialog"]') as HTMLElement;
    const modalScope = within(modal);
    const confirmButton = await modalScope.findByRole('button', { name: /remove from workspace/i });
    await user.click(confirmButton);

    await waitFor(
      () => {
        expect(body.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    await delay(TEST_TIMEOUTS.LONG_OPERATION);

    expect(updateRoleBindingsSpy).toHaveBeenCalledTimes(1);
    expect(updateRoleBindingsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceId: expect.any(String),
        subjectId: expect.any(String),
        body: expect.objectContaining({ roles: [] }),
      }),
    );
  },
};

export const GrantAccessSingleGroupRole: Story = {
  name: 'Grant access (single group + role)',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Grant Access — Single Group + Role

A lighter variation of the Grant Access wizard with one group and one role.

### Journey Flow
1. Navigate to **Production** workspace detail
2. Click **Grant access**
3. Select **Marketing Team** (group-4)
4. **Next** → select **Workspace Viewer**
5. **Next** (review) → **Submit**
6. Verify \`batchCreateRoleBindings\` API spy called with group-4

### API Verification
- \`batchCreateRoleBindingsSpy\` asserts the request contains group-4 (Marketing Team)

### Design References

<img src="/mocks/workspaces/Grant access.png" alt="Grant Access Wizard" width="400" />
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    batchCreateRoleBindingsSpy.mockClear();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToProductionWorkspaceDetail(user, canvas);

    const grantAccessButton = await canvas.findByRole('button', { name: /grant access/i });
    await user.click(grantAccessButton);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    const body = within(document.body);
    await body.findByText(/grant access in workspace/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    // Wait for groups table to load (Marketing Team from defaultKesselGroups)
    const marketingText = await body.findByText(KESSEL_GROUP_MARKETING.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    const marketingRow = marketingText.closest('tr') as HTMLElement;
    const marketingCheckbox = marketingRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await user.click(marketingCheckbox);
    await delay(TEST_TIMEOUTS.QUICK_SETTLE);

    const wizardDialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const wizardScopeInner = within(wizardDialog);
    const nextButton = await wizardScopeInner.findByRole('button', { name: /^next$/i });
    await user.click(nextButton);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    // "Workspace Viewer" is on page 2 of the paginated roles table — filter first
    const roleFilterInput = await body.findByPlaceholderText(/filter by name/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await user.clear(roleFilterInput);
    await user.type(roleFilterInput, KESSEL_ROLE_WS_VIEWER.name!);
    await delay(TEST_TIMEOUTS.QUICK_SETTLE);

    // After filtering, the filter chip also contains the role name text.
    // Select the checkbox in the table body row directly.
    await waitFor(
      () => {
        const rows = document.querySelectorAll('[role="dialog"] tbody tr');
        if (rows.length === 0) throw new Error('No table rows found');
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );
    const viewerRow = document.querySelector('[role="dialog"] tbody tr') as HTMLElement;
    const viewerCheckbox = viewerRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await user.click(viewerCheckbox);
    await delay(TEST_TIMEOUTS.QUICK_SETTLE);

    const nextButton2 = within(document.querySelector('[role="dialog"]') as HTMLElement).getByRole('button', { name: /^next$/i });
    await user.click(nextButton2);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    await body.findByText(KESSEL_GROUP_MARKETING.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await body.findByText(KESSEL_ROLE_WS_VIEWER.name!, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    const submitButton = await body.findByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await delay(TEST_TIMEOUTS.LONG_OPERATION);

    await waitFor(() => {
      const addressBar = canvas.getByTestId('fake-address-bar');
      expect(addressBar).toHaveTextContent(/workspaces/i);
    });

    expect(batchCreateRoleBindingsSpy).toHaveBeenCalledTimes(1);
    expect(batchCreateRoleBindingsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requests: expect.arrayContaining([
          expect.objectContaining({
            subject: expect.objectContaining({ id: 'group-4', type: 'group' }),
            role: expect.objectContaining({ id: expect.any(String) }),
            resource: expect.objectContaining({ type: 'workspace' }),
          }),
        ]),
      }),
    );
  },
};

export const EditRoleAccess: Story = {
  tags: ['test-skip'],
  name: 'Edit role access',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Edit Role Access (test-skip — PatternFly ToolbarFilter bug)

Complete flow for editing role access via the RoleAccessModal.

### Journey Flow
1. Navigate to **Production** workspace detail
2. Click **Production Admins** → drawer opens
3. Click **Edit access for this workspace** → RoleAccessModal opens
4. Verify Workspace Administrator and Workspace Viewer are pre-selected
5. Deselect Workspace Viewer
6. Click **Update** → modal closes

> **Skipped**: PatternFly ToolbarFilter bug — \`Cannot read properties of null (reading 'firstElementChild')\` in DataViewCheckboxFilter.

### Design References

<img src="/mocks/workspaces/Edit access from role binding.png" alt="Edit Role Access" width="400" />
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToProductionWorkspaceDetail(user, canvas);

    const productionAdminsText = await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name);
    await user.click(productionAdminsText);
    await delay(TEST_TIMEOUTS.AFTER_DRAWER_OPEN);

    const drawerPanel = document.querySelector('.pf-v6-c-drawer__panel') as HTMLElement;
    await expect(drawerPanel).toBeInTheDocument();
    const drawer = within(drawerPanel);

    await drawer.findByRole('heading', { name: KESSEL_GROUP_PROD_ADMINS.name });

    const editAccessButton = await drawer.findByRole('button', { name: /edit access for this workspace/i });
    await expect(editAccessButton).toBeInTheDocument();
    await user.click(editAccessButton);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    const body = within(document.body);
    const dialog = await body.findByRole('dialog', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await expect(dialog).toBeInTheDocument();

    await expect(body.findByText(/edit access/i)).resolves.toBeInTheDocument();

    await waitFor(
      async () => {
        await expect(body.findByText(KESSEL_ROLE_WS_ADMIN.name!)).resolves.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    const modalScope = within(dialog);
    const table = await modalScope.findByRole('grid', { name: /roles selection table/i });
    const tableScope = within(table);

    const adminRow = (await tableScope.findByText(KESSEL_ROLE_WS_ADMIN.name!)).closest('tr') as HTMLElement;
    const adminCheckbox = adminRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await expect(adminCheckbox).toBeInTheDocument();
    await expect(adminCheckbox.checked).toBe(true);

    const viewerRow = (await tableScope.findByText(KESSEL_ROLE_WS_VIEWER.name!)).closest('tr') as HTMLElement;
    const viewerCheckbox = viewerRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await expect(viewerCheckbox).toBeInTheDocument();
    await expect(viewerCheckbox.checked).toBe(true);

    await user.click(viewerCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);
    await expect(viewerCheckbox.checked).toBe(false);

    const updateButton = await modalScope.findByRole('button', { name: /update/i });
    await expect(updateButton).not.toBeDisabled();

    await user.click(updateButton);

    await waitFor(
      () => {
        expect(body.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    await waitFor(() => {
      const addressBar = canvas.getByTestId('fake-address-bar');
      expect(addressBar).toHaveTextContent(/workspaces\/detail/i);
    });
  },
};

export const RemovePrincipalsFromRole: Story = {
  tags: ['test-skip'],
  name: 'Edit access to deselect a role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Edit Access — Deselect a Role (test-skip — PatternFly bug)

Same flow as EditRoleAccess but for the Viewers group.

### Journey Flow
1. Navigate to **Production** workspace detail
2. Click **Viewers** → drawer opens
3. Click **Edit access for this workspace** → RoleAccessModal
4. Verify Workspace Viewer pre-selected
5. Deselect Workspace Viewer
6. Click **Update** → modal closes

> **Skipped**: Same PatternFly ToolbarFilter bug as EditRoleAccess.

### Design References

<img src="/mocks/workspaces/Edit access from role binding.png" alt="Edit Access" width="400" />
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToProductionWorkspaceDetail(user, canvas);

    const viewersText = await canvas.findByText(KESSEL_GROUP_VIEWERS.name);
    await user.click(viewersText);
    await delay(TEST_TIMEOUTS.AFTER_DRAWER_OPEN);

    const drawerPanel = document.querySelector('.pf-v6-c-drawer__panel') as HTMLElement;
    await expect(drawerPanel).toBeInTheDocument();
    const drawer = within(drawerPanel);

    await drawer.findByRole('heading', { name: KESSEL_GROUP_VIEWERS.name });

    const editAccessButton = await drawer.findByRole('button', { name: /edit access for this workspace/i });
    await user.click(editAccessButton);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    const body = within(document.body);
    const dialog = await body.findByRole('dialog', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    await waitFor(
      async () => {
        await expect(body.findByText(KESSEL_ROLE_WS_VIEWER.name!)).resolves.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    const modalScope = within(dialog);
    const table = await modalScope.findByRole('grid', { name: /roles selection table/i });
    const tableScope = within(table);

    const viewerRow = (await tableScope.findByText(KESSEL_ROLE_WS_VIEWER.name!)).closest('tr') as HTMLElement;
    const viewerCheckbox = viewerRow?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await expect(viewerCheckbox.checked).toBe(true);

    await user.click(viewerCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);
    await expect(viewerCheckbox.checked).toBe(false);

    const updateButton = await modalScope.findByRole('button', { name: /update/i });
    await user.click(updateButton);

    await waitFor(
      () => {
        expect(body.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    await waitFor(() => {
      const addressBar = canvas.getByTestId('fake-address-bar');
      expect(addressBar).toHaveTextContent(/workspaces\/detail/i);
    });
  },
};

export const WorkspaceAssetsTab: Story = {
  name: 'Workspace detail — Assets tab',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the workspace detail page Assets tab.

**Journey Flow:**
1. Navigate to Workspaces
2. Wait for Root Workspace
3. Expand Root Workspace row, click Production link
4. Wait for detail page to load
5. Click Assets tab
6. Verify assets content loads
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, WS_ROOT.name);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    await expandWorkspaceRow(user, canvas, WS_ROOT.name);
    await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);
    const productionLink = await canvas.findByRole('link', { name: /^production$/i });
    await user.click(productionLink);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    const assetsTab = await canvas.findByRole('tab', { name: /assets/i });
    await user.click(assetsTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);
    await expect(assetsTab).toHaveAttribute('aria-selected', 'true');

    // Verify assets content loads (the Assets tab shows service links)
    await waitFor(
      () => {
        const content =
          canvas.queryByText(/navigate to a service/i) || canvas.queryByText(/red hat insights/i) || canvas.queryByText(/manage your assets/i);
        expect(content).toBeTruthy();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );
  },
};
