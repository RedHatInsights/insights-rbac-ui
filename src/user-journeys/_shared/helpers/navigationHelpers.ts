import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';

/**
 * Expands a workspace row in the hierarchical table if it's collapsed
 */
export async function expandWorkspaceRow(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>, workspaceName: string) {
  const workspaceRow = canvas.getByText(workspaceName).closest('tr') as HTMLElement;
  expect(workspaceRow).toBeInTheDocument();

  const toggleButton = workspaceRow.querySelector('.pf-v5-c-table__toggle button') as HTMLButtonElement;
  expect(toggleButton).toBeInTheDocument();

  if (toggleButton.getAttribute('aria-expanded') === 'false') {
    await user.click(toggleButton);
    await delay(500);
  }
}

/**
 * Opens a row's kebab menu (actions dropdown) by the row's name
 */
export async function openRowActionsMenu(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>, rowName: string) {
  const kebabButton = await canvas.findByRole('button', { name: `${rowName} actions` });
  await user.click(kebabButton);
  await delay(200);

  // Wait for menu to appear
  await waitFor(async () => {
    const menuItem = document.querySelector('[role="menuitem"]');
    await expect(menuItem).toBeInTheDocument();
  });
}

/**
 * Opens a role's kebab menu (actions dropdown) - roles have a different aria-label pattern
 */
export async function openRoleActionsMenu(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>, roleName: string) {
  const kebabButton = await canvas.findByRole('button', { name: `Actions for role ${roleName}` });
  await user.click(kebabButton);
  await delay(200);

  // Wait for menu to appear
  await waitFor(async () => {
    const menuItem = document.querySelector('[role="menuitem"]');
    await expect(menuItem).toBeInTheDocument();
  });
}

/**
 * Opens the detail page Actions dropdown (in the page header)
 * This is typically a kebab menu (three dots) for groups or an "Actions" button for other pages
 */
export async function openDetailPageActionsMenu(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>) {
  // Try to find an Actions button first (for pages that have one)
  let actionsButton = canvas.queryByRole('button', { name: 'Actions' });

  // If no Actions button, look for kebab menu by ID (for group detail pages)
  if (!actionsButton) {
    actionsButton = document.getElementById('group-actions-dropdown') as HTMLButtonElement;
  }

  // If still not found, try to find any kebab toggle button using OUIA ID
  if (!actionsButton) {
    const dropdown = document.querySelector('[data-ouia-component-id="group-title-actions-dropdown"]');
    if (dropdown) {
      actionsButton = dropdown.querySelector('button') as HTMLButtonElement;
    }
  }

  // Last resort: find any kebab toggle button
  if (!actionsButton) {
    actionsButton = document.querySelector('.pf-v5-c-dropdown__toggle.pf-m-plain') as HTMLButtonElement;
  }

  if (actionsButton) {
    await user.click(actionsButton);
    await delay(200);

    // Wait for menu to appear
    await waitFor(async () => {
      const menuItem = document.querySelector('[role="menuitem"]');
      await expect(menuItem).toBeInTheDocument();
    });
  } else {
    throw new Error('Could not find Actions button or kebab menu');
  }
}

/**
 * Clicks a menu item from an open dropdown menu
 */
export async function clickMenuItem(user: ReturnType<typeof userEvent.setup>, menuItemText: string) {
  const menuItem = await within(document.body).findByText(menuItemText);
  await expect(menuItem).toBeInTheDocument();
  await user.click(menuItem);
  await delay(200);
}

/**
 * Confirms a deletion in a modal by clicking the Remove/Delete button
 */
export async function confirmDeleteModal(user: ReturnType<typeof userEvent.setup>, confirmationText: string, buttonText: string = 'Remove') {
  // Wait for confirmation modal to appear
  await waitFor(() => {
    const modal = document.querySelector('[role="dialog"]');
    expect(modal).toBeInTheDocument();
  });

  await delay(300); // Give user time to "read" the confirmation

  // Click confirmation button (Remove, Activate, Deactivate, etc.)
  const modal = document.querySelector('[role="dialog"]') as HTMLElement;
  const confirmButton = within(modal).getByRole('button', { name: new RegExp(buttonText, 'i') });
  await user.click(confirmButton);

  // Wait for modal to close
  await waitFor(() => {
    const modal = document.querySelector('[role="dialog"]');
    expect(modal).toBeNull();
  });
}

/**
 * Verifies a success notification appears and no error/warning notifications
 */
export async function verifySuccessNotification() {
  await waitFor(() => {
    const successNotification = document.querySelector('.pf-v5-c-alert.pf-m-success');
    expect(successNotification).toBeInTheDocument();

    // Verify no error or warning notifications
    const errorNotification = document.querySelector('.pf-v5-c-alert.pf-m-danger');
    const warningNotification = document.querySelector('.pf-v5-c-alert.pf-m-warning');
    expect(errorNotification).toBeNull();
    expect(warningNotification).toBeNull();
  });
}

/**
 * Waits for a page/list to load by checking for a specific element
 */
export async function waitForPageToLoad(canvas: ReturnType<typeof within>, elementText: string) {
  await waitFor(async () => {
    await expect(canvas.getByText(elementText)).toBeInTheDocument();
  });
}

/**
 * Navigates to a page by clicking the sidebar navigation link
 */
export async function navigateToPage(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>, linkText: string) {
  const navLink = canvas.getByRole('link', { name: linkText });
  await user.click(navLink);
  await delay(300); // Wait for navigation
}
