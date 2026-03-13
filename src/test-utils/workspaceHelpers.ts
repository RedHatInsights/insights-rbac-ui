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

import { expect, waitFor, within } from 'storybook/test';
import { type ScopedQueries, clearAndType } from './interactionHelpers';
import { TEST_TIMEOUTS, type UserEvent } from './testUtils';

/**
 * Opens the Create Workspace wizard from a button and returns the wizard scope
 *
 * Usage:
 * ```ts
 * const wizard = await openWorkspaceWizard(user, canvas);
 * ```
 */
export async function openWorkspaceWizard(user: UserEvent, canvas: ScopedQueries) {
  // Click "Create workspace" button to open the wizard
  const createButton = await canvas.findByRole('button', { name: /create workspace/i });
  expect(createButton).toBeInTheDocument();
  await user.click(createButton);

  // The wizard renders in document.body (not in canvas)
  const body = within(document.body);

  // Wait for wizard to appear — use findAllByRole since multiple dialogs may exist
  const dialogs = await body.findAllByRole('dialog', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  const dialog = dialogs[dialogs.length - 1];
  await within(dialog).findByText(/create new workspace/i);

  return within(dialog);
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
export async function fillWorkspaceForm(user: UserEvent, wizardScope: ScopedQueries, name: string, description?: string) {
  await clearAndType(user, () => wizardScope.getByRole('textbox', { name: /workspace name/i }) as HTMLInputElement, name);

  if (description) {
    await clearAndType(user, () => wizardScope.getByRole('textbox', { name: /workspace description/i }) as HTMLTextAreaElement, description);
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
export async function openParentWorkspaceSelector(user: UserEvent, wizardScope: ScopedQueries) {
  // Click the parent selector button
  const parentSelector = await wizardScope.findByRole('button', { name: /select workspaces/i });
  expect(parentSelector).toBeInTheDocument();
  await user.click(parentSelector);

  // Wait for the tree view panel to open
  const treePanel = await within(document.body).findByTestId('workspace-selector-menu', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  expect(treePanel).toBeInTheDocument();

  return within(treePanel);
}

/**
 * Expands a workspace node in the tree view
 *
 * Usage:
 * ```ts
 * await expandWorkspaceInTree(user, treePanel, 'Default Workspace');
 * ```
 */
export async function expandWorkspaceInTree(user: UserEvent, treePanelScope: ScopedQueries, workspaceName: string) {
  const workspaceText = await treePanelScope.findByText(workspaceName, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  const workspaceNode = workspaceText.closest('li');
  expect(workspaceNode).toBeInTheDocument();

  await waitFor(() => expect(workspaceNode?.querySelector('.pf-v6-c-tree-view__node-toggle')).toBeInTheDocument(), {
    timeout: TEST_TIMEOUTS.ELEMENT_WAIT,
  });
  const toggleButton = workspaceNode!.querySelector('.pf-v6-c-tree-view__node-toggle') as Element;

  await user.click(toggleButton);
}

/**
 * Selects a workspace from the tree and confirms the selection
 *
 * Usage:
 * ```ts
 * await selectWorkspaceFromTree(user, treePanel, 'Production');
 * ```
 */
export async function selectWorkspaceFromTree(user: UserEvent, treePanelScope: ScopedQueries, workspaceName: string) {
  const workspaceButton = await treePanelScope.findByRole('button', { name: workspaceName });
  expect(workspaceButton).toBeInTheDocument();
  await user.click(workspaceButton);

  const body = within(document.body);
  const selectButton = await body.findByRole('button', { name: /select workspace/i }).catch(async () => {
    const buttonByText = await body.findByText(/select workspace/i);
    const button = buttonByText.closest('button');
    return button;
  });

  expect(selectButton).toBeInTheDocument();
  if (selectButton) {
    await user.click(selectButton);
  }
}

/**
 * Complete combo: Expand parent workspace(s) in tree and select a child
 *
 * Usage:
 * ```ts
 * // Single level expansion
 * await selectParentWorkspace(user, wizard, 'Root Workspace', 'Default Workspace');
 * // Multi-level expansion (expand Root, then Default, then select Production)
 * await selectParentWorkspace(user, wizard, ['Root Workspace', 'Default Workspace'], 'Production');
 * ```
 */
export async function selectParentWorkspace(
  user: UserEvent,
  wizardScope: ScopedQueries,
  parentsToExpand: string | string[],
  workspaceToSelect: string,
) {
  const treePanel = await openParentWorkspaceSelector(user, wizardScope);

  const parents = Array.isArray(parentsToExpand) ? parentsToExpand : [parentsToExpand];
  for (const parent of parents) {
    await expandWorkspaceInTree(user, treePanel, parent);
  }

  await selectWorkspaceFromTree(user, treePanel, workspaceToSelect);
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
export async function openWorkspaceKebabMenu(user: UserEvent, canvas: ScopedQueries, workspaceName: string) {
  const workspaceText = await canvas.findByText(workspaceName, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  const workspaceRow = workspaceText.closest('tr') as HTMLElement;
  expect(workspaceRow).toBeInTheDocument();

  const rowScope = within(workspaceRow);
  const kebabButton = await rowScope.findByLabelText(/kebab toggle|actions/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

  await user.click(kebabButton);

  return within(document.body);
}
