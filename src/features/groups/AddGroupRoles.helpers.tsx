import { userEvent, waitFor, within } from 'storybook/test';

/**
 * Helper function to fill and submit the Add Group Roles modal
 *
 * NOTE: This modal is rendered in the #storybook-modals container in Storybook,
 * or at document.body level in production.
 *
 * @param user - userEvent instance from the test
 * @param groupName - Name of the group (appears in modal title)
 * @param roleCount - Number of roles to select (by row index)
 */
export async function fillAddGroupRolesModal(user: ReturnType<typeof userEvent.setup>, groupName: string, roleCount: number) {
  // Modal is rendered at body level or in #storybook-modals container
  const modalContainer = document.getElementById('storybook-modals') || document.body;

  // Wait for "Add roles" modal to be visible and find the specific modal by its heading
  let addRolesModal: HTMLElement | null = null;
  await waitFor(() => {
    const allDialogs = Array.from(modalContainer.querySelectorAll('[role="dialog"]'));
    // Find the dialog that contains "Add roles to [groupName]" heading
    addRolesModal =
      (allDialogs.find((dialog) => {
        const heading = within(dialog as HTMLElement).queryByRole('heading', { name: new RegExp(`add roles to.*${groupName}`, 'i') });
        return heading !== null;
      }) as HTMLElement) || null;

    if (!addRolesModal) {
      throw new Error('Add roles modal not found');
    }
  });

  const modal = within(addRolesModal!);

  // Wait for roles table to load in the modal
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Select roles by finding their checkboxes
  // The checkboxes are typically labeled "Select row N"
  for (let i = 0; i < roleCount; i++) {
    // Use getAllByRole and pick the first one to handle cases where multiple tables exist
    const checkboxes = modal.getAllByRole('checkbox', { name: new RegExp(`select row ${i}`, 'i') });
    await user.click(checkboxes[0]);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Click "Add to group" button
  await new Promise((resolve) => setTimeout(resolve, 300));
  const submitBtn = modal.getByRole('button', { name: /add to group/i });
  await user.click(submitBtn);
}
