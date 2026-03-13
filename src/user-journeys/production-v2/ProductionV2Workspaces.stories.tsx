import { expect, userEvent, waitFor, within } from 'storybook/test';
import { clearAndType, waitForContentReady } from '../../test-utils/interactionHelpers';
import {
  Story,
  TEST_TIMEOUTS,
  WS_DEFAULT,
  WS_PRODUCTION,
  WS_ROOT,
  WS_STAGING,
  clickWizardNext,
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
  waitForModal,
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Workspaces page', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);
    });

    await step('Create workspace via wizard', async () => {
      const wizard = await openWorkspaceWizard(user, canvas);
      await fillWorkspaceForm(user, wizard, 'QA Environment', 'Quality Assurance testing workspace');
      const parentLabel = await wizard.findByText(/parent workspace/i);
      expect(parentLabel).toBeInTheDocument();
      await selectParentWorkspace(user, wizard, [WS_ROOT.name, WS_DEFAULT.name], WS_PRODUCTION.name);
      await clickWizardNext(user, wizard);
      await clickWizardNext(user, wizard, { buttonText: /submit/i });
    });

    await step('Verify QA Environment in workspace list', async () => {
      await waitForPageToLoad(canvas, WS_ROOT.name);

      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);
      await expandWorkspaceRow(user, canvas, WS_PRODUCTION.name);

      const qaEnvironment = await canvas.findByText('QA Environment');
      expect(qaEnvironment).toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Workspaces page', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);
    });

    await step('Create workspace with parent selection', async () => {
      const wizard = await openWorkspaceWizard(user, canvas);
      await fillWorkspaceForm(user, wizard, 'Test Workspace M2', 'A test workspace with parent selection');
      const parentLabel = await wizard.findByText(/parent workspace/i);
      expect(parentLabel).toBeInTheDocument();
      await selectParentWorkspace(user, wizard, [WS_ROOT.name, WS_DEFAULT.name], WS_PRODUCTION.name);
      await clickWizardNext(user, wizard);
      await clickWizardNext(user, wizard, { buttonText: /submit/i });
    });

    await step('Verify Test Workspace M2 under Production', async () => {
      await waitForPageToLoad(canvas, WS_ROOT.name);

      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);
      await expandWorkspaceRow(user, canvas, WS_PRODUCTION.name);

      const newWorkspace = await canvas.findByText('Test Workspace M2');
      expect(newWorkspace).toBeInTheDocument();

      const newWorkspaceRow = newWorkspace.closest('tr') as HTMLElement;
      expect(newWorkspaceRow.getAttribute('aria-level')).toBe('4');
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Open Create subworkspace from Production kebab', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);

      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

      const body = await openWorkspaceKebabMenu(user, canvas, WS_PRODUCTION.name);
      const createSubworkspaceButton = await body.findByText(/create subworkspace/i);
      expect(createSubworkspaceButton).toBeInTheDocument();
      await user.click(createSubworkspaceButton);

      await body.findByText(/create new workspace/i);
      const wizardScope = await waitForModal();

      await fillWorkspaceForm(user, wizardScope, 'Test Subworkspace');

      const parentLabel = await wizardScope.findByText(/parent workspace/i);
      expect(parentLabel).toBeInTheDocument();

      await selectParentWorkspace(user, wizardScope, [WS_ROOT.name, WS_DEFAULT.name], WS_PRODUCTION.name);

      await clickWizardNext(user, wizardScope);
      await clickWizardNext(user, wizardScope, { buttonText: /submit/i });
    });

    await step('Verify Test Subworkspace under Production', async () => {
      await waitForPageToLoad(canvas, WS_ROOT.name);

      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);
      await expandWorkspaceRow(user, canvas, WS_PRODUCTION.name);

      const newSubworkspace = await canvas.findByText('Test Subworkspace');
      expect(newSubworkspace).toBeInTheDocument();

      const newSubworkspaceRow = newSubworkspace.closest('tr') as HTMLElement;
      expect(newSubworkspaceRow.getAttribute('aria-level')).toBe('4');
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Open Move workspace modal and select new parent', async () => {
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

      // Async popover content
      const treePanel = await within(document.body).findByTestId('workspace-selector-menu', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      const treePanelScope = within(treePanel);

      await expandWorkspaceInTree(user, treePanelScope, WS_ROOT.name);
      await expandWorkspaceInTree(user, treePanelScope, WS_DEFAULT.name);
      await selectWorkspaceFromTree(user, treePanelScope, WS_PRODUCTION.name);

      const submitButton = await body.findByRole('button', { name: /^submit$/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeEnabled();
      await user.click(submitButton);
    });

    await step('Verify Staging moved under Production', async () => {
      await waitForPageToLoad(canvas, WS_ROOT.name);

      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);
      await expandWorkspaceRow(user, canvas, WS_PRODUCTION.name);

      const stagingWorkspace = await canvas.findByText(WS_STAGING.name);
      expect(stagingWorkspace).toBeInTheDocument();

      const stagingRowAfterMove = stagingWorkspace.closest('tr') as HTMLElement;
      expect(stagingRowAfterMove.getAttribute('aria-level')).toBe('4');
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Open Edit workspace modal and save changes', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);

      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

      const body = await openWorkspaceKebabMenu(user, canvas, WS_PRODUCTION.name);
      const editButton = await body.findByText(/^edit workspace$/i);
      expect(editButton).toBeInTheDocument();
      await user.click(editButton);

      const modalScope = await waitForModal();
      await modalScope.findByText(/edit workspace information/i);

      await clearAndType(user, () => modalScope.getByDisplayValue(WS_PRODUCTION.name) as HTMLInputElement, 'Production Updated');
      await clearAndType(
        user,
        () => modalScope.getByDisplayValue(WS_PRODUCTION.description!) as HTMLTextAreaElement,
        'Updated production environment',
      );

      const saveButton = await modalScope.findByRole('button', { name: /^save$/i });
      expect(saveButton).toBeEnabled();
      await user.click(saveButton);
    });

    await step('Verify Production Updated in list', async () => {
      await waitForPageToLoad(canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

      const updatedWorkspace = await canvas.findByText('Production Updated');
      expect(updatedWorkspace).toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Open Delete workspace modal and confirm', async () => {
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

      const confirmButton = await body.findByRole('button', { name: /^delete$/i });
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).toBeEnabled();

      await user.click(confirmButton);
    });

    await step('Verify Staging removed and Production still present', async () => {
      await waitForPageToLoad(canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

      await waitFor(() => {
        expect(canvas.queryByText(WS_STAGING.name)).not.toBeInTheDocument();
      });
      expect(await canvas.findByText(WS_PRODUCTION.name)).toBeInTheDocument();
    });
  },
};
