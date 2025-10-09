import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';

/**
 * Helper function to fill out the Edit Role Modal form
 *
 * @param user - The userEvent instance
 * @param roleName - New name for the role
 * @param roleDescription - New description for the role
 */
export async function fillEditRoleModal(user: ReturnType<typeof userEvent.setup>, roleName: string, roleDescription: string): Promise<void> {
  // Wait for edit modal to appear and load data
  const modal = await waitFor(
    () => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      const modalContent = within(dialog as HTMLElement);
      expect(modalContent.getByText('Edit role information')).toBeInTheDocument();
      return dialog as HTMLElement;
    },
    { timeout: 5000 },
  );

  await delay(300);

  // Fill in new name
  const nameInput = within(modal).getByLabelText(/name/i) as HTMLInputElement;
  await user.click(nameInput);
  nameInput.setSelectionRange(0, nameInput.value.length);
  await user.keyboard('{Backspace}');
  await user.type(nameInput, roleName);
  await delay(200);

  // Fill in new description
  const descInput = within(modal).getByLabelText(/description/i) as HTMLTextAreaElement;
  await user.click(descInput);
  descInput.setSelectionRange(0, descInput.value.length);
  await user.keyboard('{Backspace}');
  await user.type(descInput, roleDescription);
  await delay(200);

  // Wait for validation and click Save button
  const submitButton = within(modal).getByRole('button', { name: /save/i });
  await waitFor(() => expect(submitButton).toBeEnabled(), { timeout: 10000 });
  await user.click(submitButton);

  // Wait for modal to close
  await waitFor(
    () => {
      const modal = document.querySelector('[role="dialog"]');
      expect(modal).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );
}
