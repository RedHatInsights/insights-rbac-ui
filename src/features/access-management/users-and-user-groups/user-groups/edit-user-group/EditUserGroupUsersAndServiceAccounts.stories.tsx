import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { ComponentMapper, FormRenderer } from '@data-driven-forms/react-form-renderer';
import { FormTemplate } from '@data-driven-forms/pf4-component-mapper';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';

import { EditGroupUsersAndServiceAccounts } from './EditUserGroupUsersAndServiceAccounts';

// Mock users data
const mockUsers = [
  {
    id: '1',
    uuid: '1',
    username: 'john.doe',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: false,
    external_source_id: '123',
  },
  {
    id: '2',
    uuid: '2',
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    is_org_admin: true,
    external_source_id: '456',
  },
];

// Mock service accounts data matching ServiceAccountPayloadItem interface
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
];

// Create a FormRenderer wrapper for testing the component
// Note: Named TestFormWrapper (not FormWrapper) to avoid conflicts with data-driven-forms prop names
const TestFormWrapper: React.FC<{
  initialUsers?: string[];
  initialServiceAccounts?: string[];
  groupId?: string;
  onSubmit?: (values: any) => void;
}> = ({ initialUsers = [], initialServiceAccounts = [], groupId = 'group-123', onSubmit = fn() }) => {
  const schema = {
    fields: [
      {
        component: 'edit-group-users-and-service-accounts',
        name: 'members',
        groupId,
        initialUsers,
        initialServiceAccounts,
      },
    ],
  };

  const customComponentMapper: ComponentMapper = {
    ...componentMapper,
    'edit-group-users-and-service-accounts': EditGroupUsersAndServiceAccounts,
  };

  return <FormRenderer schema={schema} onSubmit={onSubmit} componentMapper={customComponentMapper} FormTemplate={FormTemplate} />;
};

const meta: Meta<typeof EditGroupUsersAndServiceAccounts> = {
  component: EditGroupUsersAndServiceAccounts,
  parameters: {
    docs: {
      description: {
        component: `
**EditGroupUsersAndServiceAccounts** is a form field component that provides a tabbed interface for managing both users and service accounts within a user group.

### Form Field Features
- **Tabbed Interface**: Separate tabs for Users and Service Accounts management
- **Form Integration**: Seamless integration with @data-driven-forms workflow
- **State Synchronization**: Manages both user and service account selections in unified form state
- **Change Tracking**: Reports combined changes for efficient API calls
- **Initial State Management**: Handles pre-existing members for edit scenarios

### Integration Patterns
- **Form Field Component**: Implements useFieldApi for form integration
- **Unified State**: Combines user and service account state into single form field
- **Tab Management**: Maintains active tab state for better UX
- **Data Structure**: Provides structured diff data for API consumption

### Business Logic
- **Combined Management**: Single form field managing multiple related entities
- **Initial State**: Accepts both user and service account initial selections
- **Change Detection**: Tracks additions/removals across both entity types
- **Form Validation**: Integrates with form validation patterns
- **State Persistence**: Maintains selections when switching between tabs

### Data Structure
The component manages a form value with the following structure:
\`\`\`typescript
{
  users: {
    initial: string[];    // Original user IDs
    updated: string[];    // Current user IDs  
  },
  serviceAccounts: {
    initial: string[];    // Original service account IDs
    updated: string[];    // Current service account IDs
  }
}
\`\`\`
        `,
      },
    },
  },
  // Render the component within a form context for proper testing
  render: (args) => <TestFormWrapper {...args} />,
  argTypes: {
    groupId: {
      description: 'UUID of the group being edited',
      control: 'text',
    },
    initialUsers: {
      description: 'Array of user IDs currently in the group',
      control: 'object',
    },
    initialServiceAccounts: {
      description: 'Array of service account IDs currently in the group',
      control: 'object',
    },
    onSubmit: {
      description: 'Form submission handler',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with both users and service accounts
export const Default: Story = {
  args: {
    groupId: 'group-123',
    initialUsers: ['1'], // John is initially in the group
    initialServiceAccounts: ['1'], // webapp-service is initially in the group
    onSubmit: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length, limit: 20, offset: 0 },
          });
        }),
        // Service accounts API endpoint
        http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
          console.log('SB: MSW: Service accounts API called:', request.url);
          return HttpResponse.json(mockServiceAccounts);
        }),
        // Group principals endpoint for service account assignments
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request }) => {
          const url = new URL(request.url);
          const principalType = url.searchParams.get('principal_type');

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

    // Wait for the component to load
    await expect(canvas.findByText('Users')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Service accounts')).resolves.toBeInTheDocument();

    // Verify the Users tab is active by default
    const usersTab = await canvas.findByText('Users');

    // Wait for users to load in the table
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();

    // Verify users are displayed
    await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();

    // Switch to Service Accounts tab
    const serviceAccountsTab = await canvas.findByText('Service accounts');
    await userEvent.click(serviceAccountsTab);

    // Wait for service accounts to load
    await expect(canvas.findByText('webapp-service')).resolves.toBeInTheDocument();

    // Verify service accounts are displayed
    await expect(canvas.findByText('api-gateway-service')).resolves.toBeInTheDocument();

    // Switch back to Users tab
    await userEvent.click(usersTab);

    // Verify users are still displayed
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
  },
};

// Empty group scenario (new group creation)
export const NewGroup: Story = {
  args: {
    groupId: 'new-group',
    initialUsers: [],
    initialServiceAccounts: [],
    onSubmit: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length, limit: 20, offset: 0 },
          });
        }),
        // Service accounts API endpoint
        http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
          console.log('SB: MSW: Service accounts API called:', request.url);
          return HttpResponse.json(mockServiceAccounts);
        }),
        // Group principals endpoint for new groups
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request }) => {
          const url = new URL(request.url);
          console.log('SB: MSW: Group principals API called (new group):', request.url, 'Type:', url.searchParams.get('principal_type'));
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for the component to load
    await expect(canvas.findByText('Users')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Service accounts')).resolves.toBeInTheDocument();

    // Wait for users to load
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();

    // Verify no users are pre-selected
    const userCheckboxes = await canvas.findAllByRole('checkbox');
    userCheckboxes.forEach(async (checkbox) => {
      if (checkbox.getAttribute('aria-label')?.includes('Select row')) {
        await expect(checkbox).not.toBeChecked();
      }
    });

    // Switch to Service Accounts tab
    const serviceAccountsTab = await canvas.findByText('Service accounts');
    await userEvent.click(serviceAccountsTab);

    // Wait for service accounts to load
    await expect(canvas.findByText('webapp-service')).resolves.toBeInTheDocument();

    // Verify no service accounts are pre-selected
    const serviceAccountCheckboxes = await canvas.findAllByRole('checkbox');
    serviceAccountCheckboxes.forEach(async (checkbox) => {
      if (checkbox.getAttribute('aria-label')?.includes('Select row')) {
        await expect(checkbox).not.toBeChecked();
      }
    });
  },
};

// Tab switching with selections
export const TabSwitchingWithSelections: Story = {
  args: {
    groupId: 'group-123',
    initialUsers: ['1'], // John is pre-selected
    initialServiceAccounts: [],
    onSubmit: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length, limit: 20, offset: 0 },
          });
        }),
        // Service accounts API endpoint
        http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
          console.log('SB: MSW: Service accounts API called:', request.url);
          return HttpResponse.json(mockServiceAccounts);
        }),
        // Group principals endpoint for service account assignments
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request }) => {
          const url = new URL(request.url);
          const principalType = url.searchParams.get('principal_type');

          if (principalType === 'user') {
            // Return John as selected user
            return HttpResponse.json({
              data: [mockUsers[0]],
              meta: { count: 1, limit: 20, offset: 0 },
            });
          }

          // Return empty service accounts for this group
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for component to load
    await expect(canvas.findByText('Users')).resolves.toBeInTheDocument();

    // Wait for users to load and verify John is pre-selected
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();

    // Find John's row and verify he's selected
    const johnRow = (await canvas.findByText('john.doe')).closest('tr');
    const johnCheckbox = within(johnRow as HTMLElement).getByRole('checkbox');

    // Wait for initial selection to be applied
    await expect(johnCheckbox).toBeChecked();

    // Select Jane as well
    const janeRow = (await canvas.findByText('jane.smith')).closest('tr');
    const janeCheckbox = within(janeRow as HTMLElement).getByRole('checkbox');
    await userEvent.click(janeCheckbox);

    // Verify Jane is now selected
    await expect(janeCheckbox).toBeChecked();

    // Switch to Service Accounts tab
    const serviceAccountsTab = await canvas.findByText('Service accounts');
    await userEvent.click(serviceAccountsTab);

    // Wait for service accounts to load
    await expect(canvas.findByText('webapp-service')).resolves.toBeInTheDocument();

    // Select a service account
    const webappRow = (await canvas.findByText('webapp-service')).closest('tr');
    const webappCheckbox = within(webappRow as HTMLElement).getByRole('checkbox');
    await userEvent.click(webappCheckbox);

    // Verify service account is selected
    await expect(webappCheckbox).toBeChecked();

    // Switch back to Users tab
    const usersTab = await canvas.findByText('Users');
    await userEvent.click(usersTab);

    // Verify user selections are preserved
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();

    // Check that both users are still selected
    const johnRowAgain = (await canvas.findByText('john.doe')).closest('tr');
    const johnCheckboxAgain = within(johnRowAgain as HTMLElement).getByRole('checkbox');
    await expect(johnCheckboxAgain).toBeChecked();

    const janeRowAgain = (await canvas.findByText('jane.smith')).closest('tr');
    const janeCheckboxAgain = within(janeRowAgain as HTMLElement).getByRole('checkbox');
    await expect(janeCheckboxAgain).toBeChecked();
  },
};

// Pre-populated group (edit scenario)
export const PrePopulatedGroup: Story = {
  args: {
    groupId: 'group-123',
    initialUsers: ['1', '2'], // Both John and Jane are in the group
    initialServiceAccounts: ['1', '2'], // Both service accounts are in the group
    onSubmit: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length, limit: 20, offset: 0 },
          });
        }),
        // Service accounts API endpoint
        http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
          console.log('SB: MSW: Service accounts API called:', request.url);
          return HttpResponse.json(mockServiceAccounts);
        }),
        // Group principals endpoint for both users and service accounts
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request }) => {
          const url = new URL(request.url);
          const principalType = url.searchParams.get('principal_type');

          if (principalType === 'user') {
            // Return both users as selected
            return HttpResponse.json({
              data: mockUsers,
              meta: { count: mockUsers.length, limit: 20, offset: 0 },
            });
          }

          // Return both service accounts as selected
          return HttpResponse.json({
            data: mockServiceAccounts.map((sa) => ({
              clientId: sa.clientId,
              name: sa.name,
              description: sa.description,
              created: new Date(sa.createdAt * 1000).toISOString(),
              type: 'service-account',
              username: sa.clientId,
              owner: sa.createdBy,
            })),
            meta: { count: mockServiceAccounts.length, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for component to load
    await expect(canvas.findByText('Users')).resolves.toBeInTheDocument();

    // Wait for users to load
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();

    // Verify both users are pre-selected
    const johnRow = (await canvas.findByText('john.doe')).closest('tr');
    const johnCheckbox = within(johnRow as HTMLElement).getByRole('checkbox');

    const janeRow = (await canvas.findByText('jane.smith')).closest('tr');
    const janeCheckbox = within(janeRow as HTMLElement).getByRole('checkbox');

    // Wait for initial user selection to be applied
    await expect(johnCheckbox).toBeChecked();
    await expect(janeCheckbox).toBeChecked();

    // Switch to Service Accounts tab
    const serviceAccountsTab = await canvas.findByText('Service accounts');
    await userEvent.click(serviceAccountsTab);

    // Wait for service accounts to load
    await expect(canvas.findByText('webapp-service')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('api-gateway-service')).resolves.toBeInTheDocument();

    // Verify both service accounts are pre-selected
    const webappRow = (await canvas.findByText('webapp-service')).closest('tr');
    const webappCheckbox = within(webappRow as HTMLElement).getByRole('checkbox');

    const apiGatewayRow = (await canvas.findByText('api-gateway-service')).closest('tr');
    const apiGatewayCheckbox = within(apiGatewayRow as HTMLElement).getByRole('checkbox');

    // Wait for initial service account selection to be applied
    await expect(webappCheckbox).toBeChecked();
    await expect(apiGatewayCheckbox).toBeChecked();
  },
};

// Loading states
export const LoadingStates: Story = {
  args: {
    groupId: 'group-123',
    initialUsers: [],
    initialServiceAccounts: [],
    onSubmit: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/principals/', async () => {
          await delay('infinite');
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length },
          });
        }),
        // Service accounts API endpoint with delay
        http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', async () => {
          await delay('infinite');
          return HttpResponse.json(mockServiceAccounts);
        }),
        // Group principals endpoint with delay
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

    // Wait for component structure to load
    await expect(canvas.findByText('Users')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Service accounts')).resolves.toBeInTheDocument();

    // Check for loading state in Users tab
    await waitFor(
      async () => {
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        await expect(skeletonElements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );

    // Switch to Service Accounts tab and check loading there too
    const serviceAccountsTab = await canvas.findByText('Service accounts');
    await userEvent.click(serviceAccountsTab);

    // Service accounts should also show loading
    await waitFor(
      async () => {
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        await expect(skeletonElements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  },
};
