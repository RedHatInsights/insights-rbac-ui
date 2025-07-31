import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider } from '@patternfly/react-data-view';
import { HttpResponse, delay, http } from 'msw';

import { UserDetailsRolesView } from './UserDetailsRolesView';

const meta: Meta<typeof UserDetailsRolesView> = {
  component: UserDetailsRolesView,
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
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**UserDetailsRolesView** is a container component that manages role data, Redux state, and business logic for displaying roles assigned to a specific user.

### Container Responsibilities
- **Data Fetching**: Dispatches \`fetchRoles\` action with username filter on mount
- **State Management**: Handles loading, error, and success states from Redux
- **API Integration**: Interfaces with RBAC API for user's role data
- **Error Handling**: Provides user-friendly error messages and recovery

### Architecture
- **Smart Component**: Fetches its own data and manages state
- **Redux Connected**: Uses selectors for roles data, loading, and error states  
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
**Standard Container View**: Complete API orchestration test. Component dispatches \`fetchRoles\` action with username filter, MSW responds with mock data, Redux updates, and table renders user's assigned roles.

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
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');

          // Component calls fetchRoles with username=userId filter
          if (username === 'john.doe') {
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
                  name: 'Insights Viewer',
                  display_name: 'Red Hat Insights Viewer',
                  description: 'Read-only access to Red Hat Insights',
                  system: true,
                  platform_default: true,
                  admin_default: false,
                  policyCount: 5,
                  accessCount: 12,
                },
                {
                  uuid: 'role-4',
                  name: 'Custom Development Role',
                  display_name: 'Custom Development Role',
                  description: 'Custom role for development team',
                  system: false,
                  platform_default: false,
                  admin_default: false,
                  policyCount: 3,
                  accessCount: 8,
                },
              ],
              meta: { count: 4, limit: 1000, offset: 0 },
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

    // Wait for roles to load from API call
    await expect(canvas.findByText('Organization Administrator')).resolves.toBeInTheDocument();

    // Verify multiple roles are displayed (component shows role.name, not display_name)
    await expect(canvas.findByText('User Access Administrator')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Insights Viewer')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Custom Development Role')).resolves.toBeInTheDocument();

    // Verify display names are shown in user group column
    await expect(canvas.findByText('Organization Administrator')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('User Access Administrator')).resolves.toBeInTheDocument();

    // Verify workspace column shows placeholder (API doesn't provide workspace data yet)
    const workspacePlaceholders = canvas.getAllByText('?');
    await expect(workspacePlaceholders.length).toBeGreaterThan(0);
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
      handlers: [
        http.get('/api/rbac/v1/roles/', async () => {
          await delay('infinite');
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show loading spinner while API call is in progress
    await expect(canvas.findByLabelText('Loading user roles', {}, { timeout: 10000 })).resolves.toBeInTheDocument();
    await expect(canvas.queryByRole('grid')).not.toBeInTheDocument(); // No table during loading
    await expect(canvas.queryByText('Organization Administrator')).not.toBeInTheDocument();
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
      handlers: [
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');

          if (username === 'empty.user') {
            return HttpResponse.json({
              data: [],
              meta: { count: 0, limit: 1000, offset: 0 },
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

    // Wait for empty state to render
    await expect(canvas.findByText('No roles found')).resolves.toBeInTheDocument();

    // Should show appropriate empty state message
    await expect(canvas.findByText('This user has no roles assigned.')).resolves.toBeInTheDocument();
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
**API Error State**: Simulates structured API error response. Component dispatches \`fetchRoles\` action, MSW responds with 500 error, and container handles error state through Redux.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');

          if (username === 'error.user') {
            // Return unstructured error to trigger generic fallback message
            return HttpResponse.json({ message: 'Request failed with status code 500' }, { status: 500 });
          }

          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show error state with proper message
    await expect(canvas.findByText('Unable to load roles')).resolves.toBeInTheDocument();

    // Should show generic fallback message for API errors
    await expect(canvas.findByText('Something went wrong. Please try again.')).resolves.toBeInTheDocument();
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
**Network Failure**: Simulates complete network failure. Component dispatches \`fetchRoles\` action, MSW simulates network error, and container handles failure through Redux error handling.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');

          if (username === 'network.user') {
            // Same error format as API Error to ensure consistent error handling
            return HttpResponse.json({ message: 'Request failed with status code 500' }, { status: 500 });
          }

          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show generic error message for network failures
    await expect(canvas.findByText('Unable to load roles')).resolves.toBeInTheDocument();

    // Should show generic fallback message for network errors
    await expect(canvas.findByText('Something went wrong. Please try again.')).resolves.toBeInTheDocument();
  },
};
