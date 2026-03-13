import type { UserEvent } from '@testing-library/user-event';
import { expect, userEvent, waitFor } from 'storybook/test';
import { clearAndType, waitForModal, waitForModalClose } from '../../../test-utils/interactionHelpers';
import { type StepFn, noopStep } from '../../../test-utils/testUtils';

export interface EditGroupFormData {
  name: string;
  description?: string;
}

export async function fillEditGroupModal(
  data: EditGroupFormData,
  waitForCompletion = true,
  user: UserEvent = userEvent.setup(),
  step: StepFn = noopStep,
): Promise<void> {
  const modal = await waitForModal();

  await step('Wait for form to load', async () => {
    await waitFor(
      () => {
        const textboxes = modal.getAllByRole('textbox');
        expect(textboxes.length).toBe(2);
        expect((textboxes[0] as HTMLInputElement).value).not.toBe('');
      },
      { timeout: 5000 },
    );
  });

  await step('Edit group name and description', async () => {
    await clearAndType(user, () => modal.getAllByRole('textbox')[0] as HTMLInputElement, data.name);

    if (data.description !== undefined) {
      await clearAndType(user, () => modal.getAllByRole('textbox')[1] as HTMLTextAreaElement, data.description);
    }
  });

  await step('Save changes', async () => {
    const saveButton = await modal.findByRole('button', { name: /save/i });
    await waitFor(() => expect(saveButton).toBeEnabled(), { timeout: 10000 });
    await user.click(saveButton);
  });

  if (!waitForCompletion) return;

  await step('Wait for modal to close', async () => {
    await waitForModalClose();
  });
}
