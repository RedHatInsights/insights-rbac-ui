import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, http } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import AddGroupServiceAccounts from './AddGroupServiceAccounts';

// Written using Cursor with gpt-5.2
const postMethodSpy = fn();

// Service accounts payload as returned by the SSO service accounts endpoint
const mockServiceAccounts = [
  {
    id: 'uuid-ci-pipeline-service',
    name: 'ci-pipeline-service',
    clientId: 'service-account-123',
    createdBy: 'platform-team',
    createdAt: 1642636800,
    description: 'CI/CD pipeline automation service account',
  },
  {
    id: 'uuid-monitoring-collector',
    name: 'monitoring-collector',
    clientId: 'service-account-456',
    createdBy: 'ops-team',
    createdAt: 1642550400,
    description: 'Monitoring and metrics collection service',
  },
];

const meta: Meta<typeof AddGroupServiceAccounts> = {
  component: AddGroupServiceAccounts,
  tags: ['add-group-service-accounts'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/groups/detail/test-group-id/service-accounts/add']}>
        <Routes>
          <Route path="/groups/detail/:groupId/service-accounts/add" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
  args: {
    postMethod: postMethodSpy,
    // Provide name to avoid fetching group in story
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
      handlers: [
        // Platform default group lookup (AddGroupServiceAccounts calls useGroupsQuery({ platformDefault: true, limit: 1 }))
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const platformDefault = url.searchParams.get('platform_default');
          const limit = parseInt(url.searchParams.get('limit') || '20', 10);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);

          if (platformDefault === 'true') {
            return HttpResponse.json({
              data: [
                {
                  uuid: 'platform-default-group-uuid',
                  name: 'Default access',
                  platform_default: true,
                  admin_default: false,
                  system: true,
                },
              ],
              meta: { count: 1, limit, offset },
            });
          }

          return HttpResponse.json({ data: [], meta: { count: 0, limit, offset } });
        }),
        // External SSO service accounts endpoint (axiosInstance interceptor returns .data directly)
        http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
          const url = new URL(request.url);
          const first = parseInt(url.searchParams.get('first') || '0');
          const max = parseInt(url.searchParams.get('max') || '20');
          return HttpResponse.json(mockServiceAccounts.slice(first, first + max));
        }),
        // Group principals lookup (used to mark SAs assigned-to-group); in this story none are assigned
        http.get('/api/rbac/v1/groups/:groupId/principals/', () => {
          return HttpResponse.json({
            data: {},
            meta: { count: 0, limit: 20, offset: 0 },
          });
        }),
      ],
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
  play: async () => {
    const modal = await screen.findByRole('dialog');
    const modalContent = within(modal);

    // Modal title should be visible
    await expect(modalContent.findByText(/add service account/i)).resolves.toBeInTheDocument();

    // Primary action disabled until a service account is selected
    const addToGroupButton = await modalContent.findByRole('button', { name: /add to group/i });
    await expect(addToGroupButton).toBeDisabled();

    // Wait for service accounts to appear
    await expect(modalContent.findByText('ci-pipeline-service')).resolves.toBeInTheDocument();

    // Select first row (skip bulk checkbox at [0])
    const table = await modalContent.findByRole('grid');
    const checkboxes = within(table).getAllByRole('checkbox');
    await userEvent.click(checkboxes[1]);

    await waitFor(async () => {
      await expect(addToGroupButton).toBeEnabled();
    });
  },
};

export const CancelClosesModal: Story = {
  play: async () => {
    const modal = await screen.findByRole('dialog');
    const modalContent = within(modal);

    const cancelButton = await modalContent.findByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    // postMethod is used by the parent to close the modal
    await waitFor(async () => {
      await expect(postMethodSpy).toHaveBeenCalled();
    });
  },
};
