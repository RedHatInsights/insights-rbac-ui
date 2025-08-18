import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Provider } from 'react-redux';
// @ts-ignore - redux-mock-store doesn't have TypeScript definitions
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';
import { RoleAssignmentsTable } from './RoleAssignmentsTable';
import { IntlProvider } from 'react-intl';
import { Group } from '../../../../redux/groups/reducer';

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

// Mock group data
const mockGroups: Group[] = [
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

const meta: Meta<typeof RoleAssignmentsTable> = {
  component: RoleAssignmentsTable,
  tags: ['autodocs', 'workspaces', 'role-assignments-table'],
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The RoleAssignmentsTable displays groups and their role assignments in a workspace context.

## Key Features
- **Prop-based Data**: Receives groups data as props from parent component
- **Pagination**: Built-in pagination with configurable page sizes
- **Bulk Selection**: Select individual or all groups on a page
- **Sorting & Filtering**: Sortable columns and user group filtering
- **Interactive Drawer**: Clickable rows open drawer with Users and Roles tabs
- **Data States**: Loading, empty, and error states
- **Responsive Design**: Optimized for different screen sizes

## Props Interface
- \`groups\`: Array of group data to display
- \`totalCount\`: Total number of groups for pagination
- \`isLoading\`: Loading state boolean
- \`page\`: Current page number
- \`perPage\`: Number of items per page
- \`onSetPage\`: Callback when page changes
- \`onPerPageSelect\`: Callback when per page changes
- \`sortBy\`: Current sort field
- \`direction\`: Current sort direction
- \`onSort\`: Callback when sorting changes
- \`filters\`: Current filter values
- \`onSetFilters\`: Callback when filters change
- \`clearAllFilters\`: Callback to clear all filters
- \`ouiaId\`: OUIA identifier for testing

## Group Data Structure
Groups include name, description, user count, role count, and timestamps.
The table handles long descriptions with tooltips and shows creation/modification times.
        `,
      },
    },
  },
  argTypes: {
    groups: {
      description: 'Array of group data to display',
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
      description: 'Current filter values',
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

// Default story with groups data
export const Default: Story = {
  args: {
    groups: mockGroups,
    totalCount: mockGroups.length,
    isLoading: false,
    page: 1,
    perPage: 20,
    onSetPage: fn(),
    onPerPageSelect: fn(),
    sortBy: 'name',
    direction: 'asc',
    onSort: fn(),
    filters: { name: '' },
    onSetFilters: fn(),
    clearAllFilters: fn(),
    ouiaId: 'role-assignments-table',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state showing role assignments with full group data including descriptions and counts.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to load - PatternFly uses 'grid' role for interactive tables
    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    // Verify table headers (using more specific selectors to avoid filter dropdown conflicts)
    await waitFor(async () => {
      // Check for table headers specifically within the table
      const tableHeaders = table.querySelectorAll('th');
      expect(tableHeaders.length).toBeGreaterThan(0);

      // Verify specific headers exist in the table
      await expect(canvas.getByText('Description')).toBeInTheDocument();
      await expect(canvas.getByText('Users')).toBeInTheDocument();
      await expect(canvas.getByText('Roles')).toBeInTheDocument();
      await expect(canvas.getByText('Last modified')).toBeInTheDocument();
    });

    // Verify group data is displayed
    await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Development Team')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('QA Engineers')).resolves.toBeInTheDocument();

    // Verify pagination is present (appears in both header and footer toolbars)
    const paginationElements = canvas.getAllByText('1 - 3', { exact: false });
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
    filters: { name: '' },
    onSetFilters: fn(),
    clearAllFilters: fn(),
    ouiaId: 'role-assignments-table-loading',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state showing skeleton table while fetching role assignment data.',
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
    filters: { name: '' },
    onSetFilters: fn(),
    clearAllFilters: fn(),
    ouiaId: 'role-assignments-table-empty',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no role assignments are found.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.findByText('No user group found')).resolves.toBeInTheDocument();
  },
};

// Test pagination callback
export const PaginationTest: Story = {
  args: {
    groups: mockGroups.slice(0, 2), // Show first page
    totalCount: mockGroups.length, // Total count for pagination
    isLoading: false,
    page: 1,
    perPage: 2,
    onSetPage: fn(),
    onPerPageSelect: fn(),
    sortBy: 'name',
    direction: 'asc',
    onSort: fn(),
    filters: { name: '' },
    onSetFilters: fn(),
    clearAllFilters: fn(),
    ouiaId: 'role-assignments-pagination',
  },
  parameters: {
    docs: {
      description: {
        story: 'Testing pagination functionality with navigation between pages.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Wait for table to load
    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    // Verify first page content
    await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Development Team')).resolves.toBeInTheDocument();

    // Verify pagination shows correct info (appears in both header and footer toolbars)
    const paginationElements = canvas.getAllByText('1 - 2', { exact: false });
    await expect(paginationElements.length).toBeGreaterThan(0);

    // Find next page buttons (multiple due to header and footer pagination)
    const nextButtons = canvas.getAllByRole('button', { name: /next/i });
    await expect(nextButtons.length).toBeGreaterThan(0);
    await expect(nextButtons[0]).toBeEnabled();

    // Test pagination callback when clicking next
    await userEvent.click(nextButtons[0]);

    // Verify the callback was called and the second argument is the page number
    await expect(args.onSetPage).toHaveBeenCalled();
    const mockFn = args.onSetPage as any;
    const lastCall = mockFn.mock.calls[mockFn.mock.calls.length - 1];
    expect(lastCall[1]).toBe(2); // Second argument should be the page number
  },
};

// Test row click to open drawer
export const DrawerInteraction: Story = {
  args: {
    groups: mockGroups,
    totalCount: mockGroups.length,
    isLoading: false,
    page: 1,
    perPage: 20,
    onSetPage: fn(),
    onPerPageSelect: fn(),
    sortBy: 'name',
    direction: 'asc',
    onSort: fn(),
    filters: { name: '' },
    onSetFilters: fn(),
    clearAllFilters: fn(),
    ouiaId: 'role-assignments-drawer-test',
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
        story: 'Testing row click functionality to open the GroupDetailsDrawer with tabs.',
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
    await expect(canvas.queryByRole('tab', { name: /users/i })).not.toBeInTheDocument();

    // Find the first row (Platform Administrators) and click it
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

    // Verify roles tab content is visible (default active tab)
    await expect(canvas.findByText('Administrator')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('User Manager')).resolves.toBeInTheDocument();

    // Switch to Users tab
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    await userEvent.click(usersTab);

    // Verify users content is now visible
    await expect(canvas.findByText('admin')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('John')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Doe')).resolves.toBeInTheDocument();

    // Close drawer by clicking close button
    const closeButton = await canvas.findByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    // Verify drawer is closed
    await waitFor(async () => {
      await expect(canvas.queryByRole('tab', { name: /roles/i })).not.toBeInTheDocument();
    });
  },
};
