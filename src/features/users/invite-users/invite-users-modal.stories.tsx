import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import InviteUsersModal from './invite-users-modal';

// Spy for fetchData prop
const fetchDataSpy = fn();

// Router decorator
const withRouter = (Story: any) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/users/invite-users"
          element={
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          }
        />
        <Route path="/users" element={<div data-testid="users-page">Users Page</div>} />
        <Route path="*" element={<Navigate to="/users/invite-users" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const meta: Meta<typeof InviteUsersModal> = {
  component: InviteUsersModal,
  tags: ['invite-users', 'custom-css'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    fetchData: fetchDataSpy,
  },
};

export default meta;
type Story = StoryObj<typeof InviteUsersModal>;

/**
 * Default state - Modal is open with empty form
 */
export const Default: Story = {
  play: async () => {
    await delay(300);
    const body = within(document.body);

    // Modal should be visible
    const modal = await body.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Title should be visible
    expect(body.getByText(/invite users/i)).toBeInTheDocument();

    // Email text area should be present
    const emailInput = body.getByRole('textbox');
    expect(emailInput).toBeInTheDocument();

    // Admin checkbox should be present and unchecked
    const adminCheckbox = body.getByRole('checkbox');
    expect(adminCheckbox).toBeInTheDocument();
    expect(adminCheckbox).not.toBeChecked();

    // Save button should be disabled (no emails entered)
    const saveButton = body.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();

    // Cancel button should be enabled
    const cancelButton = body.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeEnabled();
  },
};

/**
 * Enter valid emails - Save button becomes enabled
 */
export const EnterValidEmails: Story = {
  play: async () => {
    await delay(300);
    const body = within(document.body);

    // Email text area
    const emailInput = body.getByRole('textbox');
    expect(emailInput).toBeInTheDocument();

    // Save button should initially be disabled
    const saveButton = body.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();

    // Enter valid email addresses
    await userEvent.type(emailInput, 'user1@example.com, user2@example.com');
    expect(emailInput).toHaveValue('user1@example.com, user2@example.com');

    // Save button should now be enabled
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  },
};

/**
 * Enter invalid emails - Save button remains disabled
 */
export const EnterInvalidEmails: Story = {
  play: async () => {
    await delay(300);
    const body = within(document.body);

    // Email text area
    const emailInput = body.getByRole('textbox');

    // Save button should initially be disabled
    const saveButton = body.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();

    // Enter invalid text (not emails)
    await userEvent.type(emailInput, 'not an email, also not valid');
    expect(emailInput).toHaveValue('not an email, also not valid');

    // Wait a bit for the email extraction to run
    await delay(200);

    // Save button should still be disabled (no valid emails)
    expect(saveButton).toBeDisabled();
  },
};

/**
 * Toggle admin checkbox
 */
export const ToggleAdminCheckbox: Story = {
  play: async () => {
    await delay(300);
    const body = within(document.body);

    // Find and verify admin checkbox
    const adminCheckbox = body.getByRole('checkbox');
    expect(adminCheckbox).not.toBeChecked();

    // Click to check
    await userEvent.click(adminCheckbox);
    expect(adminCheckbox).toBeChecked();

    // Click to uncheck
    await userEvent.click(adminCheckbox);
    expect(adminCheckbox).not.toBeChecked();
  },
};

/**
 * Expand admin description section
 */
export const ExpandAdminDescription: Story = {
  play: async () => {
    await delay(300);
    const body = within(document.body);

    // Find the expandable toggle button
    const expandToggle = body.getByRole('button', { name: /organization administrator/i });
    expect(expandToggle).toBeInTheDocument();

    // Click to expand
    await userEvent.click(expandToggle);

    // Description should be visible after expansion
    await waitFor(() => {
      // The description text about org admin privileges should appear
      const expandedContent = document.querySelector('.pf-v5-c-expandable-section__content');
      expect(expandedContent).toBeInTheDocument();
    });
  },
};

/**
 * Cancel without changes - verifies cancel button is present and clickable
 */
export const CancelWithoutChanges: Story = {
  play: async () => {
    await delay(300);
    const body = within(document.body);

    // Find cancel button
    const cancelButton = body.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();
  },
};

/**
 * Save button enabled state with valid emails and admin checkbox
 */
export const SaveButtonEnabledWithValidEmails: Story = {
  play: async () => {
    await delay(300);
    const body = within(document.body);

    // Enter valid emails
    const emailInput = body.getByRole('textbox');
    await userEvent.type(emailInput, 'user1@example.com, user2@example.com');
    await delay(200);

    // Check admin checkbox
    const adminCheckbox = body.getByRole('checkbox');
    await userEvent.click(adminCheckbox);
    expect(adminCheckbox).toBeChecked();

    // Verify save button is enabled
    const saveButton = body.getByRole('button', { name: /save/i });
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  },
};

/**
 * Mixed valid and invalid emails - only valid ones enable save
 */
export const MixedValidInvalidEmails: Story = {
  play: async () => {
    await delay(300);
    const body = within(document.body);

    // Save button should initially be disabled
    const saveButton = body.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();

    // Enter mixed valid and invalid emails
    const emailInput = body.getByRole('textbox');
    await userEvent.type(emailInput, 'valid@example.com, not-an-email, another.valid@test.org, @invalid');

    await delay(200);

    // Save button should be enabled (valid emails were found)
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  },
};

/**
 * Admin checkbox unchecked by default
 */
export const AdminCheckboxUncheckedByDefault: Story = {
  play: async () => {
    await delay(300);
    const body = within(document.body);

    // Admin checkbox should be unchecked by default
    const adminCheckbox = body.getByRole('checkbox');
    expect(adminCheckbox).not.toBeChecked();

    // Enter valid email
    const emailInput = body.getByRole('textbox');
    await userEvent.type(emailInput, 'user@example.com');
    await delay(200);

    // Save button should be enabled
    const saveButton = body.getByRole('button', { name: /save/i });
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  },
};
