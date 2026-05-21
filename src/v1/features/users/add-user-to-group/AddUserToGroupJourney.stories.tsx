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
import { DEFAULT_GROUPS, DEFAULT_USERS } from '../../../../shared/data/mocks/seed';
import type { GroupOut, Principal } from '../../../../shared/data/mocks/db';
import { selectTableRow } from '../../../../test-utils/interactionHelpers';

const addMembersToGroupSpy = fn();

const seedUser = DEFAULT_USERS[0];
const seedAdminGroup = DEFAULT_GROUPS.find((g) => g.admin_default)!;
const seedAvailableGroups = DEFAULT_GROUPS.filter((g) => !g.admin_default && !g.platform_default);

const withRouter = (Story: React.ComponentType) => (
  <MemoryRouter initialEntries={[`/iam/user-access/users/detail/${seedUser.username}/add-to-group`]}>
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
        ...usersHandlers([seedUser as unknown as Principal]),
        ...v1RolesHandlers([]),
        ...groupsHandlers([seedAdminGroup, ...seedAvailableGroups] as unknown as GroupOut[]),
        ...groupMembersHandlers({}, {}, { onAddMembers: addMembersToGroupSpy }),
      ],
    },
  },
  beforeEach: () => {
    addMembersToGroupSpy.mockClear();
  },
  play: async ({ step }) => {
    const user = userEvent.setup();
    const body = within(document.body);
    const targetGroup = seedAvailableGroups[0];

    await step('Verify modal appears via outlet context', async () => {
      await body.findByRole('dialog', {}, { timeout: 5000 });
      await body.findByText(targetGroup.name, {}, { timeout: 5000 });
    });

    await step('Select a group and submit', async () => {
      const dialog = within(await body.findByRole('dialog'));
      await selectTableRow(user, dialog, targetGroup.name);

      const saveButton = dialog.getByRole('button', { name: /save/i });
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
      await user.click(saveButton);
    });

    await step('Verify API called with correct username from outlet context', async () => {
      await waitFor(
        () => {
          expect(addMembersToGroupSpy).toHaveBeenCalledWith(
            targetGroup.uuid,
            expect.objectContaining({
              principals: [{ username: seedUser.username }],
            }),
          );
        },
        { timeout: 5000 },
      );
    });
  },
};
