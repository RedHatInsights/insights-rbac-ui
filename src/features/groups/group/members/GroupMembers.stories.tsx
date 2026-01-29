import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { GroupMembers } from './GroupMembers';
// Mock data
const mockMembers = [
  {
    username: 'alice.johnson',
    email: 'alice.johnson@example.com',
    first_name: 'Alice',
    last_name: 'Johnson',
    is_active: true,
  },
  {
    username: 'bob.smith',
    email: 'bob.smith@example.com',
    first_name: 'Bob',
    last_name: 'Smith',
    is_active: false,
  },
  {
    username: 'charlie.brown',
    email: 'charlie.brown@example.com',
    first_name: 'Charlie',
    last_name: 'Brown',
    is_active: true,
  },
];

const mockGroup = {
  uuid: 'group-123',
  name: 'Test Group',
  description: 'A test group for stories',
  admin_default: false,
  platform_default: false,
};

const mockDefaultAdminGroup = {
  ...mockGroup,
  uuid: 'admin-group-123',
  name: 'Default Admin Group',
  admin_default: true,
  system: true, // Unmodified default group
};

const mockDefaultPlatformGroup = {
  ...mockGroup,
  uuid: 'platform-group-123',
  name: 'Default Platform Group',
  platform_default: true,
  system: true, // Unmodified default group
};

// Track API calls for parameter verification
const getMembersSpy = fn();
const getGroupSpy = fn();

// Basic mock handlers with spy integration
const createMockHandlers = () => [
  // Fetch group details - REQUIRED for component to work
  http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
    getGroupSpy({ groupId: params.groupId });

    // Return the appropriate group based on groupId to fix admin/platform rendering
    if (params.groupId === 'admin-group-123') {
      return HttpResponse.json(mockDefaultAdminGroup);
    } else if (params.groupId === 'platform-group-123') {
      return HttpResponse.json(mockDefaultPlatformGroup);
    } else {
      return HttpResponse.json(mockGroup);
    }
  }),
  // Fetch group members - REQUIRED for table data
  http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request, params }) => {
    const url = new URL(request.url);
    const username = url.searchParams.get('principal_username') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    getMembersSpy({
      groupId: params.groupId,
      username,
      limit,
      offset,
    });

    const filteredMembers = username ? mockMembers.filter((member) => member.username.toLowerCase().includes(username.toLowerCase())) : mockMembers;

    return HttpResponse.json({
      data: filteredMembers,
      meta: { count: filteredMembers.length, limit, offset },
    });
  }),
];

const meta: Meta<typeof GroupMembers> = {
  component: GroupMembers,
  decorators: [
    (Story, { parameters }) => {
      // Use story-specific groupId if provided, otherwise default
      const groupId = parameters?.groupId || 'group-123';
      const initialEntries = parameters.routerInitialEntries || [`/user-access/groups/${groupId}/members`];
      return (
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route
              path="/user-access/groups/:groupId/members"
              element={
                <div style={{ height: '100vh', padding: '1rem' }}>
                  <Story />
                </div>
              }
            />
          </Routes>
        </MemoryRouter>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        component: `
**Group Members Container**: Manages members within a group including viewing, adding, and removing members.

This modern container uses react-data-view and provides:
- Member listing with status, username, email, name
- Bulk selection and actions (remove members)
- Individual member actions
- Filtering by username/email
- Pagination controls
- Add member functionality

## Stories Directory:
- **Default**: Basic member list with realistic data
- **Loading**: Shows loading state while fetching data
- **EmptyState**: No members in group scenario
- **DefaultAdminGroup**: Special admin default group with restricted actions
- **DefaultPlatformGroup**: Special platform default group with restricted actions
- **BulkSelection**: Test bulk member selection and actions
- **FilterMembers**: Test filter functionality
- **AddMemberButton**: Test toolbar actions menu
- **ToolbarActionsState**: Test selection-based state management
- **RowActions**: Test individual member action menus
`,
      },
    },
    msw: {
      handlers: createMockHandlers(),
    },
  },
};

export default meta;
type Story = StoryObj<typeof GroupMembers>;

// Basic member list with NO permissions (default)
export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Regular group member list with no user permissions.

Shows read-only table with member data but no interactive elements:
- Table is NOT selectable (no checkboxes)
- No row action menus (no kebab buttons)
- No "Add member" button in toolbar
- User can only view member list

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[WithPermissions](?path=/story/features-groups-member-groupmembers--with-permissions)**: Full interactive table with admin permissions
- **[LoadingState](?path=/story/features-groups-member-groupmembers--loading)**: Loading state while fetching data
- **[EmptyState](?path=/story/features-groups-member-groupmembers--empty-state)**: No members in group
- **[DefaultAdminGroup](?path=/story/features-groups-member-groupmembers--default-admin-group)**: Shows admin default group card
- **[DefaultPlatformGroup](?path=/story/features-groups-member-groupmembers--default-platform-group)**: Shows platform default group card
        `,
      },
    },
    msw: {
      handlers: createMockHandlers(),
    },
    permissions: {
      orgAdmin: false,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for table to load (simplified table placeholder)
    expect(await canvas.findByRole('grid')).toBeInTheDocument();

    // Verify members are displayed
    expect(await canvas.findByText('alice.johnson')).toBeInTheDocument();
    expect(await canvas.findByText('bob.smith')).toBeInTheDocument();

    // Verify NO interactive elements (no permissions)
    expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(canvas.queryByLabelText(/actions/i)).not.toBeInTheDocument();
    expect(canvas.queryByRole('button', { name: /add member/i })).not.toBeInTheDocument();
  },
};

// Member list WITH permissions (interactive)
export const WithPermissions: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    msw: {
      handlers: createMockHandlers(),
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for table to load
    expect(await canvas.findByRole('grid')).toBeInTheDocument();

    // Verify members are displayed
    expect(await canvas.findByText('alice.johnson')).toBeInTheDocument();

    // Verify interactive elements (with permissions) - look for button by text content
    expect(await canvas.findByRole('button', { name: 'Add member' })).toBeInTheDocument();

    // Look for any dropdown toggle buttons in the table (row actions)
    const table = await canvas.findByRole('grid');
    const dropdownButtons = within(table).queryAllByRole('button');

    // Should have row action buttons when permissions exist
    expect(dropdownButtons.length).toBeGreaterThan(0);
  },
};

// Loading state
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', async () => {
          await delay(100); // Short delay instead of infinite
          return HttpResponse.json(mockGroup);
        }),
        http.get('/api/rbac/v1/groups/:groupId/principals/', async () => {
          await delay('infinite'); // Keep infinite delay for members to show loading
          return HttpResponse.json({ data: [], meta: { count: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Wait for group data to load

    // Should show table structure while members API call is pending
    const canvas = within(canvasElement);
    expect(await canvas.findByRole('grid')).toBeInTheDocument();

    // Should show skeleton loading elements, not empty data
    await waitFor(async () => {
      const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"]');
      await expect(skeletonElements.length).toBeGreaterThan(0);
    });

    // Should NOT show actual member data since API never resolves
    expect(canvas.queryByText('alice.johnson')).not.toBeInTheDocument();
    expect(canvas.queryByText('bob.smith')).not.toBeInTheDocument();
  },
};

// Empty state
export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          getGroupSpy({ groupId: params.groupId });
          return HttpResponse.json(mockGroup);
        }),
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ params }) => {
          getMembersSpy({ groupId: params.groupId });
          return HttpResponse.json({ data: [], meta: { count: 0, limit: 20, offset: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show empty state message
    expect(await canvas.findByText(/no.*members/i)).toBeInTheDocument();
  },
};

// Default admin group - check what actually renders
export const DefaultAdminGroup: Story = {
  parameters: {
    groupId: 'admin-group-123',
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          getGroupSpy({ groupId: params.groupId });
          return HttpResponse.json(mockDefaultAdminGroup);
        }),
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ params }) => {
          getMembersSpy({ groupId: params.groupId });
          return HttpResponse.json({ data: [], meta: { count: 0, limit: 20, offset: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show DefaultMembersCard for admin groups
    expect(await canvas.findByText('All organization administrators in this organization are members of this group.')).toBeInTheDocument();
  },
};

// Default platform group - check what actually renders
export const DefaultPlatformGroup: Story = {
  parameters: {
    groupId: 'platform-group-123',
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          getGroupSpy({ groupId: params.groupId });
          return HttpResponse.json(mockDefaultPlatformGroup);
        }),
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ params }) => {
          getMembersSpy({ groupId: params.groupId });
          return HttpResponse.json({ data: [], meta: { count: 0, limit: 20, offset: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Platform default groups show the special card message (not the table)
    // These are read-only - users cannot add/remove members from unmodified default groups
    expect(await canvas.findByText('All users in this organization are members of this group.')).toBeInTheDocument();

    // Should NOT show a data table or any action buttons
    const table = canvas.queryByRole('table');
    expect(table).not.toBeInTheDocument();
    const addButton = canvas.queryByRole('button', { name: /add member/i });
    expect(addButton).not.toBeInTheDocument();
  },
};

// Test filtering functionality (requires permissions)
export const FilterMembers: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          getGroupSpy({ groupId: params.groupId });
          return HttpResponse.json(mockGroup);
        }),
        http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request, params }) => {
          const url = new URL(request.url);
          // The actual API uses 'principal_username' parameter as shown in logs
          const username = url.searchParams.get('principal_username') || '';
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          getMembersSpy({
            groupId: params.groupId,
            username,
            limit,
            offset,
          });

          // Filter members based on username search
          const filteredMembers = username
            ? mockMembers.filter((member) => member.username.toLowerCase().includes(username.toLowerCase()))
            : mockMembers;

          return HttpResponse.json({
            data: filteredMembers,
            meta: { count: filteredMembers.length, limit, offset },
          });
        }),
      ],
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for table to load
    expect(await canvas.findByRole('grid')).toBeInTheDocument();

    // Verify all members are initially displayed
    expect(await canvas.findByText('alice.johnson')).toBeInTheDocument();
    expect(await canvas.findByText('bob.smith')).toBeInTheDocument();
    expect(await canvas.findByText('charlie.brown')).toBeInTheDocument();

    // Check initial API call count
    const initialCallCount = getMembersSpy.mock.calls.length;

    // Find filter input using a more generic approach for DataViewTextFilter
    const filterInput = await canvas.findByRole('textbox');

    // Type to trigger filtering
    await userEvent.type(filterInput, 'alice');

    // Wait for debouncing and API call
    await delay(1000);

    // Verify API was called again with filter
    expect(getMembersSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
    const latestCall = getMembersSpy.mock.calls[getMembersSpy.mock.calls.length - 1][0];
    expect(latestCall.username).toBe('alice');

    // Verify filtered results
    expect(await canvas.findByText('alice.johnson')).toBeInTheDocument();
    expect(canvas.queryByText('bob.smith')).not.toBeInTheDocument();
    expect(canvas.queryByText('charlie.brown')).not.toBeInTheDocument();

    // Test clear all filters functionality
    // Note: There are TWO "Clear filters" buttons (top and bottom toolbar), so use findAllByText
    const clearAllFiltersButtons = await canvas.findAllByText('Clear filters');
    const clearAllFilters = clearAllFiltersButtons[0]; // Use the first one (top toolbar)

    // Reset spy to track the clear filters API call
    getMembersSpy.mockClear();

    await userEvent.click(clearAllFilters);

    // Wait for filter state to update and API call to be triggered
    // Need longer delay because filters.onSetFilters might be async
    await delay(1500);

    // Verify API was called with no filters (username should be empty)
    await waitFor(
      () => {
        expect(getMembersSpy).toHaveBeenCalled();
        const lastCall = getMembersSpy.mock.calls[getMembersSpy.mock.calls.length - 1][0];
        expect(lastCall.username).toBe('');
        expect(lastCall.offset).toBe(0);
      },
      { timeout: 1000 },
    );

    // Verify all members are displayed again after clearing filters
    expect(await canvas.findByText('alice.johnson')).toBeInTheDocument();
    expect(await canvas.findByText('bob.smith')).toBeInTheDocument();
    expect(await canvas.findByText('charlie.brown')).toBeInTheDocument();

    // Verify the filter input is cleared
    expect(filterInput).toHaveValue('');
  },
};

// Test Add member button and toolbar functionality
export const AddMemberButton: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    msw: {
      handlers: createMockHandlers(),
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for table to load
    expect(await canvas.findByRole('grid')).toBeInTheDocument();

    // Verify "Add member" button is present as a primary toolbar button
    const addMemberButton = await canvas.findByRole('button', { name: 'Add member' });
    expect(addMemberButton).toBeInTheDocument();
    expect(addMemberButton).not.toHaveAttribute('disabled');

    // Find toolbar actions kebab menu (should be present with permissions)
    const toolbarKebab = await canvas.findByRole('button', { name: 'Member bulk actions' });
    expect(toolbarKebab).toBeInTheDocument();

    // Click to open toolbar actions
    await userEvent.click(toolbarKebab);

    // Verify "Remove" option is present but disabled (no members selected)
    const removeOption = await within(document.body).findByRole('menuitem', { name: 'Remove' });
    expect(removeOption).toBeInTheDocument();
    expect(removeOption).toBeDisabled();

    // Verify "Add member" is NOT in the kebab menu (it's a primary button)
    expect(canvas.queryByRole('menuitem', { name: 'Add member' })).not.toBeInTheDocument();
  },
};

// Test bulk selection functionality
export const BulkSelection: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    msw: createMockHandlers(),
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for table to load with data
    await canvas.findByRole('grid');
    expect(await canvas.findByText('alice.johnson')).toBeInTheDocument();

    // Check bulk select checkbox is present (only visible with permissions)
    // BulkSelect component uses a different label - let's find it by role first
    const checkboxes = await canvas.findAllByRole('checkbox');
    const bulkSelectCheckbox = checkboxes[0]; // First checkbox should be bulk select
    expect(bulkSelectCheckbox).toBeInTheDocument();
    expect(bulkSelectCheckbox).toHaveAttribute('type', 'checkbox');
    expect(bulkSelectCheckbox).not.toBeChecked();

    // Check individual row checkboxes are present
    const rowCheckboxes = await canvas.findAllByRole('checkbox');
    expect(rowCheckboxes.length).toBeGreaterThan(1); // Bulk + individual checkboxes

    // Click bulk select to select all
    await userEvent.click(bulkSelectCheckbox);

    // Verify bulk select is now checked
    expect(bulkSelectCheckbox).toBeChecked();

    // Verify individual row checkboxes are also checked
    const individualCheckboxes = rowCheckboxes.filter((cb) => cb !== bulkSelectCheckbox);
    individualCheckboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });

    // TEST DESELECT: Click bulk select again to deselect all
    await userEvent.click(bulkSelectCheckbox);

    // Verify bulk select is now unchecked
    expect(bulkSelectCheckbox).not.toBeChecked();

    // Verify individual row checkboxes are also unchecked
    individualCheckboxes.forEach((checkbox) => {
      expect(checkbox).not.toBeChecked();
    });
  },
};

// Test toolbar actions state based on selection
export const ToolbarActionsState: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    msw: {
      handlers: createMockHandlers(),
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for table to load
    expect(await canvas.findByRole('grid')).toBeInTheDocument();
    expect(await canvas.findByText('alice.johnson')).toBeInTheDocument();

    // Verify "Add member" button is always enabled as a primary button
    const addMemberButton = await canvas.findByRole('button', { name: 'Add member' });
    expect(addMemberButton).toBeInTheDocument();
    expect(addMemberButton).not.toHaveAttribute('disabled');

    // Open toolbar actions initially (no selection)
    const toolbarKebab = await canvas.findByRole('button', { name: 'Member bulk actions' });
    await userEvent.click(toolbarKebab);

    // Verify initial state: Remove disabled when no selection
    const removeOption = await within(document.body).findByRole('menuitem', { name: 'Remove' });
    expect(removeOption).toBeDisabled(); // Disabled when no selection

    // Verify "Add member" is NOT in the kebab menu
    expect(canvas.queryByRole('menuitem', { name: 'Add member' })).not.toBeInTheDocument();

    // Close menu
    await userEvent.click(canvasElement);

    // Select a member row
    const aliceRow = (await canvas.findByText('alice.johnson')).closest('tr');
    if (!aliceRow) throw new Error('Could not find alice.johnson row');
    const rowCheckbox = within(aliceRow).getByRole('checkbox');
    await userEvent.click(rowCheckbox);

    // Verify "Add member" button is still enabled after selection
    expect(addMemberButton).not.toHaveAttribute('disabled');

    // Open toolbar actions with selection
    await userEvent.click(toolbarKebab);

    // Verify state with selection: Remove should now be enabled
    const removeAfter = await within(document.body).findByRole('menuitem', { name: 'Remove' });
    expect(removeAfter).not.toBeDisabled(); // Now enabled with selection

    // Verify "Add member" is still NOT in the kebab menu
    expect(canvas.queryByRole('menuitem', { name: 'Add member' })).not.toBeInTheDocument();

    // Verify checkbox state is maintained
    expect(rowCheckbox).toBeChecked();
  },
};

// Test individual row actions
export const RowActions: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    msw: {
      handlers: createMockHandlers(),
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for table to load
    expect(await canvas.findByRole('grid')).toBeInTheDocument();
    expect(await canvas.findByText('alice.johnson')).toBeInTheDocument();

    // Find a member row and its action button
    const aliceRow = (await canvas.findByText('alice.johnson')).closest('tr');
    if (!aliceRow) throw new Error('Could not find alice.johnson row');

    // Find the kebab action button in the row (last cell)
    const rowKebab = await within(aliceRow).findByRole('button', { name: 'Actions for alice.johnson' });
    expect(rowKebab).toBeInTheDocument();

    // Click to open row actions menu
    await userEvent.click(rowKebab);

    // Verify "Remove" action is available
    const removeAction = await within(document.body).findByRole('menuitem', { name: 'Remove' });
    expect(removeAction).toBeInTheDocument();
    expect(removeAction).not.toBeDisabled();

    // Verify the menu is properly positioned (should be visible)
    const menu = removeAction.closest('[role="menu"]');
    expect(menu).toBeInTheDocument();
  },
};

export const RemoveSingleMemberFlow: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Flow**: Complete user journey from table to member removal confirmation modal.

This story demonstrates:
1. User clicks kebab menu on a member row
2. Selects "Remove" action
3. Confirmation modal appears with proper messaging (singular)
4. User can confirm or cancel the removal

Perfect for code review and UX validation.
        `,
      },
    },
    msw: {
      handlers: [
        ...createMockHandlers(),
        http.delete('/api/rbac/v1/groups/:groupId/principals/', async () => {
          return HttpResponse.json({ message: 'Members removed successfully' });
        }),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [mockGroup],
            meta: { count: 1, limit: 50, offset: 0 },
          });
        }),
      ],
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    expect(await canvas.findByRole('grid')).toBeInTheDocument();
    const aliceText = await canvas.findByText('alice.johnson');
    expect(aliceText).toBeInTheDocument();

    const aliceRow = aliceText.closest('tr');
    if (!aliceRow) throw new Error('Could not find alice.johnson row');

    const kebabButton = await within(aliceRow).findByRole('button', { name: 'Actions for alice.johnson' });
    await userEvent.click(kebabButton);

    await delay(200);

    const removeMenuItem = await within(document.body).findByRole('menuitem', { name: /Remove/i });
    expect(removeMenuItem).toBeInTheDocument();

    await userEvent.click(removeMenuItem);

    const body = within(document.body);
    const modal = await body.findByRole('dialog', {}, { timeout: 5000 });
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText(/Remove member\?/i)).toBeInTheDocument();
    expect(within(modal).getByText(/alice\.johnson/i)).toBeInTheDocument();
  },
};

export const BulkRemoveMembersFlow: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Bulk Removal Flow**: Complete user journey for removing multiple members at once.

This story demonstrates:
1. User selects multiple members using checkboxes
2. Clicks bulk "Remove" button in toolbar
3. Confirmation modal appears showing plural messaging ("Remove members?")
4. Modal shows count of members to be removed

Perfect for testing bulk operations and proper pluralization.
        `,
      },
    },
    msw: {
      handlers: [
        ...createMockHandlers(),
        http.delete('/api/rbac/v1/groups/:groupId/principals/', async () => {
          return HttpResponse.json({ message: 'Members removed successfully' });
        }),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [mockGroup],
            meta: { count: 1, limit: 50, offset: 0 },
          });
        }),
      ],
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement }) => {
    await delay(500);
    const canvas = within(canvasElement);

    const table = await canvas.findByRole('grid');
    expect(table).toBeInTheDocument();

    await canvas.findByText('alice.johnson');

    const checkboxes = await canvas.findAllByRole('checkbox');
    const bulkSelectCheckbox = checkboxes[0];

    await userEvent.click(bulkSelectCheckbox);

    await delay(300);

    // Click the bulk actions kebab menu
    const bulkActionsButton = await canvas.findByRole('button', { name: 'Member bulk actions' });
    expect(bulkActionsButton).toBeInTheDocument();
    await userEvent.click(bulkActionsButton);

    // Find and click the "Remove" menuitem
    const removeMenuItem = await within(document.body).findByRole('menuitem', { name: 'Remove' });
    expect(removeMenuItem).toBeInTheDocument();
    expect(removeMenuItem).toBeEnabled(); // Should be enabled now that rows are selected

    await userEvent.click(removeMenuItem);

    const body = within(document.body);
    const modal = await body.findByRole('dialog', {}, { timeout: 5000 });
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText(/Remove members\?/i)).toBeInTheDocument();
  },
};
