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
import { type ScopedQueries, clearAndType, clickWizardNext } from './interactionHelpers';
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
 * Navigates from the details step to the "Select parent workspace" step
 * by clicking "Next" and waiting for the search input to appear.
 *
 * Usage:
 * ```ts
 * await navigateToParentStep(user, wizard);
 * ```
 */
export async function navigateToParentStep(user: UserEvent, wizardScope: ScopedQueries) {
  await clickWizardNext(user, wizardScope);
  await wizardScope.findByLabelText(/search workspaces/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
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
 * Selects a workspace node from a PatternFly TreeView by clicking its text.
 *
 * Matches the proven pattern used in WorkspaceTreeView.stories.tsx and
 * ManagedWorkspaceSelector.stories.tsx: findByText → click.
 *
 * Works in both the wizard's inline tree and the dropdown panel tree.
 * When used with the dropdown `ManagedWorkspaceSelector`, the caller must
 * also click the confirmation button separately.
 *
 * Usage:
 * ```ts
 * await selectWorkspaceFromTree(user, treeScope, 'Production');
 * ```
 */
export async function selectWorkspaceFromTree(user: UserEvent, treeScope: ScopedQueries, workspaceName: string) {
  const workspaceText = await treeScope.findByText(workspaceName, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  expect(workspaceText).toBeInTheDocument();
  await user.click(workspaceText);
}

/**
 * Navigates to the parent step and selects a workspace from the inline tree.
 * The tree starts fully expanded, so no manual expansion is needed for
 * typical hierarchies.
 *
 * Usage:
 * ```ts
 * await selectParentWorkspace(user, wizard, 'Production');
 * ```
 */
export async function selectParentWorkspace(user: UserEvent, wizardScope: ScopedQueries, workspaceToSelect: string) {
  await navigateToParentStep(user, wizardScope);
  const tree = await wizardScope.findByRole('tree', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  await selectWorkspaceFromTree(user, within(tree), workspaceToSelect);
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
