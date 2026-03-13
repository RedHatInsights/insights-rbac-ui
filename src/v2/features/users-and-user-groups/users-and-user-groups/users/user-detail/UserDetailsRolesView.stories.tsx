import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider } from '@patternfly/react-data-view';

import { UserDetailsRolesView } from './UserDetailsRolesView';
import { v2RolesErrorHandlers, v2RolesHandlers, v2RolesLoadingHandlers } from '../../../../../../v2/data/mocks/roles.handlers';

const meta: Meta<typeof UserDetailsRolesView> = {
  component: UserDetailsRolesView,
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
**UserDetailsRolesView** is a container component that manages role data, React Query state, and business logic for displaying roles assigned to a specific user.

### Container Responsibilities
- **Data Fetching**: Dispatches \`fetchRoles\` action with username filter on mount
- **State Management**: Handles loading, error, and success states from React Query
- **API Integration**: Interfaces with RBAC API for user's role data
- **Error Handling**: Provides user-friendly error messages and recovery

### Architecture
- **Smart Component**: Fetches its own data and manages state
- **Data Fetching**: Uses React Query for roles data, loading, and error states  
- **MSW Compatible**: Stories use MSW to test real API integration flows
- **State-Driven UI**: Renders different components based on loading/error/success states

### Data Display
- Shows role name, display name, and workspace (when API provides workspace data)
- Handles missing workspace data gracefully with placeholder
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserDetailsRolesView>;

export const Default: Story = {
  tags: ['autodocs'],
  args: {
    userId: 'john.doe',
    ouiaId: 'user-roles-view',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Standard Container View**: Complete API orchestration test. Component dispatches \`fetchRoles\` action with username filter, MSW responds with mock data, React Query updates, and table renders user's assigned roles.

## Additional Container Test Stories

For testing specific container scenarios, see these additional stories:

- **[Loading](?path=/story/features-access-management-users-and-user-groups-users-user-detail-userdetailsrolesview--loading)**: Tests container behavior during API loading with delay simulation
- **[EmptyUserRoles](?path=/story/features-access-management-users-and-user-groups-users-user-detail-userdetailsrolesview--empty-user-roles)**: Tests container response to successful API call with empty data
- **[APIError](?path=/story/features-access-management-users-and-user-groups-users-user-detail-userdetailsrolesview--api-error)**: Tests container error handling with structured API error responses
- **[NetworkFailure](?path=/story/features-access-management-users-and-user-groups-users-user-detail-userdetailsrolesview--network-failure)**: Tests container resilience during network/server failures

Each story demonstrates different aspects of container state management and error handling.
        `,
      },
    },
    msw: {
      handlers: [
        ...v2RolesHandlers([
          {
            id: 'role-1',
            name: 'Organization Administrator',
            description: 'Full administrative access to the organization',
            permissions: [],
            permissions_count: 15,
            last_modified: '2024-01-01T00:00:00Z',
          },
          {
            id: 'role-2',
            name: 'User Access Administrator',
            description: 'Manage user access and group memberships',
            permissions: [],
            permissions_count: 8,
            last_modified: '2024-01-01T00:00:00Z',
          },
          {
            id: 'role-3',
            name: 'Insights Viewer',
            description: 'Read-only access to Red Hat Insights',
            permissions: [],
            permissions_count: 5,
            last_modified: '2024-01-01T00:00:00Z',
          },
          {
            id: 'role-4',
            name: 'Custom Development Role',
            description: 'Custom role for development team',
            permissions: [],
            permissions_count: 3,
            last_modified: '2024-01-01T00:00:00Z',
          },
        ]),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify roles displayed', async () => {
      await expect(canvas.findByText('Organization Administrator')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('User Access Administrator')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Insights Viewer')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Custom Development Role')).resolves.toBeInTheDocument();
    });
  },
};

export const Loading: Story = {
  args: {
    userId: 'loading.user',
    ouiaId: 'user-roles-view-loading',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Loading State**: Simulates delay before responding.
        `,
      },
    },
    msw: {
      handlers: [...v2RolesLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify loading state', async () => {
      await expect(canvas.findByLabelText('UserRolesView', {}, { timeout: 10000 })).resolves.toBeInTheDocument();
      await expect(canvas.queryByText('Organization Administrator')).not.toBeInTheDocument();
    });
  },
};

export const EmptyUserRoles: Story = {
  args: {
    userId: 'empty.user',
    ouiaId: 'user-roles-view-empty',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Empty State**: User has no role assignments. Component dispatches \`fetchRoles\` action, MSW responds with empty data array, and container handles empty state.
        `,
      },
    },
    msw: {
      handlers: [...v2RolesHandlers([])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty state', async () => {
      await expect(canvas.findByText('No roles found')).resolves.toBeInTheDocument();

      await expect(canvas.findByText('This user has no roles assigned.')).resolves.toBeInTheDocument();
    });
  },
};

export const APIError: Story = {
  args: {
    userId: 'error.user',
    ouiaId: 'user-roles-view-error',
  },
  parameters: {
    docs: {
      description: {
        story: `
**API Error State**: Simulates structured API error response. Component dispatches \`fetchRoles\` action, MSW responds with 500 error, and container handles error state through React Query.
        `,
      },
    },
    msw: {
      handlers: [...v2RolesErrorHandlers(500)],
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify API error state', async () => {
      await expect(canvas.findByText('Unable to load roles')).resolves.toBeInTheDocument();

      await expect(canvas.findByText('Something went wrong. Please try again.')).resolves.toBeInTheDocument();
    });
  },
};

export const NetworkFailure: Story = {
  args: {
    userId: 'network.user',
    ouiaId: 'user-roles-view-network',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Network Failure**: Simulates complete network failure. Component dispatches \`fetchRoles\` action, MSW simulates network error, and container handles failure through React Query error handling.
        `,
      },
    },
    msw: {
      handlers: [...v2RolesErrorHandlers(500)],
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify network failure state', async () => {
      await expect(canvas.findByText('Unable to load roles')).resolves.toBeInTheDocument();

      await expect(canvas.findByText('Something went wrong. Please try again.')).resolves.toBeInTheDocument();
    });
  },
};
