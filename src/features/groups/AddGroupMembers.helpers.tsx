import { userEvent, waitFor, within } from 'storybook/test';

/**
 * Helper function to fill and submit the Add Group Members modal
 *
 * NOTE: This modal is rendered in the #storybook-modals container in Storybook,
 * or at document.body level in production.
 *
 * @param user - userEvent instance from the test
 * @param memberUsernames - Array of usernames to select (by row index based on order in table)
 */
export async function fillAddGroupMembersModal(user: ReturnType<typeof userEvent.setup>, memberUsernames: string[]) {
  // Modal is rendered at body level or in #storybook-modals container
  const modalContainer = document.getElementById('storybook-modals') || document.body;

  // Wait for "Add members" modal to be visible and find the specific modal by its heading
  let addMembersModal: HTMLElement | null = null;
  await waitFor(() => {
    const allDialogs = Array.from(modalContainer.querySelectorAll('[role="dialog"]'));
    // Find the dialog that contains "Add members" heading
    addMembersModal =
      (allDialogs.find((dialog) => {
        const heading = within(dialog as HTMLElement).queryByRole('heading', { name: /add members/i });
        return heading !== null;
      }) as HTMLElement) || null;

    if (!addMembersModal) {
      throw new Error('Add members modal not found');
    }
  });

  const modal = within(addMembersModal!);

  // Wait for users table to load in the modal
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Select users by finding their checkboxes
  // The checkboxes are typically labeled "Select row N"
  for (let i = 0; i < memberUsernames.length; i++) {
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
