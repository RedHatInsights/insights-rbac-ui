import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { RoleAssignmentsTable } from './RoleAssignmentsTable';
import { Group } from '../../../../redux/groups/reducer';
import { HttpResponse, http } from 'msw';

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

// MSW handlers for group details API calls
const groupDetailsHandlers = [
  // Handler for fetching group members
  http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request }) => {
    const url = new URL(request.url);
    const principalType = url.searchParams.get('principal_type');

    // Return empty users for user principal type
    if (principalType === 'user') {
      return HttpResponse.json({
        data: [],
        meta: {
          count: 0,
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
      data: [],
      meta: {
        count: 0,
        limit: 1000,
        offset: 0,
      },
    });
  }),
];

// Router wrapper for components that use AppLink
const withRouter = () => {
  const RouterWrapper = (Story: React.ComponentType) => (
    <MemoryRouter initialEntries={['/']}>
      <Story />
    </MemoryRouter>
  );
  RouterWrapper.displayName = 'RouterWrapper';
  return RouterWrapper;
};

const meta: Meta<typeof RoleAssignmentsTable> = {
  component: RoleAssignmentsTable,
  tags: ['autodocs'],
  decorators: [withRouter()],
  parameters: {
    msw: {
      handlers: groupDetailsHandlers,
    },
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

// Test basic table functionality without drawer interaction
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
    docs: {
      description: {
        story: 'Testing basic table functionality. Drawer interaction is complex and requires full app context.',
      },
    },
    msw: {
      handlers: [
        // Mock API for group users (drawer users tab)
        http.get('/api/rbac/v1/groups/:groupId/principals/', () => {
          return HttpResponse.json({
            data: [
              { username: 'admin', email: 'admin@company.com', first_name: 'John', last_name: 'Doe', is_org_admin: true },
              { username: 'user1', email: 'user1@company.com', first_name: 'Jane', last_name: 'Smith', is_org_admin: false },
            ],
            meta: { count: 2, limit: 1000, offset: 0 },
          });
        }),
        // Mock API for group roles (drawer roles tab)
        http.get('/api/rbac/v1/groups/:groupId/roles/', () => {
          return HttpResponse.json({
            data: [
              { uuid: 'role-1', name: 'administrator', display_name: 'Administrator', description: 'Full admin access' },
              { uuid: 'role-2', name: 'user-manager', display_name: 'User Manager', description: 'Manage users' },
            ],
            meta: { count: 2, limit: 1000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to load
    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    // Verify table content is displayed
    await expect(canvas.findByText('Platform Administrators')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Development Team')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('QA Engineers')).resolves.toBeInTheDocument();

    // Verify table headers
    await expect(canvas.getByText('Description')).toBeInTheDocument();
    await expect(canvas.getByText('Users')).toBeInTheDocument();
    await expect(canvas.getByText('Roles')).toBeInTheDocument();
    await expect(canvas.getByText('Last modified')).toBeInTheDocument();

    // Click on a row to open the drawer - find the first group row
    const firstGroupRow = await canvas.findByText('Platform Administrators');
    await userEvent.click(firstGroupRow);

    // Wait for drawer to open by looking for tabs
    await waitFor(
      async () => {
        // Look for tabs with more flexible matching
        const tabs = canvas.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThanOrEqual(2);

        // Check if we can find roles and users tabs (case insensitive)
        const tabTexts = tabs.map((tab) => tab.textContent?.toLowerCase() || '');
        expect(tabTexts.some((text) => text.includes('role'))).toBeTruthy();
        expect(tabTexts.some((text) => text.includes('user'))).toBeTruthy();
      },
      { timeout: 5000 },
    );

    // Wait for roles tab content to load
    await waitFor(
      async () => {
        // Look for any role content - be flexible about exact text
        const roleElements = canvas.queryAllByText(/administrator|user manager/i);
        expect(roleElements.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );

    // Switch to Users tab
    await waitFor(async () => {
      const tabs = canvas.getAllByRole('tab');
      const usersTab = tabs.find((tab) => tab.textContent?.toLowerCase().includes('user'));
      expect(usersTab).toBeTruthy();
      if (usersTab) await userEvent.click(usersTab);
    });

    // Wait for users content to load
    await waitFor(
      async () => {
        // Look for any user content - be flexible about exact text
        const userElements = canvas.queryAllByText(/admin|john|doe/i);
        expect(userElements.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );

    // Try to close drawer - look for any close-like button
    await waitFor(
      async () => {
        const closeButtons = canvas.queryAllByRole('button');
        const closeButton = closeButtons.find(
          (btn) => btn.textContent?.toLowerCase().includes('close') || btn.getAttribute('aria-label')?.toLowerCase().includes('close'),
        );
        if (closeButton) {
          await userEvent.click(closeButton);
        }
      },
      { timeout: 2000 },
    );

    // Basic test completion - drawer interaction tested
    expect(true).toBeTruthy();
  },
};

// Test Grant Access Button - Feature Flag Disabled (should be disabled)
export const GrantAccessButtonDisabled: Story = {
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
    workspaceName: 'Test Workspace',
    ouiaId: 'role-assignments-grant-access-disabled-test',
  },
  parameters: {
    featureFlags: {
      'platform.rbac.workspaces': false, // Feature flag disabled - button should be disabled
    },
    docs: {
      description: {
        story: 'Testing Grant Access button when feature flag is disabled. Button should be present but disabled.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to load
    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    // Verify Grant Access button is present but disabled
    const grantAccessButton = await canvas.findByRole('button', { name: /grant access/i });
    await expect(grantAccessButton).toBeInTheDocument();
    await expect(grantAccessButton).toBeDisabled();
  },
};

// Test Grant Access Wizard functionality
export const GrantAccessWizardTest: Story = {
  tags: ['ff:platform.rbac.workspaces'], // Required tag for feature flag usage
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
    workspaceName: 'Test Workspace', // Required for wizard to render
    ouiaId: 'role-assignments-grant-access-test',
  },
  parameters: {
    featureFlags: {
      'platform.rbac.workspaces': true, // Enable grant access wizard functionality (M5 master flag)
    },
    docs: {
      description: {
        story:
          'Testing Grant Access wizard functionality. Verifies the wizard opens when the Grant Access button is clicked. Requires the m5 feature flag to be enabled.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for table to load
    const table = await canvas.findByRole('grid');
    await expect(table).toBeInTheDocument();

    // Wait for Grant Access button and verify it's enabled
    // The button should be enabled when the platform.rbac.workspaces feature flag is true
    let grantAccessButton: HTMLElement;
    await waitFor(
      async () => {
        grantAccessButton = canvas.getByRole('button', { name: /grant access/i });
        await expect(grantAccessButton).toBeInTheDocument();
        await expect(grantAccessButton).toBeEnabled();
      },
      { timeout: 10000 }, // Give more time for feature flag to be applied
    );

    // Click the Grant Access button
    await userEvent.click(grantAccessButton!);

    // Wait for the wizard modal to appear
    await waitFor(
      async () => {
        // Look for the wizard modal dialog
        const wizardModal = document.querySelector('[role="dialog"]');
        expect(wizardModal).toBeInTheDocument();

        // Verify wizard title appears with workspace name
        const modalContent = within(wizardModal as HTMLElement);
        await expect(modalContent.getByText(/grant access in workspace test workspace/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify wizard step navigation is present
    await waitFor(
      async () => {
        const wizardModal = document.querySelector('[role="dialog"]') as HTMLElement;
        const modalContent = within(wizardModal);

        // Look for step content in the wizard - be more specific to avoid multiple matches
        // Check for any text that indicates we're on the user groups step
        const stepTexts = modalContent.queryAllByText(/select user group/i);
        expect(stepTexts.length).toBeGreaterThan(0); // At least one should exist

        // Verify wizard navigation buttons are present
        const nextButton = modalContent.queryByRole('button', { name: /next/i });
        const cancelButton = modalContent.queryByRole('button', { name: /cancel/i });

        expect(nextButton || cancelButton).toBeTruthy(); // At least one navigation button should be present
      },
      { timeout: 3000 },
    );

    // Test canceling the wizard
    await waitFor(
      async () => {
        const wizardModal = document.querySelector('[role="dialog"]') as HTMLElement;
        const modalContent = within(wizardModal);

        // Look for Cancel button and click it
        const cancelButton = modalContent.getByRole('button', { name: /cancel/i });
        await userEvent.click(cancelButton);
      },
      { timeout: 2000 },
    );

    // Verify wizard modal closes after cancel
    await waitFor(
      async () => {
        const wizardModal = document.querySelector('[role="dialog"]');
        expect(wizardModal).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Verify Grant Access button is still present after modal closes
    await expect(canvas.findByRole('button', { name: /grant access/i })).resolves.toBeInTheDocument();
  },
};
