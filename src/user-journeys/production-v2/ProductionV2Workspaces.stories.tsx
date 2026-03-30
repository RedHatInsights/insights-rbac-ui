import { expect, userEvent, waitFor, within } from 'storybook/test';
import { clearAndType, dismissWorkspaceReadyModal, waitForContentReady } from '../../test-utils/interactionHelpers';
import {
  Story,
  TEST_TIMEOUTS,
  WS_DEFAULT,
  WS_DEVELOPMENT,
  WS_PRODUCTION,
  WS_ROOT,
  WS_STAGING,
  clickWizardNext,
  db,
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
## Create Workspace (Basic)

Tests basic workspace creation with parent selection on a dedicated step.

### Journey Flow
1. Navigate to **Workspaces** page
2. Click **Create workspace** button
3. Fill in name ("QA Environment") and description, click **Next**
4. Select **Production** as parent from the fully expanded tree, click **Next**
5. Review, then **Submit**
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
      await selectParentWorkspace(user, wizard, WS_PRODUCTION.name);
      await clickWizardNext(user, wizard);
      await clickWizardNext(user, wizard, { buttonText: /submit/i });
    });

    await step('Dismiss workspace ready modal', async () => {
      await dismissWorkspaceReadyModal(user);
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

Tests that admins can create a workspace and choose a parent via the full-width tree step.

### Journey Flow
1. Navigate to **Workspaces**
2. Click **Create workspace**
3. Fill in name ("Test Workspace M2") and description, click **Next**
4. Select **Production** from the workspace tree, click **Next**
5. Review, then **Submit**
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
      await selectParentWorkspace(user, wizard, WS_PRODUCTION.name);
      await clickWizardNext(user, wizard);
      await clickWizardNext(user, wizard, { buttonText: /submit/i });
    });

    await step('Dismiss workspace ready modal', async () => {
      await dismissWorkspaceReadyModal(user);
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
  name: 'Create sub-workspace from kebab menu',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Create Sub-workspace from Kebab Menu

Tests creating a child workspace from a parent's action menu.
The parent selection step is skipped because the parent is implicit (the workspace whose kebab was clicked).

### Journey Flow
1. Navigate to **Workspaces**, expand **Root Workspace** > **Default Workspace**
2. Open **Production** kebab menu and click **Create sub-workspace**
3. Wizard opens with parent pre-set — fill name ("Test Subworkspace"), click **Next**
4. Review (parent step is skipped), then **Submit**
5. Verify "Test Subworkspace" appears under Production at level 4

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

    await step('Open Create sub-workspace from Production kebab', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);

      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

      const body = await openWorkspaceKebabMenu(user, canvas, WS_PRODUCTION.name);
      const createSubworkspaceButton = await body.findByText(/create sub-workspace/i);
      expect(createSubworkspaceButton).toBeInTheDocument();
      await user.click(createSubworkspaceButton);

      await body.findByText(/create new workspace/i);
      const wizardScope = await waitForModal();

      await fillWorkspaceForm(user, wizardScope, 'Test Subworkspace');

      await clickWizardNext(user, wizardScope);
      await clickWizardNext(user, wizardScope, { buttonText: /submit/i });
    });

    await step('Dismiss workspace ready modal', async () => {
      await dismissWorkspaceReadyModal(user);
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

Tests moving a workspace to a new parent via the inline tree picker.

### Journey Flow
1. Navigate to **Workspaces**, expand **Root Workspace** > **Default Workspace**
2. Open **Staging** kebab menu → **Move workspace**
3. Modal opens with a full-width inline tree (starts fully expanded)
4. Select **Production** from the tree
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

      // Inline tree is rendered directly — select Production
      const tree = await body.findByRole('tree', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await selectWorkspaceFromTree(user, within(tree), WS_PRODUCTION.name);

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

export const CreateSiblingWorkspace: Story = {
  name: 'Create sibling workspace from kebab menu',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Create Sibling Workspace from Kebab Menu

Tests creating a sibling workspace via the kebab menu. The parent selection step
is skipped because the parent is implicitly set to the target workspace's own parent.

### Journey Flow
1. Navigate to **Workspaces**, expand **Root Workspace** > **Default Workspace**
2. Open **Production** kebab menu and click **Create sibling workspace**
3. Wizard opens with parent pre-set to **Default Workspace** — fill name ("Sibling Workspace"), click **Next**
4. Review (parent step is skipped), then **Submit**
5. Verify "Sibling Workspace" appears at the same level as Production (level 3)
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

    await step('Open Create sibling workspace from Production kebab', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);

      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

      const body = await openWorkspaceKebabMenu(user, canvas, WS_PRODUCTION.name);
      const createSiblingButton = await body.findByText(/create sibling workspace/i);
      expect(createSiblingButton).toBeInTheDocument();
      await user.click(createSiblingButton);

      await body.findByText(/create new workspace/i);
      const wizardScope = await waitForModal();

      await fillWorkspaceForm(user, wizardScope, 'Sibling Workspace');

      await clickWizardNext(user, wizardScope);
      await clickWizardNext(user, wizardScope, { buttonText: /submit/i });
    });

    await step('Dismiss workspace ready modal', async () => {
      await dismissWorkspaceReadyModal(user);
    });

    await step('Verify Sibling Workspace at same level as Production', async () => {
      await waitForPageToLoad(canvas, WS_ROOT.name);

      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

      const siblingWorkspace = await canvas.findByText('Sibling Workspace');
      expect(siblingWorkspace).toBeInTheDocument();

      const siblingRow = siblingWorkspace.closest('tr') as HTMLElement;
      expect(siblingRow.getAttribute('aria-level')).toBe('3');
    });
  },
};

export const DeleteWorkspaceFromDetail: Story = {
  name: 'Delete workspace from detail page',
  args: {
    initialRoute: `/iam/access-management/workspaces/detail/${WS_DEVELOPMENT.id}`,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Delete Workspace from Detail Page

Tests deleting a workspace via the detail page header kebab. This exercises
the route-based \`RoutedDeleteModal\` rendered through the detail page outlet.

### Journey Flow
1. Start at **Development** detail page
2. Open header **Actions** kebab → **Delete workspace**
3. Delete confirmation modal opens (routed at \`/detail/${WS_DEVELOPMENT.id}/delete\`)
4. Check the "I understand" checkbox, click **Delete**
5. Verify redirect to workspace list and Development is gone
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

    await step('Verify detail page loaded', async () => {
      await canvas.findByRole('heading', { name: new RegExp(`^${WS_DEVELOPMENT.name}$`, 'i') }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Open Actions kebab and click Delete workspace', async () => {
      const actionsButtons = await canvas.findAllByRole('button', { name: /^actions$/i });
      await user.click(actionsButtons[0]);

      const body = within(document.body);
      const deleteButton = await body.findByText(/^delete workspace$/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      expect(deleteButton).toBeInTheDocument();
      await user.click(deleteButton);
    });

    await step('Confirm deletion', async () => {
      const body = within(document.body);
      const modalHeading = await body.findByRole('heading', { name: /delete.*workspace/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      expect(modalHeading).toBeInTheDocument();

      const checkbox = await body.findByRole('checkbox', { name: /understand.*cannot be undone/i });
      expect(checkbox).not.toBeChecked();
      await user.click(checkbox);

      const confirmButton = await body.findByRole('button', { name: /^delete$/i });
      expect(confirmButton).toBeEnabled();
      await user.click(confirmButton);
    });

    await step('Verify redirect to list and Development is gone', async () => {
      await waitFor(
        () => {
          const addressBar = canvas.queryByTestId('fake-address-bar');
          expect(addressBar).not.toHaveTextContent(/detail/i);
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      await waitForPageToLoad(canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

      await waitFor(() => {
        expect(canvas.queryByText(WS_DEVELOPMENT.name)).not.toBeInTheDocument();
      });
      expect(await canvas.findByText(WS_PRODUCTION.name)).toBeInTheDocument();
    });
  },
};

export const MoveWorkspaceFromDetail: Story = {
  name: 'Move workspace from detail page',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Move Workspace from Detail Page

Tests moving a workspace via the detail page header kebab. This exercises
the route-based \`RoutedMoveDialog\` rendered through the detail page outlet.

### Journey Flow
1. Navigate to **Workspaces**, expand tree, click **Staging** link to open detail
2. Open header **Actions** kebab → **Move workspace**
3. Move dialog opens (routed at \`/detail/ws-3/move\`)
4. Select **Production** as new parent, click **Submit**
5. Verify redirect back to detail and Staging now under Production (level 4)
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

    await step('Navigate to Staging detail page', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);

      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

      const stagingLink = await canvas.findByRole('link', { name: /^Staging$/i });
      await user.click(stagingLink);

      await waitFor(() => {
        const addressBar = canvas.queryByTestId('fake-address-bar');
        expect(addressBar).toHaveTextContent(/workspaces\/detail/i);
      });

      await canvas.findByRole('heading', { name: /^Staging$/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Open Actions kebab and click Move workspace', async () => {
      const actionsButtons = await canvas.findAllByRole('button', { name: /^actions$/i });
      await user.click(actionsButtons[0]);

      const body = within(document.body);
      const moveButton = await body.findByText(/^move workspace$/i);
      expect(moveButton).toBeInTheDocument();
      await user.click(moveButton);
    });

    await step('Select new parent and submit', async () => {
      const body = within(document.body);
      const modalHeading = await body.findByRole('heading', { name: /move.*staging/i });
      expect(modalHeading).toBeInTheDocument();

      const tree = await body.findByRole('tree', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await selectWorkspaceFromTree(user, within(tree), WS_PRODUCTION.name);

      const submitButton = await body.findByRole('button', { name: /^submit$/i });
      expect(submitButton).toBeEnabled();
      await user.click(submitButton);
    });

    await step('Verify Staging moved under Production', async () => {
      await waitFor(() => {
        const addressBar = canvas.queryByTestId('fake-address-bar');
        expect(addressBar).toHaveTextContent(/workspaces\/detail/i);
      });

      const workspacesLinks = await canvas.findAllByRole('link', { name: /workspaces/i });
      await user.click(workspacesLinks[workspacesLinks.length - 1]);
      await waitForPageToLoad(canvas, WS_ROOT.name);

      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);
      await expandWorkspaceRow(user, canvas, WS_PRODUCTION.name);

      const stagingWorkspace = await canvas.findByText(WS_STAGING.name);
      expect(stagingWorkspace).toBeInTheDocument();

      const stagingRow = stagingWorkspace.closest('tr') as HTMLElement;
      expect(stagingRow.getAttribute('aria-level')).toBe('4');
    });
  },
};
