import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider } from '@patternfly/react-data-view';

import { GroupDetailsRolesView } from './GroupDetailsRolesView';
import { groupRolesErrorHandlers, groupRolesHandlers, groupRolesLoadingHandlers } from '../../../../../../shared/data/mocks/groupRoles.handlers';

const meta: Meta<typeof GroupDetailsRolesView> = {
  component: GroupDetailsRolesView,
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
**GroupDetailsRolesView** is a container component that manages role data, React Query state, and business logic for displaying group assigned roles.

### Container Responsibilities
- **Data Fetching**: Dispatches \`fetchRolesForGroup\` action on mount
- **State Management**: Handles loading, error, and success states from React Query
- **API Integration**: Interfaces with RBAC API for role data
- **Error Handling**: Provides user-friendly error messages and recovery

### Architecture
- **Smart Component**: Fetches its own data and manages state
- **Data Fetching**: Uses React Query for roles data, loading, and error states  
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
**Container Component Pattern**: This is a container component that manages API orchestration for displaying roles within a group. It dispatches React Query mutations to fetch data and handles loading, error, and empty states.

## Container Test Stories

This component includes several test scenarios to verify different container behaviors:

- **[Loading](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsrolesview--loading)**: Tests container behavior during API loading with delay simulation
- **[EmptyGroup](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsrolesview--empty-group)**: Tests container response to successful API call with empty data
- **[APIError](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsrolesview--api-error)**: Tests container error handling with structured API error responses
- **[NetworkFailure](?path=/story/features-access-management-users-and-user-groups-user-groups-user-group-detail-groupdetailsrolesview--network-failure)**: Tests container resilience during network/server failures

Each story demonstrates different aspects of container state management and error handling.
        `,
        story: `
**Standard Container View**: Complete API orchestration test. Component dispatches \`fetchRolesForGroup\` action, MSW responds with mock data, React Query updates, and table renders roles.

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
        ...groupRolesHandlers({
          'test-group-id': [
            {
              uuid: 'role-1',
              name: 'Organization Administrator',
              display_name: 'Organization Administrator',
              description: 'Full administrative access to the organization',
              system: true,
              platform_default: false,
              created: '2023-01-01T00:00:00Z',
              modified: '2023-01-01T00:00:00Z',
            },
            {
              uuid: 'role-2',
              name: 'User Access Administrator',
              display_name: 'User Access Administrator',
              description: 'Manage user access and group memberships',
              system: true,
              platform_default: false,
              created: '2023-01-01T00:00:00Z',
              modified: '2023-01-01T00:00:00Z',
            },
            {
              uuid: 'role-3',
              name: 'Custom Team Role',
              display_name: 'Custom Team Role',
              description: 'Custom role with specific team permissions',
              system: false,
              platform_default: false,
              created: '2023-01-01T00:00:00Z',
              modified: '2023-01-01T00:00:00Z',
            },
          ],
        }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify roles displayed', async () => {
      await expect(canvas.findByText('Organization Administrator')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('User Access Administrator')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Custom Team Role')).resolves.toBeInTheDocument();
    });
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
      handlers: [...groupRolesLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify loading state', async () => {
      await expect(canvas.findByLabelText('GroupRolesView')).resolves.toBeInTheDocument();
    });
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
      handlers: [...groupRolesHandlers({ 'empty-group-id': [] })],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty state', async () => {
      await expect(canvas.findByText('No roles found')).resolves.toBeInTheDocument();

      await expect(canvas.findByText('This group currently has no roles assigned to it.')).resolves.toBeInTheDocument();
    });
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
      handlers: [...groupRolesErrorHandlers(500)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify API error state', async () => {
      await expect(
        await canvas.findByText((content, element) => element?.textContent === 'Something went wrong. Please try again.'),
      ).toBeInTheDocument();
    });
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
      handlers: [...groupRolesErrorHandlers(500)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify network failure state', async () => {
      await expect(
        await canvas.findByText((content, element) => element?.textContent === 'Something went wrong. Please try again.'),
      ).toBeInTheDocument();
    });
  },
};
