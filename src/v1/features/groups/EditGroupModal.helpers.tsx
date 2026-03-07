import { expect, userEvent, waitFor, within } from 'storybook/test';

// REUSABLE HELPER: Fill Edit Group Modal Form
// Exported for composition in stories (e.g., EditGroupModal.stories.tsx, AppEntry.stories.tsx)
export interface EditGroupFormData {
  name: string;
  description?: string;
}

/**
 * Helper function to fill out the Edit Group Modal form
 * EXPORTED for reuse/composition in E2E tests
 *
 * @param data - Form data to fill
 * @param waitForCompletion - If false, returns immediately after clicking submit (default: true)
 * @param user - Optional custom userEvent instance (e.g., with delay configured). Defaults to userEvent.
 */
export async function fillEditGroupModal(
  data: EditGroupFormData,
  waitForCompletion = true,
  user: ReturnType<typeof userEvent.setup> | typeof userEvent = userEvent,
): Promise<void> {
  // Step 1: Wait for edit modal to appear and load data
  const modal = await waitFor(
    () => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    },
    { timeout: 5000 },
  );

  const modalContent = within(modal);

  // Step 2: Wait for form to be fully loaded - wait for textboxes to be populated
  // The form has 2 textboxes: name (input) and description (textarea)
  await waitFor(
    () => {
      const textboxes = modalContent.getAllByRole('textbox');
      expect(textboxes.length).toBe(2);
      // Wait for name field to be pre-populated
      expect((textboxes[0] as HTMLInputElement).value).not.toBe('');
    },
    { timeout: 5000 },
  );

  // Get fields by role - they're in order: name, description
  const textboxes = modalContent.getAllByRole('textbox');
  const nameField = textboxes[0] as HTMLInputElement;
  const descriptionField = textboxes[1] as HTMLTextAreaElement;

  // Step 3: Edit the group name and description
  // Use direct selection manipulation instead of clear() for CLI test runner compatibility
  // Focus the field first
  await user.click(nameField);
  // Select all text using setSelectionRange
  nameField.setSelectionRange(0, nameField.value.length);
  // Delete the selected text, then type the new value
  await user.keyboard('{Backspace}');
  await user.type(nameField, data.name);

  if (data.description !== undefined) {
    await user.click(descriptionField);
    descriptionField.setSelectionRange(0, descriptionField.value.length);
    await user.keyboard('{Backspace}');
    await user.type(descriptionField, data.description);
  }

  // Step 4: Wait for validation and click Save button
  const saveButton = await modalContent.findByRole('button', { name: /save/i });
  await waitFor(() => expect(saveButton).toBeEnabled(), { timeout: 10000 });
  await user.click(saveButton);

  if (!waitForCompletion) {
    return;
  }

  // Step 5: Wait for modal to close
  await waitFor(
    () => {
      const modal = document.querySelector('[role="dialog"]');
      expect(modal).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );
}
