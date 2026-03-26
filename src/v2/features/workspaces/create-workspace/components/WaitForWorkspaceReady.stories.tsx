import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { waitForModal } from '../../../../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS } from '../../../../../test-utils/testUtils';
import { WaitForWorkspaceReady } from './WaitForWorkspaceReady';

const MOCK_WORKSPACE = { id: 'workspace-new-123', name: 'My New Workspace' };

const ALL_PERMISSIONS_FOR_WORKSPACE = {
  view: [MOCK_WORKSPACE.id],
  edit: [MOCK_WORKSPACE.id],
  delete: [MOCK_WORKSPACE.id],
  create: [MOCK_WORKSPACE.id],
  move: [MOCK_WORKSPACE.id],
};

const NO_PERMISSIONS = {
  view: [],
  edit: [],
  delete: [],
  create: [],
  move: [],
};

const meta: Meta<typeof WaitForWorkspaceReady> = {
  component: WaitForWorkspaceReady,
  tags: ['autodocs', 'ff:platform.rbac.workspaces', 'ff:platform.rbac.workspace-hierarchy'],
  parameters: {
    docs: {
      description: {
        component: `
**WaitForWorkspaceReady** is the post-submit progress modal shown after a workspace is created.

It polls the Kessel access SDK (via useSelfAccessCheck) until all workspace permissions
(view, edit, delete, create, move) are propagated to SpiceDB. Three visual states:

- **Polling**: Spinner with progress message while waiting for permissions
- **Ready**: Success icon with "Close" button when all permissions are available
- **Timeout**: Warning with "Close" escape hatch if propagation takes too long (60s)

In Storybook, the SDK hook is mocked via StorybookMockContext. Set
\`workspacePermissions\` to control which workspace IDs have which permissions.
        `,
      },
    },
    featureFlags: {
      'platform.rbac.workspaces': true,
      'platform.rbac.workspace-hierarchy': true,
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WaitForWorkspaceReady>;

export const PollingState: Story = {
  args: {
    workspace: MOCK_WORKSPACE,
    onFinish: fn(),
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the spinner/progress state while polling for workspace permissions. Workspace permissions are empty so the SDK mock returns false for all relations.',
      },
    },
    workspacePermissions: NO_PERMISSIONS,
  },
  play: async ({ step }) => {
    await step('Verify polling state is shown', async () => {
      const body = within(document.body);
      await expect(body.findByText('Setting up your workspace')).resolves.toBeInTheDocument();
      await expect(body.findByText(/Configuring permissions/)).resolves.toBeInTheDocument();
    });
  },
};

export const ReadyState: Story = {
  args: {
    workspace: MOCK_WORKSPACE,
    onFinish: fn(),
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the success state after all workspace permissions are propagated. The "Close" button triggers the onFinish callback.',
      },
    },
    workspacePermissions: ALL_PERMISSIONS_FOR_WORKSPACE,
  },
  play: async ({ args, step }) => {
    await step('Verify success state is shown', async () => {
      const body = within(document.body);
      await expect(body.findByText('Workspace ready', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).resolves.toBeInTheDocument();
      await expect(body.findByText(/has been created and is ready to use/)).resolves.toBeInTheDocument();
    });

    await step('Click Close and verify onFinish is called', async () => {
      const modal = await waitForModal({
        waitUntil: (dlg) => expect(dlg.queryByText('Workspace ready')).toBeInTheDocument(),
      });
      const buttons = await modal.findAllByRole('button', { name: /close/i });
      const closeButton = buttons.find((btn) => btn.textContent?.trim().toLowerCase() === 'close') ?? buttons[0];
      await expect(args.onFinish).not.toHaveBeenCalled();
      await userEvent.click(closeButton);
      await expect(args.onFinish).toHaveBeenCalledTimes(1);
    });
  },
};
