import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider } from '@patternfly/react-data-view';
import { HttpResponse, delay, http } from 'msw';

import { UserDetailsGroupsView } from './UserDetailsGroupsView';

const meta: Meta<typeof UserDetailsGroupsView> = {
  component: UserDetailsGroupsView,
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
**UserDetailsGroupsView** is a container component that manages group data, Redux state, and business logic for displaying groups that a specific user belongs to.

### Container Responsibilities
- **Data Fetching**: Dispatches \`fetchGroups\` action with username filter on mount
- **State Management**: Handles loading, error, and success states from Redux
- **API Integration**: Interfaces with RBAC API for user's group data
- **Error Handling**: Provides user-friendly error messages and recovery

### Architecture
- **Smart Component**: Fetches its own data and manages state
- **Redux Connected**: Uses selectors for groups data, loading, and error states  
- **MSW Compatible**: Stories use MSW to test real API integration flows
- **State-Driven UI**: Renders different components based on loading/error/success states
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserDetailsGroupsView>;

export const Default: Story = {
  tags: ['autodocs'],
  args: {
    userId: 'john.doe',
    ouiaId: 'user-groups-view',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Standard Container View**: Complete API orchestration test. Component dispatches \`fetchGroups\` action with username filter, MSW responds with mock data, Redux updates, and table renders user's groups.

## Additional Container Test Stories

For testing specific container scenarios, see these additional stories:

- **[Loading](?path=/story/features-access-management-users-and-user-groups-users-user-detail-userdetailsgroupsview--loading)**: Tests container behavior during API loading with delay simulation
- **[EmptyUserGroups](?path=/story/features-access-management-users-and-user-groups-users-user-detail-userdetailsgroupsview--empty-user-groups)**: Tests container response to successful API call with empty data
- **[APIError](?path=/story/features-access-management-users-and-user-groups-users-user-detail-userdetailsgroupsview--api-error)**: Tests container error handling with structured API error responses
- **[NetworkFailure](?path=/story/features-access-management-users-and-user-groups-users-user-detail-userdetailsgroupsview--network-failure)**: Tests container resilience during network/server failures

Each story demonstrates different aspects of container state management and error handling.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');

          // Component calls fetchGroups with username=userId filter
          if (username === 'john.doe') {
            return HttpResponse.json({
              data: [
                {
                  uuid: 'group-1',
                  name: 'Platform Administrators',
                  description: 'Full platform administrative access',
                  principalCount: 15,
                  policyCount: 8,
                  system: true,
                  platform_default: false,
                  admin_default: true,
                },
                {
                  uuid: 'group-2',
                  name: 'Development Team',
                  description: 'Access for development team members',
                  principalCount: 8,
                  policyCount: 5,
                  system: false,
                  platform_default: false,
                  admin_default: false,
                },
                {
                  uuid: 'group-3',
                  name: 'Quality Assurance',
                  description: 'QA team with testing permissions',
                  principalCount: 6,
                  policyCount: 3,
                  system: false,
                  platform_default: false,
                  admin_default: false,
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

    // Check that groups are displayed
    await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();

    // Additional groups shown
    await expect(canvas.findByText('Development Team')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Quality Assurance')).resolves.toBeInTheDocument();

    // Check user counts are shown
    await expect(canvas.findByText('15')).resolves.toBeInTheDocument(); // Principal count for Platform Administrators
    await expect(canvas.findByText('8')).resolves.toBeInTheDocument(); // Principal count for Development Team

    // Check table structure (grid role in PatternFly tables)
    const grid = await canvas.findByRole('grid');
    await expect(grid).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    userId: 'loading.user',
    ouiaId: 'user-groups-view-loading',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Loading State**: Simulates API delay to test container loading behavior. Component dispatches \`fetchGroups\` action but MSW introduces delay before responding.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', async () => {
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
    await expect(canvas.findByLabelText('Loading user groups', {}, { timeout: 10000 })).resolves.toBeInTheDocument();
    await expect(canvas.queryByRole('grid')).not.toBeInTheDocument(); // No table during loading
    await expect(canvas.queryByText('Platform Administrators')).not.toBeInTheDocument();
  },
};

export const EmptyUserGroups: Story = {
  args: {
    userId: 'empty.user',
    ouiaId: 'user-groups-view-empty',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Empty State**: User has no group memberships. Component dispatches \`fetchGroups\` action, MSW responds with empty data array, and container handles empty state.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', ({ request }) => {
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
    await expect(canvas.findByText('No groups found')).resolves.toBeInTheDocument();

    // Should show appropriate empty state message
    await expect(canvas.findByText('This user is not a member of any groups.')).resolves.toBeInTheDocument();
  },
};

export const APIError: Story = {
  args: {
    userId: 'error.user',
    ouiaId: 'user-groups-view-error',
  },
  parameters: {
    docs: {
      description: {
        story: `
**API Error State**: Simulates structured API error response. Component dispatches \`fetchGroups\` action, MSW responds with 500 error, and container handles error state through Redux.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', ({ request }) => {
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
    await expect(canvas.findByText('Unable to load groups')).resolves.toBeInTheDocument();

    // Should show generic fallback message for API errors
    await expect(
      await canvas.findByText((content, element) => {
        return element?.textContent === 'Something went wrong. Please try again.';
      }),
    ).toBeInTheDocument();
  },
};

export const NetworkFailure: Story = {
  args: {
    userId: 'network.user',
    ouiaId: 'user-groups-view-network',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Network Failure**: Simulates complete network failure. Component dispatches \`fetchGroups\` action, MSW simulates network error, and container handles failure through Redux error handling.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', ({ request }) => {
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
    await expect(canvas.findByText('Unable to load groups')).resolves.toBeInTheDocument();

    // Should show generic fallback message for network errors
    await expect(
      await canvas.findByText((content, element) => {
        return element?.textContent === 'Something went wrong. Please try again.';
      }),
    ).toBeInTheDocument();
  },
};
