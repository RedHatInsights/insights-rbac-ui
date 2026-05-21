import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { User } from '../User';
import { AddUserToGroup } from './AddUserToGroup';
import ElementWrapper from '../../../../shared/components/ElementWrapper';
import { usersHandlers } from '../../../../shared/data/mocks/users.handlers';
import { groupsHandlers } from '../../../../shared/data/mocks/groups.handlers';
import { groupMembersHandlers } from '../../../../shared/data/mocks/groupMembers.handlers';
import { v1RolesHandlers } from '../../../data/mocks/roles.handlers';
import type { GroupOut, Principal } from '../../../../shared/data/mocks/db';

const addMembersToGroupSpy = fn();

const mockUser = {
  username: 'john.doe',
  email: 'john.doe@redhat.com',
  first_name: 'John',
  last_name: 'Doe',
  is_active: true,
  is_org_admin: false,
};

const mockAdminGroup = {
  uuid: 'admin-group-uuid',
  name: 'Default admin access',
  description: 'Default admin group',
  admin_default: true,
  platform_default: false,
  system: true,
};

const mockAvailableGroups = [
  {
    uuid: 'available-group-1',
    name: 'Engineering',
    description: 'Engineering team',
    platform_default: false,
    admin_default: false,
    roleCount: 2,
    principalCount: 4,
  },
  {
    uuid: 'available-group-2',
    name: 'QA Team',
    description: 'Quality assurance',
    platform_default: false,
    admin_default: false,
    roleCount: 1,
    principalCount: 3,
  },
];

const withRouter = (Story: React.ComponentType) => (
  <MemoryRouter initialEntries={['/iam/user-access/users/detail/john.doe/add-to-group']}>
    <Routes>
      <Route
        path="/iam/user-access/users/detail/:username/*"
        element={
          <div style={{ minHeight: '100vh' }}>
            <Story />
          </div>
        }
      >
        <Route
          path="add-to-group"
          element={
            <ElementWrapper>
              <AddUserToGroup />
            </ElementWrapper>
          }
        />
      </Route>
    </Routes>
  </MemoryRouter>
);

const meta: Meta<typeof User> = {
  component: User,
  title: 'v1/features/users/AddUserToGroupJourney',
  tags: ['journey'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof User>;

export const Default: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    msw: {
      handlers: [
        ...usersHandlers([mockUser as unknown as Principal]),
        ...v1RolesHandlers([]),
        ...groupsHandlers([mockAdminGroup, ...mockAvailableGroups] as unknown as GroupOut[]),
        ...groupMembersHandlers({}, {}, { onAddMembers: addMembersToGroupSpy }),
      ],
    },
  },
  beforeEach: () => {
    addMembersToGroupSpy.mockClear();
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Verify modal appears via outlet context', async () => {
      await body.findByRole('dialog', {}, { timeout: 5000 });
      await body.findByText('Engineering', {}, { timeout: 5000 });
    });

    await step('Select a group and submit', async () => {
      const dialog = await body.findByRole('dialog');
      const checkboxes = within(dialog).getAllByRole('checkbox');
      await userEvent.click(checkboxes[1]);

      const saveButton = within(dialog).getByRole('button', { name: /save/i });
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
      await userEvent.click(saveButton);
    });

    await step('Verify API called with correct username from outlet context', async () => {
      await waitFor(
        () => {
          expect(addMembersToGroupSpy).toHaveBeenCalledWith(
            'available-group-1',
            expect.objectContaining({
              principals: [{ username: 'john.doe' }],
            }),
          );
        },
        { timeout: 5000 },
      );
    });
  },
};
