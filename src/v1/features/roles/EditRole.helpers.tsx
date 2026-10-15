import type { UserEvent } from '@testing-library/user-event';
import { expect, waitFor } from 'storybook/test';
import { clearAndType, waitForModal, waitForModalClose } from '../../../test-utils/interactionHelpers';
import { type StepFn, noopStep } from '../../../test-utils/testUtils';

export async function fillEditRoleModal(user: UserEvent, roleName: string, roleDescription: string, step: StepFn = noopStep): Promise<void> {
  await step('Wait for edit modal to load', async () => {
    const modal = await waitForModal();
    await modal.findByText('Edit role information');
  });

  const modal = await waitForModal();

  await step('Edit role name and description', async () => {
    await clearAndType(user, () => modal.getByLabelText(/name/i) as HTMLInputElement, roleName);
    await clearAndType(user, () => modal.getByLabelText(/description/i) as HTMLTextAreaElement, roleDescription);
  });

  await step('Save changes', async () => {
    const submitButton = modal.getByRole('button', { name: /save/i });
    await waitFor(() => expect(submitButton).toBeEnabled(), { timeout: 10000 });
    await user.click(submitButton);
  });

  await step('Wait for modal to close', async () => {
    await waitForModalClose();
  });
}
