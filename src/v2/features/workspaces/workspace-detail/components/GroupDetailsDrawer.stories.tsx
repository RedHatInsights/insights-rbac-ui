import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';

import {
  createGroupMembersHandlers,
  groupMembersErrorHandlers,
  groupMembersLoadingHandlers,
} from '../../../../../shared/data/mocks/groupMembers.handlers';
import { GroupDetailsDrawer } from './GroupDetailsDrawer';
import type { InheritedWorkspaceGroupRow, WorkspaceGroupRow } from '../../../../data/queries/groupAssignments';
import { type Member } from '../../../../../v2/data/queries/groups';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Card } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';

// Mock users data
const mockUsers: Member[] = [
  {
    username: 'john.doe',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: false,
  },
  {
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    is_org_admin: false,
  },
];

const mockGroup: WorkspaceGroupRow = {
  id: 'group-1',
  name: 'Platform Administrators',
  description: 'Full access to all platform resources and administrative functions',
  userCount: 12,
  roleCount: 2,
  roles: [
    { id: '1', name: 'Administrator' },
    { id: '2', name: 'User Manager' },
  ],
  lastModified: '2024-01-20T14:45:00Z',
};

// MSW handlers for group details API calls (mockGroup has uuid 'group-1')
const groupDetailsHandlers = [
  ...createGroupMembersHandlers(
    {
      'group-1': mockUsers.map((u) => ({
        username: u.username,
        email: u.email ?? '',
        first_name: u.first_name ?? '',
        last_name: u.last_name ?? '',
        is_active: u.is_active ?? true,
        is_org_admin: u.is_org_admin ?? false,
        external_source_id: u.username,
      })),
    },
    {},
  ),
];

// Drawer components need a sized container and Router context for proper rendering
const withWrapper = () => {
  const Wrapper = (Story: React.ComponentType) => (
    <MemoryRouter initialEntries={['/']}>
      <div style={{ height: '600px', padding: '16px' }}>
        <Story />
      </div>
    </MemoryRouter>
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
- **Data Management**: Handles React Query state for group members and roles
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
const mockWorkspace = { id: 'ws-test', name: 'Test Workspace' };

const mockInheritedGroup: InheritedWorkspaceGroupRow = {
  id: 'group-inherited-1',
  name: 'Powerpuff Girls',
  description: 'Inherited group from parent workspace',
  userCount: 3,
  roleCount: 2,
  roles: [
    { id: 'role-1', name: 'RHEL DevOps' },
    { id: 'role-2', name: 'RHEL Inventory Viewer' },
  ],
  lastModified: '2024-01-20T14:45:00Z',
  inheritedFrom: {
    workspaceId: 'ws-parent-1',
    workspaceName: 'Medical Imaging IT',
  },
};

const DrawerExample = ({
  isOpen: initialIsOpen = false,
  group = mockGroup,
  onClose = fn(),
  ouiaId = 'group-details-drawer',
  currentWorkspace = mockWorkspace,
  showInheritance = false,
  canEditAccess = false,
  canRevokeAccess = false,
  onRemoveFromWorkspace,
}: {
  isOpen?: boolean;
  group?: WorkspaceGroupRow | InheritedWorkspaceGroupRow;
  onClose?: () => void;
  ouiaId?: string;
  currentWorkspace?: { id: string; name: string };
  showInheritance?: boolean;
  canEditAccess?: boolean;
  canRevokeAccess?: boolean;
  onRemoveFromWorkspace?: (group: WorkspaceGroupRow) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(initialIsOpen);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <GroupDetailsDrawer
      isOpen={isOpen}
      group={isOpen ? group : undefined}
      onClose={handleClose}
      ouiaId={ouiaId}
      currentWorkspace={currentWorkspace}
      showInheritance={showInheritance}
      canEditAccess={canEditAccess}
      canRevokeAccess={canRevokeAccess}
      onRemoveFromWorkspace={onRemoveFromWorkspace}
    >
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
    canEditAccess: true,
    canRevokeAccess: true,
    onRemoveFromWorkspace: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default group details drawer showing users and roles tabs with mock data.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify default drawer', async () => {
      // Initially drawer should be closed
      await expect(canvas.queryByText('Platform Administrators')).not.toBeInTheDocument();

      // Open drawer by clicking button
      const openButton = await canvas.findByRole('button', { name: /open group details drawer/i });
      await userEvent.click(openButton);

      // Wait for drawer to open and show group name
      await canvas.findByText('Platform Administrators');

      const editAccessButton = await canvas.findByRole('button', { name: /edit access for this workspace/i });
      await expect(editAccessButton).toBeEnabled();

      await expect(canvas.queryByRole('button', { name: /remove from workspace/i })).not.toBeInTheDocument();

      // Verify tabs are present - Roles tab should be active by default
      await canvas.findByRole('tab', { name: /roles/i });
      const usersTab = await canvas.findByRole('tab', { name: /users/i });

      // Verify role data loads (roles come from mockGroup.roles, not a separate fetch)
      await canvas.findByText(mockGroup.roles[0].name);
      await canvas.findByText(mockGroup.roles[1].name);

      const adminRoleLink = await canvas.findByRole('link', { name: mockGroup.roles[0].name });
      const userManagerRoleLink = await canvas.findByRole('link', { name: mockGroup.roles[1].name });

      expect(adminRoleLink).toHaveAttribute('href');
      expect(userManagerRoleLink).toHaveAttribute('href');
      expect(adminRoleLink.getAttribute('href')).toContain(`/roles/detail/${mockGroup.roles[0].id}`);
      expect(userManagerRoleLink.getAttribute('href')).toContain(`/roles/detail/${mockGroup.roles[1].id}`);

      await userEvent.click(usersTab);

      // Verify user data loads
      await canvas.findByText('john.doe');
      await canvas.findByText('Jane');
      await canvas.findByText('Doe');
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify open state', async () => {
      const editAccessButton = await canvas.findByRole('button', { name: /edit access for this workspace/i });
      await expect(editAccessButton).toBeInTheDocument();

      const closeButton = await canvas.findByRole('button', { name: /close drawer panel/i });
      await expect(closeButton).toBeInTheDocument();
      expect(closeButton).not.toBeDisabled();
    });
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
      handlers: [...groupMembersLoadingHandlers()],
    },
    docs: {
      description: {
        story: 'Drawer showing loading state for the Users tab. Roles tab uses data from the group prop (no separate fetch).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify loading state', async () => {
      const usersTab = await canvas.findByRole('tab', { name: /users/i });
      await userEvent.click(usersTab);

      await waitFor(async () => {
        const spinners = canvas.queryAllByLabelText(/loading/i);
        expect(spinners.length).toBeGreaterThan(0);
      });
    });
  },
};

// Empty state
const emptyGroup: WorkspaceGroupRow = { ...mockGroup, roleCount: 0, roles: [] };

export const EmptyState: Story = {
  render: (args) => <DrawerExample {...args} />,
  args: {
    isOpen: true,
    group: emptyGroup,
    onClose: fn(),
    ouiaId: 'group-details-drawer-empty',
  },
  parameters: {
    msw: {
      handlers: [...createGroupMembersHandlers({}, {})],
    },
    docs: {
      description: {
        story: 'Drawer showing empty states when group has no users or roles.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify empty state', async () => {
      await canvas.findByText(/currently has no roles assigned/i);

      const usersTab = await canvas.findByRole('tab', { name: /users/i });
      await userEvent.click(usersTab);

      await canvas.findByText(/currently has no users assigned/i);
    });
  },
};

// Role Links story - specifically for testing role link functionality
export const RoleLinks: Story = {
  render: (args) => <DrawerExample {...args} />,
  args: {
    isOpen: true,
    group: mockGroup,
    onClose: fn(),
    ouiaId: 'group-details-drawer-role-links',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests that role names are rendered as clickable links with correct href attributes pointing to role detail pages.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify role links', async () => {
      const adminRoleLink = await canvas.findByRole('link', { name: mockGroup.roles[0].name });
      const userManagerRoleLink = await canvas.findByRole('link', { name: mockGroup.roles[1].name });
      await expect(adminRoleLink).toBeInTheDocument();
      await expect(userManagerRoleLink).toBeInTheDocument();

      expect(adminRoleLink).toHaveAttribute('href');
      expect(userManagerRoleLink).toHaveAttribute('href');
      expect(adminRoleLink.getAttribute('href')).toContain(`/roles/detail/${mockGroup.roles[0].id}`);
      expect(userManagerRoleLink.getAttribute('href')).toContain(`/roles/detail/${mockGroup.roles[1].id}`);

      expect(adminRoleLink).toHaveClass('pf-v6-c-button', 'pf-m-link', 'pf-m-inline');
      expect(userManagerRoleLink).toHaveClass('pf-v6-c-button', 'pf-m-link', 'pf-m-inline');

      expect(adminRoleLink).toHaveTextContent(mockGroup.roles[0].name);
      expect(userManagerRoleLink).toHaveTextContent(mockGroup.roles[1].name);
    });
  },
};

// Inherited state - shows drawer for a group inherited from a parent workspace
export const InheritedState: Story = {
  render: (args) => <DrawerExample {...args} />,
  args: {
    isOpen: true,
    group: mockInheritedGroup,
    onClose: fn(),
    ouiaId: 'group-details-drawer-inherited',
    showInheritance: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Drawer for an inherited group. Shows subtitle, info alert, external link icons on workspace names, and hides Edit/Remove buttons.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify inherited state', async () => {
      // Verify subtitle
      await canvas.findByText(/roles listed here were granted in a parent workspace/i);

      // Verify info alert
      await canvas.findByText(/editing access to a parent workspace must be done within that workspace/i);

      // Verify no "Edit access" or "Remove group" buttons
      await expect(canvas.queryByRole('button', { name: /^edit access$/i })).not.toBeInTheDocument();
      await expect(canvas.queryByRole('button', { name: /remove group from workspace/i })).not.toBeInTheDocument();

      // Verify role names are present
      await canvas.findByText(mockInheritedGroup.roles[0].name);
      await canvas.findByText(mockInheritedGroup.roles[1].name);

      // Verify workspace links with external icon are present in the inherited-from column
      const workspaceLinks = await canvas.findAllByText(mockInheritedGroup.inheritedFrom!.workspaceName);
      await expect(workspaceLinks.length).toBeGreaterThanOrEqual(1);

      // Verify the alert can be dismissed (scope to the alert container to avoid matching the drawer close button)
      const alertElement = canvas
        .getByText(/editing access to a parent workspace must be done within that workspace/i)
        .closest('.pf-v6-c-alert') as HTMLElement;
      const closeAlertButton = within(alertElement).getByRole('button', { name: /close/i });
      await userEvent.click(closeAlertButton);
      await waitFor(() => {
        expect(canvas.queryByText(/editing access to a parent workspace must be done within that workspace/i)).not.toBeInTheDocument();
      });
    });
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
      handlers: [...groupMembersErrorHandlers(500)],
    },
    docs: {
      description: {
        story:
          'Drawer showing error states when data fails to load. Note: This story is for visual testing only as error handling integration is complex.',
      },
    },
  },
};

export const PermissionDenied: Story = {
  render: (args) => <DrawerExample {...args} />,
  args: {
    isOpen: true,
    group: mockGroup,
    onClose: fn(),
    ouiaId: 'group-details-drawer-no-permissions',
    canEditAccess: false,
    canRevokeAccess: false,
    onRemoveFromWorkspace: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Drawer with both edit and revoke permissions denied. Both action buttons are present but disabled.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify edit button disabled and remove hidden', async () => {
      const editAccessButton = await canvas.findByRole('button', { name: /edit access for this workspace/i });
      await expect(editAccessButton).toBeDisabled();

      await expect(canvas.queryByRole('button', { name: /remove from workspace/i })).not.toBeInTheDocument();
    });
  },
};

export const EditOnlyPermission: Story = {
  render: (args) => <DrawerExample {...args} />,
  args: {
    isOpen: true,
    group: mockGroup,
    onClose: fn(),
    ouiaId: 'group-details-drawer-edit-only',
    canEditAccess: true,
    canRevokeAccess: false,
    onRemoveFromWorkspace: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Drawer with edit permission granted but revoke denied. Remove button is hidden (temporarily disabled feature).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify edit enabled and remove hidden', async () => {
      const editAccessButton = await canvas.findByRole('button', { name: /edit access for this workspace/i });
      await expect(editAccessButton).toBeEnabled();

      await expect(canvas.queryByRole('button', { name: /remove from workspace/i })).not.toBeInTheDocument();
    });
  },
};
