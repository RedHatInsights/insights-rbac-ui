import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { waitForContentReady } from '../../../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS } from '../../../../test-utils/testUtils';
import { findSortButton } from '../../../../test-utils/tableHelpers';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MyWorkspaces } from './MyWorkspaces';
import { workspacesHandlers } from '../../../data/mocks/workspaces.handlers';
import { roleBindingsHandlers } from '../../../data/mocks/roleBindings.handlers';
import { BINDING_TENANT_ADMIN_JOHN_PROD, DEFAULT_WORKSPACES, WS_DEFAULT, WS_PRODUCTION, WS_STAGING } from '../../../data/mocks/seed';
import { USER_JOHN } from '../../../../shared/data/mocks/seed';

const ALL_WORKSPACE_IDS = DEFAULT_WORKSPACES.map((ws) => ws.id);
const MOCK_ACCOUNT_ID = String(USER_JOHN.external_source_id);

const meta: Meta<typeof MyWorkspaces> = {
  component: MyWorkspaces,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [...workspacesHandlers(), ...roleBindingsHandlers()],
    },
    userIdentity: {
      internal: { account_id: MOCK_ACCOUNT_ID },
    },
    workspacePermissions: {
      view: ALL_WORKSPACE_IDS,
      edit: ALL_WORKSPACE_IDS,
      delete: ALL_WORKSPACE_IDS,
      create: ALL_WORKSPACE_IDS,
      move: ALL_WORKSPACE_IDS,
    },
    docs: {
      description: {
        component: `
"My workspaces" tab — shows workspaces the current user has edit access to.

Each workspace shows an Admin or Viewer badge. Clicking a row opens a drawer
listing the user's role assignments within that workspace.

### Design References

<img src="/mocks/my-access/My Access-2.png" alt="My Access workspaces tab" width="400" />
`,
      },
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
type Story = StoryObj<typeof MyWorkspaces>;

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify default my workspaces', async () => {
      await expect(canvas.findByLabelText('My workspaces')).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Tests sorting functionality for the Workspace column.
 *
 * Verifies that:
 * - The Workspace column header is sortable (has sort button)
 * - Clicking the sort button toggles between ascending and descending order
 * - The data is correctly sorted after each click
 */
export const SortByName: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Wait for data to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Sort descending', async () => {
      const sortButton = await findSortButton(canvas, /workspace/i);
      await user.click(sortButton);
      await waitFor(
        () => {
          const rows = canvas.queryAllByRole('row');
          expect(rows[1]).toHaveTextContent(new RegExp(WS_STAGING.name, 'i'));
        },
        { timeout: TEST_TIMEOUTS.POST_MUTATION_REFRESH },
      );
    });

    await step('Sort ascending', async () => {
      const sortButton = await findSortButton(canvas, /workspace/i);
      await user.click(sortButton);
      await waitFor(
        () => {
          const rows = canvas.queryAllByRole('row');
          expect(rows[1]).toHaveTextContent(new RegExp(WS_DEFAULT.name, 'i'));
        },
        { timeout: TEST_TIMEOUTS.POST_MUTATION_REFRESH },
      );
    });
  },
};

/**
 * Tests the workspace detail drawer. Clicking a workspace row opens a drawer
 * showing the current user's role assignments (via granted_subject_type/granted_subject_id).
 */
export const DrawerShowsUserRoles: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Wait for data to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Click Production workspace row to open drawer', async () => {
      const link = await canvas.findByText(WS_PRODUCTION.name);
      const row = link.closest('tr')!;
      await user.click(row);
    });

    await step('Verify drawer shows role assigned to this user', async () => {
      await waitFor(
        () => {
          const panel = canvas.queryByTestId('detail-drawer-panel');
          expect(panel).toBeInTheDocument();
          expect(panel).toHaveTextContent(BINDING_TENANT_ADMIN_JOHN_PROD.role.name);
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });
  },
};
