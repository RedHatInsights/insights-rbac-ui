import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider } from '@patternfly/react-data-view';

import { UserDetailsGroupsView } from './UserDetailsGroupsView';
import { groupsErrorHandlers, groupsHandlers, groupsLoadingHandlers } from '../../../../../../shared/data/mocks/groups.handlers';
import { GROUP_ADMIN_DEFAULT, GROUP_SYSTEM_DEFAULT } from '../../../../../../shared/data/mocks/seed';
import messages from '../../../../../../Messages';

const ALL_USERS_LABEL = messages.allUsers.defaultMessage;
const ALL_ORG_ADMINS_LABEL = messages.allOrgAdmins.defaultMessage;

const meta: Meta<typeof UserDetailsGroupsView> = {
  component: UserDetailsGroupsView,
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
**UserDetailsGroupsView** is a container component that manages group data, React Query state, and business logic for displaying groups that a specific user belongs to.

### Container Responsibilities
- **Data Fetching**: Dispatches \`fetchGroups\` action with username filter on mount
- **State Management**: Handles loading, error, and success states from React Query
- **API Integration**: Interfaces with RBAC API for user's group data
- **Error Handling**: Provides user-friendly error messages and recovery

### Architecture
- **Smart Component**: Fetches its own data and manages state
- **Data Fetching**: Uses React Query for groups data, loading, and error states  
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
**Standard Container View**: Complete API orchestration test. Component dispatches \`fetchGroups\` action with username filter, MSW responds with mock data, React Query updates, and table renders user's groups.

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
        ...groupsHandlers([
          {
            uuid: 'group-1',
            name: 'Platform Administrators',
            description: 'Full platform administrative access',
            principalCount: 15,
            roleCount: 8,
            created: '2023-01-01T00:00:00Z',
            modified: '2024-01-01T00:00:00Z',
            system: true,
            platform_default: false,
            admin_default: true,
          },
          {
            uuid: 'group-2',
            name: 'Development Team',
            description: 'Access for development team members',
            principalCount: 8,
            roleCount: 5,
            created: '2023-01-01T00:00:00Z',
            modified: '2024-01-01T00:00:00Z',
            system: false,
            platform_default: false,
            admin_default: false,
          },
          {
            uuid: 'group-3',
            name: 'Quality Assurance',
            description: 'QA team with testing permissions',
            principalCount: 6,
            roleCount: 3,
            created: '2023-01-01T00:00:00Z',
            modified: '2024-01-01T00:00:00Z',
            system: false,
            platform_default: false,
            admin_default: false,
          },
        ]),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify groups displayed', async () => {
      await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();

      await expect(canvas.findByText('Development Team')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Quality Assurance')).resolves.toBeInTheDocument();

      await expect(canvas.findByText(ALL_ORG_ADMINS_LABEL)).resolves.toBeInTheDocument();
      await expect(canvas.findByText('8')).resolves.toBeInTheDocument();

      const grid = await canvas.findByRole('grid');
      await expect(grid).toBeInTheDocument();
    });
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
      handlers: [...groupsLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify loading state', async () => {
      await expect(canvas.findByLabelText('UserGroupsView', {}, { timeout: 10000 })).resolves.toBeInTheDocument();
      await expect(canvas.queryByText('Platform Administrators')).not.toBeInTheDocument();
    });
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
      handlers: [...groupsHandlers([])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty state', async () => {
      await expect(canvas.findByText('No groups found')).resolves.toBeInTheDocument();

      await expect(canvas.findByText('This user is not a member of any groups.')).resolves.toBeInTheDocument();
    });
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
**API Error State**: Simulates structured API error response. Component dispatches \`fetchGroups\` action, MSW responds with 500 error, and container handles error state through React Query.
        `,
      },
    },
    msw: {
      handlers: [...groupsErrorHandlers(500)],
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify API error state', async () => {
      await expect(canvas.findByText('Unable to load groups', {}, { timeout: 3000 })).resolves.toBeInTheDocument();
    });
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
**Network Failure**: Simulates complete network failure. Component dispatches \`fetchGroups\` action, MSW simulates network error, and container handles failure through React Query error handling.
        `,
      },
    },
    msw: {
      handlers: [...groupsErrorHandlers(500)],
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify network failure state', async () => {
      await expect(canvas.findByText('Unable to load groups', {}, { timeout: 3000 })).resolves.toBeInTheDocument();
    });
  },
};

export const DefaultGroupCounts: Story = {
  args: {
    userId: 'john.doe',
    ouiaId: 'user-groups-view-default-counts',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default platform and admin groups list with normalized Users column values from `useGroupsQuery` (implicit membership).',
      },
    },
    msw: {
      handlers: [...groupsHandlers([GROUP_SYSTEM_DEFAULT, GROUP_ADMIN_DEFAULT])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify normalized default group counts', async () => {
      await expect(canvas.findByText(GROUP_SYSTEM_DEFAULT.name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(GROUP_ADMIN_DEFAULT.name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(ALL_USERS_LABEL)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(ALL_ORG_ADMINS_LABEL)).resolves.toBeInTheDocument();
    });
  },
};
