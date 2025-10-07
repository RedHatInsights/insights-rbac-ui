import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Users } from './Users';
import { BrowserRouter } from 'react-router-dom';
import { HttpResponse, delay, http } from 'msw';

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

// Minimal decorator - only provide Router (Redux provider is global)
const withRouter = (Story: any) => {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    </BrowserRouter>
  );
};

// Create stable auth mock to prevent render loops
const stableAuthMock = {
  getToken: () => Promise.resolve('mock-token'),
  getUser: () =>
    Promise.resolve({
      identity: {
        org_id: 12345,
        account_number: '123456',
        user: {
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
        },
      },
    }),
};

const meta: Meta<typeof Users> = {
  component: Users,
  tags: ['ff:platform.rbac.common-auth-model', 'env:prod', 'perm:org-admin'],
  decorators: [withRouter],
  parameters: {
    // Use global providers for these (configured in .storybook/preview.tsx)
    permissions: {
      orgAdmin: true, // Default for testing
    },
    chrome: {
      environment: 'prod',
      auth: stableAuthMock,
    },
    featureFlags: {
      'platform.rbac.common-auth-model': false,
    },
    docs: {
      description: {
        component: `
**Users** is a feature container component that provides the main interface for viewing and managing users.

## Container Responsibilities
- **Redux State Management**: Manages user data, loading states, and API interactions
- **Authentication Integration**: Handles Chrome API integration for tokens and user context
- **Modal Coordination**: Manages all modal states (delete, bulk actions, add to group)
- **Feature Flag Integration**: Adapts UI based on auth model variations
- **Permission Context**: Handles organization admin permissions and production environment checks
- **Business Logic Orchestration**: Coordinates user operations like status changes and group assignments

## Key Features
- **User Table Management**: Provides data and callbacks to UsersTable presentational component
- **Modal Workflows**: Handles delete confirmation, bulk deactivation, and group assignment flows
- **User Focus Management**: Tracks focused user for detail drawer integration
- **Layout Providers**: Wraps components with necessary context providers and layout components
- **Route Integration**: Manages navigation to invitation flows and other user-related routes

## Architecture Pattern
This component follows the container/presentational pattern:
- **Container (this component)**: Redux, API calls, business logic, modal state
- **Presentational (UsersTable)**: Pure UI component receiving data and callbacks via props
- **Modal Components**: Injected as children to maintain separation of concerns

## Testing Focus
These stories test the container's integration with Redux, external APIs, and modal orchestration.
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
    platform_default: false,
    admin_default: false,
    system: false,
  },
];

const mockUserRoles = [
  {
    uuid: 'role-1',
    name: 'User administrators',
    description: 'Manage users and groups',
    display_name: 'User administrators',
    system: false,
    platform_default: false,
    admin_default: false,
    accessCount: 5,
    applications: ['rbac'],
    groups_in_count: 2,
    groups_in: ['Administrators', 'HR Team'],
    workspace: {
      uuid: 'workspace-1',
      name: 'Default',
      description: 'Default workspace',
    },
  },
  {
    uuid: 'role-2',
    name: 'Cost Management Viewer',
    description: 'View cost management data',
    display_name: 'Cost Management Viewer',
    system: false,
    platform_default: false,
    admin_default: false,
    accessCount: 2,
    applications: ['cost-management'],
    groups_in_count: 1,
    groups_in: ['Administrators'],
    workspace: {
      uuid: 'workspace-1',
      name: 'Default',
      description: 'Default workspace',
    },
  },
];

// Standard container story that tests Redux integration
export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Complete user management container with Redux integration. Orchestrates data fetching, page layout, modal coordination, and full table functionality.

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[Loading](?path=/story/features-access-management-users-and-user-groups-users-users--loading-from-redux)**: Tests container behavior during API loading via Redux state management
- **[EmptyState](?path=/story/features-access-management-users-and-user-groups-users-users--empty-state-from-redux)**: Tests container response to empty user data from Redux  
- **[AddToGroupModalIntegration](?path=/story/features-access-management-users-and-user-groups-users-users--add-to-group-modal-integration)**: Tests complete add-to-group modal workflow with Redux orchestration
- **[DeleteUserModalIntegration](?path=/story/features-access-management-users-and-user-groups-users-users--delete-user-modal-integration)**: Tests complete delete user modal workflow with Redux orchestration
- **[BulkDeactivateModalIntegration](?path=/story/features-access-management-users-and-user-groups-users-users--bulk-deactivate-modal-integration)**: Tests bulk deactivation workflow with Redux state coordination
        `,
      },
    },
    msw: {
      handlers: [
        // Principals API - this is what fetchUsers actually calls
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length, limit: 20, offset: 0 },
          });
        }),
        http.put('/api/rbac/v1/users/:userId/', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for container to load data and render the table through Redux
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();

    // Verify container passes Redux data to table - all users should be present
    await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('bob.johnson')).resolves.toBeInTheDocument();

    // Verify action buttons are rendered through container (check overflow menu)
    const kebabButton = await canvas.findByLabelText('Actions overflow menu');
    await userEvent.click(kebabButton);

    await expect(canvas.findByText(/Add to user group/i)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Invite users/i)).resolves.toBeInTheDocument();

    // Close the menu
    await userEvent.keyboard('{Escape}');
  },
};

// Container with loading state from Redux
export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container Redux integration for loading states. Users should see skeleton loading indicators when data is being fetched through Redux.',
      },
    },
    msw: {
      handlers: [
        // Never resolve to keep component in loading state - tests real Redux loading orchestration
        http.get('/api/rbac/v1/principals/', async () => {
          await delay('infinite');
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
    // Should show skeleton loading state from container Redux
    await waitFor(async () => {
      const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
      await expect(skeletonElements.length).toBeGreaterThan(0);
    });
  },
};

// Container with empty state from Redux
export const EmptyState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests container handling of empty user data from Redux. Container properly coordinates empty state display.',
      },
    },
    msw: {
      handlers: [
        // Return empty data to test empty state handling - tests real Redux empty state orchestration
        http.get('/api/rbac/v1/principals/', () => {
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

    // Should show empty state from container coordination
    await expect(canvas.findByRole('heading', { name: 'No users found' })).resolves.toBeInTheDocument();
  },
};

// Container add-to-group modal integration test
export const AddToGroupModalIntegration: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container "Add to user group" modal state management and integration. Validates that selecting users and clicking "Add to user group" properly opens the AddUserToGroupModal and coordinates with Redux state.',
      },
    },
    msw: {
      handlers: [
        // Principals API - let container fetch data naturally
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: [mockUsers[0]], // Single user for focused testing
            meta: { count: 1, limit: 20, offset: 0 },
          });
        }),
        // Groups API for modal functionality
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [
              { uuid: '1', name: 'Test Group 1', description: 'First test group', principalCount: 2, roleCount: 1, system: false },
              { uuid: '2', name: 'Test Group 2', description: 'Second test group', principalCount: 5, roleCount: 2, system: false },
            ],
            meta: { count: 2 },
          });
        }),
        // Add handler for adding users to groups
        http.post('/api/rbac/v1/groups/:groupId/principals/', ({ request, params }) => {
          addMembersToGroupSpy(request, params);
          return HttpResponse.json({ success: true });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
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
  },
};

// Container delete user modal integration test
export const DeleteUserModalIntegration: Story = {
  tags: ['env:stage', 'perm:org-admin'],
  parameters: {
    docs: {
      description: {
        story:
          'Tests container delete user modal state management. Validates that clicking delete on a user properly opens the DeleteUserModal with the correct user information.',
      },
    },
    // Override chrome environment to allow delete actions (production disables delete)
    chrome: {
      environment: 'stage', // Non-production environment to enable delete
      auth: stableAuthMock,
    },
    // Ensure user has org admin permissions to enable delete
    permissions: {
      orgAdmin: true,
    },
    msw: {
      handlers: [
        // Principals API - let container fetch data naturally
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: [mockUsers[0]], // Single user for focused testing
            meta: { count: 1, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for container to load data and render the user
    await canvas.findByText('john.doe');

    // Find the kebab menu button for the user's row actions
    const kebabMenuButton = await canvas.findByLabelText('Actions for user john.doe');

    // Click the kebab menu to open it
    await userEvent.click(kebabMenuButton);

    // Find the delete option in the opened dropdown
    const deleteButton = await canvas.findByText('Delete');
    await expect(deleteButton).toBeInTheDocument();

    await userEvent.click(deleteButton);

    // Verify delete modal appears with correct title
    // Note: Modal content is rendered to document.body via portal, not in canvas
    const modal = await screen.findByRole('dialog');
    await expect(modal).toBeInTheDocument();
    await expect(within(modal).getByText(/Remove from user groups\?/i)).toBeInTheDocument();

    // Complete the workflow by confirming the deletion
    const modalContent = within(modal);

    // Find and click the Remove button
    const removeButton = await modalContent.findByRole('button', { name: /remove/i });
    await expect(removeButton).not.toBeDisabled();
    await userEvent.click(removeButton);

    // Verify modal closes after action (API calls are TODO in the actual component)
    await waitFor(async () => {
      await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
        // Principals API - let container fetch data naturally
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: mockUsers.slice(0, 2), // Two users for bulk testing
            meta: { count: 2, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for container to load data and render the users
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();

    // Select multiple users by clicking their checkboxes - wait for them to be available
    const firstRowCheckbox = await canvas.findByLabelText('Select row 0');
    const secondRowCheckbox = await canvas.findByLabelText('Select row 1');

    await userEvent.click(firstRowCheckbox);
    await userEvent.click(secondRowCheckbox);

    // Wait for selection state to update
    await delay(100);

    // Look for bulk status dropdown (based on the UsersTable implementation)
    const statusDropdownButton = await canvas.findByText(/Activate users/i); // This is the toggle text from activateUsersButton message
    await expect(statusDropdownButton).toBeInTheDocument();
    await expect(statusDropdownButton).not.toBeDisabled();

    // Click to open the dropdown
    await userEvent.click(statusDropdownButton);

    // Look for deactivate option in the dropdown
    const bulkDeactivateButton = await canvas.findByText(/Deactivate users/i); // This should match deactivateUsersButton message
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
        // Main users endpoint
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20', 10);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);

          // Return paginated users
          const paginatedUsers = mockUsers.slice(offset, offset + limit);

          return HttpResponse.json({
            data: paginatedUsers,
            meta: {
              limit,
              offset,
              count: mockUsers.length,
            },
          });
        }),

        // User groups endpoint (for UserDetailsGroupsView)
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');

          if (username === 'john.doe') {
            // John Doe's groups
            return HttpResponse.json({
              data: mockUserGroups,
              meta: {
                count: mockUserGroups.length,
              },
            });
          } else if (username === 'jane.smith') {
            // Jane Smith's groups (only Administrators)
            return HttpResponse.json({
              data: [mockUserGroups[0]], // Only Administrators group
              meta: {
                count: 1,
              },
            });
          } else if (username) {
            // Other users have no groups
            return HttpResponse.json({ data: [], meta: { count: 0 } });
          }

          // Fallback for other group requests
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),

        // User roles endpoint (for UserDetailsRolesView)
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');

          if (username === 'john.doe') {
            // John Doe's roles
            return HttpResponse.json({
              data: mockUserRoles,
              meta: {
                count: mockUserRoles.length,
              },
            });
          } else if (username === 'jane.smith') {
            // Jane Smith's roles (only Cost Management Viewer)
            return HttpResponse.json({
              data: [mockUserRoles[1]], // Only Cost Management Viewer
              meta: {
                count: 1,
              },
            });
          } else if (username) {
            // Other users have no roles
            return HttpResponse.json({ data: [], meta: { count: 0 } });
          }

          // Fallback for other role requests
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for users table to load
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();

    // Get drawer panel reference (always exists in DOM)
    const drawerPanel = canvasElement.querySelector('.pf-v5-c-drawer__panel') as HTMLElement;
    await expect(drawerPanel).toBeInTheDocument();
    const drawer = within(drawerPanel);

    // Click on John Doe's row to focus user
    const johnDoeRow = (await canvas.findByText('john.doe')).closest('tr');
    await expect(johnDoeRow).toBeInTheDocument();

    await userEvent.click(johnDoeRow!);

    // Verify drawer content shows John Doe's details
    await expect(drawer.findByText('John Doe')).resolves.toBeInTheDocument();
    await expect(drawer.findByText('john.doe@example.com')).resolves.toBeInTheDocument();

    // Verify Groups tab content loads (default tab)
    await expect(drawer.findByText('Administrators')).resolves.toBeInTheDocument();
    await expect(drawer.findByText('Developers')).resolves.toBeInTheDocument();

    // Switch to Roles tab
    const rolesTab = await drawer.findByText('Assigned roles');
    await userEvent.click(rolesTab);

    // Verify Roles tab content loads
    await expect(drawer.findByText('User administrators')).resolves.toBeInTheDocument();
    await expect(drawer.findByText('Cost Management Viewer')).resolves.toBeInTheDocument();

    // Switch back to Groups tab
    const groupsTab = await drawer.findByText('User groups');
    await userEvent.click(groupsTab);

    // Verify Groups content is still there
    await expect(drawer.findByText('Administrators')).resolves.toBeInTheDocument();
    await expect(drawer.findByText('Developers')).resolves.toBeInTheDocument();

    // Test selecting a different user - click Jane Smith
    const janeSmithRow = (await canvas.findByText('jane.smith')).closest('tr');
    await expect(janeSmithRow).toBeInTheDocument();

    await userEvent.click(janeSmithRow!);

    // Verify drawer content updates to Jane's details
    await expect(drawer.findByText('Jane Smith')).resolves.toBeInTheDocument();
    await expect(drawer.findByText('jane.smith@example.com')).resolves.toBeInTheDocument();

    // Verify Groups content loads for Jane (only Administrators)
    await expect(drawer.findByText('Administrators')).resolves.toBeInTheDocument();
    await expect(drawer.queryByText('Developers')).not.toBeInTheDocument(); // Jane is not in Developers

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
  },
};
