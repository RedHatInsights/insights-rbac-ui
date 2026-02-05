import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';

/**
 * Helper function to fill out the Create Role wizard when copying an existing role.
 *
 * Flow:
 * 1. Select "Copy an existing role"
 * 2. Select a source role from the table
 * 3. Keep the default name/description (pre-filled as "Copy of [source]")
 * 4. Review permissions (inherited from source)
 * 5. Submit and verify success
 *
 * @param user The userEvent instance.
 * @param sourceRoleName The name of the role to copy from.
 */
export async function fillCopyRoleWizard(user: ReturnType<typeof userEvent.setup>, sourceRoleName: string) {
  // Wait for the Create Role wizard modal to appear
  const modal = await waitFor(
    () => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      const modalContent = within(dialog as HTMLElement);
      // Wait for the type selector radio buttons to appear
      expect(modalContent.getByRole('radio', { name: /copy an existing role/i })).toBeInTheDocument();
      return dialog as HTMLElement;
    },
    { timeout: 5000 },
  );

  await delay(300);

  // Step 1: Select "Copy an existing role"
  const copyOption = within(modal).getByRole('radio', { name: /copy an existing role/i });
  await user.click(copyOption);
  await delay(500);

  // Wait for roles table to appear
  await waitFor(
    () => {
      const table = within(modal).queryByRole('grid');
      expect(table).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  await delay(300);

  // Select the source role by clicking its radio button
  // The role name appears as a radio button label in the base role table
  const sourceRoleRadio = within(modal).getByRole('radio', { name: new RegExp(sourceRoleName, 'i') });
  await user.click(sourceRoleRadio);
  await delay(300);

  // Click Next to proceed to name/description step
  const buttons1 = within(modal).getAllByRole('button', { name: /^next$/i });
  const nextButton1 = buttons1.find((btn) => btn.classList.contains('pf-m-primary'));
  expect(nextButton1).toBeInTheDocument();
  await waitFor(() => expect(nextButton1!).toBeEnabled(), { timeout: 5000 });
  await user.click(nextButton1!);
  await delay(500);

  // Step 2: Name and description (pre-filled as "Copy of [source]")
  // Wait for the name input to appear (indicates step transition complete)
  await waitFor(
    () => {
      const nameInput = within(modal).queryByLabelText(/role name/i);
      expect(nameInput).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  // The name is pre-filled with "Copy of [source role]" - just wait for async validation
  await delay(1000); // Wait for async validation (debounced)

  // Wait for Next button to become enabled (async validation must complete)
  const buttons2 = within(modal).getAllByRole('button', { name: /^next$/i });
  const nextButton2 = buttons2.find((btn) => btn.classList.contains('pf-m-primary'));
  expect(nextButton2).toBeInTheDocument();
  await waitFor(() => expect(nextButton2!).toBeEnabled(), { timeout: 10000 });
  await user.click(nextButton2!);
  await delay(500);

  // Step 3: Permissions (may be pre-selected from source role)
  // Check if we're on the permissions step
  const permissionsHeading = within(modal).queryByRole('heading', { name: /add permissions/i });
  if (permissionsHeading) {
    // Permissions are inherited from source, just click Next
    const buttons3 = within(modal).getAllByRole('button', { name: /^next$/i });
    const nextButton3 = buttons3.find((btn) => btn.classList.contains('pf-m-primary'));
    if (nextButton3) {
      await waitFor(() => expect(nextButton3).toBeEnabled(), { timeout: 5000 });
      await user.click(nextButton3);
      await delay(500);
    }
  }

  // Step 4: Review and submit
  await waitFor(
    () => {
      const heading = within(modal).queryByRole('heading', { name: /review details/i });
      expect(heading).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  await delay(300);

  // Click Submit
  const submitButton = within(modal).getByRole('button', { name: /submit/i });
  await waitFor(() => expect(submitButton).toBeEnabled(), { timeout: 5000 });
  await user.click(submitButton);

  // Wait for success screen
  await waitFor(
    () => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      const successText = within(dialog as HTMLElement).queryByText(/you have successfully created a new role/i);
      expect(successText).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  await delay(300); // Human moment to see success

  // Click "Exit" button to close the wizard
  const successDialog = document.querySelector('[role="dialog"]') as HTMLElement;
  const exitButton = within(successDialog).getByRole('button', { name: /exit/i });
  await user.click(exitButton);

  // Wait for modal to close
  await waitFor(
    () => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );
}
