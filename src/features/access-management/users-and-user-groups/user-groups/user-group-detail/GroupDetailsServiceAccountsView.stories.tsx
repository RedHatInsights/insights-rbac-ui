import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider } from '@patternfly/react-data-view';
import { HttpResponse, delay, http } from 'msw';

import { GroupDetailsServiceAccountsView } from './GroupDetailsServiceAccountsView';

const meta: Meta<typeof GroupDetailsServiceAccountsView> = {
  component: GroupDetailsServiceAccountsView,
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
**GroupDetailsServiceAccountsView** is a container component that manages service account data, React Query state, and business logic for displaying group service accounts.

### Container Responsibilities
- **Data Fetching**: Dispatches \`fetchServiceAccountsForGroup\` action on mount
- **State Management**: Handles loading, error, and success states from React Query
- **API Integration**: Interfaces with RBAC API for service account data
- **Error Handling**: Provides user-friendly error messages and recovery

### Architecture
- **Smart Component**: Fetches its own data and manages state
- **Data Fetching**: Uses React Query for service accounts data, loading, and error states  
- **MSW Compatible**: Stories use MSW to test real API integration flows
- **State-Driven UI**: Renders different components based on loading/error/success states
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GroupDetailsServiceAccountsView>;
export const Default: Story = {
  args: {
    groupId: 'test-group-id',
    ouiaId: 'group-service-accounts-view-default',
  },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**Container Component Pattern**: This is a container component that manages API orchestration for displaying service accounts within a group. It dispatches React Query mutations to fetch data and handles loading, error, and empty states.

## Container Test Stories

This component includes several test scenarios to verify different container behaviors:

- **[Loading](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsserviceaccountsview--loading)**: Tests container behavior during API loading with delay simulation
- **[EmptyGroup](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsserviceaccountsview--empty-group)**: Tests container response to successful API call with empty data
- **[APIError](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsserviceaccountsview--api-error)**: Tests container error handling with structured API error responses
- **[NetworkFailure](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsserviceaccountsview--network-failure)**: Tests container resilience during network/server failures

Each story demonstrates different aspects of container state management and error handling.
        `,
        story: `
**Standard Container View**: Complete API orchestration test. Component dispatches \`fetchServiceAccountsForGroup\` action, MSW responds with mock data, React Query updates, and table renders service accounts.

## Additional Container Test Stories

For testing specific container scenarios, see these additional stories:

- **[Loading](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsserviceaccountsview--loading)**: Tests container behavior during API loading with delay simulation
- **[EmptyGroup](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsserviceaccountsview--empty-group)**: Tests container response to successful API call with empty data
- **[APIError](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsserviceaccountsview--api-error)**: Tests container error handling with structured API error responses
- **[NetworkFailure](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsserviceaccountsview--network-failure)**: Tests container resilience during network/server failures

Each story demonstrates different aspects of container state management and error handling.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/principals/', () => {
          // Return service accounts for this story to test the UI
          return HttpResponse.json({
            data: [
              {
                clientId: 'service-account-12345',
                name: 'RBAC Service Account',
                description: 'Service account for RBAC API access',
                created: '2023-01-15T10:30:00Z',
                type: 'service-account',
                username: 'service-account-12345',
                owner: 'admin@example.com',
              },
              {
                clientId: 'automation-sa-67890',
                name: 'Automation Service Account',
                description: 'Service account for automation and CI/CD pipelines',
                created: '2023-02-20T14:45:00Z',
                type: 'service-account',
                username: 'automation-sa-67890',
                owner: 'devops@example.com',
              },
              {
                clientId: 'monitoring-sa-11111',
                name: 'Monitoring Service Account',
                description: 'Service account for monitoring and alerting systems',
                created: '2023-03-10T09:15:00Z',
                type: 'service-account',
                username: 'monitoring-sa-11111',
                owner: 'ops@example.com',
              },
            ],
            meta: { count: 3, limit: 1000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    await expect(canvas.findByText('RBAC Service Account')).resolves.toBeInTheDocument();

    await expect(canvas.findByText('Automation Service Account')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Monitoring Service Account')).resolves.toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    groupId: 'loading-group-id',
    ouiaId: 'group-service-accounts-view-loading',
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
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show skeleton loading state while API call is in progress (TableView uses SkeletonTable)
    await expect(canvas.findByLabelText('GroupServiceAccountsView')).resolves.toBeInTheDocument();
  },
};

export const EmptyGroup: Story = {
  args: {
    groupId: 'empty-group-id',
    ouiaId: 'group-service-accounts-view-empty',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the empty state when a group has no service accounts assigned. The API call succeeds but returns an empty array, triggering a friendly empty state with helpful messaging.',
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ params }) => {
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
    await expect(canvas.findByText('No service accounts found')).resolves.toBeInTheDocument();

    await expect(canvas.findByText('This group currently has no service accounts assigned to it.')).resolves.toBeInTheDocument();
  },
};

export const APIError: Story = {
  args: {
    groupId: 'error-group-id',
    ouiaId: 'group-service-accounts-view-api-error',
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
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ params }) => {
          const { groupId } = params;

          if (groupId === 'error-group-id') {
            return HttpResponse.json({ errors: [{ detail: 'Failed to fetch service accounts' }] }, { status: 500 });
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
    ouiaId: 'group-service-accounts-view-network-error',
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

    await expect(
      await canvas.findByText((content, element) => element?.textContent === 'Something went wrong. Please try again.'),
    ).toBeInTheDocument();
  },
};
