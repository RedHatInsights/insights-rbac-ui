/**
 * Shared helpers for workspace-related user interactions
 *
 * These helpers are used by both:
 * - Component stories in src/features/workspaces
 * - User journey tests in src/user-journeys/kessel-*
 *
 * Benefits of shared helpers:
 * - Consistent interaction patterns across all stories
 * - Semantic selectors (findByRole) instead of document.getElementById
 * - Easier maintenance when UI changes
 * - Reduced code duplication
 */

import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';

/**
 * Opens the Create Workspace wizard from a button and returns the wizard scope
 *
 * Usage:
 * ```ts
 * const wizard = await openWorkspaceWizard(user, canvas);
 * ```
 */
export async function openWorkspaceWizard(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>) {
  // Click "Create workspace" button to open the wizard
  const createButton = await canvas.findByRole('button', { name: /create workspace/i });
  expect(createButton).toBeInTheDocument();
  await user.click(createButton);

  // The wizard renders in document.body (not in canvas)
  const body = within(document.body);

  // Wait for wizard to appear (findByText already waits, no delay needed)
  await body.findByText(/create new workspace/i);

  // Find the wizard container
  const wizard = document.querySelector('.pf-v6-c-wizard, .pf-c-wizard');
  expect(wizard).toBeInTheDocument();

  return within(wizard as HTMLElement);
}

/**
 * Fills the workspace wizard form fields (name and optionally description)
 *
 * Uses semantic selectors instead of document.getElementById for better accessibility
 *
 * Usage:
 * ```ts
 * await fillWorkspaceForm(user, wizard, 'My Workspace', 'Optional description');
 * ```
 */
export async function fillWorkspaceForm(
  user: ReturnType<typeof userEvent.setup>,
  wizardScope: ReturnType<typeof within>,
  name: string,
  description?: string,
) {
  // Use semantic selector - findByRole is more accessible than getElementById
  // The label might be split across spans, so we use a flexible regex
  const nameInput = await wizardScope.findByRole('textbox', { name: /workspace name/i });
  expect(nameInput).toBeInTheDocument();
  await user.clear(nameInput);
  await user.type(nameInput, name);

  if (description) {
    const descriptionInput = await wizardScope.findByRole('textbox', { name: /workspace description/i });
    expect(descriptionInput).toBeInTheDocument();
    await user.clear(descriptionInput);
    await user.type(descriptionInput, description);
  }
}

/**
 * Opens the parent workspace selector tree panel
 *
 * Returns the tree panel scope for further interactions
 *
 * Usage:
 * ```ts
 * const treePanel = await openParentWorkspaceSelector(user, wizard);
 * ```
 */
export async function openParentWorkspaceSelector(user: ReturnType<typeof userEvent.setup>, wizardScope: ReturnType<typeof within>) {
  // Click the parent selector button
  const parentSelector = await wizardScope.findByRole('button', { name: /select workspaces/i });
  expect(parentSelector).toBeInTheDocument();
  await user.click(parentSelector);

  // Wait for the tree view panel to open
  await delay(500);

  // The tree view panel renders in document.body
  const treePanel = document.querySelector('.rbac-c-workspace-selector-menu');
  expect(treePanel).toBeInTheDocument();

  return within(treePanel as HTMLElement);
}

/**
 * Expands a workspace node in the tree view
 *
 * Usage:
 * ```ts
 * await expandWorkspaceInTree(user, treePanel, 'Default Workspace');
 * ```
 */
export async function expandWorkspaceInTree(
  user: ReturnType<typeof userEvent.setup>,
  treePanelScope: ReturnType<typeof within>,
  workspaceName: string,
) {
  // Find the workspace node by name
  const workspaceNode = treePanelScope.getByText(workspaceName).closest('li');
  expect(workspaceNode).toBeInTheDocument();

  // Find the toggle button (expand/collapse) by its class
  const toggleButton = workspaceNode?.querySelector('.pf-v6-c-tree-view__node-toggle');
  expect(toggleButton).toBeInTheDocument();

  // Click to expand
  await user.click(toggleButton as Element);
  await delay(300);
}

/**
 * Selects a workspace from the tree and confirms the selection
 *
 * Usage:
 * ```ts
 * await selectWorkspaceFromTree(user, treePanel, 'Production');
 * ```
 */
export async function selectWorkspaceFromTree(
  user: ReturnType<typeof userEvent.setup>,
  treePanelScope: ReturnType<typeof within>,
  workspaceName: string,
) {
  // Find and click the workspace button
  const workspaceButton = await treePanelScope.findByRole('button', { name: workspaceName });
  expect(workspaceButton).toBeInTheDocument();
  await user.click(workspaceButton);
  await delay(300);

  // Click the "Select Workspace" button to confirm (may be in portal)
  // The button might be labeled "Select Workspace" or just contain that text
  const body = within(document.body);

  // Try to find the button by its text content
  // Use flexible regex that matches "Select Workspace" or "Select workspace" anywhere
  const selectButton = await body.findByRole('button', { name: /select workspace/i }).catch(async () => {
    // Fallback: find by text content if role search fails
    const buttonByText = await body.findByText(/select workspace/i);
    const button = buttonByText.closest('button');
    return button;
  });

  expect(selectButton).toBeInTheDocument();
  if (selectButton) {
    await user.click(selectButton);
  }
  await delay(500);
}

/**
 * Complete combo: Expand a parent workspace in tree and select a child
 *
 * Usage:
 * ```ts
 * await selectParentWorkspace(user, wizard, 'Default Workspace', 'Production');
 * ```
 */
export async function selectParentWorkspace(
  user: ReturnType<typeof userEvent.setup>,
  wizardScope: ReturnType<typeof within>,
  parentToExpand: string,
  workspaceToSelect: string,
) {
  const treePanel = await openParentWorkspaceSelector(user, wizardScope);
  await expandWorkspaceInTree(user, treePanel, parentToExpand);
  await selectWorkspaceFromTree(user, treePanel, workspaceToSelect);
}

/**
 * Navigates wizard steps (Next, Back, Submit, Cancel)
 *
 * Usage:
 * ```ts
 * await clickWizardButton(user, wizard, 'Next');
 * await clickWizardButton(user, wizard, 'Submit');
 * ```
 */
export async function clickWizardButton(
  user: ReturnType<typeof userEvent.setup>,
  wizardScope: ReturnType<typeof within>,
  buttonName: 'Next' | 'Back' | 'Submit' | 'Cancel',
) {
  const button = await wizardScope.findByRole('button', { name: new RegExp(buttonName, 'i') });
  expect(button).toBeInTheDocument();
  expect(button).toBeEnabled();
  await user.click(button);
  await delay(500);
}

/**
 * Opens a workspace's kebab menu from the table
 *
 * Returns the body scope for interacting with the menu (which renders in document.body)
 *
 * Usage:
 * ```ts
 * const body = await openWorkspaceKebabMenu(user, canvas, 'Production');
 * const editButton = await body.findByText(/edit workspace/i);
 * ```
 */
export async function openWorkspaceKebabMenu(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>, workspaceName: string) {
  // Find the workspace row
  const workspaceRow = canvas.getByText(workspaceName).closest('tr') as HTMLElement;
  expect(workspaceRow).toBeInTheDocument();

  // Find and click the kebab menu button
  const rowScope = within(workspaceRow);
  const kebabButton = rowScope.getByLabelText(/kebab toggle|actions/i);
  expect(kebabButton).toBeInTheDocument();
  await user.click(kebabButton);
  await delay(300);

  // Menu opens in document.body
  return within(document.body);
}

/**
 * Opens a modal (Edit Workspace, Move Workspace, Delete Workspace)
 *
 * Returns the modal scope for interacting with its contents
 *
 * Usage:
 * ```ts
 * const modal = await findModal('Edit workspace');
 * ```
 */
export async function findModal(expectedHeading: string | RegExp) {
  const body = within(document.body);

  // Wait for modal to appear
  await body.findByRole('dialog');

  // Verify the modal has the expected heading
  if (typeof expectedHeading === 'string') {
    await body.findByText(expectedHeading);
  } else {
    await body.findByText(expectedHeading);
  }

  // Find the modal container
  const modal = document.querySelector('.pf-v6-c-modal-box, .pf-c-modal-box');
  expect(modal).toBeInTheDocument();

  return within(modal as HTMLElement);
}

/**
 * Fills and submits the Edit Workspace modal
 *
 * Usage:
 * ```ts
 * await editWorkspaceInModal(user, 'Updated Name', 'Updated Description');
 * ```
 */
export async function editWorkspaceInModal(user: ReturnType<typeof userEvent.setup>, newName?: string, newDescription?: string) {
  const modal = await findModal(/edit workspace/i);

  if (newName) {
    const nameInput = await modal.findByDisplayValue(/./); // Find first input with value
    expect(nameInput).toBeInTheDocument();
    await user.clear(nameInput);
    await user.type(nameInput, newName);
  }

  if (newDescription) {
    const inputs = await modal.findAllByRole('textbox');
    const descInput = inputs[1]; // Description is typically the second input
    if (descInput) {
      await user.clear(descInput);
      await user.type(descInput, newDescription);
    }
  }

  // Click Save button
  const saveButton = await modal.findByRole('button', { name: /save/i });
  expect(saveButton).toBeInTheDocument();
  await user.click(saveButton);

  // Wait for modal to close (dialog should disappear)
  await waitFor(() => {
    const dialog = within(document.body).queryByRole('dialog', { name: /edit workspace/i });
    expect(dialog).not.toBeInTheDocument();
  });
}

/**
 * Confirms a delete operation by checking the confirmation checkbox and clicking Delete
 *
 * Usage:
 * ```ts
 * await confirmDelete(user);
 * ```
 */
export async function confirmDelete(user: ReturnType<typeof userEvent.setup>) {
  const modal = await findModal(/delete workspace/i);

  // Find and check the confirmation checkbox
  const checkbox = await modal.findByRole('checkbox', { name: /understand.*irreversible/i });
  expect(checkbox).toBeInTheDocument();
  await user.click(checkbox);
  await delay(300);

  // Click Delete button
  const deleteButton = await modal.findByRole('button', { name: /delete/i });
  expect(deleteButton).toBeInTheDocument();
  expect(deleteButton).toBeEnabled();
  await user.click(deleteButton);

  // Wait for modal to close (dialog should disappear)
  await waitFor(() => {
    const dialog = within(document.body).queryByRole('dialog', { name: /delete workspace/i });
    expect(dialog).not.toBeInTheDocument();
  });
}
