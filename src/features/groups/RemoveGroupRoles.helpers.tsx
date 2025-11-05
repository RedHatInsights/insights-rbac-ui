import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';

/**
 * Helper to remove selected roles from a group using the Actions dropdown.
 *
 * This handles:
 * - Finding the correct Actions dropdown (there may be multiple on the page)
 * - Opening the dropdown
 * - Clicking the "Remove" menu item
 * - Confirming the removal in the modal (if confirmModal is true)
 */
export async function removeSelectedRolesFromGroup(
  user: ReturnType<typeof userEvent.setup>,
  canvas: ReturnType<typeof within>,
  confirmModal: boolean = true,
) {
  // Find the bulk actions toggle button (kebab menu in toolbar)
  // Use the specific aria-label to distinguish it from row-level action menus
  const actionsToggle = await waitFor(
    async () => {
      const button = canvas.getByRole('button', { name: /bulk actions toggle/i });
      await expect(button).toBeEnabled();
      return button;
    },
    { timeout: 5000 },
  );

  // Open the dropdown
  await user.click(actionsToggle);
  await delay(300);

  // Click "Remove" from dropdown menu (menu items are rendered in document.body)
  const removeMenuItem = await waitFor(
    async () => {
      const menuItem = within(document.body).getByRole('menuitem', { name: /remove/i });
      await expect(menuItem).toBeInTheDocument();
      return menuItem;
    },
    { timeout: 3000 },
  );

  await user.click(removeMenuItem);

  if (confirmModal) {
    const body = within(document.body);
    const modal = await body.findByRole('dialog', {}, { timeout: 5000 });
    expect(modal).toBeInTheDocument();

    const confirmRemoveBtn = within(modal).getByRole('button', { name: /remove/i });
    await user.click(confirmRemoveBtn);
  }
}
