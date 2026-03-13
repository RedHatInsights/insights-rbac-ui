import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ComponentMapper, FormRenderer } from '@data-driven-forms/react-form-renderer';

import { usersHandlers, usersLoadingHandlers } from '../../../../../../shared/data/mocks/users.handlers';
import { serviceAccountsHandlers, serviceAccountsLoadingHandlers } from '../../../../../../shared/data/mocks/serviceAccounts.handlers';
import { createGroupMembersHandlers, groupMembersLoadingHandlers } from '../../../../../../shared/data/mocks/groupMembers.handlers';
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
];

// Create a FormRenderer wrapper for testing the component
// Note: Named TestFormWrapper (not FormWrapper) to avoid conflicts with data-driven-forms prop names
const TestFormWrapper: React.FC<{
  initialUsers?: string[];
  initialServiceAccounts?: string[];
  groupId?: string;
  onSubmit?: (values: Record<string, unknown>) => void;
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
    initialUsers: ['john.doe'], // John is initially in the group (using username)
    initialServiceAccounts: ['webapp-client'], // webapp-service is initially in the group (using clientId)
    onSubmit: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        ...usersHandlers(mockUsers),
        ...serviceAccountsHandlers(mockServiceAccountsForList),
        ...createGroupMembersHandlers({ 'group-123': [] }, { 'group-123': [mockServiceAccountsForGroup[0]] }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
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
    });
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
      handlers: [...usersHandlers(mockUsers), ...serviceAccountsHandlers(mockServiceAccountsForList), ...createGroupMembersHandlers({}, {})],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
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
    });
  },
};

// Tab switching with selections
export const TabSwitchingWithSelections: Story = {
  args: {
    groupId: 'group-123',
    initialUsers: ['john.doe'], // John is pre-selected (using username)
    initialServiceAccounts: [],
    onSubmit: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        ...usersHandlers(mockUsers),
        ...serviceAccountsHandlers(mockServiceAccountsForList),
        ...createGroupMembersHandlers({ 'group-123': [mockUsers[0]] }, { 'group-123': [] }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
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
    });
  },
};

// Pre-populated group (edit scenario)
export const PrePopulatedGroup: Story = {
  args: {
    groupId: 'group-123',
    initialUsers: ['john.doe', 'jane.smith'], // Both John and Jane are in the group (using username)
    initialServiceAccounts: ['webapp-client', 'api-gateway-client'], // Both service accounts are in the group (using clientId)
    onSubmit: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        ...usersHandlers(mockUsers),
        ...serviceAccountsHandlers(mockServiceAccountsForList),
        ...createGroupMembersHandlers({ 'group-123': mockUsers }, { 'group-123': mockServiceAccountsForGroup }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
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
    });
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
      handlers: [...usersLoadingHandlers(), ...serviceAccountsLoadingHandlers(), ...groupMembersLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
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
    });
  },
};
