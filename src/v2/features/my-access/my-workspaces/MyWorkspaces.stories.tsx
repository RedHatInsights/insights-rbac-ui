import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
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
