import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider } from '@patternfly/react-data-view';
import { HttpResponse, delay, http } from 'msw';

import { GroupDetailsUsersView } from './GroupDetailsUsersView';

const meta: Meta<typeof GroupDetailsUsersView> = {
  component: GroupDetailsUsersView,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <DataViewEventsProvider>
          <div style={{ height: '500px', padding: '1rem' }}>
            <Story />
          </div>
        </DataViewEventsProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
**GroupDetailsUsersView** is a container component that manages user data, React Query state, and business logic for displaying group members.

### Container Responsibilities
- **Data Fetching**: Dispatches \`fetchMembersForGroup\` action on mount
- **State Management**: Handles loading, error, and success states from React Query
- **API Integration**: Interfaces with RBAC API for user data
- **Error Handling**: Provides user-friendly error messages and recovery

### Architecture
- **Smart Component**: Fetches its own data and manages state
- **Data Fetching**: Uses React Query for members data, loading, and error states  
- **MSW Compatible**: Stories use MSW to test real API integration flows
- **State-Driven UI**: Renders different components based on loading/error/success states
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GroupDetailsUsersView>;

export const Default: Story = {
  tags: ['autodocs'],
  args: {
    groupId: 'test-group-id',
    ouiaId: 'group-users-view',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Standard Container View**: Complete API orchestration test. Component dispatches \`fetchMembersForGroup\` action, MSW responds with mock data, React Query updates, and table renders users.

## Additional Container Test Stories

For testing specific container scenarios, see these additional stories:

- **[Loading](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsusersview--loading)**: Tests container behavior during API loading with delay simulation
- **[EmptyGroup](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsusersview--empty-group)**: Tests container response to successful API call with empty data
- **[APIError](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsusersview--api-error)**: Tests container error handling with structured API error responses
- **[NetworkFailure](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsusersview--network-failure)**: Tests container resilience during network/server failures

Each story demonstrates different aspects of container state management and error handling.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request }) => {
          const url = new URL(request.url);
          const type = url.searchParams.get('type');

          // Component calls fetchMembersForGroup which uses principalType=User
          if (!type || type === 'user') {
            return HttpResponse.json({
              data: [
                {
                  username: 'john.doe',
                  email: 'john.doe@example.com',
                  first_name: 'John',
                  last_name: 'Doe',
                  is_active: true,
                  is_org_admin: false,
                },
                {
                  username: 'jane.smith',
                  email: 'jane.smith@example.com',
                  first_name: 'Jane',
                  last_name: 'Smith',
                  is_active: true,
                  is_org_admin: false,
                },
                {
                  username: 'admin.user',
                  email: 'admin@example.com',
                  first_name: 'Admin',
                  last_name: 'User',
                  is_active: true,
                  is_org_admin: true,
                },
              ],
              meta: { count: 3, limit: 1000, offset: 0 },
            });
          }

          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Check that users are displayed
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();

    // Additional users shown
    await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('admin.user')).resolves.toBeInTheDocument();

    // Check first names are shown
    await expect(canvas.findByText('John')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Jane')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Admin')).resolves.toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    groupId: 'test-group-id',
    ouiaId: 'group-users-view-loading',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the loading state with a spinner while the API call is in progress. The component displays a centered spinner with proper aria-label instead of an empty table.',
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/principals/', async () => {
          await delay('infinite');
          return HttpResponse.json({
            data: [],
            meta: { count: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show skeleton loading state while API call is in progress (TableView uses SkeletonTable)
    await expect(canvas.findByLabelText('GroupDetailsUsersView', {}, { timeout: 10000 })).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('john.doe')).not.toBeInTheDocument();
  },
};

export const EmptyGroup: Story = {
  args: {
    groupId: 'empty-group-id',
    ouiaId: 'group-users-view-empty',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the empty state when a group has no users assigned. The API call succeeds but returns an empty array, triggering a friendly empty state with helpful messaging.',
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/principals/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 1000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show empty state inside TableView
    await expect(canvas.findByText('No users found')).resolves.toBeInTheDocument();

    // Should show empty state message
    await expect(canvas.findByText('This group currently has no users assigned to it.')).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('john.doe')).not.toBeInTheDocument();
    await expect(canvas.queryByText('Unable to load users')).not.toBeInTheDocument(); // No error
  },
};

export const APIError: Story = {
  args: {
    groupId: 'error-group-id',
    ouiaId: 'group-users-view-error',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests container error handling when the API returns structured error responses. Shows how the container extracts user-friendly messages from API error format.',
      },
    },
    test: { dangerouslyIgnoreUnhandledErrors: true },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ params }) => {
          const { groupId } = params;

          if (groupId === 'error-group-id') {
            return HttpResponse.json({ errors: [{ detail: 'Group not found' }] }, { status: 404 });
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should render generic failure message instead of table
    await expect(canvas.findByText('Unable to load users')).resolves.toBeInTheDocument();

    // Generic helper text for API/network failures
    await expect(canvas.findByText('Something went wrong. Please try again.')).resolves.toBeInTheDocument();
  },
};

export const NetworkFailure: Story = {
  args: {
    groupId: 'network-error-group-id',
    ouiaId: 'group-users-view-network-error',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests container resilience during network/server failures. Shows how technical error messages (like axios errors) are converted to user-friendly fallback messages.',
      },
    },
    test: { dangerouslyIgnoreUnhandledErrors: true },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ params }) => {
          const { groupId } = params;

          if (groupId === 'network-error-group-id') {
            return HttpResponse.json({ message: 'Request failed with status code 500' }, { status: 500 });
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should render generic failure message
    await expect(canvas.findByText('Unable to load users')).resolves.toBeInTheDocument();

    await expect(canvas.findByText('Something went wrong. Please try again.')).resolves.toBeInTheDocument();
  },
};
