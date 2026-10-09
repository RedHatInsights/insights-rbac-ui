import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { accountManagementErrorHandlers, accountManagementHandlers } from '../../../../shared/data/mocks/accountManagement.handlers';
import { queryAlert } from '../../../../test-utils/interactionHelpers';
import InviteUsers from './invite-users-modal-common-auth';

// Emails used across the submit journeys. Kept as constants so the typed input and the
// spy assertions stay in sync and no literal is repeated.
const INVITE_EMAIL_1 = 'newuser1@example.com';
const INVITE_EMAIL_2 = 'newuser2@example.com';
const INVITE_EMAILS = `${INVITE_EMAIL_1}, ${INVITE_EMAIL_2}`;

// `InviteUsers` reads `fetchData` from the router Outlet context (its real parent is
// `UsersListNotSelectable`). The spy lets submit/cancel stories assert the callback.
const fetchDataSpy = fn();

// Captures the parsed invite POST body so submit stories can assert the `permissions` array.
const inviteSpy = fn();

const inviteHandlers = accountManagementHandlers({
  onInvite: (_request, body) => {
    inviteSpy(body);
  },
});

// Supplies the Outlet context the modal depends on, mirroring the production route tree
// (parent route renders `<Outlet context={{ fetchData }} />`, invite modal is the child).
const withOutletContext = (Story: React.ComponentType) => (
  <MemoryRouter initialEntries={['/users/invite']}>
    <Routes>
      <Route path="/users" element={<Outlet context={{ fetchData: fetchDataSpy }} />}>
        <Route
          path="invite"
          element={
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          }
        />
      </Route>
    </Routes>
  </MemoryRouter>
);

const meta: Meta<typeof InviteUsers> = {
  component: InviteUsers,
  tags: ['invite-users'],
  decorators: [withOutletContext],
  parameters: {
    layout: 'fullscreen',
    // Common-auth model on (this modal only mounts under that flag); itless off so the
    // account/v1 invite URL is used and the Manage Support Cases checkbox renders.
    featureFlags: {
      'platform.rbac.common-auth-model': true,
      'platform.rbac.itless': false,
    },
    msw: { handlers: inviteHandlers },
  },
};

export default meta;
type Story = StoryObj<typeof InviteUsers>;

/**
 * Default (common-auth, non-ITLess, advanced permissions off):
 * the Manage Support Cases checkbox ships as a real field, while the still-stubbed
 * Download/Subscriptions fields stay hidden behind the advanced-permissions flag.
 */
export const Default: Story = {
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Modal renders with email + org admin + manage support cases', async () => {
      await body.findByRole('dialog');
      expect(body.getByRole('textbox', { name: /enter the e-mail addresses/i })).toBeInTheDocument();
      expect(body.getByRole('checkbox', { name: /organization administrators/i })).toBeInTheDocument();
      expect(body.getByRole('checkbox', { name: /manage support cases/i })).toBeInTheDocument();
    });

    await step('Stubbed advanced fields are hidden', async () => {
      expect(body.queryByRole('checkbox', { name: /download software and updates/i })).not.toBeInTheDocument();
      expect(body.queryByRole('checkbox', { name: /manage your subscriptions/i })).not.toBeInTheDocument();
    });
  },
};

/**
 * ITLess/FedRAMP: the account API is unavailable, so the Manage Support Cases checkbox
 * must not render. Org admin remains.
 */
export const ITLessHidesManageSupportCases: Story = {
  parameters: {
    featureFlags: {
      'platform.rbac.common-auth-model': true,
      'platform.rbac.itless': true,
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Org admin present, manage support cases hidden', async () => {
      await body.findByRole('dialog');
      expect(body.getByRole('checkbox', { name: /organization administrators/i })).toBeInTheDocument();
      expect(body.queryByRole('checkbox', { name: /manage support cases/i })).not.toBeInTheDocument();
    });
  },
};

/**
 * Advanced permissions flag on: the dormant Download/Subscriptions fields render
 * alongside the shipped Manage Support Cases checkbox.
 */
export const AdvancedPermissions: Story = {
  parameters: {
    featureFlags: {
      'platform.rbac.common-auth-model': true,
      'platform.rbac.common-auth-model_advanced-permissions': true,
      'platform.rbac.itless': false,
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('All customer-portal fields render', async () => {
      await body.findByRole('dialog');
      expect(body.getByRole('checkbox', { name: /manage support cases/i })).toBeInTheDocument();
      expect(body.getByRole('checkbox', { name: /download software and updates/i })).toBeInTheDocument();
      expect(body.getByRole('checkbox', { name: /manage your subscriptions/i })).toBeInTheDocument();
    });
  },
};

/**
 * Checking Manage Support Cases and submitting grants the permission in a single invite
 * call: the POST body carries `permissions: ['portal_manage_cases']` (the IT Account API
 * models portal permissions as a flat string array, not top-level booleans).
 */
export const GrantsManageSupportCasesOnInvite: Story = {
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Reset spies', async () => {
      inviteSpy.mockClear();
      fetchDataSpy.mockClear();
    });

    await step('Fill emails and check Manage Support Cases', async () => {
      await body.findByRole('dialog');
      const emailInput = body.getByRole('textbox', { name: /enter the e-mail addresses/i });
      await userEvent.type(emailInput, INVITE_EMAILS);

      const manageCases = body.getByRole('checkbox', { name: /manage support cases/i });
      await userEvent.click(manageCases);
      expect(manageCases).toBeChecked();
    });

    await step('Submit the invite', async () => {
      const submit = body.getByRole('button', { name: /invite new users/i });
      await waitFor(() => expect(submit).toBeEnabled());
      await userEvent.click(submit);
    });

    await step("Invite POST carries permissions: ['portal_manage_cases']", async () => {
      await waitFor(() => expect(inviteSpy).toHaveBeenCalled());
      const sentBody = inviteSpy.mock.calls[0][0] as { emails?: string[]; permissions?: string[] };
      expect(sentBody.permissions).toContain('portal_manage_cases');
      expect(sentBody.emails).toContain(INVITE_EMAIL_1);
      expect(sentBody.emails).toContain(INVITE_EMAIL_2);
    });

    await step('fetchData is called to close + refresh', async () => {
      await waitFor(() => expect(fetchDataSpy).toHaveBeenCalledWith(true));
    });
  },
};

/**
 * API failure: the invite endpoint returns 500. The modal surfaces an inline danger
 * alert instead of silently closing or hanging. (non-negotiable #25)
 */
export const InviteApiFailure: Story = {
  parameters: {
    msw: { handlers: accountManagementErrorHandlers(500) },
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Reset spies', async () => {
      fetchDataSpy.mockClear();
    });

    await step('Fill emails and submit', async () => {
      await body.findByRole('dialog');
      const emailInput = body.getByRole('textbox', { name: /enter the e-mail addresses/i });
      await userEvent.type(emailInput, INVITE_EMAILS);

      const submit = body.getByRole('button', { name: /invite new users/i });
      await waitFor(() => expect(submit).toBeEnabled());
      await userEvent.click(submit);
    });

    await step('Inline danger alert is shown and modal stays open', async () => {
      await waitFor(() => expect(queryAlert(document.body, 'danger')).toBeInTheDocument());
      expect(body.getByRole('dialog')).toBeInTheDocument();
      expect(fetchDataSpy).not.toHaveBeenCalledWith(true);
    });
  },
};
