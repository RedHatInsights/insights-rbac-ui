import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { expectLoadingVisible, waitForDrawer } from '../../../../../test-utils/interactionHelpers';
import { Users } from './Users';
import { BrowserRouter } from 'react-router-dom';
import type { MockUserIdentity } from '../../../../../../.storybook/contexts/StorybookMockContext';
import { usersHandlers, usersLoadingHandlers } from '../../../../../shared/data/mocks/users.handlers';
import { groupsHandlers } from '../../../../../shared/data/mocks/groups.handlers';
import { v2RolesHandlers } from '../../../../data/mocks/roles.handlers';
import { groupMembersHandlers } from '../../../../../shared/data/mocks/groupMembers.handlers';
import { accountManagementHandlers } from '../../../../../shared/data/mocks/accountManagement.handlers';
import { createRoleBindingsListHandlers } from '../../../../data/mocks/roleBindings.handlers';
import type { RoleBinding } from '../../../../data/queries/roleBindings';

// Spy for tracking API calls
const addMembersToGroupSpy = fn();

// Mock user data for testing
const mockUsers = [
  {
    id: '1',
    username: 'john.doe',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: false,
    external_source_id: 123,
  },
  {
    id: '2',
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    is_org_admin: true,
    external_source_id: 456,
  },
  {
    id: '3',
    username: 'bob.johnson',
    email: 'bob.johnson@example.com',
    first_name: 'Bob',
    last_name: 'Johnson',
    is_active: false,
    is_org_admin: false,
    external_source_id: 789,
  },
];

// Minimal decorator - only provide Router (React Query provider is global)
const withRouter = (Story: StoryFn) => {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    </BrowserRouter>
  );
};

// Mock user identity for stories
const standardUser: MockUserIdentity = {
  org_id: '12345',
  account_number: '123456',
  user: {
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  },
};

const meta: Meta<typeof Users> = {
  component: Users,
  tags: ['ff:platform.rbac.common-auth-model', 'env:prod', 'perm:org-admin'],
  decorators: [withRouter],
  parameters: {
    permissions: {
      orgAdmin: true,
    },
    userIdentity: standardUser,
    featureFlags: {
      'platform.rbac.common-auth-model': false,
    },
    docs: {
      description: {
        component: `
**Users** is a feature container component that provides the main interface for viewing and managing users.

## Container Responsibilities
- **React Query State Management**: Manages user data, loading states, and API interactions
- **Authentication Integration**: Handles Chrome API integration for tokens and user context
- **Modal Coordination**: Manages all modal states (delete, bulk actions, add to group)
- **Feature Flag Integration**: Adapts UI based on auth model variations
- **Permission Context**: Handles organization admin permissions
- **Business Logic Orchestration**: Coordinates user operations like status changes and group assignments

## Key Features
- **User Table Management**: Provides data and callbacks to UsersTable presentational component
- **Modal Workflows**: Handles delete confirmation, bulk deactivation, and group assignment flows
- **User Focus Management**: Tracks focused user for detail drawer integration
- **Layout Providers**: Wraps components with necessary context providers and layout components
- **Route Integration**: Manages navigation to invitation flows and other user-related routes

## Architecture Pattern
This component follows the container/presentational pattern:
- **Container (this component)**: React Query, API calls, business logic, modal state
- **Presentational (UsersTable)**: Pure UI component receiving data and callbacks via props
- **Modal Components**: Injected as children to maintain separation of concerns

## Testing Focus
These stories test the container's integration with React Query, external APIs, and modal orchestration.
The presentational components are tested separately with comprehensive interaction stories.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for user details drawer
const mockUserGroups = [
  {
    uuid: 'group-1',
    name: 'Administrators',
    description: 'System administrators',
    principalCount: 5,
    roleCount: 3,
    created: '2023-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: 'group-2',
    name: 'Developers',
    description: 'Development team',
    principalCount: 12,
    roleCount: 2,
    created: '2023-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
];

const mockUserRolesV2 = [
  {
    id: 'role-1',
    name: 'User administrators',
    description: 'Manage users and groups',
    permissions: [],
    permissions_count: 5,
    last_modified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'role-2',
    name: 'Cost Management Viewer',
    description: 'View cost management data',
    permissions: [],
    permissions_count: 2,
    last_modified: '2024-01-01T00:00:00Z',
  },
];

const storyRoleBindings: RoleBinding[] = [
  {
    role: { id: mockUserRolesV2[0].id, name: mockUserRolesV2[0].name },
    subject: { id: String(mockUsers[0].external_source_id), type: 'user', groupName: mockUserGroups[0].name },
    resource: { id: 'ws-1', name: 'Production', type: 'workspace' },
  },
  {
    role: { id: mockUserRolesV2[1].id, name: mockUserRolesV2[1].name },
    subject: { id: String(mockUsers[0].external_source_id), type: 'user', groupName: mockUserGroups[1].name },
    resource: { id: 'ws-2', name: 'Development', type: 'workspace' },
  },
  {
    role: { id: mockUserRolesV2[1].id, name: mockUserRolesV2[1].name },
    subject: { id: String(mockUsers[1].external_source_id), type: 'user', groupName: mockUserGroups[0].name },
    resource: { id: 'ws-1', name: 'Production', type: 'workspace' },
  },
];

// Standard container story that tests React Query integration
export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Complete user management container with React Query integration. Orchestrates data fetching, page layout, modal coordination, and full table functionality.

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[Loading](?path=/story/features-access-management-users-and-user-groups-users-users--loading)**: Tests container behavior during API loading via React Query
- **[EmptyState](?path=/story/features-access-management-users-and-user-groups-users-users--empty-state)**: Tests container response to empty user data from React Query  
- **[AddToGroupModalIntegration](?path=/story/features-access-management-users-and-user-groups-users-users--add-to-group-modal-integration)**: Tests complete add-to-group modal workflow with React Query orchestration
- **[BulkDeactivateModalIntegration](?path=/story/features-access-management-users-and-user-groups-users-users--bulk-deactivate-modal-integration)**: Tests bulk deactivation workflow with React Query state coordination
        `,
      },
    },
    msw: {
      handlers: [
        ...usersHandlers(
          mockUsers.map((u) => ({
            username: u.username,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            is_active: u.is_active,
            is_org_admin: u.is_org_admin,
            external_source_id: String(u.external_source_id),
          })),
        ),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for container to load data and render the table through React Query
      await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();

      // Verify container passes React Query data to table - all users should be present
      await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('bob.johnson')).resolves.toBeInTheDocument();

      // Verify action buttons are rendered through container (check overflow menu)
      const kebabButton = await canvas.findByLabelText('Actions overflow menu');
      await userEvent.click(kebabButton);

      await expect(canvas.findByText(/Add to user group/i)).resolves.toBeInTheDocument();
      await expect(within(document.body).findByText(/Invite users/i)).resolves.toBeInTheDocument();

      // Close the menu
      await userEvent.keyboard('{Escape}');
    });
  },
};

// Container with loading state from React Query
export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container React Query integration for loading states. Users should see skeleton loading indicators when data is being fetched through React Query.',
      },
    },
    msw: {
      handlers: [...usersLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      // Should show skeleton loading state from container React Query
      await waitFor(() => {
        expectLoadingVisible(canvasElement);
      });
    });
  },
};

// Container with empty state from React Query
export const EmptyState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests container handling of empty user data from React Query. Container properly coordinates empty state display.',
      },
    },
    msw: {
      handlers: [...usersHandlers([])],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Should show empty state from container coordination
      await expect(canvas.findByRole('heading', { name: 'No users found' })).resolves.toBeInTheDocument();
    });
  },
};

// Container add-to-group modal integration test
export const AddToGroupModalIntegration: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container "Add to user group" modal state management and integration. Validates that selecting users and clicking "Add to user group" properly opens the AddUserToGroupModal and coordinates with React Query state.',
      },
    },
    msw: {
      handlers: [
        ...usersHandlers([
          {
            username: mockUsers[0].username,
            email: mockUsers[0].email,
            first_name: mockUsers[0].first_name,
            last_name: mockUsers[0].last_name,
            is_active: mockUsers[0].is_active,
            is_org_admin: mockUsers[0].is_org_admin,
            external_source_id: String(mockUsers[0].external_source_id),
          },
        ]),
        ...groupsHandlers([
          {
            uuid: '1',
            name: 'Test Group 1',
            description: 'First test group',
            principalCount: 2,
            roleCount: 1,
            created: '2023-01-01T00:00:00Z',
            modified: '2024-01-01T00:00:00Z',
            platform_default: false,
            admin_default: false,
            system: false,
          },
          {
            uuid: '2',
            name: 'Test Group 2',
            description: 'Second test group',
            principalCount: 5,
            roleCount: 2,
            created: '2023-01-01T00:00:00Z',
            modified: '2024-01-01T00:00:00Z',
            platform_default: false,
            admin_default: false,
            system: false,
          },
        ]),
        ...groupMembersHandlers(undefined, undefined, {
          onAddMembersWithRequest: addMembersToGroupSpy,
        }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Reset spy for clean test
      addMembersToGroupSpy.mockClear();

      // Wait for container to load data and render the user
      await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();

      // Test bulk selection through container logic - wait for checkbox to be available
      const firstRowCheckbox = await canvas.findByLabelText('Select row 0');

      await userEvent.click(firstRowCheckbox);

      let addToGroupButton: HTMLElement | null = null;
      await waitFor(async () => {
        // It may be in toolbar or overflow; check both possibilities
        addToGroupButton = canvas.queryByText(/Add to user group/i);
        if (!addToGroupButton) {
          const kebabButton = canvas.queryByLabelText('Actions overflow menu');
          if (kebabButton) {
            userEvent.click(kebabButton);
            addToGroupButton = canvas.queryByText(/Add to user group/i);
          }
        }
        await expect(addToGroupButton).not.toBeNull();
        await expect(addToGroupButton!).not.toHaveAttribute('disabled');
      });

      // Test add to group modal coordination
      await userEvent.click(addToGroupButton!);

      // Verify modal appears (container manages modal state)
      // Note: Modal content is rendered to document.body via portal, not in canvas
      const modal = await screen.findByRole('dialog');
      await expect(modal).toBeInTheDocument();
      await expect(within(modal).getByText(/Add to user group/i)).toBeInTheDocument();

      // Wait for groups to load in modal, then test group selection and API call
      // Use findByText to wait for the groups to load (important for CI environments)
      await expect(within(modal).findByText(/Test Group 1/i)).resolves.toBeInTheDocument();

      // Select a group and submit to test the API call
      const groupCheckboxes = within(modal).getAllByRole('checkbox');
      await userEvent.click(groupCheckboxes[0]); // Select first group

      const addButton = within(modal).getByRole('button', { name: /add/i });
      await waitFor(async () => {
        await expect(addButton).not.toBeDisabled();
      });

      await userEvent.click(addButton);

      // Verify the API was called with correct group ID
      await waitFor(async () => {
        await expect(addMembersToGroupSpy).toHaveBeenCalledWith(expect.any(Request), expect.objectContaining({ groupId: '1' }));
      });

      // Modal should close after successful submission
      await waitFor(async () => {
        await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  },
};

// API spy for org admin toggle
const toggleOrgAdminSpy = fn();

// Container org admin toggle integration test
export const OrgAdminToggleIntegration: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests the full org admin toggle mutation flow. Validates that clicking the org admin switch calls the IT API roles endpoint with the correct method (POST to grant, DELETE to revoke) and shows a success notification.',
      },
    },
    msw: {
      handlers: [
        ...usersHandlers(
          mockUsers.map((u) => ({
            username: u.username,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            is_active: u.is_active,
            is_org_admin: u.is_org_admin,
            external_source_id: String(u.external_source_id),
          })),
        ),
        ...accountManagementHandlers({
          onToggleOrgAdmin: (accountId, userId, body) => {
            toggleOrgAdminSpy({ accountId, userId, body });
          },
        }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Reset spy', async () => {
      toggleOrgAdminSpy.mockClear();
    });

    await step('Grant org admin to non-admin user', async () => {
      const canvas = within(canvasElement);
      await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();

      const orgAdminSwitch = await canvas.findByLabelText(/Toggle org admin for john.doe/i);
      await expect(orgAdminSwitch).not.toBeChecked();
      await userEvent.click(orgAdminSwitch);
    });

    await step('Verify API call and success notification', async () => {
      await waitFor(
        async () => {
          await expect(toggleOrgAdminSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              userId: String(mockUsers[0].external_source_id),
              body: { role: 'organization_administrator' },
            }),
          );
        },
        { timeout: 5000 },
      );

      await waitFor(
        async () => {
          const notification = within(document.body).queryByText(/Success updating user/i);
          await expect(notification).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  },
};

// Container bulk deactivate modal integration test
export const BulkDeactivateModalIntegration: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container bulk deactivate modal state management. Validates that selecting multiple users and triggering bulk deactivation properly opens the BulkDeactivateUsersModal.',
      },
    },
    msw: {
      handlers: [
        ...usersHandlers(
          mockUsers.slice(0, 2).map((u) => ({
            username: u.username,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            is_active: u.is_active,
            is_org_admin: u.is_org_admin,
            external_source_id: String(u.external_source_id),
          })),
        ),
        ...accountManagementHandlers(),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for container to load data and render the users
      await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();

      // Select multiple users by clicking their checkboxes - wait for them to be available
      const firstRowCheckbox = await canvas.findByLabelText('Select row 0');
      const secondRowCheckbox = await canvas.findByLabelText('Select row 1');

      await userEvent.click(firstRowCheckbox);
      await userEvent.click(secondRowCheckbox);

      // Open the Actions overflow menu first (bulk actions are inside the kebab dropdown)
      const overflowMenu = await canvas.findByLabelText('Actions overflow menu');
      await userEvent.click(overflowMenu);

      // Look for deactivate option in the dropdown menu
      const bulkDeactivateButton = await within(document.body).findByRole('menuitem', { name: /Deactivate users/i });
      await expect(bulkDeactivateButton).toBeInTheDocument();

      // Click bulk deactivate
      await userEvent.click(bulkDeactivateButton);

      // Verify bulk deactivate modal appears (container manages modal state)
      // Note: Modal content is rendered to document.body via portal, not in canvas
      const modal = await screen.findByRole('dialog');
      await expect(modal).toBeInTheDocument();
      await expect(within(modal).getByText(/Deactivate users/i)).toBeInTheDocument();

      // Complete the workflow by confirming the action
      const modalContent = within(modal);

      // Find and click the confirmation checkbox
      const confirmCheckbox = await modalContent.findByRole('checkbox');
      await userEvent.click(confirmCheckbox);

      // Find and click the deactivate button
      const deactivateButton = await modalContent.findByRole('button', { name: /deactivate user\(s\)/i });
      await expect(deactivateButton).not.toBeDisabled();
      await userEvent.click(deactivateButton);

      // Verify modal closes after action (API calls are TODO in the actual component)
      await waitFor(async () => {
        await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  },
};

export const UserDetailsIntegration: Story = {
  args: {
    defaultPerPage: 5,
    ouiaId: 'users-with-details-drawer',
  },
  parameters: {
    docs: {
      description: {
        story: `
**User Details Integration**: Tests complete row click behavior and UserDetailsDrawer integration. When a user clicks on a table row, the drawer opens and loads the user's groups and roles data.

### Integration Features:
- **Row Click Events**: Table rows trigger DataView events when clicked
- **Drawer State Management**: UserDetailsDrawer opens and displays user information
- **Data Loading**: Groups and roles are fetched for the selected user  
- **Tab Switching**: Users can switch between Groups and Roles tabs
- **Close Behavior**: Drawer can be closed via close button

### Data Flow:
1. User clicks table row → \`handleRowClick\` → \`setFocusedUser\` + DataView event
2. UserDetailsDrawer subscribes to DataView events → opens drawer
3. UserDetailsGroupsView dispatches \`fetchGroups\` with username filter
4. UserDetailsRolesView dispatches \`fetchRoles\` with username filter
5. MSW handlers respond with mock data → components render user details
        `,
      },
    },
    msw: {
      handlers: [
        ...usersHandlers(
          mockUsers.map((u) => ({
            username: u.username,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            is_active: u.is_active,
            is_org_admin: u.is_org_admin,
            external_source_id: String(u.external_source_id),
          })),
        ),
        ...groupsHandlers(mockUserGroups, {
          groupsForUsername: (username: string) => {
            if (username === 'john.doe') return mockUserGroups;
            if (username === 'jane.smith') return [mockUserGroups[0]];
            if (username) return [];
            return null;
          },
        }),
        ...v2RolesHandlers(mockUserRolesV2, {
          rolesForUsername: (username: string) => {
            if (username === 'john.doe') return mockUserRolesV2;
            if (username === 'jane.smith') return [mockUserRolesV2[1]];
            if (username) return [];
            return null;
          },
        }),
        ...createRoleBindingsListHandlers(storyRoleBindings),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for users table to load
      await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();

      const drawer = await waitForDrawer();

      // Click on John Doe's row to focus user
      const johnDoeRow = (await canvas.findByText('john.doe')).closest('tr');
      await expect(johnDoeRow).toBeInTheDocument();

      await userEvent.click(johnDoeRow!);

      // Verify drawer content shows John Doe's details
      await expect(drawer.findByText('John Doe')).resolves.toBeInTheDocument();
      await expect(drawer.findByText('john.doe@example.com')).resolves.toBeInTheDocument();

      // PF tabs render all tab content into the DOM (hidden via CSS), so group
      // names like "Administrators" can appear in both the Groups tab and the
      // Roles tab's "User Group" column simultaneously. Use findAllByText.
      const initialAdminTexts = await drawer.findAllByText('Administrators');
      await expect(initialAdminTexts.length).toBeGreaterThanOrEqual(1);
      const initialDevTexts = await drawer.findAllByText('Developers');
      await expect(initialDevTexts.length).toBeGreaterThanOrEqual(1);

      // Switch to Roles tab
      const rolesTab = await drawer.findByRole('tab', { name: /Assigned roles/i });
      await userEvent.click(rolesTab);

      // Verify Roles tab content loads (role names are unique across tabs)
      await expect(drawer.findByText('User administrators')).resolves.toBeInTheDocument();
      await expect(drawer.findByText('Cost Management Viewer')).resolves.toBeInTheDocument();

      // Switch back to Groups tab
      const groupsTab = await drawer.findByRole('tab', { name: /User groups/i });
      await userEvent.click(groupsTab);

      const adminTexts = await drawer.findAllByText('Administrators');
      await expect(adminTexts.length).toBeGreaterThanOrEqual(1);
      const devTexts = await drawer.findAllByText('Developers');
      await expect(devTexts.length).toBeGreaterThanOrEqual(1);

      // Test selecting a different user - click Jane Smith
      const janeSmithRow = (await canvas.findByText('jane.smith')).closest('tr');
      await expect(janeSmithRow).toBeInTheDocument();

      await userEvent.click(janeSmithRow!);

      // Verify drawer content updates to Jane's details
      await expect(drawer.findByText('Jane Smith')).resolves.toBeInTheDocument();
      await expect(drawer.findByText('jane.smith@example.com')).resolves.toBeInTheDocument();

      // Verify Groups content loads for Jane (only Administrators)
      const janeAdminTexts = await drawer.findAllByText('Administrators');
      await expect(janeAdminTexts.length).toBeGreaterThanOrEqual(1);

      // Test close functionality
      const closeButton = await drawer.findByLabelText('Close drawer panel');
      await userEvent.click(closeButton);

      // Verify drawer content is cleared (but drawer panel still exists)
      await waitFor(
        async () => {
          await expect(drawer.queryByText('Jane Smith')).not.toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });
  },
};
