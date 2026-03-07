import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
import {
  Story,
  TEST_TIMEOUTS,
  WS_DEFAULT,
  WS_PRODUCTION,
  WS_ROOT,
  WS_STAGING,
  clickWizardButton,
  db,
  expandWorkspaceInTree,
  expandWorkspaceRow,
  fillWorkspaceForm,
  meta,
  navigateToPage,
  openWorkspaceKebabMenu,
  openWorkspaceWizard,
  resetStoryState,
  selectParentWorkspace,
  selectWorkspaceFromTree,
  waitForPageToLoad,
} from './_v2OrgAdminSetup';

export default {
  ...meta,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Workspaces',
  tags: ['prod-v2-org-admin'],
};

export const CreateWorkspaceBasic: Story = {
  name: 'Create workspace (basic)',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Create Workspace (Basic — No Parent Selection)

Tests basic workspace creation where the parent is fixed to "Root Workspace".

### Journey Flow
1. Navigate to **Workspaces** page
2. Click **Create workspace** button
3. Fill in name ("QA Environment") and description
4. Parent workspace selector is present but shows "Root Workspace" (disabled in M1 mode)
5. Click **Next** to review, then **Submit**
6. Verify wizard closes and "QA Environment" appears in the workspace list

### Design References

<img src="/mocks/workspaces/Workspace list.png" alt="Workspace list page" width="400" />
<img src="/mocks/workspaces/Create workspace.png" alt="Create workspace wizard" width="400" />
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

    const wizard = await openWorkspaceWizard(user, canvas);

    await fillWorkspaceForm(user, wizard, 'QA Environment', 'Quality Assurance testing workspace');

    const parentLabel = await wizard.findByText(/parent workspace/i);
    expect(parentLabel).toBeInTheDocument();

    await selectParentWorkspace(user, wizard, [WS_ROOT.name, WS_DEFAULT.name], WS_PRODUCTION.name);

    await clickWizardButton(user, wizard, 'Next');
    await clickWizardButton(user, wizard, 'Submit');

    await waitForPageToLoad(canvas, WS_ROOT.name);

    await expandWorkspaceRow(user, canvas, WS_ROOT.name);
    await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);
    await expandWorkspaceRow(user, canvas, WS_PRODUCTION.name);

    const qaEnvironment = await canvas.findByText('QA Environment');
    expect(qaEnvironment).toBeInTheDocument();
  },
};

export const CreateWorkspaceWithParent: Story = {
  name: 'Create workspace with parent selection',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Create Workspace with Parent Selection

Tests that admins can create a workspace and choose a parent via the tree selector.

### Journey Flow
1. Navigate to **Workspaces**
2. Click **Create workspace**
3. Fill in name ("Test Workspace M2") and description
4. Open parent selector tree — expand **Root Workspace** > **Default Workspace** — select **Production**
5. Click **Next** then **Submit**
6. Expand hierarchy and verify "Test Workspace M2" appears under Production at level 4

### Design References

<img src="/mocks/workspaces/Workspace list.png" alt="Workspace list page" width="400" />
<img src="/mocks/workspaces/Create workspace.png" alt="Create workspace wizard" width="400" />
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

    const wizard = await openWorkspaceWizard(user, canvas);
    await fillWorkspaceForm(user, wizard, 'Test Workspace M2', 'A test workspace with parent selection');

    const parentLabel = await wizard.findByText(/parent workspace/i);
    expect(parentLabel).toBeInTheDocument();

    await selectParentWorkspace(user, wizard, [WS_ROOT.name, WS_DEFAULT.name], WS_PRODUCTION.name);

    await clickWizardButton(user, wizard, 'Next');
    await clickWizardButton(user, wizard, 'Submit');

    await waitForPageToLoad(canvas, WS_ROOT.name);

    await expandWorkspaceRow(user, canvas, WS_ROOT.name);
    await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);
    await expandWorkspaceRow(user, canvas, WS_PRODUCTION.name);

    const newWorkspace = await canvas.findByText('Test Workspace M2');
    expect(newWorkspace).toBeInTheDocument();

    const newWorkspaceRow = newWorkspace.closest('tr') as HTMLElement;
    expect(newWorkspaceRow.getAttribute('aria-level')).toBe('4');
  },
};

export const CreateSubworkspace: Story = {
  name: 'Create subworkspace from kebab menu',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Create Subworkspace from Kebab Menu

Tests creating a child workspace from a parent's action menu.

### Journey Flow
1. Navigate to **Workspaces**, expand **Root Workspace** > **Default Workspace**
2. Open **Production** kebab menu and click **Create subworkspace**
3. Wizard opens — fill name ("Test Subworkspace")
4. Select **Production** as parent in tree
5. **Next** then **Submit**
6. Verify "Test Subworkspace" appears under Production at level 4

### Design References

<img src="/mocks/workspaces/Workspace list.png" alt="Workspace list page" width="400" />
<img src="/mocks/workspaces/Create workspace.png" alt="Create workspace wizard" width="400" />
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

    const body = await openWorkspaceKebabMenu(user, canvas, WS_PRODUCTION.name);
    const createSubworkspaceButton = await body.findByText(/create subworkspace/i);
    expect(createSubworkspaceButton).toBeInTheDocument();
    await user.click(createSubworkspaceButton);

    await body.findByText(/create new workspace/i);
    const wizardEl = document.querySelector('.pf-v6-c-wizard, .pf-c-wizard');
    expect(wizardEl).toBeInTheDocument();
    const wizardScope = within(wizardEl as HTMLElement);

    await fillWorkspaceForm(user, wizardScope, 'Test Subworkspace');

    const parentLabel = await wizardScope.findByText(/parent workspace/i);
    expect(parentLabel).toBeInTheDocument();

    await selectParentWorkspace(user, wizardScope, [WS_ROOT.name, WS_DEFAULT.name], WS_PRODUCTION.name);

    await clickWizardButton(user, wizardScope, 'Next');
    await clickWizardButton(user, wizardScope, 'Submit');

    await waitForPageToLoad(canvas, WS_ROOT.name);

    await expandWorkspaceRow(user, canvas, WS_ROOT.name);
    await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);
    await expandWorkspaceRow(user, canvas, WS_PRODUCTION.name);

    const newSubworkspace = await canvas.findByText('Test Subworkspace');
    expect(newSubworkspace).toBeInTheDocument();

    const newSubworkspaceRow = newSubworkspace.closest('tr') as HTMLElement;
    expect(newSubworkspaceRow.getAttribute('aria-level')).toBe('4');
  },
};

export const MoveWorkspace: Story = {
  name: 'Move workspace',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Move Workspace

Tests moving a workspace to a new parent in the hierarchy.

### Journey Flow
1. Navigate to **Workspaces**, expand **Root Workspace** > **Default Workspace**
2. Open **Staging** kebab menu → **Move workspace**
3. Modal opens showing current parent ("Default Workspace")
4. Open tree selector — expand **Root Workspace** > **Default Workspace** — select **Production**
5. Click **Submit**
6. Verify **Staging** now appears under **Production** at level 4 (moved from level 3)

### Design References

<img src="/mocks/workspaces/Move assets to current workspace.png" alt="Move workspace" width="400" />
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

    const body = await openWorkspaceKebabMenu(user, canvas, WS_STAGING.name);
    const moveWorkspaceButton = await body.findByText(/^move workspace$/i);
    expect(moveWorkspaceButton).toBeInTheDocument();
    expect(moveWorkspaceButton).not.toHaveAttribute('disabled');
    await user.click(moveWorkspaceButton);

    const modalHeading = await body.findByRole('heading', { name: /move.*staging/i });
    expect(modalHeading).toBeInTheDocument();

    const parentSelector = await body.findByRole('button', { name: /default workspace/i });
    expect(parentSelector).toBeInTheDocument();

    await user.click(parentSelector);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    const treePanel = document.querySelector('.rbac-c-workspace-selector-menu');
    expect(treePanel).toBeInTheDocument();
    const treePanelScope = within(treePanel as HTMLElement);

    await expandWorkspaceInTree(user, treePanelScope, WS_ROOT.name);
    await expandWorkspaceInTree(user, treePanelScope, WS_DEFAULT.name);
    await selectWorkspaceFromTree(user, treePanelScope, WS_PRODUCTION.name);

    const submitButton = await body.findByRole('button', { name: /^submit$/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    await waitForPageToLoad(canvas, WS_ROOT.name);

    await expandWorkspaceRow(user, canvas, WS_ROOT.name);
    await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);
    await expandWorkspaceRow(user, canvas, WS_PRODUCTION.name);

    const stagingWorkspace = await canvas.findByText(WS_STAGING.name);
    expect(stagingWorkspace).toBeInTheDocument();

    const stagingRowAfterMove = stagingWorkspace.closest('tr') as HTMLElement;
    expect(stagingRowAfterMove.getAttribute('aria-level')).toBe('4');
  },
};

export const EditWorkspace: Story = {
  name: 'Edit workspace',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Edit Workspace

Tests editing a workspace's name and description via the kebab menu.

### Journey Flow
1. Navigate to **Workspaces**, expand **Root Workspace** > **Default Workspace**
2. Open **Production** kebab menu → **Edit workspace**
3. Edit modal opens with current values pre-filled
4. Change name to "Production Updated" and description to "Updated production environment"
5. Click **Save**
6. Verify "Production Updated" appears in the workspace list

### Design References

<img src="/mocks/workspaces/Edit workspace.png" alt="Edit workspace modal" width="400" />
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

    const body = await openWorkspaceKebabMenu(user, canvas, WS_PRODUCTION.name);
    const editButton = await body.findByText(/^edit workspace$/i);
    expect(editButton).toBeInTheDocument();
    await user.click(editButton);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const modal = await body.findByRole('dialog', { name: /edit workspace information/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    const modalScope = within(modal);

    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const nameInput = await modalScope.findByDisplayValue(WS_PRODUCTION.name);
    const descriptionInput = await modalScope.findByDisplayValue(WS_PRODUCTION.description!);

    await user.clear(nameInput);
    await user.type(nameInput, 'Production Updated');

    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated production environment');
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const saveButton = modalScope.getByRole('button', { name: /^save$/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitForPageToLoad(canvas, WS_ROOT.name);
    await expandWorkspaceRow(user, canvas, WS_ROOT.name);
    await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

    const updatedWorkspace = await canvas.findByText('Production Updated');
    expect(updatedWorkspace).toBeInTheDocument();
  },
};

export const DeleteWorkspace: Story = {
  name: 'Delete workspace',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Delete Workspace

Tests deleting a leaf workspace via the kebab menu with confirmation.

### Journey Flow
1. Navigate to **Workspaces**, expand **Root Workspace** > **Default Workspace**
2. Open **Staging** kebab menu → **Delete workspace**
3. Confirmation modal opens with "I understand this action cannot be undone" checkbox
4. Check checkbox, click **Delete**
5. Verify **Staging** is removed from the list; **Production** still present

### Design References

<img src="/mocks/workspaces/Delete workspace.png" alt="Delete workspace" width="400" />
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

    const body = await openWorkspaceKebabMenu(user, canvas, WS_STAGING.name);
    const deleteButton = await body.findByText(/^delete workspace$/i);
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton);

    const modalHeading = await body.findByRole('heading', { name: /delete.*workspace/i });
    expect(modalHeading).toBeInTheDocument();

    const checkbox = await body.findByRole('checkbox', { name: /understand.*cannot be undone/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const confirmButton = await body.findByRole('button', { name: /^delete$/i });
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    await waitForPageToLoad(canvas, WS_ROOT.name);
    await expandWorkspaceRow(user, canvas, WS_ROOT.name);
    await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

    await waitFor(() => {
      expect(canvas.queryByText(WS_STAGING.name)).not.toBeInTheDocument();
    });
    expect(await canvas.findByText(WS_PRODUCTION.name)).toBeInTheDocument();
  },
};
