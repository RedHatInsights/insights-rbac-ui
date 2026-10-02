import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { SupportCasesToggle } from './SupportCasesToggle';
import {
  accountManagementErrorHandlers,
  accountManagementHandlers,
  supportCasesTogglePostErrorHandlers,
} from '../data/mocks/accountManagement.handlers';
import { createResettableMap } from '../data/mocks/db';
import { DEFAULT_USER_PERMISSIONS, USER_JANE, USER_JOHN } from '../data/mocks/seed';

const JOHN_ID = String(USER_JOHN.external_source_id);
const JANE_ID = String(USER_JANE.external_source_id);

// Resettable so the POST handler's mutation doesn't leak across play-function reruns.
const toggleOnPermissions = createResettableMap<string, string[]>(Object.entries(DEFAULT_USER_PERMISSIONS));
const toggleOnSpy = fn();

const meta: Meta<typeof SupportCasesToggle> = {
  component: SupportCasesToggle,
  parameters: {
    environment: 'stage',
    orgAdmin: true,
    docs: {
      description: {
        component:
          'A toggle switch for managing the `portal_manage_cases` permission. Fetches current state from the account API and toggles via POST. Hidden in ITLess environments.',
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
  // this run's initial GET (which fires on mount, before the play function).
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
          'When the account detail GET fails, the toggle settles into a disabled state (not a stuck spinner) so a click can never POST permissions built from an empty base.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Toggle renders disabled when the account detail query errors', async () => {
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
