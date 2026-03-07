import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';

/**
 * Helper function to confirm role deletion in the delete modal
 *
 * @param user - The userEvent instance
 */
export async function confirmDeleteRoleModal(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  // Wait for delete confirmation modal
  const modal = await waitFor(
    () => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      const modalContent = within(dialog as HTMLElement);
      // More specific - look for the heading
      expect(modalContent.getByRole('heading', { name: /delete role/i })).toBeInTheDocument();
      return dialog as HTMLElement;
    },
    { timeout: 5000 },
  );

  await delay(300);

  // Check the confirmation checkbox
  const checkbox = within(modal).getByRole('checkbox');
  await user.click(checkbox);
  await delay(200);

  // Click the Delete button
  const deleteButton = within(modal).getByRole('button', { name: /delete role/i });
  await waitFor(() => expect(deleteButton).toBeEnabled(), { timeout: 5000 });
  await user.click(deleteButton);
}
