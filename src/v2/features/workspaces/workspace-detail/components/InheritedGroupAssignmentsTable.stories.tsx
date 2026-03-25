import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { getSkeletonCount } from '../../../../../test-utils/interactionHelpers';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { InheritedGroupAssignmentsTable } from './InheritedGroupAssignmentsTable';
import type { InheritedWorkspaceGroupRow } from '../../../../data/queries/groupAssignments';
import { createGroupMembersHandlers, groupMembersHandlers } from '../../../../../shared/data/mocks/groupMembers.handlers';
const mockInheritedGroups: InheritedWorkspaceGroupRow[] = [
  {
    id: 'group-inherited-1',
    name: 'Platform Administrators',
    description: 'Full access to all platform resources and administrative functions',
    userCount: 12,
    isDefaultGroup: false,
    roleCount: 2,
    roles: [
      { id: 'role-1', name: 'Workspace Administrator' },
      { id: 'role-2', name: 'Workspace Viewer' },
    ],
    lastModified: '2024-01-20T14:45:00Z',
    inheritedFrom: {
      workspaceId: 'ws-parent-1',
      workspaceName: 'Root Workspace',
    },
  },
  {
    id: 'group-inherited-2',
    name: 'Development Team',
    description: 'Access to development resources and environments',
    userCount: 25,
    isDefaultGroup: false,
    roleCount: 1,
    roles: [{ id: 'role-3', name: 'Developer' }],
    lastModified: '2024-01-18T16:20:00Z',
    inheritedFrom: {
      workspaceId: 'ws-parent-2',
      workspaceName: 'Engineering Workspace',
    },
  },
  {
    id: 'group-inherited-3',
    name: 'QA Engineers',
    description: '',
    userCount: 8,
    isDefaultGroup: false,
    roleCount: 1,
    roles: [{ id: 'role-4', name: 'Tester' }],
    lastModified: '2024-01-19T13:30:00Z',
    inheritedFrom: {
      workspaceId: 'ws-parent-1',
      workspaceName: 'Root Workspace',
    },
  },
];

const groupDetailsHandlers = [...groupMembersHandlers({}, {})];

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

Read-only table -- no row selection, no Grant Access button. Manages its own table state
(pagination, sorting, filtering) via useTableState. The parent only provides data and loading state.

## Columns
- User group (sortable)
- Description
- Users (sortable)
- Roles (sortable)
- Inherited from (sortable, with info popover) -- workspace link
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify default inherited table', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      // Verify standard columns are present
      await waitFor(async () => {
        await expect(canvas.queryByText('Description')).toBeInTheDocument();
        await expect(canvas.queryByText('Users')).toBeInTheDocument();
        await expect(canvas.queryByText('Roles')).toBeInTheDocument();
        await expect(canvas.queryByText('Last modified')).toBeInTheDocument();
      });

      // Verify "Inherited from" column header text (part of the popover label)
      await expect(canvas.getByText('Inherited from')).toBeInTheDocument();

      // Verify table is read-only: no checkboxes, no Grant Access button
      await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
      await expect(canvas.queryByText('Grant access')).not.toBeInTheDocument();

      // Verify group names
      await expect(canvas.findByText(mockInheritedGroups[0].name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(mockInheritedGroups[1].name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(mockInheritedGroups[2].name)).resolves.toBeInTheDocument();

      // Verify inheritance links are rendered
      await waitFor(async () => {
        const rootWorkspaceLinks = canvas.queryAllByText(mockInheritedGroups[0].inheritedFrom!.workspaceName);
        expect(rootWorkspaceLinks.length).toBe(2); // Two groups inherited from Root Workspace
        await expect(canvas.queryByText(mockInheritedGroups[1].inheritedFrom!.workspaceName)).toBeInTheDocument();
      });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify loading state', async () => {
      await waitFor(
        () => {
          expect(getSkeletonCount(canvasElement)).toBeGreaterThan(0);
          const loadingElements = canvas.queryAllByText('Platform Administrators');
          expect(loadingElements.length).toBe(0);
        },
        { timeout: 2000 },
      );
    });
  },
};

export const EmptyState: Story = {
  args: {
    groups: [],
    totalCount: 0,
    isLoading: false,
    ouiaId: 'inherited-role-assignments-table-empty',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify empty state', async () => {
      await expect(canvas.findByText('No user group found')).resolves.toBeInTheDocument();
    });
  },
};

export const InheritanceFilter: Story = {
  args: {
    groups: mockInheritedGroups,
    totalCount: mockInheritedGroups.length,
    isLoading: false,
    ouiaId: 'inherited-role-assignments-filter-test',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify inheritance filter', async () => {
      const table = await canvas.findByRole('grid');
      await expect(table).toBeInTheDocument();

      await expect(canvas.getByText('Inherited from')).toBeInTheDocument();

      await waitFor(async () => {
        const rootLinks = canvas.queryAllByText(mockInheritedGroups[0].inheritedFrom!.workspaceName);
        expect(rootLinks.length).toBe(2);
        await expect(canvas.queryByText(mockInheritedGroups[1].inheritedFrom!.workspaceName)).toBeInTheDocument();
      });
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
        ...createGroupMembersHandlers(
          {
            'group-inherited-1': [
              {
                username: 'admin',
                email: 'admin@company.com',
                first_name: 'Admin',
                last_name: 'User',
                is_active: true,
                is_org_admin: true,
                external_source_id: '1',
              },
              {
                username: 'dev1',
                email: 'dev1@company.com',
                first_name: 'Dev',
                last_name: 'One',
                is_active: true,
                is_org_admin: false,
                external_source_id: '2',
              },
            ],
          },
          {},
        ),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify drawer with inheritance', async () => {
      await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();

      const firstGroupRow = await canvas.findByText('Platform Administrators');
      await userEvent.click(firstGroupRow);

      await waitFor(
        async () => {
          const tabs = canvas.queryAllByRole('tab');
          expect(tabs.length).toBeGreaterThanOrEqual(2);
        },
        { timeout: 5000 },
      );
    });
  },
};
