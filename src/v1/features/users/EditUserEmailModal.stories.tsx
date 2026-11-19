import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { EditUserEmailModal, type EditUserEmailModalProps } from './EditUserEmailModal';
import {
  accountManagementErrorHandlers,
  accountManagementHandlers,
  accountManagementLoadingHandlers,
} from '../../../shared/data/mocks/accountManagement.handlers';
import { clearAndType, waitForModal, waitForModalClose, waitForNotification } from '../../../test-utils/interactionHelpers';

const USER = {
  username: 'john.doe',
  userId: '53159986',
  currentEmail: 'john.doe@redhat.com',
};

const updateEmailSpy = fn();
const closeSpy = fn();
/** Captures the RAW update-user-details body so the wire contract can be asserted (D12). */
const updateBodySpy = fn();

/**
 * Keeps the modal's `isOpen` under story control so the Cancel/Save close paths are observable,
 * while still forwarding a spy so plays can assert `onClose` fired.
 */
const ModalHarness: React.FC<Partial<EditUserEmailModalProps>> = (overrides) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <EditUserEmailModal
      isOpen={isOpen}
      username={USER.username}
      userId={USER.userId}
      currentEmail={USER.currentEmail}
      onClose={() => {
        closeSpy();
        setIsOpen(false);
      }}
      {...overrides}
    />
  );
};

const meta: Meta<typeof EditUserEmailModal> = {
  component: EditUserEmailModal,
  tags: ['users', 'edit-email'],
  parameters: {
    layout: 'fullscreen',
    orgAdmin: true,
    featureFlags: {
      'platform.rbac.common-auth-model': true,
      'platform.rbac.itless': false,
    },
  },
  render: () => <ModalHarness />,
  beforeEach: () => {
    updateEmailSpy.mockClear();
    closeSpy.mockClear();
    updateBodySpy.mockClear();
  },
};

export default meta;
type Story = StoryObj<typeof EditUserEmailModal>;

const successHandlers = () => accountManagementHandlers({ onUpdateEmail: (userId, email) => updateEmailSpy({ userId, email }) });

export const Default: Story = {
  parameters: {
    msw: { handlers: successHandlers() },
  },
  play: async () => {
    const modal = await waitForModal();
    await expect(modal.getByText('Edit email address')).toBeInTheDocument();

    const input = modal.getByLabelText('Email address') as HTMLInputElement;
    await expect(input).toHaveValue(USER.currentEmail);
  },
};

export const SaveValidEmail: Story = {
  parameters: {
    msw: { handlers: successHandlers() },
  },
  play: async () => {
    const user = userEvent.setup();
    const newEmail = 'corrected.address@redhat.com';
    const modal = await waitForModal();

    await clearAndType(user, () => modal.getByLabelText('Email address') as HTMLInputElement, newEmail);
    await user.click(modal.getByRole('button', { name: /save/i }));

    // Submitted through the account API with the edited address.
    await waitForNotification(/success updating user/i);
    await expect(updateEmailSpy).toHaveBeenCalledWith({ userId: USER.userId, email: newEmail });

    // The dialog closes on a successful save.
    await waitForModalClose();
    await expect(closeSpy).toHaveBeenCalled();
  },
};

/**
 * D12 (write contract half) — the save POST carries ONLY the email.
 *
 * `onUpdateEmail` collapses the request to `(userId, email)`, so it cannot see extra keys. The
 * account API rejects an update-user-details body that also includes `id`/`username`/`roles`
 * with 400 "Failed to read request", and a body that also carried `permissions` would overwrite
 * the user's portal grants as a side effect of an email correction.
 */
export const SaveSendsOnlyTheEmailField: Story = {
  parameters: {
    msw: {
      handlers: accountManagementHandlers({
        onUpdateUserDetails: (userId, body) => {
          updateBodySpy({ userId, body });
        },
      }),
    },
  },
  play: async () => {
    const user = userEvent.setup();
    const newEmail = 'only.email@redhat.com';
    const modal = await waitForModal();

    await clearAndType(user, () => modal.getByLabelText('Email address') as HTMLInputElement, newEmail);
    await user.click(modal.getByRole('button', { name: /save/i }));

    await waitForNotification(/success updating user/i);
    await waitFor(() => expect(updateBodySpy).toHaveBeenCalledTimes(1));

    const { userId, body } = updateBodySpy.mock.calls[0][0] as { userId: string; body: Record<string, unknown> };
    await expect(userId).toBe(USER.userId);
    await expect(Object.keys(body)).toEqual(['email']);
    await expect(body.email).toBe(newEmail);
  },
};

export const ValidationError: Story = {
  parameters: {
    msw: { handlers: successHandlers() },
  },
  play: async () => {
    const user = userEvent.setup();
    const modal = await waitForModal();

    const input = modal.getByLabelText('Email address') as HTMLInputElement;
    await user.clear(input);
    await user.click(modal.getByRole('button', { name: /save/i }));

    // Inline validation blocks submission; the API is never called.
    await expect(await modal.findByText(/email address is required/i)).toBeInTheDocument();
    await expect(updateEmailSpy).not.toHaveBeenCalled();

    // A clearly malformed address is rejected too.
    await clearAndType(user, () => modal.getByLabelText('Email address') as HTMLInputElement, 'not-an-email');
    await expect(await modal.findByText(/enter a valid email address/i)).toBeInTheDocument();
    await expect(updateEmailSpy).not.toHaveBeenCalled();
  },
};

export const SaveError: Story = {
  parameters: {
    msw: { handlers: accountManagementErrorHandlers(500) },
  },
  play: async () => {
    const user = userEvent.setup();
    const modal = await waitForModal();

    await clearAndType(user, () => modal.getByLabelText('Email address') as HTMLInputElement, 'corrected.address@redhat.com');
    await user.click(modal.getByRole('button', { name: /save/i }));

    // The admin sees a clear error and the dialog stays open so they can retry.
    await waitForNotification(/failed updating user/i);
    await expect(modal.getByText('Edit email address')).toBeInTheDocument();
    await expect(closeSpy).not.toHaveBeenCalled();
  },
};

export const PendingSaveBlocksClose: Story = {
  parameters: {
    msw: { handlers: accountManagementLoadingHandlers() },
  },
  play: async () => {
    const user = userEvent.setup();
    const newEmail = 'in.flight@redhat.com';
    const modal = await waitForModal();

    await clearAndType(user, () => modal.getByLabelText('Email address') as HTMLInputElement, newEmail);
    await user.click(modal.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(modal.queryByRole('button', { name: /cancel/i })).toBeDisabled());

    await user.keyboard('{Escape}');
    await user.click(modal.getByRole('button', { name: /close/i }));

    await expect(modal.getByText('Edit email address')).toBeInTheDocument();
    await expect(closeSpy).not.toHaveBeenCalled();
    await expect(modal.getByLabelText('Email address')).toHaveValue(newEmail);
  },
};

export const CancelDiscards: Story = {
  parameters: {
    msw: { handlers: successHandlers() },
  },
  play: async () => {
    const user = userEvent.setup();
    const modal = await waitForModal();

    await clearAndType(user, () => modal.getByLabelText('Email address') as HTMLInputElement, 'unsaved.change@redhat.com');
    await user.click(modal.getByRole('button', { name: /cancel/i }));

    // Closing before save discards the change without calling the API.
    await waitForModalClose();
    await expect(closeSpy).toHaveBeenCalled();
    await expect(updateEmailSpy).not.toHaveBeenCalled();
  },
};
