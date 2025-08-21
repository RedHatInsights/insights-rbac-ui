import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Provider } from 'react-redux';
// @ts-ignore - redux-mock-store doesn't have TypeScript definitions
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import { ParentRoleAssignmentsTable } from './ParentRoleAssignmentsTable';
import { GroupWithInheritance } from './GroupDetailsDrawer';
import { IntlProvider } from 'react-intl';

// Redux store setup
const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
const mockStore = configureStore(middlewares);

const createInitialState = (overrides: Record<string, unknown> = {}) => ({
  groupReducer: {
    selectedGroup: {
      members: { data: [], isLoading: false },
      roles: { data: [], isLoading: false },
      error: null,
    },
    ...overrides,
  },
});

// Mock group data with inheritance information
const mockGroupsWithInheritance: GroupWithInheritance[] = [
  {
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
    inheritedFrom: {
      workspaceId: 'parent-workspace-1',
      workspaceName: 'Production Environment',
    },
  },
  {
    uuid: 'group-2',
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
      workspaceId: 'parent-workspace-2',
      workspaceName: 'Corporate Parent',
    },
  },
  {
    uuid: 'group-3',
    name: 'QA Engineers',
    principalCount: 8,
    roleCount: 3,
    created: '2024-01-12T11:00:00Z',
    modified: '2024-01-19T13:30:00Z',
    admin_default: false,
    platform_default: false,
    system: false,
    inheritedFrom: {
      workspaceId: 'parent-workspace-1',
      workspaceName: 'Production Environment',
    },
  },
  {
    uuid: 'group-4',
    name: 'Support Team',
    description: 'Customer support and issue resolution',
    principalCount: 15,
    roleCount: 4,
    created: '2024-01-08T08:00:00Z',
    modified: '2024-01-17T12:15:00Z',
    admin_default: false,
    platform_default: false,
    system: false,
    // This group has no inheritedFrom to test the N/A case
  },
];

// Story decorator to provide necessary context
const withProviders = (Story: React.ComponentType, context: { parameters?: { mockState?: { groupReducer?: Record<string, unknown> } } }) => {
  const initialState = createInitialState(context.parameters?.mockState?.groupReducer || {});
  const store = mockStore(initialState);

  return (
    <Provider store={store}>
      <IntlProvider locale="en" messages={{}}>
        <div style={{ height: '600px', padding: '16px' }}>
          <Story />
        </div>
      </IntlProvider>
    </Provider>
  );
};

const meta: Meta<typeof ParentRoleAssignmentsTable> = {
  component: ParentRoleAssignmentsTable,
  tags: ['autodocs', 'workspaces', 'parent-role-assignments-table'],
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The ParentRoleAssignmentsTable displays groups and their role assignments that are inherited from parent workspaces.

## Key Features
- **Prop-based Data**: Receives groups data with inheritance information as props
- **Inheritance Column**: Shows "Inherited from" column with hyperlinks to parent workspaces
- **Pagination**: Built-in pagination with configurable page sizes
- **Bulk Selection**: Select individual or all groups on a page
- **Sorting & Filtering**: Sortable columns and dual filtering (user group + inherited from)
- **Interactive Drawer**: Clickable rows open drawer with Users and Roles tabs (Roles tab includes inheritance)
- **Data States**: Loading, empty, and error states
- **Responsive Design**: Optimized for different screen sizes

## Props Interface
- \`groups\`: Array of GroupWithInheritance data to display
- \`totalCount\`: Total number of groups for pagination
- \`isLoading\`: Loading state boolean
- \`page\`: Current page number
- \`perPage\`: Number of items per page
- \`onSetPage\`: Callback when page changes
- \`onPerPageSelect\`: Callback when per page changes
- \`sortBy\`: Current sort field
- \`direction\`: Current sort direction
- \`onSort\`: Callback when sorting changes
- \`filters\`: Current filter values (name + inheritedFrom)
- \`onSetFilters\`: Callback when filters change
- \`clearAllFilters\`: Callback to clear all filters
- \`ouiaId\`: OUIA identifier for testing

## GroupWithInheritance Data Structure
Extends the base Group interface with optional inheritedFrom property containing workspaceId and workspaceName.
        `,
      },
    },
  },
  argTypes: {
    groups: {
      description: 'Array of GroupWithInheritance data to display',
      control: { type: 'object' },
    },
    totalCount: {
      description: 'Total number of groups for pagination',
      control: { type: 'number' },
    },
    isLoading: {
      description: 'Loading state boolean',
      control: { type: 'boolean' },
    },
    page: {
      description: 'Current page number',
      control: { type: 'number' },
    },
    perPage: {
      description: 'Number of items per page',
      control: { type: 'number' },
    },
    onSetPage: {
      description: 'Callback when page changes',
      action: 'page-changed',
    },
    onPerPageSelect: {
      description: 'Callback when per page changes',
      action: 'per-page-changed',
    },
    sortBy: {
      description: 'Current sort field',
      control: { type: 'text' },
    },
    direction: {
      description: 'Current sort direction',
      control: { type: 'select', options: ['asc', 'desc'] },
    },
    onSort: {
      description: 'Callback when sorting changes',
      action: 'sort-changed',
    },
    filters: {
      description: 'Current filter values (name + inheritedFrom)',
      control: { type: 'object' },
    },
    onSetFilters: {
      description: 'Callback when filters change',
      action: 'filters-changed',
    },
    clearAllFilters: {
      description: 'Callback to clear all filters',
      action: 'filters-cleared',
    },
    ouiaId: {
      description: 'OUIA identifier for testing',
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with groups data including inheritance
export const Default: Story = {
  args: {
    groups: mockGroupsWithInheritance,
    totalCount: mockGroupsWithInheritance.length,
    isLoading: false,
    page: 1,
    perPage: 20,
    onSetPage: fn(),
    onPerPageSelect: fn(),
    sortBy: 'name',
    direction: 'asc',
    onSort: fn(),
    filters: { name: '', inheritedFrom: '' },
    onSetFilters: fn(),
    clearAllFilters: fn(),
    ouiaId: 'parent-role-assignments-table',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state showing role assignments inherited from parent workspaces with "Inherited from" column.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to load - PatternFly uses 'grid' role for interactive tables
    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    // Verify table headers including the new "Inherited from" column
    await waitFor(async () => {
      const tableHeaders = table.querySelectorAll('th');
      expect(tableHeaders.length).toBeGreaterThan(0);

      // Verify specific headers exist in the table
      await expect(canvas.getByText('Description')).toBeInTheDocument();
      await expect(canvas.getByText('Users')).toBeInTheDocument();
      await expect(canvas.getByText('Roles')).toBeInTheDocument();
      await expect(canvas.getByText('Inherited from')).toBeInTheDocument();
      await expect(canvas.getByText('Last modified')).toBeInTheDocument();
    });

    // Verify group data is displayed
    await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Development Team')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('QA Engineers')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Support Team')).resolves.toBeInTheDocument();

    // Verify inheritance links are present
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Corporate Parent')).resolves.toBeInTheDocument();

    // Verify pagination is present
    const paginationElements = canvas.getAllByText('1 - 4', { exact: false });
    await expect(paginationElements.length).toBeGreaterThan(0);
  },
};

// Loading state
export const LoadingState: Story = {
  args: {
    groups: [],
    totalCount: 0,
    isLoading: true,
    page: 1,
    perPage: 20,
    onSetPage: fn(),
    onPerPageSelect: fn(),
    sortBy: 'name',
    direction: 'asc',
    onSort: fn(),
    filters: { name: '', inheritedFrom: '' },
    onSetFilters: fn(),
    clearAllFilters: fn(),
    ouiaId: 'parent-role-assignments-table-loading',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state showing skeleton table while fetching inherited role assignment data.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // In loading state, should show skeleton elements and not actual group data
    await waitFor(
      async () => {
        // Check for skeleton loading elements
        const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
        expect(skeletonElements.length).toBeGreaterThan(0);

        // Should not show actual group data
        const loadingElements = canvas.queryAllByText('Platform Administrators');
        expect(loadingElements.length).toBe(0);
      },
      { timeout: 2000 },
    );
  },
};

// Empty state
export const EmptyState: Story = {
  args: {
    groups: [],
    totalCount: 0,
    isLoading: false,
    page: 1,
    perPage: 20,
    onSetPage: fn(),
    onPerPageSelect: fn(),
    sortBy: 'name',
    direction: 'asc',
    onSort: fn(),
    filters: { name: '', inheritedFrom: '' },
    onSetFilters: fn(),
    clearAllFilters: fn(),
    ouiaId: 'parent-role-assignments-table-empty',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no inherited role assignments are found.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.findByText('No user group found')).resolves.toBeInTheDocument();
  },
};

// Test inheritance link functionality
export const InheritanceLinkTest: Story = {
  args: {
    groups: mockGroupsWithInheritance.slice(0, 2), // Show groups with inheritance
    totalCount: 2,
    isLoading: false,
    page: 1,
    perPage: 20,
    onSetPage: fn(),
    onPerPageSelect: fn(),
    sortBy: 'name',
    direction: 'asc',
    onSort: fn(),
    filters: { name: '', inheritedFrom: '' },
    onSetFilters: fn(),
    clearAllFilters: fn(),
    ouiaId: 'role-assignments-inheritance-test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Testing inheritance column with hyperlinks to parent workspaces.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to load
    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    // Verify inheritance links are clickable
    const productionLink = await canvas.findByRole('link', { name: 'Production Environment' });
    await expect(productionLink).toBeInTheDocument();
    await expect(productionLink.getAttribute('href')).toBe('#/workspaces/parent-workspace-1');

    const corporateLink = await canvas.findByRole('link', { name: 'Corporate Parent' });
    await expect(corporateLink).toBeInTheDocument();
    await expect(corporateLink.getAttribute('href')).toBe('#/workspaces/parent-workspace-2');
  },
};

// Test dual filtering functionality
export const FilteringTest: Story = {
  args: {
    groups: mockGroupsWithInheritance,
    totalCount: mockGroupsWithInheritance.length,
    isLoading: false,
    page: 1,
    perPage: 20,
    onSetPage: fn(),
    onPerPageSelect: fn(),
    sortBy: 'name',
    direction: 'asc',
    onSort: fn(),
    filters: { name: '', inheritedFrom: '' },
    onSetFilters: fn(),
    clearAllFilters: fn(),
    ouiaId: 'role-assignments-filtering-test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Testing dual filtering functionality for both user group names and inherited from sources.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Wait for table to load
    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    // Test user group filter
    const userGroupFilter = await canvas.findByPlaceholderText('Filter by user group');
    await userEvent.type(userGroupFilter, 'Development');

    // Verify filter callback was called
    await expect(args.onSetFilters).toHaveBeenCalled();

    // Test inherited from filter
    const inheritedFromFilter = await canvas.findByPlaceholderText('Filter by inherited from');
    await userEvent.type(inheritedFromFilter, 'Production');

    // Verify filter callback was called again
    await expect(args.onSetFilters).toHaveBeenCalledTimes(12); // 11 characters typed total
  },
};

// Test drawer interaction with inheritance info
export const DrawerInteractionWithInheritance: Story = {
  args: {
    groups: mockGroupsWithInheritance.slice(0, 1), // Just first group for focused testing
    totalCount: 1,
    isLoading: false,
    page: 1,
    perPage: 20,
    onSetPage: fn(),
    onPerPageSelect: fn(),
    sortBy: 'name',
    direction: 'asc',
    onSort: fn(),
    filters: { name: '', inheritedFrom: '' },
    onSetFilters: fn(),
    clearAllFilters: fn(),
    ouiaId: 'parent-role-assignments-drawer-test',
  },
  parameters: {
    mockState: {
      groupReducer: {
        selectedGroup: {
          members: {
            data: [
              { username: 'admin', first_name: 'Admin', last_name: 'User', uuid: '1' },
              { username: 'user1', first_name: 'John', last_name: 'Doe', uuid: '2' },
            ],
            isLoading: false,
          },
          roles: {
            data: [
              { uuid: '1', display_name: 'Administrator' },
              { uuid: '2', display_name: 'User Manager' },
            ],
            isLoading: false,
          },
          error: null,
        },
      },
    },
    docs: {
      description: {
        story: 'Testing row click functionality to open the GroupDetailsDrawer with inheritance information in the roles tab.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to load
    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    // Initially drawer should be closed
    await expect(canvas.queryByRole('tab', { name: /roles/i })).not.toBeInTheDocument();

    // Find the first row and click it
    const firstRowCell = await canvas.findByText('Platform Administrators');
    await userEvent.click(firstRowCell);

    // Wait for drawer to open
    await waitFor(async () => {
      // Should see the group name in drawer header
      await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();

      // Should see tabs
      await expect(canvas.findByRole('tab', { name: /roles/i })).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('tab', { name: /users/i })).resolves.toBeInTheDocument();
    });

    // Verify roles tab content includes inheritance column
    await expect(canvas.findByText('Administrator')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('User Manager')).resolves.toBeInTheDocument();

    // The inheritance link should be visible in the roles tab
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

    // Switch to Users tab to verify it still works
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    await userEvent.click(usersTab);

    // Verify users content is now visible
    await expect(canvas.findByText('admin')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('John')).resolves.toBeInTheDocument();
  },
};
