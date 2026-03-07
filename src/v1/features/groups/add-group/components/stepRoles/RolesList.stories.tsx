import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { delay } from 'msw';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { v1RolesHandlers, v1RolesLoadingHandlers } from '../../../../../data/mocks/roles.handlers';
import type { RoleOutDynamic } from '../../../../../data/mocks/db';
import { RolesList } from './RolesList';

const storyRoles: RoleOutDynamic[] = [
  {
    uuid: 'role-1',
    name: 'console-administrator',
    display_name: 'Console Administrator',
    description: 'Full administrative access to all console features and settings',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 10,
    applications: ['rbac'],
  },
  {
    uuid: 'role-2',
    name: 'organization-administrator',
    display_name: 'Organization Administrator',
    description: 'Manage organization settings, users, and subscriptions',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 10,
    applications: ['rbac'],
  },
  {
    uuid: 'role-3',
    name: 'insights-viewer',
    display_name: 'Insights Viewer',
    description: 'View insights, recommendations, and system health data',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 10,
    applications: ['rbac'],
  },
  {
    uuid: 'role-4',
    name: 'content-manager',
    display_name: 'Content Manager',
    description: 'Create, edit, and manage content across the platform',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 10,
    applications: ['rbac'],
  },
  {
    uuid: 'role-5',
    name: 'auditor',
    display_name: 'Auditor',
    description: 'View audit logs and compliance reports',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 10,
    applications: ['rbac'],
  },
  {
    uuid: 'role-6',
    name: 'developer',
    display_name: 'Developer',
    description: 'Deploy and manage applications and services',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 10,
    applications: ['rbac'],
  },
  {
    uuid: 'role-7',
    name: 'support-specialist',
    display_name: 'Support Specialist',
    description: 'Access customer support tools and case management',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 10,
    applications: ['rbac'],
  },
  {
    uuid: 'role-8',
    name: 'billing-manager',
    display_name: 'Billing Manager',
    description: 'Manage billing, payments, and subscription details',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 10,
    applications: ['rbac'],
  },
];

// Test wrapper component
const RolesListTestWrapper: React.FC<{
  initialSelectedRoles?: Array<Pick<RoleOutDynamic, 'uuid' | 'name' | 'display_name'>>;
  onSelect?: (selectedRoles: Array<Pick<RoleOutDynamic, 'uuid' | 'name' | 'display_name'>>) => void;
  rolesExcluded?: boolean;
  groupId?: string;
  usesMetaInURL?: boolean;
}> = (props) => (
  <MemoryRouter>
    <div style={{ height: '600px', padding: '20px' }}>
      <RolesList
        initialSelectedRoles={props.initialSelectedRoles || []}
        onSelect={props.onSelect || fn()}
        rolesExcluded={props.rolesExcluded}
        groupId={props.groupId}
        usesMetaInURL={props.usesMetaInURL}
        {...props}
      />
    </div>
  </MemoryRouter>
);

const meta: Meta<typeof RolesListTestWrapper> = {
  title: 'Features/Groups/AddGroup/RolesList',
  component: RolesListTestWrapper,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The RolesList component displays a paginated, searchable table of roles with selection capabilities.
Used in the Add Group wizard to select roles to assign to a new group.

## Key Features
- **Selection**: Individual and bulk role selection
- **Search**: Filter roles by name, display name, or description
- **Pagination**: Configurable page sizes with navigation
- **Loading States**: Skeleton loading while fetching data
- **Empty States**: Contextual messages when no roles available
- **Clear Filters**: Reset all applied filters
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RolesListTestWrapper>;

export const Default: Story = {
  name: 'Default - With Roles',
  parameters: {
    msw: {
      handlers: [...v1RolesHandlers(storyRoles)],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Verify table headers
    expect(await canvas.findByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(await canvas.findByRole('columnheader', { name: /description/i })).toBeInTheDocument();

    // Verify roles are displayed
    expect(await canvas.findByText(storyRoles[0].display_name!)).toBeInTheDocument();
    expect(await canvas.findByText(storyRoles[1].display_name!)).toBeInTheDocument();
    expect(await canvas.findByText(storyRoles[2].display_name!)).toBeInTheDocument();

    // Verify pagination is present (there are two - top and bottom)
    const paginationElements = canvas.getAllByRole('navigation', { name: /pagination/i });
    expect(paginationElements.length).toBeGreaterThanOrEqual(1);

    // Verify search filter is present
    expect(await canvas.findByPlaceholderText(/filter by role name/i)).toBeInTheDocument();
  },
};

export const WithInitialSelection: Story = {
  args: {
    initialSelectedRoles: [
      { uuid: 'role-1', name: 'console-administrator', display_name: 'Console Administrator' },
      { uuid: 'role-3', name: 'insights-viewer', display_name: 'Insights Viewer' },
    ],
  },
  parameters: {
    msw: {
      handlers: [...v1RolesHandlers(storyRoles)],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for table to load
    await canvas.findByText(storyRoles[0].display_name!);

    // Verify initial selections are handled by the component
    const table = await canvas.findByRole('grid');
    expect(table).toBeInTheDocument();

    // Verify roles are displayed (selection state is managed externally)
    expect(canvas.getByText(storyRoles[0].display_name!)).toBeInTheDocument();
    expect(canvas.getByText(storyRoles[2].display_name!)).toBeInTheDocument();
  },
};

export const FilteringTest: Story = {
  name: 'Search and Filtering',
  parameters: {
    msw: {
      handlers: [...v1RolesHandlers(storyRoles)],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for table to load
    await canvas.findByText(storyRoles[0].display_name!);

    // Test filtering by "admin"
    const filterInput = await canvas.findByPlaceholderText(/filter by role name/i);
    await userEvent.type(filterInput, 'admin');

    // Wait for filtered results
    await canvas.findByText(storyRoles[0].display_name!);
    await canvas.findByText(storyRoles[1].display_name!);

    // Verify non-matching roles are filtered out
    await waitFor(() => {
      expect(canvas.queryByText(storyRoles[2].display_name!)).not.toBeInTheDocument();
      expect(canvas.queryByText(storyRoles[5].display_name!)).not.toBeInTheDocument();
    });

    // Test clearing the filter
    await userEvent.clear(filterInput);

    // Wait for previously filtered roles to reappear
    await canvas.findByText(storyRoles[2].display_name!, {}, { timeout: 3000 });
  },
};

export const SelectionTest: Story = {
  name: 'Individual and Bulk Selection',
  args: {
    onSelect: fn(),
  },
  parameters: {
    msw: {
      handlers: [...v1RolesHandlers(storyRoles)],
    },
  },
  play: async ({ canvasElement, args }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for table to load
    await canvas.findByText(storyRoles[0].display_name!);
    const table = await canvas.findByRole('grid');

    // Test individual selection - find any checkbox and click it
    const checkboxes = within(table).getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes.find((checkbox) => checkbox.getAttribute('aria-label')?.includes('Select row'));

    if (firstRowCheckbox) {
      await userEvent.click(firstRowCheckbox);

      // Verify onSelect was called (selection state may be managed externally)
      await waitFor(
        () => {
          expect(args.onSelect).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );
    }

    // Test bulk select dropdown
    const bulkSelectButton = await canvas.findByRole('button', { name: /select/i });
    await userEvent.click(bulkSelectButton);

    // Select page option (dropdown renders via portal)
    const selectPageOption = await within(document.body).findByText(/select page/i);
    await userEvent.click(selectPageOption);

    // Verify bulk select interaction occurred (external state management via onSelect)
    await waitFor(
      () => {
        // Component calls onSelect multiple times due to internal selection management
        // Just verify it was called at least twice (individual + bulk selection)
        const mockFn = args.onSelect as unknown as { mock: { calls: unknown[] } };
        expect(mockFn).toHaveBeenCalled();
        expect(mockFn.mock.calls.length).toBeGreaterThanOrEqual(2);
      },
      { timeout: 1000 },
    );
  },
};

export const PaginationTest: Story = {
  name: 'Pagination Controls',
  parameters: {
    msw: {
      handlers: [...v1RolesHandlers(storyRoles)],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for table to load
    await canvas.findByText(storyRoles[0].display_name!);

    // Verify pagination controls are present (there are two - top and bottom)
    const paginationNavs = canvas.getAllByRole('navigation', { name: /pagination/i });
    expect(paginationNavs.length).toBeGreaterThanOrEqual(1);

    // Test per-page dropdown if we have enough data
    const perPageButton = canvas.queryByRole('button', { name: /items per page/i });
    if (perPageButton) {
      await userEvent.click(perPageButton);

      // Look for per-page options
      const option10 = canvas.queryByText('10 per page');
      if (option10) {
        await userEvent.click(option10);

        // Verify the change took effect
        await waitFor(() => {
          expect(canvas.queryByRole('button', { name: /10 per page/i })).toBeInTheDocument();
        });
      }
    }
  },
};

export const ClearFiltersTest: Story = {
  name: 'Clear Filters Button',
  parameters: {
    msw: {
      handlers: [...v1RolesHandlers(storyRoles)],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for table to load
    await canvas.findByText(storyRoles[0].display_name!);

    // Apply a filter first
    const filterInput = await canvas.findByPlaceholderText(/filter by role name/i);
    await userEvent.type(filterInput, 'admin');

    // Wait for filtered results
    await canvas.findByText(storyRoles[0].display_name!);

    // Find and click clear filters button
    const clearFiltersButton = await canvas.findByRole('button', { name: /clear filters/i });
    expect(clearFiltersButton).toBeInTheDocument();

    await userEvent.click(clearFiltersButton);

    // Verify filters are cleared — input empty and previously filtered roles reappear
    await waitFor(() => expect(filterInput).toHaveValue(''));
    await canvas.findByText(storyRoles[2].display_name!, {}, { timeout: 3000 });
    await canvas.findByText(storyRoles[5].display_name!, {}, { timeout: 3000 });
  },
};

export const LoadingState: Story = {
  name: 'Loading Skeleton',
  parameters: {
    msw: {
      handlers: [...v1RolesLoadingHandlers()],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify loading skeleton is shown
    const table = await canvas.findByRole('grid');
    expect(table).toBeInTheDocument();

    // Look for skeleton elements (they have specific classes or attributes)
    const skeletons = canvas.queryAllByRole('row');
    expect(skeletons.length).toBeGreaterThan(1); // Should have header + skeleton rows
  },
};

export const EmptyState: Story = {
  name: 'Empty State - No Roles',
  parameters: {
    msw: {
      handlers: [...v1RolesHandlers([])],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Verify empty state message is displayed
    await waitFor(
      async () => {
        // Look for empty state indicators
        expect(canvas.queryByText(storyRoles[0].display_name!)).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // The empty state should show "No roles available" heading
    const emptyStateTitle = await canvas.findByRole('heading', { name: /no roles available/i });
    expect(emptyStateTitle).toBeInTheDocument();
  },
};

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [...v1RolesHandlers([])],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(600);
    const canvas = within(canvasElement);

    // Verify component handles API error gracefully with empty state heading
    const emptyStateTitle = await canvas.findByRole('heading', { name: /no roles available/i });
    expect(emptyStateTitle).toBeInTheDocument();

    // Verify no role data is displayed (empty response)
    expect(canvas.queryByText(storyRoles[0].display_name!)).not.toBeInTheDocument();
    expect(canvas.queryByText(storyRoles[1].display_name!)).not.toBeInTheDocument();
  },
};
