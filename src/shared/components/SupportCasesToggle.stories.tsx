import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { SupportCasesToggle } from './SupportCasesToggle';
import {
  accountManagementErrorHandlers,
  accountManagementHandlers,
  accountManagementLoadingHandlers,
  supportCasesTogglePostErrorHandlers,
  supportCasesTogglePostPendingHandlers,
} from '../data/mocks/accountManagement.handlers';
import { createResettableMap } from '../data/mocks/db';
import { DEFAULT_USER_PERMISSIONS, USER_JANE, USER_JOHN } from '../data/mocks/seed';
import { PORTAL_MANAGE_CASES, useAccountUsersPermissionsQuery } from '../data/queries/users';
import { waitForNotification } from '../../test-utils/interactionHelpers';

/** Mirrors real usage: the list page bulk-fetches permissions and threads loading down; the toggle reads cache-only. */
const SupportCasesToggleHarness: React.FC<React.ComponentProps<typeof SupportCasesToggle>> = (props) => {
  const { isLoading } = useAccountUsersPermissionsQuery(props.userId ? [props.userId] : []);
  return <SupportCasesToggle {...props} isPermissionsLoading={isLoading} />;
};

const REFETCH_BUTTON_LABEL = 'Refetch permissions';

/**
 * B15 harness: same wiring as the list page, plus a control that forces the bulk permissions
 * query to refetch. Lets a play function replay the account API's read-after-write race without
 * touching timers — real elapsed time stays well inside the 30 s guard window.
 */
const SupportCasesToggleRefetchHarness: React.FC<React.ComponentProps<typeof SupportCasesToggle>> = (props) => {
  const { isLoading, refetch } = useAccountUsersPermissionsQuery(props.userId ? [props.userId] : []);
  return (
    <>
      <SupportCasesToggle {...props} isPermissionsLoading={isLoading} />
      <button type="button" onClick={() => void refetch()}>
        {REFETCH_BUTTON_LABEL}
      </button>
    </>
  );
};

const JOHN_ID = String(USER_JOHN.external_source_id);
const JANE_ID = String(USER_JANE.external_source_id);

// Jane ships seeded with manage-support-cases AND two unrelated portal permissions — exactly the
// shape B6 needs to prove a revoke does not wipe the rest.
const JANE_SEED_PERMISSIONS = DEFAULT_USER_PERMISSIONS[JANE_ID];
const JANE_PERMISSIONS_AFTER_REVOKE = JANE_SEED_PERMISSIONS.filter((permission) => permission !== PORTAL_MANAGE_CASES);
const JOHN_SEED_PERMISSIONS = DEFAULT_USER_PERMISSIONS[JOHN_ID];

const toggleNameFor = (username: string) => new RegExp(`toggle manage support cases for ${username}`, 'i');

// Resettable so the POST handler's mutation doesn't leak across play-function reruns.
const toggleOnPermissions = createResettableMap<string, string[]>(Object.entries(DEFAULT_USER_PERMISSIONS));
const toggleOnSpy = fn();

const meta: Meta<typeof SupportCasesToggle> = {
  component: SupportCasesToggle,
  render: (args) => <SupportCasesToggleHarness {...args} />,
  parameters: {
    environment: 'stage',
    orgAdmin: true,
    docs: {
      description: {
        component:
          'A toggle switch for managing the `portal_manage_cases` permission. Reads its current state cache-only (the list page bulk-fetches permissions for the whole page; the harness below mirrors that) and toggles via a read-modify-write POST. Hidden in ITLess environments.',
      },
    },
    msw: {
      handlers: [
        ...accountManagementHandlers({
          userPermissions: new Map(Object.entries(DEFAULT_USER_PERMISSIONS)),
        }),
      ],
    },
  },
  argTypes: {
    userId: {
      description: 'External source ID (string) of the user',
      control: { type: 'text' },
    },
    username: {
      description: 'Username for accessibility labels',
      control: { type: 'text' },
    },
    isDisabled: {
      description: 'Whether the toggle is disabled (non-admin viewer)',
      control: { type: 'boolean' },
    },
    isActive: {
      description: 'Whether the target user account is active',
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SupportCasesToggle>;

export const PermissionGranted: Story = {
  args: {
    userId: JANE_ID,
    username: USER_JANE.username,
    isDisabled: false,
    isActive: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify toggle is checked (permission granted)', async () => {
      const toggle = await canvas.findByRole('switch', {
        name: new RegExp(`toggle manage support cases for ${USER_JANE.username}`, 'i'),
      });
      await expect(toggle).toBeInTheDocument();
      await expect(toggle).toBeChecked();
      await expect(toggle).not.toBeDisabled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'User who has portal_manage_cases in their permissions array. Switch is checked.',
      },
    },
  },
};

export const PermissionNotGranted: Story = {
  args: {
    userId: JOHN_ID,
    username: USER_JOHN.username,
    isDisabled: false,
    isActive: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify toggle is unchecked (permission not granted)', async () => {
      const toggle = await canvas.findByRole('switch', {
        name: new RegExp(`toggle manage support cases for ${USER_JOHN.username}`, 'i'),
      });
      await expect(toggle).toBeInTheDocument();
      await expect(toggle).not.toBeChecked();
      await expect(toggle).not.toBeDisabled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'User who does NOT have portal_manage_cases. Switch is unchecked.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    userId: JANE_ID,
    username: USER_JANE.username,
    isDisabled: true,
    isActive: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify toggle is disabled', async () => {
      const toggle = await canvas.findByRole('switch', {
        name: new RegExp(`toggle manage support cases for ${USER_JANE.username}`, 'i'),
      });
      await expect(toggle).toBeInTheDocument();
      await expect(toggle).toBeDisabled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state — viewer is not an org admin.',
      },
    },
  },
};

export const InactiveUser: Story = {
  args: {
    userId: JANE_ID,
    username: USER_JANE.username,
    isDisabled: false,
    isActive: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify toggle is disabled for inactive user', async () => {
      const toggle = await canvas.findByRole('switch', {
        name: new RegExp(`toggle manage support cases for ${USER_JANE.username}`, 'i'),
      });
      await expect(toggle).toBeInTheDocument();
      await expect(toggle).toBeDisabled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Inactive user — toggle is disabled regardless of admin status.',
      },
    },
  },
};

export const ToggleOn: Story = {
  args: {
    userId: JOHN_ID,
    username: USER_JOHN.username,
    isDisabled: false,
    isActive: true,
  },
  parameters: {
    msw: {
      handlers: [
        ...accountManagementHandlers({
          userPermissions: toggleOnPermissions,
          onToggleSupportCases: (userId, grant) => {
            toggleOnSpy({ userId, grant });
          },
        }),
      ],
    },
    docs: {
      description: {
        story: 'Click to grant the permission — toggle turns on and POST is sent.',
      },
    },
  },
  // Reset before render so a prior rerun's granted permission doesn't leak into
  // this run's initial bulk search (which fires on mount, before the play function).
  beforeEach: () => {
    toggleOnPermissions.reset();
    toggleOnSpy.mockClear();
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click toggle to grant permission', async () => {
      const toggle = await canvas.findByRole('switch', {
        name: new RegExp(`toggle manage support cases for ${USER_JOHN.username}`, 'i'),
      });
      await expect(toggle).not.toBeChecked();

      await userEvent.click(toggle);

      await waitFor(() => expect(toggle).toBeChecked());
    });

    await step('Verify POST fired to grant the permission', async () => {
      await waitFor(() => {
        expect(toggleOnSpy).toHaveBeenCalledWith(expect.objectContaining({ userId: JOHN_ID, grant: true }));
      });
    });
  },
};

export const ToggleError: Story = {
  args: {
    userId: JOHN_ID,
    username: USER_JOHN.username,
    isDisabled: false,
    isActive: true,
  },
  parameters: {
    msw: {
      handlers: [
        // POST toggle fails (listed first so it wins over the success POST handler),
        // while the GET still succeeds so the initial state loads and the optimistic
        // update has a cached value to roll back.
        ...supportCasesTogglePostErrorHandlers(500),
        ...accountManagementHandlers({
          userPermissions: new Map(Object.entries(DEFAULT_USER_PERMISSIONS)),
        }),
      ],
    },
    docs: {
      description: {
        story: 'When the toggle POST fails, the optimistic update rolls back and the switch returns to its previous state.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Toggle rolls back to unchecked after a failed POST', async () => {
      const toggle = await canvas.findByRole('switch', {
        name: new RegExp(`toggle manage support cases for ${USER_JOHN.username}`, 'i'),
      });
      await expect(toggle).not.toBeChecked();

      await userEvent.click(toggle);

      // Optimistic update flips it on, then onError rolls it back off.
      await waitFor(() => expect(toggle).not.toBeChecked());
    });
  },
};

export const PermissionsOmitted: Story = {
  args: {
    userId: JOHN_ID,
    username: USER_JOHN.username,
    isDisabled: false,
    isActive: true,
  },
  parameters: {
    msw: {
      handlers: [
        // Bulk search omits this user's `permissions` key — the seeding guard skips it, so the toggle stays disabled.
        ...accountManagementHandlers({
          userPermissions: new Map(Object.entries(DEFAULT_USER_PERMISSIONS)),
          omitSearchPermissionsForIds: [JOHN_ID],
        }),
      ],
    },
    docs: {
      description: {
        story: "When the bulk search omits a user's permissions, the seeding guard leaves the cache empty and the toggle stays disabled.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Toggle is disabled when permissions were omitted from the bulk response', async () => {
      const toggle = await canvas.findByRole('switch', {
        name: new RegExp(`toggle manage support cases for ${USER_JOHN.username}`, 'i'),
      });
      await expect(toggle).toBeDisabled();
      await expect(toggle).not.toBeChecked();
    });
  },
};

export const QueryError: Story = {
  args: {
    userId: JOHN_ID,
    username: USER_JOHN.username,
    isDisabled: false,
    isActive: true,
  },
  parameters: {
    msw: {
      handlers: [...accountManagementErrorHandlers(500)],
    },
    docs: {
      description: {
        story:
          'When the bulk permissions search fails, the toggle settles into a disabled state (not a stuck spinner) so a click can never POST permissions built from an empty base.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Toggle renders disabled when the permissions query errors', async () => {
      // Allow the query (with retry) to settle into its error state before asserting.
      const toggle = await canvas.findByRole(
        'switch',
        { name: new RegExp(`toggle manage support cases for ${USER_JOHN.username}`, 'i') },
        { timeout: 5000 },
      );
      await expect(toggle).toBeDisabled();
      await expect(toggle).not.toBeChecked();
    });
  },
};

// ---------------------------------------------------------------------------
// Write contract — what actually goes over the wire (B6, B7)
// ---------------------------------------------------------------------------

const revokePermissions = createResettableMap<string, string[]>(Object.entries(DEFAULT_USER_PERMISSIONS));
const revokeBodySpy = fn();

/**
 * B6 — revoking manage-support-cases must preserve the user's OTHER portal permissions.
 *
 * The POST body is a read-modify-write built from the cached permissions array
 * (`useToggleManageSupportCasesMutation`), so an implementation that posted `[]` would silently
 * strip a real user's download / subscription-management grants. The existing `ToggleOn` story
 * only inspects the `{ userId, grant }` summary, never the array — this one asserts the array.
 */
export const RevokePreservesOtherPermissions: Story = {
  args: {
    userId: JANE_ID,
    username: USER_JANE.username,
    isDisabled: false,
    isActive: true,
  },
  parameters: {
    msw: {
      handlers: [
        ...accountManagementHandlers({
          userPermissions: revokePermissions,
          onUpdateUserDetails: (userId, body) => {
            revokeBodySpy({ userId, body });
          },
        }),
      ],
    },
    docs: {
      description: {
        story:
          'Revoking manage support cases posts the remaining portal permissions untouched. Guards the read-modify-write against wiping unrelated grants.',
      },
    },
  },
  beforeEach: () => {
    revokePermissions.reset();
    revokeBodySpy.mockClear();
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Seed exercises the case (other permissions present alongside manage cases)', async () => {
      await expect(JANE_SEED_PERMISSIONS).toContain(PORTAL_MANAGE_CASES);
      await expect(JANE_PERMISSIONS_AFTER_REVOKE.length).toBeGreaterThan(0);
    });

    await step('Revoke manage support cases', async () => {
      const toggle = await canvas.findByRole('switch', { name: toggleNameFor(USER_JANE.username) });
      await expect(toggle).toBeChecked();

      await userEvent.click(toggle);

      await waitFor(() => expect(toggle).not.toBeChecked());
    });

    await step('POSTed permissions array keeps the other grants and drops only manage cases', async () => {
      await waitFor(() => expect(revokeBodySpy).toHaveBeenCalled());

      const { userId, body } = revokeBodySpy.mock.calls[0][0] as { userId: string; body: { permissions?: string[] } };
      expect(userId).toBe(JANE_ID);
      expect(body.permissions).toEqual(JANE_PERMISSIONS_AFTER_REVOKE);
      expect(body.permissions).not.toContain(PORTAL_MANAGE_CASES);
    });
  },
};

const bodyShapePermissions = createResettableMap<string, string[]>(Object.entries(DEFAULT_USER_PERMISSIONS));
const bodyShapeSpy = fn();

/**
 * B7 — the update-user-details DTO accepts ONLY `permissions`. Sending `id`/`username`/`roles`
 * alongside it makes the server reject the whole write with 400 "Failed to read request".
 * Until now that constraint lived solely in a code comment.
 */
export const PostBodyCarriesOnlyPermissions: Story = {
  args: {
    userId: JOHN_ID,
    username: USER_JOHN.username,
    isDisabled: false,
    isActive: true,
  },
  parameters: {
    msw: {
      handlers: [
        ...accountManagementHandlers({
          userPermissions: bodyShapePermissions,
          onUpdateUserDetails: (userId, body) => {
            bodyShapeSpy({ userId, body });
          },
        }),
      ],
    },
    docs: {
      description: {
        story: 'The toggle POST body is exactly `{ permissions }` — no id, username or roles, which the account API rejects with a 400.',
      },
    },
  },
  beforeEach: () => {
    bodyShapePermissions.reset();
    bodyShapeSpy.mockClear();
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Grant manage support cases', async () => {
      const toggle = await canvas.findByRole('switch', { name: toggleNameFor(USER_JOHN.username) });
      await expect(toggle).not.toBeChecked();

      await userEvent.click(toggle);

      await waitFor(() => expect(toggle).toBeChecked());
    });

    await step('Request body has the `permissions` key and nothing else', async () => {
      await waitFor(() => expect(bodyShapeSpy).toHaveBeenCalled());

      const { body } = bodyShapeSpy.mock.calls[0][0] as { body: Record<string, unknown> };
      expect(Object.keys(body)).toEqual(['permissions']);
      expect(body.permissions).toEqual([...JOHN_SEED_PERMISSIONS, PORTAL_MANAGE_CASES]);
    });
  },
};

// ---------------------------------------------------------------------------
// Notifications (B9, B10)
// ---------------------------------------------------------------------------

/**
 * B9 — a failed toggle raises a danger notification.
 *
 * NOTE: the mutation reuses the generic `editUserError*` copy, so the user is told
 * "Failed updating user" with no mention of support cases. This story asserts the copy that
 * ships today; if the team decides that is a copy bug, this is the guard for the fix.
 */
export const ToggleErrorNotification: Story = {
  args: {
    userId: JOHN_ID,
    username: USER_JOHN.username,
    isDisabled: false,
    isActive: true,
  },
  parameters: {
    msw: {
      handlers: [
        ...supportCasesTogglePostErrorHandlers(500),
        ...accountManagementHandlers({
          userPermissions: new Map(Object.entries(DEFAULT_USER_PERMISSIONS)),
        }),
      ],
    },
    docs: {
      description: {
        story: 'A non-2xx toggle POST raises a danger notification (generic "Failed updating user" copy).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click the toggle against a failing endpoint', async () => {
      const toggle = await canvas.findByRole('switch', { name: toggleNameFor(USER_JOHN.username) });
      await userEvent.click(toggle);
    });

    await step('Danger notification is raised', async () => {
      await waitForNotification(/failed updating user/i);
    });
  },
};

const successNotificationPermissions = createResettableMap<string, string[]>(Object.entries(DEFAULT_USER_PERMISSIONS));

/**
 * B10 — a successful toggle raises a success notification. Same caveat as B9: the copy is the
 * generic "Success updating user", not support-cases specific.
 */
export const ToggleSuccessNotification: Story = {
  args: {
    userId: JOHN_ID,
    username: USER_JOHN.username,
    isDisabled: false,
    isActive: true,
  },
  parameters: {
    msw: {
      handlers: [
        ...accountManagementHandlers({
          userPermissions: successNotificationPermissions,
        }),
      ],
    },
    docs: {
      description: {
        story: 'A successful toggle POST raises a success notification (generic "Success updating user" copy).',
      },
    },
  },
  beforeEach: () => {
    successNotificationPermissions.reset();
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Grant manage support cases', async () => {
      const toggle = await canvas.findByRole('switch', { name: toggleNameFor(USER_JOHN.username) });
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toBeChecked());
    });

    await step('Success notification is raised', async () => {
      await waitForNotification(/success updating user/i);
    });
  },
};

// ---------------------------------------------------------------------------
// Loading and concurrency (B13, B14)
// ---------------------------------------------------------------------------

/** B13 — while the page-level bulk fetch is in flight the cell shows a spinner, not a switch. */
export const PermissionsLoading: Story = {
  args: {
    userId: JOHN_ID,
    username: USER_JOHN.username,
    isDisabled: false,
    isActive: true,
  },
  parameters: {
    msw: {
      handlers: [...accountManagementLoadingHandlers()],
    },
    docs: {
      description: {
        story: 'While the bulk permissions search is in flight the toggle is replaced by a labelled spinner.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Spinner renders instead of the switch', async () => {
      await expect(canvas.findByLabelText(`Loading support cases permission for ${USER_JOHN.username}`)).resolves.toBeInTheDocument();
      expect(canvas.queryByRole('switch')).not.toBeInTheDocument();
    });
  },
};

const doubleTogglePermissions = createResettableMap<string, string[]>(Object.entries(DEFAULT_USER_PERMISSIONS));
const doubleTogglePostSpy = fn();

/**
 * B14 — a second click while the first write is still in flight must not issue a second POST.
 * `isToggleDisabled` folds in `toggleMutation.isPending`, so the second click lands on a
 * disabled control. The POST is held open for the whole play function so the assertion can't flake.
 */
export const RapidDoubleToggleSendsOnePost: Story = {
  args: {
    userId: JOHN_ID,
    username: USER_JOHN.username,
    isDisabled: false,
    isActive: true,
  },
  parameters: {
    msw: {
      handlers: [
        // Only the toggle POST hangs; the bulk search still resolves so the initial state loads.
        ...supportCasesTogglePostPendingHandlers({
          onPost: (userId, body) => {
            doubleTogglePostSpy({ userId, body });
          },
        }),
        ...accountManagementHandlers({ userPermissions: doubleTogglePermissions }),
      ],
    },
    docs: {
      description: {
        story: 'Clicking twice while the write is in flight issues exactly one POST — the pending mutation disables the switch.',
      },
    },
  },
  beforeEach: () => {
    doubleTogglePermissions.reset();
    doubleTogglePostSpy.mockClear();
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('First click starts the write and disables the switch', async () => {
      const toggle = await canvas.findByRole('switch', { name: toggleNameFor(USER_JOHN.username) });
      await expect(toggle).not.toBeDisabled();

      await userEvent.click(toggle);

      await waitFor(() => expect(toggle).toBeDisabled());
    });

    await step('Second click lands on the disabled control and issues no further POST', async () => {
      const toggle = await canvas.findByRole('switch', { name: toggleNameFor(USER_JOHN.username) });
      await userEvent.click(toggle);

      await waitFor(() => expect(doubleTogglePostSpy).toHaveBeenCalledTimes(1));
      await expect(toggle).toBeDisabled();
      expect(doubleTogglePostSpy).toHaveBeenCalledTimes(1);
    });
  },
};

// ---------------------------------------------------------------------------
// Read-after-write guard (B15)
// ---------------------------------------------------------------------------

const staleRefetchPermissions = createResettableMap<string, string[]>(Object.entries(DEFAULT_USER_PERMISSIONS));
// The bulk search answers from a frozen pre-toggle snapshot, so a refetch returns exactly what
// the real eventually-consistent account API returns right after a write.
const staleSearchPermissions = new Map<string, string[]>(Object.entries(DEFAULT_USER_PERMISSIONS));
const staleSearchSpy = fn();

/**
 * B15 — a bulk refetch inside the read-after-write window must not clobber a just-toggled row.
 *
 * `useAccountUsersPermissionsQuery` skips re-seeding any cache entry written within
 * `ACCOUNT_USER_STALE_TIME`, because the account API is read-after-write inconsistent. Toggling
 * writes the entry via `onMutate` + `onSuccess`, so `dataUpdatedAt` is "now" and the stale read
 * below is ignored. Without the guard the switch would silently flip back to the server's old
 * value — i.e. the admin would see their change undo itself.
 */
export const StaleRefetchDoesNotClobberToggle: Story = {
  args: {
    userId: JOHN_ID,
    username: USER_JOHN.username,
    isDisabled: false,
    isActive: true,
  },
  render: (args) => <SupportCasesToggleRefetchHarness {...args} />,
  parameters: {
    msw: {
      handlers: [
        ...accountManagementHandlers({
          userPermissions: staleRefetchPermissions,
          searchPermissionsOverride: staleSearchPermissions,
          onSearchUsers: (ids) => {
            staleSearchSpy(ids);
          },
        }),
      ],
    },
    docs: {
      description: {
        story:
          'After a toggle, a bulk refetch returning the pre-update state leaves the switch on its new value — the read-after-write guard wins over the stale read.',
      },
    },
  },
  beforeEach: () => {
    staleRefetchPermissions.reset();
    staleSearchSpy.mockClear();
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Grant manage support cases', async () => {
      const toggle = await canvas.findByRole('switch', { name: toggleNameFor(USER_JOHN.username) });
      await expect(toggle).not.toBeChecked();

      await userEvent.click(toggle);

      await waitFor(() => expect(toggle).toBeChecked());
      await waitFor(() => expect(staleRefetchPermissions.get(JOHN_ID)).toContain(PORTAL_MANAGE_CASES));
    });

    await step('Force a bulk refetch that returns the pre-update state', async () => {
      await waitFor(() => expect(staleSearchSpy).toHaveBeenCalledTimes(1));

      await userEvent.click(await canvas.findByRole('button', { name: REFETCH_BUTTON_LABEL }));

      await waitFor(() => expect(staleSearchSpy).toHaveBeenCalledTimes(2));
      // The stale response really did omit the grant — otherwise the assertion below is vacuous.
      expect(staleSearchPermissions.get(JOHN_ID)).not.toContain(PORTAL_MANAGE_CASES);
    });

    await step('Toggle keeps its new value', async () => {
      const toggle = await canvas.findByRole('switch', { name: toggleNameFor(USER_JOHN.username) });
      await expect(toggle).toBeChecked();
    });
  },
};
