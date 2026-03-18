import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { expectLoadingVisible } from '../../../../../../test-utils/interactionHelpers';
import { EditGroupServiceAccountsTable } from './EditUserGroupServiceAccounts';
import {
  serviceAccountsErrorHandlers,
  serviceAccountsHandlers,
  serviceAccountsLoadingHandlers,
} from '../../../../../../shared/data/mocks/serviceAccounts.handlers';
import { createGroupMembersHandlers } from '../../../../../../shared/data/mocks/groupMembers.handlers';

// MockServiceAccount for serviceAccountsHandlers (list API)
const mockServiceAccountsForList = [
  {
    uuid: '1',
    name: 'webapp-service',
    clientId: 'webapp-client',
    owner: 'admin@example.com',
    timeCreated: '2024-01-15T10:30:00Z',
    description: 'Service account for web application',
  },
  {
    uuid: '2',
    name: 'api-gateway-service',
    clientId: 'api-gateway-client',
    owner: 'admin@example.com',
    timeCreated: '2024-01-10T14:20:00Z',
    description: 'Service account for API gateway operations',
  },
  {
    uuid: '3',
    name: 'backup-service',
    clientId: 'backup-client',
    owner: 'system@example.com',
    timeCreated: '2024-01-05T08:45:00Z',
    description: 'Service account for automated backup processes',
  },
];
// ServiceAccount for createGroupMembersHandlers (group principals API)
const mockServiceAccountsForGroup = [
  {
    username: 'webapp-client',
    type: 'service-account' as const,
    clientId: 'webapp-client',
    name: 'webapp-service',
    owner: 'admin@example.com',
    time_created: Math.floor(Date.parse('2024-01-15T10:30:00Z') / 1000),
    description: 'Service account for web application',
  },
  {
    username: 'api-gateway-client',
    type: 'service-account' as const,
    clientId: 'api-gateway-client',
    name: 'api-gateway-service',
    owner: 'admin@example.com',
    time_created: Math.floor(Date.parse('2024-01-10T14:20:00Z') / 1000),
    description: 'Service account for API gateway operations',
  },
  {
    username: 'backup-client',
    type: 'service-account' as const,
    clientId: 'backup-client',
    name: 'backup-service',
    owner: 'system@example.com',
    time_created: Math.floor(Date.parse('2024-01-05T08:45:00Z') / 1000),
    description: 'Service account for automated backup processes',
  },
];

const meta: Meta<typeof EditGroupServiceAccountsTable> = {
  component: EditGroupServiceAccountsTable,
  parameters: {
    docs: {
      description: {
        component: `
**EditGroupServiceAccountsTable** is a form component for managing service accounts within a user group during editing workflows.

### Form Component Features
- **Service Account Selection**: Bulk and individual selection with visual feedback
- **Data Management**: Tracks initial vs updated service account associations for efficient API calls
- **Search & Pagination**: Built-in filtering and pagination for large service account lists
- **State Management**: Uses React Query for service account data and loading states
- **Change Tracking**: Reports service account additions/removals through onChange callback

### Integration Patterns
- **Form Field**: Designed to work within @data-driven-forms workflows
- **Data Fetching**: Fetches service account data and manages loading states through React Query
- **Chrome Integration**: Uses Chrome SDK for authentication and user context
- **MSW Compatible**: Stories use MSW handlers for realistic data scenarios

### Business Logic
- **Initial State**: Takes existing group service accounts as initial selection
- **Diff Tracking**: Calculates which service accounts were added/removed for API efficiency
- **Bulk Operations**: Supports page-level and all-service-accounts selection patterns
- **Date Formatting**: Displays creation and modification dates in user-friendly format
- **Type Filtering**: Handles service account type filtering and display
        `,
      },
    },
  },
  argTypes: {
    groupId: {
      description: 'UUID of the group being edited (optional for new groups)',
      control: 'text',
    },
    initialServiceAccountIds: {
      description: 'Array of service account IDs currently in the group',
      control: 'object',
    },
    onChange: {
      description: 'Callback fired when service account selection changes',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with service accounts loaded
export const Default: Story = {
  args: {
    groupId: 'group-123',
    initialServiceAccountIds: ['1'], // webapp-service is initially in the group
    onChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        ...serviceAccountsHandlers(mockServiceAccountsForList),
        ...createGroupMembersHandlers({}, { 'group-123': [mockServiceAccountsForGroup[0]] }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for service accounts to load
      await expect(canvas.findByText('webapp-service')).resolves.toBeInTheDocument();

      // Verify table structure
      await expect(canvas.findByText('webapp-service')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('api-gateway-service')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('backup-service')).resolves.toBeInTheDocument();

      // Check descriptions are shown
      await expect(canvas.findByText('Service account for web application')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Service account for API gateway operations')).resolves.toBeInTheDocument();

      // Check pagination is present (find first matching element)
      const paginations = await canvas.findAllByLabelText(/pagination/i);
      await expect(paginations.length).toBeGreaterThan(0);
    });
  },
};

// Loading state
export const Loading: Story = {
  args: {
    groupId: 'group-123',
    initialServiceAccountIds: [],
    onChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [...serviceAccountsLoadingHandlers(), ...createGroupMembersHandlers({}, {})],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      await waitFor(
        () => {
          expectLoadingVisible(canvasElement);
        },
        { timeout: 10000 },
      );
    });
  },
};

// Empty state (no service accounts found)
export const EmptyState: Story = {
  args: {
    groupId: 'group-123',
    initialServiceAccountIds: [],
    onChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [...serviceAccountsHandlers([]), ...createGroupMembersHandlers({}, {})],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for empty state to appear
      await expect(canvas.findByText(/no service accounts found/i)).resolves.toBeInTheDocument();
    });
  },
};

// Service account selection interaction
export const ServiceAccountSelection: Story = {
  args: {
    groupId: 'group-123',
    initialServiceAccountIds: ['1'], // webapp-service is initially selected
    onChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        ...serviceAccountsHandlers(mockServiceAccountsForList),
        ...createGroupMembersHandlers({}, { 'group-123': [mockServiceAccountsForGroup[0]] }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for service accounts to load
      await expect(canvas.findByText('api-gateway-service')).resolves.toBeInTheDocument();

      // Find API Gateway service row and checkbox
      const apiGatewayText = await canvas.findByText('api-gateway-service');
      const apiGatewayRow = apiGatewayText.closest('tr');
      await expect(apiGatewayRow).toBeInTheDocument();

      const apiGatewayCheckbox = await within(apiGatewayRow as HTMLElement).findByRole('checkbox');
      await expect(apiGatewayCheckbox).not.toBeChecked();

      // Select API Gateway service by clicking its checkbox
      await userEvent.click(apiGatewayCheckbox);

      // Verify API Gateway service is now selected
      await expect(apiGatewayCheckbox).toBeChecked();

      // Test bulk selection
      const bulkSelectButton = await canvas.findByRole('button', { name: /bulk select/i });
      if (bulkSelectButton) {
        await userEvent.click(bulkSelectButton);

        // Look for "Select page" option
        const selectPageOption = canvas.queryByText(/select page/i);
        if (selectPageOption) {
          await userEvent.click(selectPageOption);

          // All visible checkboxes should now be checked
          const allCheckboxes = await canvas.findAllByRole('checkbox');
          allCheckboxes.forEach(async (checkbox) => {
            if (checkbox.getAttribute('aria-label')?.includes('Select row')) {
              await expect(checkbox).toBeChecked();
            }
          });
        }
      }
    });
  },
};

// Pre-selected service accounts scenario
export const PreSelectedServiceAccounts: Story = {
  args: {
    groupId: 'group-123',
    initialServiceAccountIds: ['webapp-client', 'api-gateway-client'], // webapp-service and api-gateway-service are initially in the group (using clientId)
    onChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        ...serviceAccountsHandlers(mockServiceAccountsForList),
        ...createGroupMembersHandlers({}, { 'group-123': [mockServiceAccountsForGroup[0], mockServiceAccountsForGroup[1]] }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for service accounts to load
      await expect(canvas.findByText('webapp-service')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('api-gateway-service')).resolves.toBeInTheDocument();

      // Verify webapp-service and api-gateway-service are pre-selected
      const webappText = await canvas.findByText('webapp-service');
      const webappRow = webappText.closest('tr');
      await expect(webappRow).toBeInTheDocument();
      const webappCheckbox = await within(webappRow as HTMLElement).findByRole('checkbox');
      await expect(webappCheckbox).toBeChecked();

      const apiGatewayText = await canvas.findByText('api-gateway-service');
      const apiGatewayRow = apiGatewayText.closest('tr');
      await expect(apiGatewayRow).toBeInTheDocument();
      const apiGatewayCheckbox = await within(apiGatewayRow as HTMLElement).findByRole('checkbox');
      await expect(apiGatewayCheckbox).toBeChecked();

      // backup-service should not be selected
      const backupText = await canvas.findByText('backup-service');
      const backupRow = backupText.closest('tr');
      await expect(backupRow).toBeInTheDocument();
      const backupCheckbox = await within(backupRow as HTMLElement).findByRole('checkbox');
      await expect(backupCheckbox).not.toBeChecked();
    });
  },
};

// API Error state
export const APIError: Story = {
  args: {
    groupId: 'group-123',
    initialServiceAccountIds: [],
    onChange: fn(),
  },
  parameters: {
    test: {
      dangerouslyIgnoreUnhandledErrors: true, // Ignore expected 500 errors from MSW
    },
    msw: {
      handlers: [...serviceAccountsErrorHandlers(500), ...createGroupMembersHandlers({}, {}, {})],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for error state to appear
      // Look for the specific error message we implemented
      const errorMessage = await canvas.findByText(/failed to load service accounts/i);
      await expect(errorMessage).toBeInTheDocument();

      // Verify error message details
      await expect(canvas.findByText(/failed to load service accounts/i)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(/please try refreshing the page/i)).resolves.toBeInTheDocument();
    });
  },
};

// New group scenario (no groupId)
export const NewGroup: Story = {
  args: {
    groupId: undefined, // No group ID for new group creation
    initialServiceAccountIds: [],
    onChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [...serviceAccountsHandlers(mockServiceAccountsForList)],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for service accounts to load
      await expect(canvas.findByText('webapp-service')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('api-gateway-service')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('backup-service')).resolves.toBeInTheDocument();

      // Verify no service accounts are pre-selected
      const checkboxes = await canvas.findAllByRole('checkbox');

      checkboxes.forEach(async (checkbox) => {
        if (checkbox.getAttribute('aria-label')?.includes('Select row')) {
          await expect(checkbox).not.toBeChecked();
        }
      });

      // Verify all service accounts are available for selection
      await expect(canvas.findByText('webapp-service')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Service account for web application')).resolves.toBeInTheDocument();
    });
  },
};
