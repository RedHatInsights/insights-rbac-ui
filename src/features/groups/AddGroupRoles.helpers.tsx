import { userEvent, waitFor, within } from 'storybook/test';

/**
 * Helper function to fill and submit the Add Group Roles modal
 *
 * @param user - userEvent instance from the test
 * @param groupName - Name of the group (appears in modal title)
 * @param roleCount - Number of roles to select (by row index)
 */
export async function fillAddGroupRolesModal(user: ReturnType<typeof userEvent.setup>, groupName: string, roleCount: number) {
  // In Storybook, modals render to #storybook-modals (from preview-body.html)
  // In production/user journeys, modals render to document.body
  const modalContainer = document.getElementById('storybook-modals') || document.body;

  // Wait for "Add roles" modal to be visible and find the specific modal by its heading
  let addRolesModal: HTMLElement | null = null;
  await waitFor(() => {
    const allDialogs = Array.from(modalContainer.querySelectorAll('[role="dialog"]'));
    // Prefer the dialog that looks like the Add Roles modal.
    // Title text may vary and may not include the group name, so match on:
    // - presence of an "Add to group" primary action, and
    // - some "Add roles" heading/text within the dialog.
    addRolesModal =
      (allDialogs.find((dialog) => {
        const d = dialog as HTMLElement;
        const hasPrimary = within(d).queryByRole('button', { name: /add to group/i }) !== null;
        const hasAddRolesText = within(d).queryByText(/add roles/i) !== null;
        return hasPrimary && hasAddRolesText;
      }) as HTMLElement) ||
      // Fallback: any dialog with an "Add to group" button
      (allDialogs.find((dialog) => within(dialog as HTMLElement).queryByRole('button', { name: /add to group/i }) !== null) as HTMLElement) ||
      null;

    if (!addRolesModal) {
      throw new Error('Add roles modal not found');
    }
  });

  const modal = within(addRolesModal!);

  // Wait for roles table to load in the modal - look for the grid/table
  await waitFor(
    () => {
      const table = modal.queryByRole('grid');
      if (!table) {
        throw new Error('Roles table not found in modal');
      }
    },
    { timeout: 5000 },
  );

  // Give additional time for data to load
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Select roles by checkbox index
  // Note: checkboxes[0] is the BulkSelect checkbox, row checkboxes start at index 1
  const checkboxes = modal.getAllByRole('checkbox');
  for (let i = 0; i < roleCount; i++) {
    // Row checkboxes start at index 1 (index 0 is the bulk select checkbox)
    const checkboxIndex = i + 1;
    if (checkboxIndex < checkboxes.length) {
      await user.click(checkboxes[checkboxIndex]);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  // Click "Add to group" button
  await new Promise((resolve) => setTimeout(resolve, 300));
  const submitBtn = modal.getByRole('button', { name: /add to group/i });
  await user.click(submitBtn);
}
