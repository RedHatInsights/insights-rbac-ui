import type { UserEvent } from '@testing-library/user-event';
import { expect, waitFor } from 'storybook/test';
import { waitForModal } from '../../../test-utils/interactionHelpers';

export async function confirmDeleteRoleModal(user: UserEvent): Promise<void> {
  const modal = await waitForModal();
  await modal.findByRole('heading', { name: /delete role/i });

  const checkbox = modal.getByRole('checkbox');
  await user.click(checkbox);

  const deleteButton = modal.getByRole('button', { name: /delete role/i });
  await waitFor(() => expect(deleteButton).toBeEnabled(), { timeout: 5000 });
  await user.click(deleteButton);
}
