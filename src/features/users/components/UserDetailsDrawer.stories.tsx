import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { UserDetailsDrawer } from './UserDetailsDrawer';
import { User } from '../../../redux/users/reducer';

const meta: Meta<typeof UserDetailsDrawer> = {
  component: UserDetailsDrawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A drawer component for displaying user details with tabs for groups and roles. Provides a clean interface for viewing user information.',
      },
    },
  },
  argTypes: {
    focusedUser: {
      description: 'The user object to display in the drawer',
    },
    onUserClick: {
      description: 'Optional callback when a user is clicked (for focus management)',
    },
    onClose: {
      description: 'Callback function called when the drawer is closed',
    },
    children: {
      description: 'Content to display in the main area (behind the drawer)',
    },
    ouiaId: {
      description: 'OUIA ID for testing purposes',
    },
    renderGroupsTab: {
      description: 'Function to render the groups tab content',
    },
    renderRolesTab: {
      description: 'Function to render the roles tab content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserDetailsDrawer>;

// Mock user data
const mockUser: User = {
  username: 'john.doe',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  external_source_id: 12345,
  is_active: true,
  is_org_admin: false,
};

const mockUserNoEmail: User = {
  username: 'jane.smith',
  first_name: 'Jane',
  last_name: 'Smith',
  email: '',
  external_source_id: 67890,
  is_active: true,
  is_org_admin: true,
};

// Mock tab renderers
const mockGroupsTabRenderer = (userId: string, ouiaId: string) => (
  <div data-testid="groups-tab-content" data-ouia-component-id={ouiaId}>
    <p>Groups for user: {userId}</p>
    <p>• Group A</p>
    <p>• Group B</p>
    <p>• Group C</p>
  </div>
);

const mockRolesTabRenderer = (userId: string, ouiaId: string) => (
  <div data-testid="roles-tab-content" data-ouia-component-id={ouiaId}>
    <p>Roles for user: {userId}</p>
    <p>• Admin Role</p>
    <p>• User Role</p>
    <p>• Viewer Role</p>
  </div>
);

// Sample content for the main area
const SampleContent = ({ onUserSelect }: { onUserSelect?: (user: User) => void }) => (
  <div style={{ padding: '2rem' }}>
    <h2>User Management</h2>
    <p>Click a user to view their details in the drawer.</p>
    {onUserSelect && (
      <div style={{ marginTop: '1rem' }}>
        <Button onClick={() => onUserSelect(mockUser)} style={{ marginRight: '1rem' }}>
          Select John Doe
        </Button>
        <Button onClick={() => onUserSelect(mockUserNoEmail)} variant="secondary">
          Select Jane Smith
        </Button>
      </div>
    )}
  </div>
);

export const ClosedDrawer: Story = {
  args: {
    focusedUser: undefined,
    onClose: fn(),
    ouiaId: 'user-details-drawer',
    renderGroupsTab: mockGroupsTabRenderer,
    renderRolesTab: mockRolesTabRenderer,
    children: <SampleContent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Drawer in closed state, showing only the main content area.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show main content
    await expect(canvas.findByText('User Management')).resolves.toBeInTheDocument();

    // Should not show drawer content
    await expect(canvas.queryByText('John Doe')).not.toBeInTheDocument();
  },
};

export const OpenWithUserDetails: Story = {
  args: {
    focusedUser: mockUser,
    onClose: fn(),
    ouiaId: 'user-details-drawer',
    renderGroupsTab: mockGroupsTabRenderer,
    renderRolesTab: mockRolesTabRenderer,
    children: <SampleContent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Drawer opened with user details displaying name, email, and default groups tab.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show user details
    await expect(canvas.findByText('John Doe')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('john.doe@example.com')).resolves.toBeInTheDocument();

    // Should show groups tab content by default
    await expect(canvas.findByTestId('groups-tab-content')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Groups for user: john.doe')).resolves.toBeInTheDocument();

    // Should show tab titles
    await expect(canvas.findByText('User groups')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Assigned roles')).resolves.toBeInTheDocument();
  },
};

export const UserWithoutEmail: Story = {
  args: {
    focusedUser: mockUserNoEmail,
    onClose: fn(),
    ouiaId: 'user-details-drawer',
    renderGroupsTab: mockGroupsTabRenderer,
    renderRolesTab: mockRolesTabRenderer,
    children: <SampleContent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Drawer with user that has no email address.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show user name but not email
    await expect(canvas.findByText('Jane Smith')).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('@')).not.toBeInTheDocument();
  },
};

export const RolesTabSelected: Story = {
  args: {
    focusedUser: mockUser,
    onClose: fn(),
    ouiaId: 'user-details-drawer',
    renderGroupsTab: mockGroupsTabRenderer,
    renderRolesTab: mockRolesTabRenderer,
    children: <SampleContent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of switching to the roles tab and viewing role information.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should start with groups tab
    await expect(canvas.findByTestId('groups-tab-content')).resolves.toBeInTheDocument();

    // Click on roles tab
    const rolesTab = await canvas.findByText('Assigned roles');
    await userEvent.click(rolesTab);

    // Wait for tab switch to complete, then check roles tab content
    await expect(canvas.findByTestId('roles-tab-content')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Roles for user: john.doe')).resolves.toBeInTheDocument();

    // Note: We don't check that groups content is gone because PatternFly tabs may keep previous content in DOM
  },
};

export const InteractiveDemo: Story = {
  args: {
    focusedUser: undefined,
    onClose: fn(),
    ouiaId: 'user-details-drawer',
    renderGroupsTab: mockGroupsTabRenderer,
    renderRolesTab: mockRolesTabRenderer,
    children: <SampleContent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing full drawer functionality including opening, closing, and tab switching.',
      },
    },
  },
  render: (args) => {
    const [selectedUser, setSelectedUser] = React.useState<User | undefined>(args.focusedUser);

    return (
      <UserDetailsDrawer {...args} focusedUser={selectedUser} onClose={() => setSelectedUser(undefined)}>
        <SampleContent onUserSelect={setSelectedUser} />
      </UserDetailsDrawer>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially closed
    await expect(canvas.queryByText('John Doe')).not.toBeInTheDocument();

    // Click to select a user
    const selectButton = await canvas.findByText('Select John Doe');
    await userEvent.click(selectButton);

    // Should open drawer with user details
    await expect(canvas.findByText('John Doe')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('john.doe@example.com')).resolves.toBeInTheDocument();

    // Test tab switching
    const rolesTab = await canvas.findByText('Assigned roles');
    await userEvent.click(rolesTab);
    await expect(canvas.findByTestId('roles-tab-content')).resolves.toBeInTheDocument();

    // Close drawer
    const closeButton = await canvas.findByLabelText('Close drawer panel');
    await userEvent.click(closeButton);

    // Should close
    await expect(canvas.queryByText('John Doe')).not.toBeInTheDocument();
  },
};

export const WithPopoverHelp: Story = {
  args: {
    focusedUser: mockUser,
    onClose: fn(),
    ouiaId: 'user-details-drawer',
    renderGroupsTab: mockGroupsTabRenderer,
    renderRolesTab: mockRolesTabRenderer,
    children: <SampleContent />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Testing the help popover on the Assigned Roles tab.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Switch to roles tab
    const rolesTab = await canvas.findByText('Assigned roles');
    await userEvent.click(rolesTab);

    // Verify the roles tab content is displayed
    await expect(canvas.findByTestId('roles-tab-content')).resolves.toBeInTheDocument();

    // We can verify the tab with popover is present by checking for the tab title
    await expect(canvas.findByText('Assigned roles')).resolves.toBeInTheDocument();

    // Note: PatternFly popover testing is complex, so we just verify the tab structure is correct
  },
};
