import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, waitFor, within } from 'storybook/test';
import { expectLoadingVisible, getTableBodyRowCount } from '../../../../test-utils/interactionHelpers';
import { AssignedUserGroupsTable, type GroupRow } from './AssignedUserGroupsTable';

const sampleGroups: GroupRow[] = [
  { uuid: 'g-1', name: 'Administrators', workspaceAssignment: 'Default workspace' },
  { uuid: 'g-2', name: 'Developers', workspaceAssignment: 'Production workspace' },
];

const meta: Meta = {
  component: AssignedUserGroupsTable,
};

export default meta;
type Story = StoryObj;

export const WithGroups: Story = {
  render: () => <AssignedUserGroupsTable groups={sampleGroups} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify with groups', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      // Column headers (match intl defaultMessage)
      await expect(canvas.findByText('User group')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Workspace assignment')).resolves.toBeInTheDocument();

      // Verify cell data
      await expect(canvas.findByText('Administrators')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Default workspace')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Production workspace')).resolves.toBeInTheDocument();

      // 2 data rows + 1 header row = 3
      const rows = within(table).getAllByRole('row');
      await expect(rows.length).toBe(3);
    });
  },
};

export const Empty: Story = {
  render: () => <AssignedUserGroupsTable groups={[]} />,
  play: async ({ canvasElement, step }) => {
    await step('Verify empty', async () => {
      await waitFor(() => {
        expect(getTableBodyRowCount(canvasElement)).toBe(0);
      });
    });
  },
};

export const Loading: Story = {
  render: () => <AssignedUserGroupsTable groups={undefined} />,
  play: async ({ canvasElement, step }) => {
    await step('Verify loading', async () => {
      await waitFor(() => {
        expectLoadingVisible(canvasElement);
      });
    });
  },
};
