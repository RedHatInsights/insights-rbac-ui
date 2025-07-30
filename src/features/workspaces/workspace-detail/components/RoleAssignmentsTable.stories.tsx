import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { RoleAssignmentsTable } from './RoleAssignmentsTable';
import { IntlProvider } from 'react-intl';
import { Group } from '../../../../redux/groups/reducer';
import { waitForSkeletonToDisappear } from '../../workspaceTestHelpers';

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
const withProviders = (Story: any) => {
  return (
    <IntlProvider locale="en" messages={{}}>
      <div style={{ height: '600px', padding: '16px' }}>
        <Story />
      </div>
    </IntlProvider>
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
- **Data States**: Loading, empty, and error states
- **Responsive Design**: Optimized for different screen sizes

## Props Interface
- \`groups\`: Array of group data to display
- \`totalCount\`: Total number of groups for pagination
- \`isLoading\`: Loading state boolean
- \`page\`: Current page number
- \`perPage\`: Number of items per page
- \`onPaginationChange\`: Callback when pagination changes
- \`onChange\`: Callback when selection changes
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
    onPaginationChange: {
      description: 'Callback when pagination changes',
      action: 'pagination-changed',
    },
    onChange: {
      description: 'Callback when selection changes',
      action: 'selection-changed',
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
    onPaginationChange: fn(),
    onChange: fn(),
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

    // Wait for skeleton loading to complete first
    await waitForSkeletonToDisappear(canvasElement);

    // Wait for table to load - PatternFly uses 'grid' role for interactive tables
    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    // Verify table headers
    await expect(canvas.findByText('User group')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Description')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Users')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Roles')).resolves.toBeInTheDocument();

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
    onPaginationChange: fn(),
    onChange: fn(),
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

    // In loading state, should show skeleton but not actual group data
    await waitFor(
      async () => {
        const loadingElements = canvas.queryAllByText('Platform Administrators');
        await expect(loadingElements.length).toBe(0);
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
    onPaginationChange: fn(),
    onChange: fn(),
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
    onPaginationChange: fn(),
    onChange: fn(),
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

    // Wait for skeleton loading to complete first
    await waitForSkeletonToDisappear(canvasElement);

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
    await expect(args.onPaginationChange).toHaveBeenCalledWith(2, 2);
  },
};
