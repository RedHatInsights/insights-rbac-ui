import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MyAccess from './MyAccess';
import MyGroups from './my-groups/MyGroups';
import MyWorkspaces from './my-workspaces/MyWorkspaces';
import { groupsHandlers } from '../../../shared/data/mocks/groups.handlers';
import { groupRolesHandlers } from '../../../shared/data/mocks/groupRoles.handlers';
import { workspacesHandlers } from '../../data/mocks/workspaces.handlers';

const meta: Meta<typeof MyAccess> = {
  component: MyAccess,
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [...groupsHandlers(), ...groupRolesHandlers(), ...workspacesHandlers()],
    },
    docs: {
      description: {
        component: `
V2 "My Access" page — shows the current user's groups and workspaces in two tabs.

Follows the same route-based tab pattern as Users & User Groups.

### Design References

<img src="/mocks/my-access/My Access.png" alt="My Access overview" width="400" />
<img src="/mocks/my-access/My Access-1.png" alt="My Access groups tab" width="400" />
<img src="/mocks/my-access/My Access-2.png" alt="My Access workspaces tab" width="400" />
<img src="/mocks/my-access/My Access-3.png" alt="My Access drawer" width="400" />
`,
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/my-access/groups']}>
        <Routes>
          <Route path="/my-access/*" element={<Story />}>
            <Route path="groups/*" element={<MyGroups />} />
            <Route path="workspaces/*" element={<MyWorkspaces />} />
          </Route>
        </Routes>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MyAccess>;

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify default my access', async () => {
      await expect(canvas.findByRole('heading', { name: 'My Access' })).resolves.toBeInTheDocument();
      await expect(canvas.findByText('My groups')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('My workspaces')).resolves.toBeInTheDocument();
    });
  },
};
