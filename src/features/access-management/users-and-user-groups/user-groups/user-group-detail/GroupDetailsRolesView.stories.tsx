import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider } from '@patternfly/react-data-view';
import { HttpResponse, delay, http } from 'msw';

import { GroupDetailsRolesView } from './GroupDetailsRolesView';

const meta: Meta<typeof GroupDetailsRolesView> = {
  component: GroupDetailsRolesView,
  tags: ['access-management-container'],
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
**GroupDetailsRolesView** is a container component that manages role data, Redux state, and business logic for displaying group assigned roles.

### Container Responsibilities
- **Data Fetching**: Dispatches \`fetchRolesForGroup\` action on mount
- **State Management**: Handles loading, error, and success states from Redux
- **API Integration**: Interfaces with RBAC API for role data
- **Error Handling**: Provides user-friendly error messages and recovery

### Architecture
- **Smart Component**: Fetches its own data and manages state
- **Redux Connected**: Uses selectors for roles data, loading, and error states  
- **MSW Compatible**: Stories use MSW to test real API integration flows
- **State-Driven UI**: Renders different components based on loading/error/success states
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GroupDetailsRolesView>;

export const Default: Story = {
  args: {
    groupId: 'test-group-id',
    ouiaId: 'group-roles-view-default',
  },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**Container Component Pattern**: This is a container component that manages API orchestration for displaying roles within a group. It dispatches Redux actions to fetch data and handles loading, error, and empty states.

## Container Test Stories

This component includes several test scenarios to verify different container behaviors:

- **[Loading](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsrolesview--loading)**: Tests container behavior during API loading with delay simulation
- **[EmptyGroup](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsrolesview--empty-group)**: Tests container response to successful API call with empty data
- **[APIError](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsrolesview--api-error)**: Tests container error handling with structured API error responses
- **[NetworkFailure](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsrolesview--network-failure)**: Tests container resilience during network/server failures

Each story demonstrates different aspects of container state management and error handling.
        `,
        story: `
**Standard Container View**: Complete API orchestration test. Component dispatches \`fetchRolesForGroup\` action, MSW responds with mock data, Redux updates, and table renders roles.

## Additional Container Test Stories

For testing specific container scenarios, see these additional stories:

- **[Loading](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsrolesview--loading)**: Tests container behavior during API loading with delay simulation
- **[EmptyGroup](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsrolesview--empty-group)**: Tests container response to successful API call with empty data
- **[APIError](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsrolesview--api-error)**: Tests container error handling with structured API error responses
- **[NetworkFailure](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsrolesview--network-failure)**: Tests container resilience during network/server failures

Each story demonstrates different aspects of container state management and error handling.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ params }) => {
          const { groupId } = params;

          // Return roles for this story to test the UI
          if (groupId === 'test-group-id') {
            return HttpResponse.json({
              data: [
                {
                  uuid: 'role-1',
                  name: 'Organization Administrator',
                  display_name: 'Organization Administrator',
                  description: 'Full administrative access to the organization',
                  system: true,
                  platform_default: false,
                  admin_default: true,
                  policyCount: 15,
                  accessCount: 45,
                },
                {
                  uuid: 'role-2',
                  name: 'User Access Administrator',
                  display_name: 'User Access Administrator',
                  description: 'Manage user access and group memberships',
                  system: true,
                  platform_default: false,
                  admin_default: false,
                  policyCount: 8,
                  accessCount: 23,
                },
                {
                  uuid: 'role-3',
                  name: 'Custom Team Role',
                  display_name: 'Custom Team Role',
                  description: 'Custom role with specific team permissions',
                  system: false,
                  platform_default: false,
                  admin_default: false,
                  policyCount: 3,
                  accessCount: 12,
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

    // Wait for the table to load and display roles
    await expect(canvas.findByText('Organization Administrator')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('User Access Administrator')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Custom Team Role')).resolves.toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    groupId: 'loading-group-id',
    ouiaId: 'group-roles-view-loading',
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
        http.get('/api/rbac/v1/groups/:groupId/roles/', async () => {
          await delay('infinite');
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show loading spinner initially
    await expect(canvas.findByLabelText('Loading roles')).resolves.toBeInTheDocument();
  },
};

export const EmptyGroup: Story = {
  args: {
    groupId: 'empty-group-id',
    ouiaId: 'group-roles-view-empty',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the empty state when a group has no roles assigned. The API call succeeds but returns an empty array, triggering a friendly empty state with helpful messaging.',
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ params }) => {
          const { groupId } = params;

          if (groupId === 'empty-group-id') {
            // Return successful empty response
            return HttpResponse.json(
              {
                data: [],
                meta: { count: 0, limit: 1000, offset: 0 },
              },
              { status: 200 },
            );
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show empty state
    await expect(canvas.findByText('No roles found')).resolves.toBeInTheDocument();

    await expect(canvas.findByText('This group currently has no roles assigned to it.')).resolves.toBeInTheDocument();
  },
};

export const APIError: Story = {
  args: {
    groupId: 'error-group-id',
    ouiaId: 'group-roles-view-api-error',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests container error handling when the API returns structured error responses. Shows how the container extracts user-friendly messages from API error format.',
      },
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true, // Ignore Chrome context errors in outlet components
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ params }) => {
          const { groupId } = params;

          if (groupId === 'error-group-id') {
            return HttpResponse.json({ errors: [{ detail: 'Failed to fetch roles' }] }, { status: 500 });
          }
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByText((content, element) => element?.textContent === 'Something went wrong. Please try again.'),
    ).toBeInTheDocument();
  },
};

export const NetworkFailure: Story = {
  args: {
    groupId: 'network-error-group-id',
    ouiaId: 'group-roles-view-network-error',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests container resilience during network/server failures. Shows how technical error messages (like axios errors) are converted to user-friendly fallback messages.',
      },
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true, // Ignore Chrome context errors in outlet components
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/roles/', ({ params }) => {
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

    await expect(
      await canvas.findByText((content, element) => element?.textContent === 'Something went wrong. Please try again.'),
    ).toBeInTheDocument();
  },
};
