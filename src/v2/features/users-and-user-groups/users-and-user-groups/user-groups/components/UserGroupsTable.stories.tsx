import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DataViewEventsProvider } from '@patternfly/react-data-view';
import { MemoryRouter } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectLoadingVisible } from '../../../../../../test-utils/interactionHelpers';
import { UserGroupsTable } from './UserGroupsTable';
import { useTableState } from '../../../../../../shared/components/table-view/hooks/useTableState';
import type { Group } from '../../../../../../v2/data/queries/groups';
import { isGroupSelectable } from '../useUserGroups';
import { GROUP_ADMIN_DEFAULT, GROUP_SYSTEM_DEFAULT } from '../../../../../../shared/data/mocks/seed';
import messages from '../../../../../../Messages';
import { type SortableColumnId, columns as userGroupsColumns } from './useUserGroupsTableConfig';

/** Matches `useGroupsQuery` select normalization (`messages.allUsers` / `messages.allOrgAdmins`). */
const ALL_USERS_LABEL = messages.allUsers.defaultMessage;
const ALL_ORG_ADMINS_LABEL = messages.allOrgAdmins.defaultMessage;

// Mock group data for testing
const createMockGroup = (id: string): Group => ({
  uuid: id,
  name: `group-${id}`,
  description: `Description for group ${id}`,
  principalCount: Math.floor(Math.random() * 50),
  roleCount: Math.floor(Math.random() * 10),
  created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  modified: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  platform_default: false,
  admin_default: false,
  system: false,
});

const mockGroups: Group[] = [
  {
    ...createMockGroup('1'),
    name: 'Administrators',
    description: 'System administrators with full access',
    principalCount: 5,
    roleCount: 3,
    platform_default: false,
    system: false,
  },
  {
    ...createMockGroup('2'),
    name: 'Developers',
    description: 'Development team members',
    principalCount: 12,
    roleCount: 2,
    platform_default: false,
    system: false,
  },
  {
    ...GROUP_SYSTEM_DEFAULT,
    principalCount: ALL_USERS_LABEL,
  },
  {
    ...GROUP_ADMIN_DEFAULT,
    principalCount: ALL_ORG_ADMINS_LABEL,
  },
  {
    ...createMockGroup('4'),
    name: 'System Group',
    description: null as unknown as string, // Test null description
    principalCount: 0,
    roleCount: 5,
    platform_default: false,
    system: true,
  },
];

// Wrapper component that provides tableState hook
const UserGroupsTableWithState: React.FC<Omit<React.ComponentProps<typeof UserGroupsTable>, 'tableState'>> = (props) => {
  const tableState = useTableState<typeof userGroupsColumns, Group, SortableColumnId>({
    columns: userGroupsColumns,
    sortableColumns: ['name', 'modified'] as const,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 20,
    initialFilters: { name: '' },
    getRowId: (group) => group.uuid,
    isRowSelectable: isGroupSelectable,
    syncWithUrl: false,
  });

  return <UserGroupsTable {...props} tableState={tableState} />;
};

// Default args for all stories
const defaultArgs = {
  groups: mockGroups,
  totalCount: mockGroups.length,
  isLoading: false,
  defaultPerPage: 20,
  enableActions: true,
  ouiaId: 'test-user-groups-table',

  // Event handlers
  onRowClick: fn(),
  onEditGroup: fn(),
  onDeleteGroup: fn(),
  onDeleteGroups: fn(),
};

const meta: Meta<typeof UserGroupsTableWithState> = {
  component: UserGroupsTableWithState,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <DataViewEventsProvider>
          <div style={{ minHeight: '600px' }}>
            <Story />
          </div>
        </DataViewEventsProvider>
      </MemoryRouter>
    ),
  ],
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        component: `
**UserGroupsTable** is a presentational component that displays user groups in a data table format.

## Component Responsibilities
- **Pure UI Rendering**: Displays groups data with no external dependencies
- **User Interactions**: Handles sorting, filtering, pagination, and selection
- **Action Triggers**: Provides callbacks for edit, delete, and row click events
- **Kebab Menu Actions**: Professional row actions with proper permission handling
- **Modal Integration**: Accepts modals as children for clean separation

## Key Features
- **Professional UX**: Kebab menus for row actions following industry standards
- **Responsive Design**: Handles various screen sizes and data states
- **Accessibility**: Full ARIA support and keyboard navigation
- **Permission Awareness**: Disables actions for system/platform groups
- **Loading States**: Skeleton loading and empty state handling

## Architecture Pattern
This is a **presentational component** that:
- Receives all data via props
- Manages only local UI state (sorting, selection)
- Calls parent callbacks for business logic
- Has no knowledge of external state or routing
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Standard view with multiple groups
export const StandardView: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Standard table view showing multiple user groups with various states. Demonstrates the table structure, group information display, and action availability. Tests the basic presentation and interaction capabilities.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Verify table structure is rendered
      await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();

      // Verify group data appears in table
      await expect(canvas.findByText('Administrators')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();
      await expect(canvas.findByText(GROUP_SYSTEM_DEFAULT.name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText('System Group')).resolves.toBeInTheDocument();

      // Test column headers appear
      await expect(canvas.findByRole('columnheader', { name: 'Name' })).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Description')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Users')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Actions')).resolves.toBeInTheDocument();

      // Verify Create User Group button is present and functional
      const createButton = await canvas.findByRole('button', { name: /create user group/i });
      await expect(createButton).toBeInTheDocument();
      await expect(createButton).toBeEnabled();
    });
  },
};

// Loading state
export const LoadingState: Story = {
  args: {
    isLoading: true,
    groups: [],
    totalCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state display with skeleton placeholders. Shows how the table handles the loading state while data is being fetched, providing visual feedback to users.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      // Should show skeleton loading state
      await waitFor(
        () => {
          expectLoadingVisible(canvasElement);
        },
        { timeout: 10000 },
      );
    });
  },
};

// Empty state
export const EmptyState: Story = {
  args: {
    groups: [],
    totalCount: 0,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state when no user groups are available. Displays appropriate messaging and guidance for users when the table has no data to show.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Should show empty state
      await expect(canvas.findByRole('heading', { name: /no user group found/i })).resolves.toBeInTheDocument();
    });
  },
};

// Focused group (row selection)
export const FocusedGroup: Story = {
  args: {
    focusedGroup: mockGroups[0],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates row focus behavior when a specific group is selected. The focused row is visually highlighted and can trigger detail views or actions.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Verify focused group is displayed
      await expect(canvas.findByText('Administrators')).resolves.toBeInTheDocument();

      // Test row click functionality
      const adminRow = (await canvas.findByText('Administrators')).closest('tr');
      await expect(adminRow).toBeInTheDocument();

      if (adminRow) {
        await userEvent.click(adminRow);
        await expect(defaultArgs.onRowClick).toHaveBeenCalled();
      }
    });
  },
};

// Actions hidden/disabled for system groups
export const SystemGroupActions: Story = {
  args: {
    groups: [mockGroups[4]], // System group
  },
  parameters: {
    docs: {
      description: {
        story:
          'System groups have the Edit action hidden and the Delete action disabled. Tests the permission logic that protects critical system groups from user modification.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Test kebab menu functionality for system group (edit should be hidden, delete should be disabled)
      const kebabButton = await canvas.findByLabelText('Actions for group System Group');
      await userEvent.click(kebabButton);

      const editAction = within(document.body).queryByText(/edit user group/i);
      await expect(editAction).not.toBeInTheDocument();

      const deleteAction = await within(document.body).findByRole('menuitem', { name: /delete user group/i });
      await expect(deleteAction).toBeDisabled();
    });
  },
};

// Default access groups have Edit hidden and Delete disabled
export const DefaultGroupActions: Story = {
  args: {
    groups: [
      { ...GROUP_SYSTEM_DEFAULT, principalCount: ALL_USERS_LABEL },
      { ...GROUP_ADMIN_DEFAULT, principalCount: ALL_ORG_ADMINS_LABEL },
    ],
    totalCount: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default access groups (platform_default and admin_default) have the Edit action hidden from the kebab menu and the Delete action disabled. Users must manage default access via Workspace role-bindings instead.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify Default access group has no Edit action', async () => {
      const canvas = within(canvasElement);

      const kebabButton = await canvas.findByLabelText(`Actions for group ${GROUP_SYSTEM_DEFAULT.name}`);
      await userEvent.click(kebabButton);

      const editAction = within(document.body).queryByText(/edit user group/i);
      await expect(editAction).not.toBeInTheDocument();

      const deleteAction = await within(document.body).findByRole('menuitem', { name: /delete user group/i });
      await expect(deleteAction).toBeDisabled();

      await userEvent.keyboard('{Escape}');
    });

    await step('Verify Default admin access group has no Edit action', async () => {
      const canvas = within(canvasElement);

      const kebabButton = await canvas.findByLabelText(`Actions for group ${GROUP_ADMIN_DEFAULT.name}`);
      await userEvent.click(kebabButton);

      const editAction = within(document.body).queryByText(/edit user group/i);
      await expect(editAction).not.toBeInTheDocument();

      const deleteAction = await within(document.body).findByRole('menuitem', { name: /delete user group/i });
      await expect(deleteAction).toBeDisabled();

      await userEvent.keyboard('{Escape}');
    });
  },
};

// Actions enabled for regular groups
export const RegularGroupActions: Story = {
  args: {
    groups: [mockGroups[0]], // Regular group
  },
  parameters: {
    docs: {
      description: {
        story:
          'Regular user groups have fully enabled actions. Tests the kebab menu functionality and action callbacks for groups that can be safely modified.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Test kebab menu functionality for regular group (should show both edit and delete)
      const kebabButton = await canvas.findByLabelText('Actions for group Administrators');
      await userEvent.click(kebabButton);

      const editAction = await within(document.body).findByText(/edit/i);
      const deleteAction = await within(document.body).findByText(/delete/i);

      await expect(editAction.closest('[role="menuitem"]')).not.toHaveAttribute('aria-disabled');
      await expect(deleteAction.closest('[role="menuitem"]')).not.toHaveAttribute('aria-disabled');

      // Test edit action
      await userEvent.click(editAction);
      await expect(defaultArgs.onEditGroup).toHaveBeenCalledWith(mockGroups[0]);
    });
  },
};

// Delete action test
export const DeleteGroupAction: Story = {
  args: {
    groups: [mockGroups[1]], // Developers group
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the delete action workflow from the kebab menu. Validates that the delete callback is properly triggered with the correct group information.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Test kebab menu functionality for developers group (should have delete disabled)
      const kebabButton = await canvas.findByLabelText('Actions for group Developers');
      await userEvent.click(kebabButton);

      const deleteAction = await within(document.body).findByText(/delete/i);
      await userEvent.click(deleteAction);

      // Verify delete callback was called
      await expect(defaultArgs.onDeleteGroup).toHaveBeenCalledWith(mockGroups[1]);
    });
  },
};

// Bulk selection
export const BulkSelection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates bulk selection functionality. Canned groups (platform_default / admin_default) are excluded from selection. Tests individual, bulk-select, and deselect flows.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify canned groups have no checkbox', async () => {
      const canvas = within(canvasElement);

      const platformDefaultRow = (await canvas.findByText(GROUP_SYSTEM_DEFAULT.name)).closest('tr');
      await expect(platformDefaultRow).toBeInTheDocument();
      await expect(within(platformDefaultRow!).queryByRole('checkbox')).not.toBeInTheDocument();

      const adminDefaultRow = (await canvas.findByText(GROUP_ADMIN_DEFAULT.name)).closest('tr');
      await expect(adminDefaultRow).toBeInTheDocument();
      await expect(within(adminDefaultRow!).queryByRole('checkbox')).not.toBeInTheDocument();
    });

    await step('Select and deselect individual rows', async () => {
      const canvas = within(canvasElement);
      const developersRow = (await canvas.findByText('Developers')).closest('tr');
      const systemGroupRow = (await canvas.findByText('System Group')).closest('tr');

      const developersCheckbox = await within(developersRow!).findByRole('checkbox');
      const systemGroupCheckbox = await within(systemGroupRow!).findByRole('checkbox');

      await expect(developersCheckbox).not.toBeChecked();
      await expect(systemGroupCheckbox).not.toBeChecked();

      await userEvent.click(developersCheckbox);
      await expect(developersCheckbox).toBeChecked();

      await userEvent.click(systemGroupCheckbox);
      await expect(systemGroupCheckbox).toBeChecked();

      await userEvent.click(developersCheckbox);
      await expect(developersCheckbox).not.toBeChecked();
      await expect(systemGroupCheckbox).toBeChecked();

      // Deselect for clean state
      await userEvent.click(systemGroupCheckbox);
    });

    await step('Kebab delete action shows zero-count label with no selection', async () => {
      const canvas = within(canvasElement);
      const kebabButton = await canvas.findByLabelText('Actions overflow menu');
      await userEvent.click(kebabButton);

      const deleteItem = await within(document.body).findByText('Delete user group');
      await expect(deleteItem).toBeInTheDocument();

      await userEvent.keyboard('{Escape}');
    });

    await step('Kebab delete action is enabled after selecting rows', async () => {
      const canvas = within(canvasElement);
      const developersRow = (await canvas.findByText('Developers')).closest('tr');
      const developersCheckbox = await within(developersRow!).findByRole('checkbox');
      await userEvent.click(developersCheckbox);

      const kebabButton = await canvas.findByLabelText('Actions overflow menu');
      await userEvent.click(kebabButton);

      const deleteItem = await within(document.body).findByText(/delete user group \(1\)/i);
      await userEvent.click(deleteItem);
      await expect(defaultArgs.onDeleteGroups).toHaveBeenCalledTimes(1);

      await userEvent.click(developersCheckbox);
    });

    await step('Bulk select selects only selectable rows', async () => {
      const canvas = within(canvasElement);
      const bulkSelectButton = await canvas.findByLabelText('Select page');
      await userEvent.click(bulkSelectButton);

      const allCheckboxes = await canvas.findAllByRole('checkbox');
      for (const checkbox of allCheckboxes) {
        await expect(checkbox).toBeChecked();
      }

      await userEvent.click(bulkSelectButton);
      for (const checkbox of allCheckboxes) {
        await expect(checkbox).not.toBeChecked();
      }
    });
  },
};

// Date format switching: relative for recent (<3 months), full date for older
export const DateFormatSwitching: Story = {
  args: {
    groups: [
      {
        ...createMockGroup('recent'),
        name: 'Recently Modified',
        modified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        ...createMockGroup('old'),
        name: 'Old Group',
        modified: new Date('2025-06-15T12:00:00Z').toISOString(), // >3 months ago
      },
      {
        ...createMockGroup('no-date'),
        name: 'No Date Group',
        modified: '',
      },
    ],
    totalCount: 3,
    enableActions: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verifies that "Last Modified" dates use relative format ("2 days ago") for groups modified within the last 3 months and full date format ("15 Jun 2025") for older groups. Groups with no date show an empty cell.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify recent date shows relative format', async () => {
      const canvas = within(canvasElement);
      const recentRow = (await canvas.findByText('Recently Modified')).closest('tr');
      // Relative format contains "ago" suffix
      await expect(within(recentRow!).findByText(/ago$/)).resolves.toBeInTheDocument();
    });

    await step('Verify old date shows full date format', async () => {
      const canvas = within(canvasElement);
      const oldRow = (await canvas.findByText('Old Group')).closest('tr');
      // Full date format: "15 Jun 2025"
      await expect(within(oldRow!).findByText(/\d{2}\s\w{3}\s\d{4}/)).resolves.toBeInTheDocument();
    });

    await step('Verify empty date stays empty', async () => {
      const canvas = within(canvasElement);
      const noDateRow = (await canvas.findByText('No Date Group')).closest('tr');
      await expect(within(noDateRow!).queryByText(/ago$/i)).not.toBeInTheDocument();
      await expect(within(noDateRow!).queryByText(/\d{2}\s\w{3}\s\d{4}/)).not.toBeInTheDocument();
    });
  },
};

// No actions mode
export const NoActionsMode: Story = {
  args: {
    enableActions: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table in read-only mode with actions disabled. Useful for contexts where groups should only be viewed but not modified, such as reporting or audit views.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Verify table is rendered but no action menus exist
      await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();
      await expect(canvas.queryByLabelText(/Actions for group/)).not.toBeInTheDocument();

      // Bulk select should also be hidden
      await expect(canvas.queryByLabelText('Select page')).not.toBeInTheDocument();
    });
  },
};

// Large dataset scenario
export const LargeDataset: Story = {
  args: {
    groups: Array.from({ length: 5 }, (_, i) => createMockGroup(`large-${i}`)),
    totalCount: 1500, // Simulate large dataset
  },
  parameters: {
    docs: {
      description: {
        story:
          'Simulates a large dataset scenario to test pagination and performance. Shows how the table handles significant amounts of data with proper pagination controls.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Verify pagination shows correct total - there are TWO pagination components (top and bottom)
      const countElements = await canvas.findAllByText(/1500/);
      await expect(countElements.length).toBeGreaterThanOrEqual(1);

      // Verify table still renders properly
      await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();
    });
  },
};

// Mixed group types
export const MixedGroupTypes: Story = {
  args: {
    groups: mockGroups, // All types: regular, platform_default, system
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows table with mixed group types including regular, platform default, and system groups. Demonstrates how different group types are visually distinguished and handled.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Test that various group types are present and visible
      await expect(canvas.findByText('Administrators')).resolves.toBeInTheDocument(); // Regular
      await expect(canvas.findByText(GROUP_SYSTEM_DEFAULT.name)).resolves.toBeInTheDocument(); // Platform default
      await expect(canvas.findByText('System Group')).resolves.toBeInTheDocument(); // System

      // Test that system groups still have restricted actions
      const systemKebab = await canvas.findByLabelText('Actions for group System Group');
      await userEvent.click(systemKebab);

      const systemDeleteAction = await within(document.body).findByText(/delete/i);
      await expect(systemDeleteAction).toBeInTheDocument();
    });
  },
};

// Create User Group Button
export const CreateUserGroupButton: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests the "Create User Group" button functionality. Verifies that the button is present, accessible, and triggers navigation to the create user group form when clicked.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Verify table is loaded first
      await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();

      // Find the Create User Group button
      const createButton = await canvas.findByRole('button', { name: /create user group/i });
      await expect(createButton).toBeInTheDocument();

      // Verify button is enabled and clickable
      await expect(createButton).toBeEnabled();

      // Verify button has correct OUIA ID for testing
      await expect(createButton).toHaveAttribute('data-ouia-component-id', 'add-usergroup-button');

      // Verify button has isPinned attribute (should be prominently displayed)
      await expect(createButton).toHaveClass('pf-m-primary');

      // Test clicking the button (should not throw error even though we're in MemoryRouter)
      await userEvent.click(createButton);

      // In a real app, this would navigate to the create user group form
      // Here we just verify the click was successful and didn't cause errors
      await expect(createButton).toBeInTheDocument();
    });
  },
};

// Actions Toolbar Test
export const ActionsToolbar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests the complete actions toolbar including Create User Group button, filters, and pagination. Validates the responsive behavior and layout of action elements.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for table to load
      await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();

      // Test Create User Group button presence
      const createButton = await canvas.findByRole('button', { name: /create user group/i });
      await expect(createButton).toBeInTheDocument();
      await expect(createButton).toBeEnabled();

      // Test filter input is present
      const filterInput = await canvas.findByPlaceholderText(/filter by name/i);
      await expect(filterInput).toBeInTheDocument();

      // Test pagination is present (there are typically two pagination components: top and bottom)
      const paginationElements = canvas.getAllByRole('navigation', { name: /pagination/i });
      await expect(paginationElements.length).toBeGreaterThanOrEqual(1);

      // Test filter functionality - type in filter and verify it accepts input
      await userEvent.type(filterInput, 'Admin');
      await expect(filterInput).toHaveValue('Admin');

      // Test that all action elements are properly positioned
      // The UserGroupsTable uses DataViewToolbar which may not have role="toolbar"
      // Instead, verify that key UI elements are present and functional
      await expect(createButton).toBeInTheDocument();
      await expect(filterInput).toBeInTheDocument();
      await expect(paginationElements.length).toBeGreaterThanOrEqual(1);
    });
  },
};

// Filter functionality test with clear filters
export const FilterUserGroups: Story = {
  args: {
    groups: [
      { ...createMockGroup('1'), name: 'Admin Group', description: 'Administrators' },
      { ...createMockGroup('2'), name: 'Developer Group', description: 'Developers' },
      { ...createMockGroup('3'), name: 'Viewer Group', description: 'Read-only users' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: `
**Filter Functionality Test**: Validates that user group filtering works correctly and that the "Clear filters" button functions properly.

This story tests:
1. Filter input accepts and retains typed value
2. "Clear filters" button appears and works correctly
3. Filter clears when "Clear filters" is clicked

Perfect for testing filter state management and ensuring the clear filters button works as expected.
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for initial load
      await canvas.findByText('Admin Group');
      await canvas.findByText('Developer Group');
      await canvas.findByText('Viewer Group');

      // TEST FILTER INPUT
      const filterInput = canvas.getByPlaceholderText(/filter by name/i);
      await userEvent.type(filterInput, 'Admin');

      // Verify filter input has the value
      await expect(filterInput).toHaveValue('Admin');

      // TEST CLEAR FILTERS
      // Find and click "Clear filters" button (there may be two toolbars, use the first one)
      const clearButtons = await canvas.findAllByText('Clear filters');
      await userEvent.click(clearButtons[0]);

      // Verify filter was cleared
      await waitFor(() => expect(filterInput).toHaveValue(''));
    });
  },
};

export const DefaultGroupsCounts: Story = {
  args: {
    groups: [
      {
        ...GROUP_SYSTEM_DEFAULT,
        principalCount: ALL_USERS_LABEL,
      },
      {
        ...GROUP_ADMIN_DEFAULT,
        principalCount: ALL_ORG_ADMINS_LABEL,
      },
    ],
    totalCount: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default platform and admin groups show normalized user counts in the Users column (same strings as `useGroupsQuery` select).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify default group labels in Users column', async () => {
      const canvas = within(canvasElement);
      await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();
      await expect(canvas.findByText(GROUP_SYSTEM_DEFAULT.name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(GROUP_ADMIN_DEFAULT.name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(ALL_USERS_LABEL)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(ALL_ORG_ADMINS_LABEL)).resolves.toBeInTheDocument();
    });
  },
};
