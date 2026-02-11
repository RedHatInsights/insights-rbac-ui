import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { InheritedGroupAssignmentsTable } from './InheritedGroupAssignmentsTable';
import type { GroupWithInheritance } from './GroupDetailsDrawer';
import { HttpResponse, http } from 'msw';

// Mock groups with inheritance data
const mockInheritedGroups: GroupWithInheritance[] = [
  {
    uuid: 'group-inherited-1',
    name: 'Platform Administrators',
    description: 'Full access to all platform resources and administrative functions',
    principalCount: 12,
    roleCount: 8,
    created: '2024-01-15T10:30:00Z',
    modified: '2024-01-20T14:45:00Z',
    admin_default: true,
    platform_default: false,
    system: false,
    inheritedFrom: {
      workspaceId: 'ws-parent-1',
      workspaceName: 'Root Workspace',
    },
  },
  {
    uuid: 'group-inherited-2',
    name: 'Development Team',
    description: 'Access to development resources and environments',
    principalCount: 25,
    roleCount: 5,
    created: '2024-01-10T09:15:00Z',
    modified: '2024-01-18T16:20:00Z',
    admin_default: false,
    platform_default: false,
    system: false,
    inheritedFrom: {
      workspaceId: 'ws-parent-2',
      workspaceName: 'Engineering Workspace',
    },
  },
  {
    uuid: 'group-inherited-3',
    name: 'QA Engineers',
    principalCount: 8,
    roleCount: 3,
    created: '2024-01-12T11:00:00Z',
    modified: '2024-01-19T13:30:00Z',
    admin_default: false,
    platform_default: false,
    system: false,
    inheritedFrom: {
      workspaceId: 'ws-parent-1',
      workspaceName: 'Root Workspace',
    },
  },
];

// MSW handlers for group details API calls
const groupDetailsHandlers = [
  http.get('/api/rbac/v1/groups/:groupId/principals/', () => {
    return HttpResponse.json({
      data: [],
      meta: { count: 0, limit: 1000, offset: 0 },
    });
  }),
  http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
    return HttpResponse.json({
      data: [],
      meta: { count: 0, limit: 1000, offset: 0 },
    });
  }),
];

const withRouter = () => {
  const RouterWrapper = (Story: React.ComponentType) => (
    <MemoryRouter initialEntries={['/']}>
      <Story />
    </MemoryRouter>
  );
  RouterWrapper.displayName = 'RouterWrapper';
  return RouterWrapper;
};

const meta: Meta<typeof InheritedGroupAssignmentsTable> = {
  component: InheritedGroupAssignmentsTable,
  tags: ['autodocs'],
  decorators: [withRouter()],
  parameters: {
    msw: { handlers: groupDetailsHandlers },
    docs: {
      description: {
        component: `
Inherited group assignments table for displaying groups with workspace inheritance context.

Manages its own table state (pagination, sorting, filtering, selection) via useTableState.
The parent only provides data and loading state.

## Columns
- User group (sortable)
- Description
- Users (sortable)
- Roles (sortable)
- Inherited from (sortable) -- workspace link
- Last modified (sortable)

## Filters
- Name (search)
- Inherited from (text filter)
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    groups: mockInheritedGroups,
    totalCount: mockInheritedGroups.length,
    isLoading: false,
    ouiaId: 'inherited-role-assignments-table',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    // Verify inheritance column is present
    await waitFor(async () => {
      await expect(canvas.getByText('Inherited from')).toBeInTheDocument();
      await expect(canvas.getByText('Description')).toBeInTheDocument();
      await expect(canvas.getByText('Users')).toBeInTheDocument();
      await expect(canvas.getByText('Roles')).toBeInTheDocument();
      await expect(canvas.getByText('Last modified')).toBeInTheDocument();
    });

    // Verify group names
    await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Development Team')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('QA Engineers')).resolves.toBeInTheDocument();

    // Verify inheritance links are rendered
    await waitFor(async () => {
      const rootWorkspaceLinks = canvas.getAllByText('Root Workspace');
      expect(rootWorkspaceLinks.length).toBe(2); // Two groups inherited from Root Workspace
      await expect(canvas.getByText('Engineering Workspace')).toBeInTheDocument();
    });
  },
};

export const LoadingState: Story = {
  args: {
    groups: [],
    totalCount: 0,
    isLoading: true,
    ouiaId: 'inherited-role-assignments-table-loading',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      async () => {
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        expect(skeletonElements.length).toBeGreaterThan(0);
        const loadingElements = canvas.queryAllByText('Platform Administrators');
        expect(loadingElements.length).toBe(0);
      },
      { timeout: 2000 },
    );
  },
};

export const EmptyState: Story = {
  args: {
    groups: [],
    totalCount: 0,
    isLoading: false,
    ouiaId: 'inherited-role-assignments-table-empty',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText('No user group found')).resolves.toBeInTheDocument();
  },
};

export const InheritanceFilter: Story = {
  args: {
    groups: mockInheritedGroups,
    totalCount: mockInheritedGroups.length,
    isLoading: false,
    ouiaId: 'inherited-role-assignments-filter-test',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    // Verify "Inherited from" column exists (unique to this table variant)
    await waitFor(async () => {
      await expect(canvas.getByText('Inherited from')).toBeInTheDocument();
    });

    // Verify workspace inheritance links
    await waitFor(async () => {
      const rootLinks = canvas.getAllByText('Root Workspace');
      expect(rootLinks.length).toBe(2);
      await expect(canvas.getByText('Engineering Workspace')).toBeInTheDocument();
    });
  },
};

export const DrawerWithInheritance: Story = {
  args: {
    groups: mockInheritedGroups,
    totalCount: mockInheritedGroups.length,
    isLoading: false,
    currentWorkspace: { id: 'ws-current', name: 'Current Workspace' },
    ouiaId: 'inherited-role-assignments-drawer-test',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/principals/', () => {
          return HttpResponse.json({
            data: [
              { username: 'admin', email: 'admin@company.com', first_name: 'Admin', last_name: 'User', is_org_admin: true },
              { username: 'dev1', email: 'dev1@company.com', first_name: 'Dev', last_name: 'One', is_org_admin: false },
            ],
            meta: { count: 2, limit: 1000, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({
            data: [{ uuid: 'role-1', name: 'administrator', display_name: 'Administrator', description: 'Full admin access' }],
            meta: { count: 1, limit: 1000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();

    const firstGroupRow = await canvas.findByText('Platform Administrators');
    await userEvent.click(firstGroupRow);

    await waitFor(
      async () => {
        const tabs = canvas.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThanOrEqual(2);
      },
      { timeout: 5000 },
    );
  },
};
