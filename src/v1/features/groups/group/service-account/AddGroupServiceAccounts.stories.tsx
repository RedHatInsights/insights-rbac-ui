import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import AddGroupServiceAccounts from './AddGroupServiceAccounts';
import { groupsHandlers } from '../../../../../shared/data/mocks/groups.handlers';
import { serviceAccountsHandlers } from '../../../../../shared/data/mocks/serviceAccounts.handlers';
import { groupMembersHandlers } from '../../../../../shared/data/mocks/groupMembers.handlers';
import type { MockServiceAccount } from '../../../../../shared/data/mocks/db';
import type { GroupOut } from '../../../../../shared/data/mocks/db';

const postMethodSpy = fn();

const storyServiceAccounts: Array<MockServiceAccount & { createdBy?: string; createdAt?: string }> = [
  {
    uuid: 'uuid-ci-pipeline-service',
    name: 'ci-pipeline-service',
    clientId: 'service-account-123',
    owner: 'platform-team',
    timeCreated: '2022-01-20T00:00:00Z',
    description: 'CI/CD pipeline automation service account',
    createdBy: 'platform-team',
    createdAt: '2022-01-20T00:00:00Z',
  },
  {
    uuid: 'uuid-monitoring-collector',
    name: 'monitoring-collector',
    clientId: 'service-account-456',
    owner: 'ops-team',
    timeCreated: '2022-01-19T00:00:00Z',
    description: 'Monitoring and metrics collection service',
    createdBy: 'ops-team',
    createdAt: '2022-01-19T00:00:00Z',
  },
];

const platformDefaultGroup: GroupOut = {
  uuid: 'platform-default-group-uuid',
  name: 'Default access',
  description: 'Platform default group',
  principalCount: 0,
  roleCount: 0,
  created: '2023-01-01T00:00:00Z',
  modified: '2023-01-01T00:00:00Z',
  platform_default: true,
  admin_default: false,
  system: true,
};

const meta: Meta<typeof AddGroupServiceAccounts> = {
  component: AddGroupServiceAccounts,
  tags: ['add-group-service-accounts'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/user-access/groups/detail/test-group-id/service-accounts/add']}>
        <Routes>
          <Route path="/user-access/groups/detail/:groupId/service-accounts/add" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
  args: {
    postMethod: postMethodSpy,
    groupName: 'Test Group',
    isDefault: false,
    isChanged: true,
  },
  parameters: {
    chrome: {
      auth: {
        getToken: () => Promise.resolve('test-token'),
      },
      getEnvironmentDetails: () => ({ sso: 'https://sso.redhat.com' }),
    },
    msw: {
      handlers: [...groupsHandlers([platformDefaultGroup]), ...serviceAccountsHandlers(storyServiceAccounts), ...groupMembersHandlers({}, {})],
    },
  },
  beforeEach: () => {
    postMethodSpy.mockClear();
  },
};

export default meta;
type Story = StoryObj<typeof AddGroupServiceAccounts>;

export const Default: Story = {
  tags: ['autodocs'],
  play: async ({ step }) => {
    await step('Verify modal and service account list', async () => {
      const modal = await screen.findByRole('dialog');
      const modalContent = within(modal);

      await expect(modalContent.findByText(/add service account/i)).resolves.toBeInTheDocument();

      const addToGroupButton = await modalContent.findByRole('button', { name: /add to group/i });
      await expect(addToGroupButton).toBeDisabled();

      await expect(modalContent.findByText(storyServiceAccounts[0].name)).resolves.toBeInTheDocument();
    });

    await step('Select service account and verify Add button enabled', async () => {
      const modal = await screen.findByRole('dialog');
      const modalContent = within(modal);
      const addToGroupButton = await modalContent.findByRole('button', { name: /add to group/i });

      const table = await modalContent.findByRole('grid');
      const checkboxes = within(table).getAllByRole('checkbox');
      await userEvent.click(checkboxes[1]);

      await waitFor(async () => {
        await expect(addToGroupButton).toBeEnabled();
      });
    });
  },
};

export const CancelClosesModal: Story = {
  play: async ({ step }) => {
    await step('Click Cancel and verify postMethod called', async () => {
      const modal = await screen.findByRole('dialog');
      const modalContent = within(modal);

      const cancelButton = await modalContent.findByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      await waitFor(async () => {
        await expect(postMethodSpy).toHaveBeenCalled();
      });
    });
  },
};
