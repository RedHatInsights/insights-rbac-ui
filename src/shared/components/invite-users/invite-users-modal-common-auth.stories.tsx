import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { accountManagementErrorHandlers, accountManagementHandlers } from '../../data/mocks/accountManagement.handlers';
import { clearAndType, queryAlert, waitForNotification } from '../../../test-utils/interactionHelpers';
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
 * Download field stays hidden behind the advanced-permissions flag.
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
 * Advanced permissions flag on: the dormant Download field renders
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
    const user = userEvent.setup();

    await step('Reset spies', async () => {
      inviteSpy.mockClear();
      fetchDataSpy.mockClear();
    });

    await step('Fill emails and check Manage Support Cases', async () => {
      await body.findByRole('dialog');
      const emailInput = body.getByRole('textbox', { name: /enter the e-mail addresses/i }) as HTMLInputElement;
      await clearAndType(user, () => emailInput, INVITE_EMAILS);

      const manageCases = body.getByRole('checkbox', { name: /manage support cases/i });
      await user.click(manageCases);
      expect(manageCases).toBeChecked();
    });

    await step('Submit the invite', async () => {
      const submit = body.getByRole('button', { name: /invite new users/i });
      await waitFor(() => expect(submit).toBeEnabled());
      await user.click(submit);
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
 * C5 — with no portal permission checked, `permissions` is omitted from the POST body entirely
 * (`users.ts` spreads `...(permissions.length > 0 && { permissions })`), not sent as `[]`.
 * Whether the invite API treats absent and empty identically is an open question with the API
 * owner; this pins the shipped behaviour either way.
 */
export const OmitsPermissionsWhenNothingChecked: Story = {
  play: async ({ step }) => {
    const body = within(document.body);
    const user = userEvent.setup();

    await step('Reset spies', async () => {
      inviteSpy.mockClear();
      fetchDataSpy.mockClear();
    });

    await step('Fill emails only and submit', async () => {
      await body.findByRole('dialog');
      await clearAndType(user, () => body.getByRole('textbox', { name: /enter the e-mail addresses/i }) as HTMLInputElement, INVITE_EMAILS);

      expect(body.getByRole('checkbox', { name: /manage support cases/i })).not.toBeChecked();
      expect(body.getByRole('checkbox', { name: /organization administrators/i })).not.toBeChecked();

      const submit = body.getByRole('button', { name: /invite new users/i });
      await waitFor(() => expect(submit).toBeEnabled());
      await user.click(submit);
    });

    await step('POST body omits the permissions key', async () => {
      await waitFor(() => expect(inviteSpy).toHaveBeenCalled());
      const sentBody = inviteSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(Object.keys(sentBody)).not.toContain('permissions');
      expect(Object.keys(sentBody)).not.toContain('roles');
      expect(sentBody.emails).toEqual([INVITE_EMAIL_1, INVITE_EMAIL_2]);
    });
  },
};

/**
 * C6 — the permissions array carries every checked portal grant, not just the first one.
 * Needs the advanced-permissions flag so the Download field renders alongside support cases.
 */
export const GrantsMultiplePortalPermissions: Story = {
  parameters: {
    featureFlags: {
      'platform.rbac.common-auth-model': true,
      'platform.rbac.common-auth-model_advanced-permissions': true,
      'platform.rbac.itless': false,
    },
  },
  play: async ({ step }) => {
    const body = within(document.body);
    const user = userEvent.setup();

    await step('Reset spies', async () => {
      inviteSpy.mockClear();
      fetchDataSpy.mockClear();
    });

    await step('Check both portal permissions and submit', async () => {
      await body.findByRole('dialog');
      await clearAndType(user, () => body.getByRole('textbox', { name: /enter the e-mail addresses/i }) as HTMLInputElement, INVITE_EMAILS);

      await user.click(body.getByRole('checkbox', { name: /manage support cases/i }));
      await user.click(body.getByRole('checkbox', { name: /download software and updates/i }));

      const submit = body.getByRole('button', { name: /invite new users/i });
      await waitFor(() => expect(submit).toBeEnabled());
      await user.click(submit);
    });

    await step('Both permission codes are present in one array', async () => {
      await waitFor(() => expect(inviteSpy).toHaveBeenCalled());
      const sentBody = inviteSpy.mock.calls[0][0] as { permissions?: string[] };
      expect(sentBody.permissions).toEqual(expect.arrayContaining(['portal_manage_cases', 'portal_download']));
      expect(sentBody.permissions).toHaveLength(2);
    });
  },
};

/**
 * C7 — outside ITLess, an unavailable `org_id` must surface as an error.
 *
 * The legacy `/user/invite` fallback cannot carry portal permissions, so completing the invite
 * through it would report success while silently dropping the requested grants. `users.ts`
 * throws instead; nothing covered that guard until now.
 */
export const MissingOrgIdSurfacesError: Story = {
  parameters: {
    // No org_id on the identity — the state the guard exists for.
    userIdentity: { internal: {} },
  },
  play: async ({ step }) => {
    const body = within(document.body);
    const user = userEvent.setup();

    await step('Reset spies', async () => {
      inviteSpy.mockClear();
      fetchDataSpy.mockClear();
    });

    await step('Fill emails, check a portal grant and submit', async () => {
      await body.findByRole('dialog');
      await clearAndType(user, () => body.getByRole('textbox', { name: /enter the e-mail addresses/i }) as HTMLInputElement, INVITE_EMAILS);
      await user.click(body.getByRole('checkbox', { name: /manage support cases/i }));

      const submit = body.getByRole('button', { name: /invite new users/i });
      await waitFor(() => expect(submit).toBeEnabled());
      await user.click(submit);
    });

    await step('Error is surfaced, no invite is sent, and the modal stays open', async () => {
      await waitForNotification(/failed to send invitation/i);
      expect(inviteSpy).not.toHaveBeenCalled();
      expect(fetchDataSpy).not.toHaveBeenCalledWith(true);
      expect(body.getByRole('dialog')).toBeInTheDocument();
    });
  },
};

/**
 * C8 — an invalid address blocks submit. The equivalent case exists for the legacy
 * `InviteUsersModal` (a different component); this modal had none.
 */
export const InvalidEmailBlocksSubmit: Story = {
  play: async ({ step }) => {
    const body = within(document.body);
    const user = userEvent.setup();

    await step('Reset spies', async () => {
      inviteSpy.mockClear();
    });

    await step('Type a malformed address', async () => {
      await body.findByRole('dialog');
      await clearAndType(user, () => body.getByRole('textbox', { name: /enter the e-mail addresses/i }) as HTMLInputElement, 'not-an-email');
      await user.tab();
    });

    await step('Validation blocks submit and no invite is sent', async () => {
      await expect(body.findByText(/are not valid/i)).resolves.toBeInTheDocument();
      expect(body.getByRole('button', { name: /invite new users/i })).toBeDisabled();
      expect(inviteSpy).not.toHaveBeenCalled();
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
    const user = userEvent.setup();

    await step('Reset spies', async () => {
      fetchDataSpy.mockClear();
    });

    await step('Fill emails and submit', async () => {
      await body.findByRole('dialog');
      const emailInput = body.getByRole('textbox', { name: /enter the e-mail addresses/i }) as HTMLInputElement;
      await clearAndType(user, () => emailInput, INVITE_EMAILS);

      const submit = body.getByRole('button', { name: /invite new users/i });
      await waitFor(() => expect(submit).toBeEnabled());
      await user.click(submit);
    });

    await step('Inline danger alert is shown and modal stays open', async () => {
      await waitFor(() => expect(queryAlert(document.body, 'danger')).toBeInTheDocument());
      expect(body.getByRole('dialog')).toBeInTheDocument();
      expect(fetchDataSpy).not.toHaveBeenCalledWith(true);
    });
  },
};
