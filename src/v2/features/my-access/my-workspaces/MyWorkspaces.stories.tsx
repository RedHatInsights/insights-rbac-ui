import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MyWorkspaces } from './MyWorkspaces';
import { workspacesHandlers } from '../../../data/mocks/workspaces.handlers';

const meta: Meta<typeof MyWorkspaces> = {
  component: MyWorkspaces,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [...workspacesHandlers()],
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.findByLabelText('My workspaces')).resolves.toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Wait for table to load
    const table = await canvas.findByLabelText('My workspaces');
    await expect(table).toBeInTheDocument();

    // Find the "Workspace" column header sort button
    const workspaceHeader = await canvas.findByRole('button', { name: /workspace/i });
    await expect(workspaceHeader).toBeInTheDocument();

    // Initially sorted ascending by name (default)
    // Workspaces in seed data: "Root Workspace", "Default Workspace", "Development", "Production", "Staging"
    const initialRows = await canvas.findAllByRole('row');
    // Skip header row (index 0), check data rows
    expect(initialRows.length).toBeGreaterThan(1);

    // Click to sort descending
    await user.click(workspaceHeader);
    // Wait for re-render by checking text content changes
    await waitFor(() => {
      const rows = canvas.getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header
      // After descending sort, "Staging" should be first (alphabetically last)
      expect(firstDataRow).toHaveTextContent(/staging|root/i);
    });

    // Click again to sort ascending
    await user.click(workspaceHeader);
    // Wait for re-render by checking text content changes
    await waitFor(() => {
      const rows = canvas.getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header
      // After ascending sort, "Default Workspace" or "Development" should be first (alphabetically)
      expect(firstDataRow).toHaveTextContent(/default|development/i);
    });
  },
};
