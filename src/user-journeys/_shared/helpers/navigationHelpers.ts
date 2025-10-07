import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';

/**
 * Opens a row's kebab menu (actions dropdown) by the row's name
 */
export async function openRowActionsMenu(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>, rowName: string) {
  const kebabButton = await canvas.findByRole('button', { name: `${rowName} actions` });
  await user.click(kebabButton);
  await delay(200);

  // Wait for menu to appear
  await waitFor(
    async () => {
      const menuItem = document.querySelector('[role="menuitem"]');
      await expect(menuItem).toBeInTheDocument();
    },
    { timeout: 3000 },
  );
}

/**
 * Opens a role's kebab menu (actions dropdown) - roles have a different aria-label pattern
 */
export async function openRoleActionsMenu(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>, roleName: string) {
  const kebabButton = await canvas.findByRole('button', { name: `Actions for role ${roleName}` });
  await user.click(kebabButton);
  await delay(200);

  // Wait for menu to appear
  await waitFor(
    async () => {
      const menuItem = document.querySelector('[role="menuitem"]');
      await expect(menuItem).toBeInTheDocument();
    },
    { timeout: 3000 },
  );
}

/**
 * Opens the detail page Actions dropdown (in the page header)
 */
export async function openDetailPageActionsMenu(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>) {
  const actionsButton = canvas.getByRole('button', { name: 'Actions' });
  await user.click(actionsButton);
  await delay(200);
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
  await waitFor(
    () => {
      const modal = document.querySelector('[role="dialog"]');
      expect(modal).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  await delay(300); // Give user time to "read" the confirmation

  // Click confirmation button (Remove, Activate, Deactivate, etc.)
  const modal = document.querySelector('[role="dialog"]') as HTMLElement;
  const confirmButton = within(modal).getByRole('button', { name: new RegExp(buttonText, 'i') });
  await user.click(confirmButton);

  // Wait for modal to close
  await waitFor(
    () => {
      const modal = document.querySelector('[role="dialog"]');
      expect(modal).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );
}

/**
 * Verifies a success notification appears and no error/warning notifications
 */
export async function verifySuccessNotification() {
  await waitFor(
    () => {
      const successNotification = document.querySelector('.pf-v5-c-alert.pf-m-success');
      expect(successNotification).toBeInTheDocument();

      // Verify no error or warning notifications
      const errorNotification = document.querySelector('.pf-v5-c-alert.pf-m-danger');
      const warningNotification = document.querySelector('.pf-v5-c-alert.pf-m-warning');
      expect(errorNotification).not.toBeInTheDocument();
      expect(warningNotification).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );
}

/**
 * Waits for a page/list to load by checking for a specific element
 */
export async function waitForPageToLoad(canvas: ReturnType<typeof within>, elementText: string, timeout: number = 10000) {
  await waitFor(
    async () => {
      await expect(canvas.getByText(elementText)).toBeInTheDocument();
    },
    { timeout },
  );
}

/**
 * Navigates to a page by clicking the sidebar navigation link
 */
export async function navigateToPage(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>, linkText: string) {
  const navLink = canvas.getByRole('link', { name: linkText });
  await user.click(navLink);
  await delay(300); // Wait for navigation
}
