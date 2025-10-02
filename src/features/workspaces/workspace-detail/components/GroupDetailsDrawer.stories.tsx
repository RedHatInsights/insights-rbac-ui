import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, http } from 'msw';
import { GroupDetailsDrawer } from './GroupDetailsDrawer';
import { Group } from '../../../../redux/groups/reducer';
import { User } from '../../../../redux/users/reducer';
import { Role } from '../../../../redux/roles/reducer';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Card } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';

// Mock users data
const mockUsers: User[] = [
  {
    username: 'john.doe',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: false,
    external_source_id: 1,
    uuid: 1,
  },
  {
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    is_org_admin: false,
    external_source_id: 2,
    uuid: 2,
  },
];

// Mock roles data
const mockRoles: Role[] = [
  {
    uuid: '1',
    name: 'Administrator',
    display_name: 'Administrator',
    description: 'Full administrative access',
    platform_default: false,
    admin_default: true,
    created: '2024-01-15T10:30:00Z',
    modified: '2024-01-20T14:45:00Z',
    access: [],
    accessCount: 0,
    applications: [],
    external_role_id: '',
    external_tenant: '',
    groups_in: [],
    groups_in_count: 0,
    system: false,
    policyCount: 0,
  },
  {
    uuid: '2',
    name: 'User Manager',
    display_name: 'User Manager',
    description: 'Manage users and groups',
    platform_default: false,
    admin_default: false,
    created: '2024-01-16T11:30:00Z',
    modified: '2024-01-21T15:45:00Z',
    access: [],
    accessCount: 0,
    applications: [],
    external_role_id: '',
    external_tenant: '',
    groups_in: [],
    groups_in_count: 0,
    system: false,
    policyCount: 0,
  },
];

const mockGroup: Group = {
  uuid: 'group-1',
  name: 'Platform Administrators',
  description: 'Full access to all platform resources and administrative functions',
  principalCount: 12,
  roleCount: 8,
  created: '2024-01-15T10:30:00Z',
  modified: '2024-01-20T14:45:00Z',
  admin_default: true,
  platform_default: false,
  system: false,
};

// MSW handlers for group details API calls
const groupDetailsHandlers = [
  // Handler for fetching group members
  http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request }) => {
    const url = new URL(request.url);
    const principalType = url.searchParams.get('principal_type');

    // Return users for user principal type
    if (principalType === 'user') {
      return HttpResponse.json({
        data: mockUsers,
        meta: {
          count: mockUsers.length,
          limit: 1000,
          offset: 0,
        },
      });
    }

    // Return empty for service accounts
    return HttpResponse.json({
      data: [],
      meta: {
        count: 0,
        limit: 1000,
        offset: 0,
      },
    });
  }),

  // Handler for fetching group roles
  http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
    return HttpResponse.json({
      data: mockRoles,
      meta: {
        count: mockRoles.length,
        limit: 1000,
        offset: 0,
      },
    });
  }),
];

// Drawer components need a sized container for proper rendering
const withWrapper = () => {
  const Wrapper = (Story: React.ComponentType) => (
    <div style={{ height: '600px', padding: '16px' }}>
      <Story />
    </div>
  );
  Wrapper.displayName = 'GroupDetailsDrawerWrapper';
  return Wrapper;
};

const meta: Meta<typeof GroupDetailsDrawer> = {
  component: GroupDetailsDrawer,
  tags: ['autodocs'],
  decorators: [withWrapper()],
  parameters: {
    msw: {
      handlers: groupDetailsHandlers,
    },
    docs: {
      description: {
        component: `
The GroupDetailsDrawer is a reusable component for displaying group details with users and roles tabs.

## Key Features
- **Reusable Design**: Can be used with any content that needs group detail viewing
- **Data Management**: Handles Redux state for group members and roles
- **Loading States**: Shows loading, error, and empty states appropriately
- **Tabbed Interface**: Users and Roles tabs with proper data display
- **Internationalization**: Uses message keys for all text content

## Props Interface
- \`isOpen\`: Boolean to control drawer visibility
- \`group\`: Group object with details to display
- \`onClose\`: Callback function when drawer is closed
- \`ouiaId\`: OUIA identifier for testing
- \`children\`: React nodes to render as drawer content

## Integration
The drawer wraps content and provides the group details panel. When a group is selected,
it fetches and displays the group's members and roles in separate tabs.
        `,
      },
    },
  },
  argTypes: {
    isOpen: {
      description: 'Controls drawer visibility',
      control: { type: 'boolean' },
    },
    group: {
      description: 'Group object to display details for',
      control: { type: 'object' },
    },
    onClose: {
      description: 'Callback when drawer is closed',
      action: 'drawer-closed',
    },
    ouiaId: {
      description: 'OUIA identifier for testing',
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive example with drawer functionality
const DrawerExample = ({
  isOpen: initialIsOpen = false,
  group = mockGroup,
  onClose = fn(),
  ouiaId = 'group-details-drawer',
}: {
  isOpen?: boolean;
  group?: Group;
  onClose?: () => void;
  ouiaId?: string;
}) => {
  const [isOpen, setIsOpen] = React.useState(initialIsOpen);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <GroupDetailsDrawer isOpen={isOpen} group={isOpen ? group : undefined} onClose={handleClose} ouiaId={ouiaId}>
      <Card>
        <CardBody>
          <h2>Content Area</h2>
          <p>This represents the main content that the drawer wraps around.</p>
          <Button onClick={() => setIsOpen(true)} disabled={isOpen}>
            Open Group Details Drawer
          </Button>
          {isOpen && (
            <p style={{ marginTop: '1rem', color: '#6a6e73' }}>
              Drawer is open - click on the drawer panel to see group details with Users and Roles tabs.
            </p>
          )}
        </CardBody>
      </Card>
    </GroupDetailsDrawer>
  );
};

// Default story showing drawer functionality
export const Default: Story = {
  render: (args) => <DrawerExample {...args} />,
  args: {
    isOpen: false,
    group: mockGroup,
    onClose: fn(),
    ouiaId: 'group-details-drawer',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default group details drawer showing users and roles tabs with mock data.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially drawer should be closed
    await expect(canvas.queryByText('Platform Administrators')).not.toBeInTheDocument();

    // Open drawer by clicking button
    const openButton = await canvas.findByRole('button', { name: /open group details drawer/i });
    await userEvent.click(openButton);

    // Wait for drawer to open and show group name
    await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();

    // Verify the "Edit access for this workspace" button is present and disabled
    const editAccessButton = await canvas.findByRole('button', { name: /edit access for this workspace/i });
    await expect(editAccessButton).toBeInTheDocument();
    expect(editAccessButton).toBeDisabled();

    // Verify tabs are present - Roles tab should be active by default
    const rolesTab = await canvas.findByRole('tab', { name: /roles/i });
    const usersTab = await canvas.findByRole('tab', { name: /users/i });

    await expect(rolesTab).toBeInTheDocument();
    await expect(usersTab).toBeInTheDocument();

    // Verify roles content is visible (default active tab)
    await expect(canvas.findByText('Administrator')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('User Manager')).resolves.toBeInTheDocument();

    // Switch to Users tab
    await userEvent.click(usersTab);

    // Verify users content is now visible
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Jane')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Doe')).resolves.toBeInTheDocument();
  },
};

// Open state for documentation
export const OpenState: Story = {
  render: (args) => <DrawerExample {...args} />,
  args: {
    isOpen: true,
    group: mockGroup,
    onClose: fn(),
    ouiaId: 'group-details-drawer-open',
  },
  parameters: {
    docs: {
      description: {
        story: 'Drawer in open state showing the group details panel with tabs.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the "Edit access for this workspace" button is present and disabled
    const editAccessButton = await canvas.findByRole('button', { name: /edit access for this workspace/i });
    await expect(editAccessButton).toBeInTheDocument();
    expect(editAccessButton).toBeDisabled();

    // Verify close button is present and enabled
    const closeButton = await canvas.findByRole('button', { name: /close drawer panel/i });
    await expect(closeButton).toBeInTheDocument();
    expect(closeButton).not.toBeDisabled();
  },
};

// Loading state
export const LoadingState: Story = {
  render: (args) => <DrawerExample {...args} />,
  args: {
    isOpen: true,
    group: mockGroup,
    onClose: fn(),
    ouiaId: 'group-details-drawer-loading',
  },
  parameters: {
    msw: {
      handlers: [
        // Infinite delay to show loading state
        http.get('/api/rbac/v1/groups/:groupId/principals/', async () => {
          await new Promise(() => {}); // Never resolves
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', async () => {
          await new Promise(() => {}); // Never resolves
        }),
      ],
    },
    docs: {
      description: {
        story: 'Drawer showing loading states in both Users and Roles tabs.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show loading spinners
    await waitFor(async () => {
      const spinners = canvas.getAllByLabelText(/loading/i);
      expect(spinners.length).toBeGreaterThan(0);
    });
  },
};

// Empty state
export const EmptyState: Story = {
  render: (args) => <DrawerExample {...args} />,
  args: {
    isOpen: true,
    group: mockGroup,
    onClose: fn(),
    ouiaId: 'group-details-drawer-empty',
  },
  parameters: {
    msw: {
      handlers: [
        // Return empty data arrays
        http.get('/api/rbac/v1/groups/:groupId/principals/', () => HttpResponse.json({ data: [], meta: { count: 0, limit: 1000, offset: 0 } })),
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => HttpResponse.json({ data: [], meta: { count: 0, limit: 1000, offset: 0 } })),
      ],
    },
    docs: {
      description: {
        story: 'Drawer showing empty states when group has no users or roles.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show empty state messages
    await expect(canvas.findByText(/currently has no roles assigned/i)).resolves.toBeInTheDocument();

    // Switch to Users tab to see empty users message
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    await userEvent.click(usersTab);

    await expect(canvas.findByText(/currently has no users assigned/i)).resolves.toBeInTheDocument();
  },
};

// Error state
export const ErrorState: Story = {
  render: (args) => <DrawerExample {...args} />,
  args: {
    isOpen: true,
    group: mockGroup,
    onClose: fn(),
    ouiaId: 'group-details-drawer-error',
  },
  parameters: {
    msw: {
      handlers: [
        // Return error responses - NOTE: Component error handling with Redux thunks
        // is complex and better tested in E2E tests. This story is for visual testing.
        http.get('/api/rbac/v1/groups/:groupId/principals/', () =>
          HttpResponse.json({ errors: [{ detail: 'Failed to load members' }] }, { status: 500 }),
        ),
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => HttpResponse.json({ errors: [{ detail: 'Failed to load roles' }] }, { status: 500 })),
      ],
    },
    docs: {
      description: {
        story:
          'Drawer showing error states when data fails to load. Note: This story is for visual testing only as Redux error handling integration is complex.',
      },
    },
  },
  // No play function - error state testing with Redux thunks requires proper error boundary setup
};
