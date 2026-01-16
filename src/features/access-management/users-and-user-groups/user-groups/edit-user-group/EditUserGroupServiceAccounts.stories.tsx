import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';

import { EditGroupServiceAccountsTable } from './EditUserGroupServiceAccounts';

// Mock service accounts data matching the ServiceAccountPayloadItem interface from the API
const mockServiceAccounts = [
  {
    id: '1',
    name: 'webapp-service',
    description: 'Service account for web application',
    clientId: 'webapp-client',
    createdBy: 'admin@example.com',
    createdAt: Math.floor(new Date('2024-01-15T10:30:00Z').getTime() / 1000), // Unix timestamp in seconds
  },
  {
    id: '2',
    name: 'api-gateway-service',
    description: 'Service account for API gateway operations',
    clientId: 'api-gateway-client',
    createdBy: 'admin@example.com',
    createdAt: Math.floor(new Date('2024-01-10T14:20:00Z').getTime() / 1000),
  },
  {
    id: '3',
    name: 'backup-service',
    description: 'Service account for automated backup processes',
    clientId: 'backup-client',
    createdBy: 'system@example.com',
    createdAt: Math.floor(new Date('2024-01-05T08:45:00Z').getTime() / 1000),
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
- **State Management**: Integrates with Redux for service account data and loading states
- **Change Tracking**: Reports service account additions/removals through onChange callback

### Integration Patterns
- **Form Field**: Designed to work within @data-driven-forms workflows
- **Redux Connected**: Fetches service account data and manages loading states through Redux
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
        // Service accounts API endpoint
        http.get('*/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
          console.log('SB: MSW: Service accounts API called:', request.url);
          return HttpResponse.json(mockServiceAccounts);
        }),
        // Group principals endpoint for checking service account assignments
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request }) => {
          const url = new URL(request.url);
          const principalType = url.searchParams.get('principal_type');
          console.log('SB: MSW: Group principals API called:', request.url, 'Type:', principalType);

          if (principalType === 'user') {
            // Return empty users for this group
            return HttpResponse.json({
              data: [],
              meta: { count: 0, limit: 20, offset: 0 },
            });
          }

          // Default to service account principals
          return HttpResponse.json({
            data: [
              {
                clientId: mockServiceAccounts[0].clientId,
                name: mockServiceAccounts[0].name,
                description: mockServiceAccounts[0].description,
                created: new Date(mockServiceAccounts[0].createdAt * 1000).toISOString(),
                type: 'service-account',
                username: mockServiceAccounts[0].clientId,
                owner: mockServiceAccounts[0].createdBy,
              },
            ],
            meta: { count: 1, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
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
      handlers: [
        // Service accounts API endpoint with delay
        http.get('*/realms/redhat-external/apis/service_accounts/v1', async () => {
          await delay('infinite');
          return HttpResponse.json(mockServiceAccounts);
        }),
        // Group principals endpoint with delay
        http.get('/api/rbac/v1/groups/:groupId/principals/', async () => {
          await delay('infinite');
          return HttpResponse.json({
            data: [],
            status: 'results',
            meta: { count: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Check for loading skeleton
    await waitFor(
      async () => {
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        await expect(skeletonElements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
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
      handlers: [
        // Service accounts API endpoint returning empty array
        http.get('*/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
          console.log('SB: MSW: Service accounts API called (empty):', request.url);
          return HttpResponse.json([]);
        }),
        // Group principals endpoint returning empty
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request }) => {
          const url = new URL(request.url);
          const principalType = url.searchParams.get('principal_type');
          console.log('SB: MSW: Group principals API called (empty):', request.url, 'Type:', principalType);
          return HttpResponse.json({
            data: [],
            status: 'results',
            meta: { count: 0, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for empty state to appear
    await expect(canvas.findByText(/no service accounts found/i)).resolves.toBeInTheDocument();
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
        // Service accounts API endpoint
        http.get('*/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
          console.log('SB: MSW: Service accounts API called:', request.url);
          return HttpResponse.json(mockServiceAccounts);
        }),
        // Group principals endpoint for checking service account assignments
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request }) => {
          const url = new URL(request.url);
          const principalType = url.searchParams.get('principal_type');
          console.log('SB: MSW: Group principals API called:', request.url, 'Type:', principalType);

          if (principalType === 'user') {
            // Return empty users for this group
            return HttpResponse.json({
              data: [],
              meta: { count: 0, limit: 20, offset: 0 },
            });
          }

          // Default to service account principals
          return HttpResponse.json({
            data: [
              {
                clientId: mockServiceAccounts[0].clientId,
                name: mockServiceAccounts[0].name,
                description: mockServiceAccounts[0].description,
                created: new Date(mockServiceAccounts[0].createdAt * 1000).toISOString(),
                type: 'service-account',
                username: mockServiceAccounts[0].clientId,
                owner: mockServiceAccounts[0].createdBy,
              },
            ],
            meta: { count: 1, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
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
        // Service accounts API endpoint
        http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
          console.log('SB: MSW: Service accounts API called:', request.url);
          return HttpResponse.json(mockServiceAccounts);
        }),
        // Group principals endpoint for checking service account assignments
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request }) => {
          console.log('SB: MSW: Group principals API called:', request.url);
          return HttpResponse.json({
            data: [
              {
                clientId: mockServiceAccounts[0].clientId,
                name: mockServiceAccounts[0].name,
                description: mockServiceAccounts[0].description,
                created: new Date(mockServiceAccounts[0].createdAt * 1000).toISOString(),
                type: 'service-account',
                username: mockServiceAccounts[0].clientId,
                owner: mockServiceAccounts[0].createdBy,
              },
              {
                clientId: mockServiceAccounts[1].clientId,
                name: mockServiceAccounts[1].name,
                description: mockServiceAccounts[1].description,
                created: new Date(mockServiceAccounts[1].createdAt * 1000).toISOString(),
                type: 'service-account',
                username: mockServiceAccounts[1].clientId,
                owner: mockServiceAccounts[1].createdBy,
              },
            ],
            meta: { count: 2, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
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
      handlers: [
        // Service accounts API endpoint returning error - matches exact URL with any query params
        http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
          console.log('SB: MSW: Service accounts API called (error):', request.url);
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        }),
        // Alternative pattern for service accounts API
        http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
          console.log('SB: MSW: Service accounts API called (error fallback):', request.url);
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        }),
        // Catch any additional user principals API calls and error them too
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          console.log('SB: MSW: User principals API called (error):', request.url);
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        }),
        // Group principals endpoint returning error
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request }) => {
          const url = new URL(request.url);
          const principalType = url.searchParams.get('principal_type');
          console.log('SB: MSW: Group principals API called (error):', request.url, 'Type:', principalType);
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for error state to appear
    // Look for the specific error message we implemented
    const errorMessage = await canvas.findByText(/failed to load service accounts/i);
    await expect(errorMessage).toBeInTheDocument();

    // Verify error message details
    await expect(canvas.findByText(/failed to load service accounts/i)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/please try refreshing the page/i)).resolves.toBeInTheDocument();
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
      handlers: [
        // Service accounts API endpoint for new group
        http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
          console.log('SB: MSW: Service accounts API called (new group):', request.url);
          return HttpResponse.json(mockServiceAccounts);
        }),
        // No group service accounts endpoint call for new groups
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
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
  },
};
