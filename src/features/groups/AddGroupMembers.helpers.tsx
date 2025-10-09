import { userEvent, waitFor, within } from 'storybook/test';

/**
 * Helper function to fill and submit the Add Group Members modal
 *
 * NOTE: This modal is rendered at document.body level, so we use within(document.body)
 * instead of the canvas element.
 *
 * @param user - userEvent instance from the test
 * @param memberUsernames - Array of usernames to select (by row index based on order in table)
 */
export async function fillAddGroupMembersModal(user: ReturnType<typeof userEvent.setup>, memberUsernames: string[]) {
  // Modal is rendered at body level, not in canvas
  const modal = within(document.body);

  // Wait for modal to be visible
  await waitFor(async () => {
    await modal.findByRole('heading', { name: /add members/i });
  });

  // Wait for users table to load in the modal
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Select users by finding their checkboxes
  // The checkboxes are typically labeled "Select row N"
  for (let i = 0; i < memberUsernames.length; i++) {
    const checkbox = modal.getByRole('checkbox', { name: new RegExp(`select row ${i}`, 'i') });
    await user.click(checkbox);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Click "Add to group" button
  await new Promise((resolve) => setTimeout(resolve, 300));
  const submitBtn = modal.getByRole('button', { name: /add to group/i });
  await user.click(submitBtn);
}
