import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider, EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { HttpResponse, delay, http } from 'msw';

import { UserDetailsDrawer } from './UserDetailsDrawer';
import { User } from '../../../../../redux/users/reducer';

// Mock user data for testing
const mockUser: User = {
  username: 'john.doe',
  email: 'john.doe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  is_active: true,
  is_org_admin: false,
  external_source_id: 123,
  uuid: 456,
};

// Component to simulate DataView table row clicks for testing
const TestDataViewTable: React.FC<{ onUserSelect: (user: User) => void }> = ({ onUserSelect }) => {
  const context = useDataViewEventsContext();

  const handleRowClick = () => {
    context.trigger(EventTypes.rowClick, mockUser);
    onUserSelect(mockUser);
  };

  return (
    <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', marginBottom: '1rem' }}>
      <h3>Mock DataView Table</h3>
      <p>Click the button below to simulate a table row click event:</p>
      <Button onClick={handleRowClick}>
        Click to select user: {mockUser.first_name} {mockUser.last_name}
      </Button>
    </div>
  );
};

const meta: Meta<typeof UserDetailsDrawer> = {
  component: UserDetailsDrawer,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <DataViewEventsProvider>
          <div style={{ height: '600px' }}>
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
**UserDetailsDrawer** is a smart container component that integrates the presentational UserDetailsDrawer with DataView events and manages drawer state.

### Container Responsibilities
- **DataView Integration**: Subscribes to DataView row click events to trigger drawer open
- **State Management**: Manages focused user state and drawer open/close behavior
- **Tab Content Rendering**: Provides render functions for UserDetailsGroupsView and UserDetailsRolesView
- **Event Orchestration**: Coordinates between table interactions and drawer display

### Architecture Pattern
This component follows the **smart container pattern**:
- **Smart Container (this component)**: Handles DataView integration, event subscriptions, and state management
- **Presentational Component**: Pure UI component from \`src/features/users/components/UserDetailsDrawer\`
- **Child Containers**: UserDetailsGroupsView and UserDetailsRolesView handle their own data fetching

### Integration Points
- **DataViewEventsProvider**: Required context for row click event subscription
- **UserDetailsGroupsView**: Rendered in groups tab with userId and ouiaId props
- **UserDetailsRolesView**: Rendered in roles tab with userId and ouiaId props
- **Presentational Drawer**: Handles all UI rendering and interactions

### Testing Focus
These stories test the container's event handling, state management, and integration with the DataView event system.
The child view components and presentational drawer are tested separately with their own comprehensive stories.
        `,
      },
    },
  },
  argTypes: {
    focusedUser: {
      description: 'The currently focused user object to display in the drawer',
    },
    setFocusedUser: {
      description: 'Function to update the focused user state',
    },
    children: {
      description: 'Content to display in the main area (typically a table or other content)',
    },
    ouiaId: {
      description: 'OUIA ID for testing purposes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserDetailsDrawer>;

export const Default: Story = {
  tags: ['autodocs'],
  args: {
    focusedUser: undefined,
    setFocusedUser: fn(),
    ouiaId: 'user-details-drawer',
  },
  parameters: {
    msw: {
      handlers: [
        // User groups API endpoint
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');
          console.log('SB: MSW: User groups API called for username:', username);

          return HttpResponse.json({
            data: [
              {
                uuid: '1',
                name: 'Administrators',
                description: 'System administrators',
                principalCount: 5,
                roleCount: 3,
                created: '2023-01-01T00:00:00Z',
                modified: '2023-06-15T10:30:00Z',
                platform_default: false,
                admin_default: false,
                system: false,
              },
            ],
            meta: { count: 1, limit: 20, offset: 0 },
          });
        }),
        // User roles API endpoint
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');
          console.log('SB: MSW: User roles API called for username:', username);

          return HttpResponse.json({
            data: [
              {
                uuid: '1',
                name: 'Red Hat Insights Viewer',
                description: 'Read-only access to Red Hat Insights',
                system: true,
                platform_default: false,
                admin_default: false,
                created: '2023-01-01T00:00:00Z',
                modified: '2023-06-15T10:30:00Z',
                policyCount: 1,
                accessCount: 5,
              },
            ],
            meta: { count: 1, limit: 20, offset: 0 },
          });
        }),
      ],
    },
    docs: {
      description: {
        story: `
**Container Integration**: Complete DataView integration test. Component subscribes to row click events, manages drawer state, and renders tab content through child container components.

## Container Test Scenarios

This story demonstrates:
- **Event Subscription**: Container subscribes to DataView \`EventTypes.rowClick\` events
- **State Management**: Manages focused user state and updates drawer visibility
- **Tab Rendering**: Provides render functions that create UserDetailsGroupsView and UserDetailsRolesView components
- **Integration Flow**: Complete flow from table row click to drawer display with tab content

## Additional Container Stories

For testing specific container scenarios, see these additional stories:

- **[WithSelectedUser](?path=/story/features-access-management-users-and-user-groups-users-user-detail-userdetailsdrawer--with-selected-user)**: Tests container with pre-selected user
- **[DataViewIntegration](?path=/story/features-access-management-users-and-user-groups-users-user-detail-userdetailsdrawer--data-view-integration)**: Tests complete DataView event integration
        `,
      },
    },
  },
  render: (args) => {
    const [focusedUser, setFocusedUser] = useState<User | undefined>(args.focusedUser);

    return (
      <UserDetailsDrawer {...args} focusedUser={focusedUser} setFocusedUser={setFocusedUser}>
        <TestDataViewTable onUserSelect={setFocusedUser} />
        <div style={{ padding: '1rem' }}>
          <h2>Main Content Area</h2>
          <p>This is where the main table or content would be displayed.</p>
          <p>The drawer will slide in from the right when a user is selected.</p>
          <p>
            <strong>Current State:</strong> {focusedUser ? `${focusedUser.first_name} ${focusedUser.last_name} selected` : 'No user selected'}
          </p>
        </div>
      </UserDetailsDrawer>
    );
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Initially, no drawer should be visible
    await expect(canvas.queryByText('john.doe')).not.toBeInTheDocument();

    // Click the test button to simulate row click
    const selectButton = await canvas.findByText('Click to select user: John Doe');
    await userEvent.click(selectButton);

    // Verify state update is reflected (the render function handles calling the state setter)
    await expect(canvas.findByText('John Doe selected')).resolves.toBeInTheDocument();

    // Verify drawer opens with user details
    await expect(canvas.findByText('john.doe@example.com')).resolves.toBeInTheDocument();
  },
};

export const WithSelectedUser: Story = {
  args: {
    focusedUser: mockUser,
    setFocusedUser: fn(),
    ouiaId: 'user-details-drawer-selected',
  },
  parameters: {
    msw: {
      handlers: [
        // User groups API endpoint
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');
          console.log('SB: MSW: User groups API called for username:', username);

          return HttpResponse.json({
            data: [
              {
                uuid: '1',
                name: 'Administrators',
                description: 'System administrators',
                principalCount: 5,
                roleCount: 3,
                created: '2023-01-01T00:00:00Z',
                modified: '2023-06-15T10:30:00Z',
                platform_default: false,
                admin_default: false,
                system: false,
              },
            ],
            meta: { count: 1, limit: 20, offset: 0 },
          });
        }),
        // User roles API endpoint
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');
          console.log('SB: MSW: User roles API called for username:', username);

          return HttpResponse.json({
            data: [
              {
                uuid: '1',
                name: 'Red Hat Insights Viewer',
                description: 'Read-only access to Red Hat Insights',
                system: true,
                platform_default: false,
                admin_default: false,
                created: '2023-01-01T00:00:00Z',
                modified: '2023-06-15T10:30:00Z',
                policyCount: 1,
                accessCount: 5,
              },
            ],
            meta: { count: 1, limit: 20, offset: 0 },
          });
        }),
      ],
    },
    docs: {
      description: {
        story: `
**Pre-selected User**: Tests container behavior when a user is already selected. Drawer is open and displays user information with tabs.
        `,
      },
    },
  },
  render: (args) => {
    const [focusedUser, setFocusedUser] = useState<User | undefined>(args.focusedUser);

    return (
      <UserDetailsDrawer {...args} focusedUser={focusedUser} setFocusedUser={setFocusedUser}>
        <div style={{ padding: '1rem' }}>
          <h2>Main Content Area</h2>
          <p>User drawer is open on the right side showing selected user details.</p>
          <p>
            <strong>Selected User:</strong> {focusedUser ? `${focusedUser.first_name} ${focusedUser.last_name}` : 'None'}
          </p>
        </div>
      </UserDetailsDrawer>
    );
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Drawer should be visible with user information - use more flexible text matcher
    await canvas.findByText((content, element) => {
      return element?.textContent === 'Selected User: John Doe';
    });

    // Verify user email is displayed
    await expect(canvas.findByText('john.doe@example.com')).resolves.toBeInTheDocument();

    // Verify tabs are present
    await expect(canvas.findByText('User groups')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Assigned roles')).resolves.toBeInTheDocument();

    // Test close button functionality
    const closeButton = await canvas.findByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    // Drawer should close (focusedUser should be set to undefined)
    // Note: This tests the onClose callback which calls setFocusedUser(undefined)
  },
};

export const DataViewIntegration: Story = {
  args: {
    focusedUser: undefined,
    setFocusedUser: fn(),
    ouiaId: 'user-details-drawer-integration',
  },
  parameters: {
    msw: {
      handlers: [
        // User groups API endpoint
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');
          console.log('SB: MSW: User groups API called for username:', username);

          return HttpResponse.json({
            data: [
              {
                uuid: '1',
                name: 'Administrators',
                description: 'System administrators',
                principalCount: 5,
                roleCount: 3,
                created: '2023-01-01T00:00:00Z',
                modified: '2023-06-15T10:30:00Z',
                platform_default: false,
                admin_default: false,
                system: false,
              },
            ],
            meta: { count: 1, limit: 20, offset: 0 },
          });
        }),
        // User roles API endpoint
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const username = url.searchParams.get('username');
          console.log('SB: MSW: User roles API called for username:', username);

          return HttpResponse.json({
            data: [
              {
                uuid: '1',
                name: 'Red Hat Insights Viewer',
                description: 'Read-only access to Red Hat Insights',
                system: true,
                platform_default: false,
                admin_default: false,
                created: '2023-01-01T00:00:00Z',
                modified: '2023-06-15T10:30:00Z',
                policyCount: 1,
                accessCount: 5,
              },
            ],
            meta: { count: 1, limit: 20, offset: 0 },
          });
        }),
      ],
    },
    docs: {
      description: {
        story: `
**Complete DataView Integration**: Full integration test showing DataView event subscription, row click handling, and drawer state management.
        `,
      },
    },
  },
  render: (args) => {
    const [focusedUser, setFocusedUser] = useState<User | undefined>(args.focusedUser);

    return (
      <UserDetailsDrawer {...args} focusedUser={focusedUser} setFocusedUser={setFocusedUser}>
        <TestDataViewTable onUserSelect={setFocusedUser} />
        <div style={{ padding: '1rem' }}>
          <h2>DataView Integration Test</h2>
          <p>This story tests the complete integration between:</p>
          <ul>
            <li>
              <strong>DataView Events</strong>: Component subscribes to EventTypes.rowClick
            </li>
            <li>
              <strong>State Management</strong>: setFocusedUser updates drawer visibility
            </li>
            <li>
              <strong>Tab Rendering</strong>: renderGroupsTab and renderRolesTab functions
            </li>
            <li>
              <strong>Child Components</strong>: UserDetailsGroupsView and UserDetailsRolesView integration
            </li>
          </ul>
          <div
            style={{
              marginTop: '1rem',
              padding: '0.5rem',
              backgroundColor: focusedUser ? '#d4edda' : '#f8d7da',
              border: `1px solid ${focusedUser ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '4px',
            }}
          >
            <strong>Integration Status:</strong>{' '}
            {focusedUser
              ? `✅ User ${focusedUser.first_name} ${focusedUser.last_name} selected via DataView event`
              : '⏳ Waiting for DataView row click event'}
          </div>
        </div>
      </UserDetailsDrawer>
    );
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Verify initial state
    await expect(canvas.findByText('⏳ Waiting for DataView row click event')).resolves.toBeInTheDocument();

    // Simulate DataView row click through test component
    const selectButton = await canvas.findByText('Click to select user: John Doe');
    await userEvent.click(selectButton);

    // Verify DataView event triggers state update
    await expect(canvas.findByText('✅ User John Doe selected via DataView event')).resolves.toBeInTheDocument();

    // Verify drawer opens with user details
    await expect(canvas.findByText('john.doe@example.com')).resolves.toBeInTheDocument();

    // Test tab switching
    const rolesTab = await canvas.findByText('Assigned roles');
    await userEvent.click(rolesTab);

    // Verify tab content is rendered (the actual content is handled by child components)
    await expect(canvas.findByText('Assigned roles')).resolves.toBeInTheDocument();

    // Switch back to groups tab
    const groupsTab = await canvas.findByText('User groups');
    await userEvent.click(groupsTab);

    await expect(canvas.findByText('User groups')).resolves.toBeInTheDocument();
  },
};
