import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MyGroups } from './MyGroups';
import { groupsHandlers } from '../../../../shared/data/mocks/groups.handlers';
import { groupRolesHandlers } from '../../../../shared/data/mocks/groupRoles.handlers';

const meta: Meta<typeof MyGroups> = {
  component: MyGroups,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [...groupsHandlers(), ...groupRolesHandlers()],
    },
    docs: {
      description: {
        component: `
"My groups" tab — shows groups the current user belongs to.

Clicking a row opens a drawer with the group's assigned roles and their workspace assignments.

### Design References

<img src="/mocks/my-access/My Access-1.png" alt="My Access groups tab" width="400" />
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
type Story = StoryObj<typeof MyGroups>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.findByLabelText('My groups')).resolves.toBeInTheDocument();
  },
};
