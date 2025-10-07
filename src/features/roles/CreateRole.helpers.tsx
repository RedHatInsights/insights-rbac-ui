import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';

/**
 * Helper function to fill out the Create Role wizard (simple flow: create from scratch, add permissions)
 * @param user The userEvent instance.
 * @param roleName The name for the new role.
 * @param roleDescription The description for the new role.
 * @param permissions Array of permission strings to search for and add (e.g., ['insights:*:*'])
 */
export async function fillCreateRoleWizard(
  user: ReturnType<typeof userEvent.setup>,
  roleName: string,
  roleDescription: string,
  permissions: string[] = ['insights:*:*'],
) {
  // Wait for the Create Role wizard modal to appear
  const modal = await waitFor(
    () => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      const modalContent = within(dialog as HTMLElement);
      // Wait for the type selector radio buttons to appear
      expect(modalContent.getByRole('radio', { name: /create a role from scratch/i })).toBeInTheDocument();
      return dialog as HTMLElement;
    },
    { timeout: 5000 },
  );

  await delay(300);

  // Step 1: Select "Create a role from scratch" (should be default, but let's click it to be sure)
  const createOption = within(modal).getByRole('radio', { name: /create a role from scratch/i });
  await user.click(createOption);
  await delay(200);

  // Fill in role name
  const nameInput = within(modal).getByLabelText(/role name/i) as HTMLInputElement;
  await user.click(nameInput);
  await user.type(nameInput, roleName);
  await delay(1000); // Wait for async validation (debounced)

  // Wait for wizard's Next button (primary button) to become enabled, then click it
  const buttons = within(modal).getAllByRole('button', { name: /^next$/i });
  const nextButton = buttons.find((btn) => btn.classList.contains('pf-m-primary'));
  expect(nextButton).toBeInTheDocument();
  await waitFor(() => expect(nextButton!).toBeEnabled(), { timeout: 10000 });
  await user.click(nextButton!);
  await delay(500);

  // Step 2: Add permissions
  // Wait for the permissions table to load
  await waitFor(
    () => {
      const heading = within(modal).queryByRole('heading', { name: /add permissions/i });
      expect(heading).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  await delay(500);

  // Search for and select permissions
  for (const permission of permissions) {
    const searchInput = within(modal).getByPlaceholderText(/filter by application/i) as HTMLInputElement;
    await user.click(searchInput);
    await user.clear(searchInput);
    await user.type(searchInput, permission);
    await delay(500);

    // Wait for filtered results and click the checkbox for the first permission
    await waitFor(
      async () => {
        const checkboxes = within(modal).queryAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );

    // Click the first checkbox (not the "select all" one)
    const checkboxes = within(modal).getAllByRole('checkbox');
    if (checkboxes.length > 1) {
      await user.click(checkboxes[1]); // First actual permission
    }
    await delay(300);
  }

  // Click Next to go to Review step (find the wizard's primary Next button)
  const buttons2 = within(modal).getAllByRole('button', { name: /^next$/i });
  const nextButton2 = buttons2.find((btn) => btn.classList.contains('pf-m-primary'));
  expect(nextButton2).toBeInTheDocument();
  await user.click(nextButton2!);
  await delay(500);

  // Step 3: Review and submit
  await waitFor(
    () => {
      const heading = within(modal).queryByRole('heading', { name: /review details/i });
      expect(heading).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  // Add description in review step if there's a description field
  const descInputs = within(modal).queryAllByLabelText(/description/i);
  if (descInputs.length > 0) {
    const descInput = descInputs[0] as HTMLTextAreaElement;
    await user.click(descInput);
    await user.type(descInput, roleDescription);
    await delay(200);
  }

  await delay(300);

  // Click Submit
  const submitButton = within(modal).getByRole('button', { name: /submit/i });
  await waitFor(() => expect(submitButton).toBeEnabled(), { timeout: 5000 });
  await user.click(submitButton);

  // Wait for success screen (appears in document, not necessarily within the original modal ref)
  await waitFor(
    () => {
      // Looking for the success message in the empty state - check whole document
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      const successText = within(dialog as HTMLElement).queryByText(/you have successfully created a new role/i);
      expect(successText).toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  await delay(300); // Human moment to see success

  // Click "Exit" button to close the wizard (get fresh dialog reference)
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
