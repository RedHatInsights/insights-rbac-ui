import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectLoadingVisible } from '../../../../../test-utils/interactionHelpers';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { GroupMembers } from './GroupMembers';
import { groupsHandlers } from '../../../../data/mocks/groups.handlers';
import { groupMembersHandlers, groupMembersLoadingHandlers } from '../../../../../shared/data/mocks/groupMembers.handlers';
import type { GroupOut } from '../../../../../shared/data/mocks/db';
import type { Principal } from '../../../../../shared/data/mocks/db';

// Mock data (MockUser shape for groupMembersHandlers)
const mockMembers: Principal[] = [
  {
    username: 'alice.johnson',
    email: 'alice.johnson@example.com',
    first_name: 'Alice',
    last_name: 'Johnson',
    is_active: true,
    is_org_admin: false,
    external_source_id: '101',
  },
  {
    username: 'bob.smith',
    email: 'bob.smith@example.com',
    first_name: 'Bob',
    last_name: 'Smith',
    is_active: false,
    is_org_admin: false,
    external_source_id: '102',
  },
  {
    username: 'charlie.brown',
    email: 'charlie.brown@example.com',
    first_name: 'Charlie',
    last_name: 'Brown',
    is_active: true,
    is_org_admin: false,
    external_source_id: '103',
  },
];

const mockGroup: GroupOut = {
  uuid: 'group-123',
  name: 'Test Group',
  description: 'A test group for stories',
  admin_default: false,
  platform_default: false,
  principalCount: 5,
  roleCount: 0,
  created: '2024-01-01T00:00:00Z',
  modified: '2024-01-02T00:00:00Z',
  system: false,
};

const mockDefaultAdminGroup: GroupOut = {
  ...mockGroup,
  uuid: 'admin-group-123',
  name: 'Default Admin Group',
  admin_default: true,
  system: true,
};

const mockDefaultPlatformGroup: GroupOut = {
  ...mockGroup,
  uuid: 'platform-group-123',
  name: 'Default Platform Group',
  platform_default: true,
  system: true,
};

// Track API calls for parameter verification
const getMembersSpy = fn();
const getGroupSpy = fn();

const membersByGroupId: Record<string, Principal[]> = {
  'group-123': mockMembers,
  'admin-group-123': [],
  'platform-group-123': [],
};

const createMockHandlers = () => [
  ...groupsHandlers([mockGroup, mockDefaultAdminGroup, mockDefaultPlatformGroup], {
    onList: () => {},
  }),
  ...groupMembersHandlers(
    membersByGroupId,
    {},
    {
      onListMembers: (groupId, params) => {
        getGroupSpy({ groupId });
        getMembersSpy({
          groupId,
          username: (params as URLSearchParams).get('principal_username') || '',
          limit: parseInt((params as URLSearchParams).get('limit') || '20', 10),
          offset: parseInt((params as URLSearchParams).get('offset') || '0', 10),
        });
      },
    },
  ),
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify read-only member list without permissions', async () => {
      expect(await canvas.findByRole('grid')).toBeInTheDocument();

      expect(await canvas.findByText(mockMembers[0].username)).toBeInTheDocument();
      expect(await canvas.findByText(mockMembers[1].username)).toBeInTheDocument();

      expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
      expect(canvas.queryByLabelText(/actions/i)).not.toBeInTheDocument();
      expect(canvas.queryByRole('button', { name: /add member/i })).not.toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify interactive member list with permissions', async () => {
      expect(await canvas.findByRole('grid')).toBeInTheDocument();

      expect(await canvas.findByText(mockMembers[0].username)).toBeInTheDocument();

      expect(await canvas.findByRole('button', { name: 'Add member' })).toBeInTheDocument();

      const table = await canvas.findByRole('grid');
      const dropdownButtons = within(table).queryAllByRole('button');

      expect(dropdownButtons.length).toBeGreaterThan(0);
    });
  },
};

// Loading state
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [...groupsHandlers([mockGroup]), ...groupMembersLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify loading state with skeleton', async () => {
      expect(await canvas.findByRole('grid')).toBeInTheDocument();

      await waitFor(
        () => {
          expectLoadingVisible(canvasElement);
        },
        { timeout: 10000 },
      );

      expect(canvas.queryByText('alice.johnson')).not.toBeInTheDocument();
      expect(canvas.queryByText('bob.smith')).not.toBeInTheDocument();
    });
  },
};

// Empty state
export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [
        ...groupsHandlers([mockGroup]),
        ...groupMembersHandlers({ 'group-123': [] }, {}, { onListMembers: (groupId) => getMembersSpy({ groupId }) }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty state message', async () => {
      expect(await canvas.findByText(/no.*members/i)).toBeInTheDocument();
    });
  },
};

// Default admin group - check what actually renders
export const DefaultAdminGroup: Story = {
  parameters: {
    groupId: 'admin-group-123',
    msw: {
      handlers: [
        ...groupsHandlers([mockDefaultAdminGroup]),
        ...groupMembersHandlers({ 'admin-group-123': [] }, {}, { onListMembers: (groupId) => getMembersSpy({ groupId }) }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify DefaultMembersCard for admin groups', async () => {
      expect(await canvas.findByText('All organization administrators in this organization are members of this group.')).toBeInTheDocument();
    });
  },
};

// Default platform group - check what actually renders
export const DefaultPlatformGroup: Story = {
  parameters: {
    groupId: 'platform-group-123',
    msw: {
      handlers: [
        ...groupsHandlers([mockDefaultPlatformGroup]),
        ...groupMembersHandlers({ 'platform-group-123': [] }, {}, { onListMembers: (groupId) => getMembersSpy({ groupId }) }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify platform default group card', async () => {
      expect(await canvas.findByText('All users in this organization are members of this group.')).toBeInTheDocument();

      const table = canvas.queryByRole('table');
      expect(table).not.toBeInTheDocument();
      const addButton = canvas.queryByRole('button', { name: /add member/i });
      expect(addButton).not.toBeInTheDocument();
    });
  },
};

// Test filtering functionality (requires permissions)
export const FilterMembers: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    msw: {
      handlers: [
        ...groupsHandlers([mockGroup]),
        ...groupMembersHandlers(
          membersByGroupId,
          {},
          {
            onListMembers: (groupId, params) => {
              getGroupSpy({ groupId });
              getMembersSpy({
                groupId,
                username: (params as URLSearchParams).get('principal_username') || '',
                limit: parseInt((params as URLSearchParams).get('limit') || '20', 10),
                offset: parseInt((params as URLSearchParams).get('offset') || '0', 10),
              });
            },
          },
        ),
      ],
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Apply filter and verify filtered results', async () => {
      expect(await canvas.findByRole('grid')).toBeInTheDocument();

      expect(await canvas.findByText(mockMembers[0].username)).toBeInTheDocument();
      expect(await canvas.findByText(mockMembers[1].username)).toBeInTheDocument();
      expect(await canvas.findByText(mockMembers[2].username)).toBeInTheDocument();

      const initialCallCount = getMembersSpy.mock.calls.length;

      const filterInput = await canvas.findByRole('textbox');

      await userEvent.type(filterInput, 'alice');

      await waitFor(
        () => {
          expect(getMembersSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
          const latestCall = getMembersSpy.mock.calls[getMembersSpy.mock.calls.length - 1][0];
          expect(latestCall.username).toBe('alice');
        },
        { timeout: 3000 },
      );

      expect(await canvas.findByText(mockMembers[0].username)).toBeInTheDocument();
      expect(canvas.queryByText(mockMembers[1].username)).not.toBeInTheDocument();
      expect(canvas.queryByText(mockMembers[2].username)).not.toBeInTheDocument();
    });

    await step('Clear filters and verify all members displayed', async () => {
      const filterInput = await canvas.findByRole('textbox');
      const clearAllFiltersButtons = await canvas.findAllByText('Clear filters');
      const clearAllFilters = clearAllFiltersButtons[0];

      getMembersSpy.mockClear();

      await userEvent.click(clearAllFilters);

      await waitFor(
        () => {
          expect(getMembersSpy).toHaveBeenCalled();
          const lastCall = getMembersSpy.mock.calls[getMembersSpy.mock.calls.length - 1][0];
          expect(lastCall.username).toBe('');
          expect(lastCall.offset).toBe(0);
        },
        { timeout: 1000 },
      );

      expect(await canvas.findByText(mockMembers[0].username)).toBeInTheDocument();
      expect(await canvas.findByText(mockMembers[1].username)).toBeInTheDocument();
      expect(await canvas.findByText(mockMembers[2].username)).toBeInTheDocument();

      expect(filterInput).toHaveValue('');
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Add member button and toolbar actions', async () => {
      expect(await canvas.findByRole('grid')).toBeInTheDocument();

      const addMemberButton = await canvas.findByRole('button', { name: 'Add member' });
      expect(addMemberButton).toBeInTheDocument();
      expect(addMemberButton).not.toHaveAttribute('disabled');

      const toolbarKebab = await canvas.findByRole('button', { name: 'Member bulk actions' });
      expect(toolbarKebab).toBeInTheDocument();

      await userEvent.click(toolbarKebab);

      const removeOption = await within(document.body).findByRole('menuitem', { name: 'Remove' });
      expect(removeOption).toBeInTheDocument();
      expect(removeOption).toBeDisabled();

      expect(canvas.queryByRole('menuitem', { name: 'Add member' })).not.toBeInTheDocument();
    });
  },
};

// Test bulk selection functionality
export const BulkSelection: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    msw: { handlers: createMockHandlers() },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select all via bulk checkbox', async () => {
      await canvas.findByRole('grid');
      expect(await canvas.findByText(mockMembers[0].username)).toBeInTheDocument();

      const checkboxes = await canvas.findAllByRole('checkbox');
      const bulkSelectCheckbox = checkboxes[0];
      expect(bulkSelectCheckbox).toBeInTheDocument();
      expect(bulkSelectCheckbox).toHaveAttribute('type', 'checkbox');
      expect(bulkSelectCheckbox).not.toBeChecked();

      const rowCheckboxes = await canvas.findAllByRole('checkbox');
      expect(rowCheckboxes.length).toBeGreaterThan(1);

      await userEvent.click(bulkSelectCheckbox);

      expect(bulkSelectCheckbox).toBeChecked();

      const individualCheckboxes = rowCheckboxes.filter((cb) => cb !== bulkSelectCheckbox);
      individualCheckboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    await step('Deselect all via bulk checkbox', async () => {
      const checkboxes = await canvas.findAllByRole('checkbox');
      const bulkSelectCheckbox = checkboxes[0];
      const individualCheckboxes = checkboxes.filter((cb) => cb !== bulkSelectCheckbox);

      await userEvent.click(bulkSelectCheckbox);

      expect(bulkSelectCheckbox).not.toBeChecked();

      individualCheckboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial toolbar state with no selection', async () => {
      expect(await canvas.findByRole('grid')).toBeInTheDocument();
      expect(await canvas.findByText(mockMembers[0].username)).toBeInTheDocument();

      const addMemberButton = await canvas.findByRole('button', { name: 'Add member' });
      expect(addMemberButton).toBeInTheDocument();
      expect(addMemberButton).not.toHaveAttribute('disabled');

      const toolbarKebab = await canvas.findByRole('button', { name: 'Member bulk actions' });
      await userEvent.click(toolbarKebab);

      const removeOption = await within(document.body).findByRole('menuitem', { name: 'Remove' });
      expect(removeOption).toBeDisabled();

      expect(canvas.queryByRole('menuitem', { name: 'Add member' })).not.toBeInTheDocument();

      await userEvent.click(canvasElement);
    });

    await step('Select member and verify Remove enabled', async () => {
      const canvas = within(canvasElement);
      const addMemberButton = await canvas.findByRole('button', { name: 'Add member' });
      const aliceRow = (await canvas.findByText(mockMembers[0].username)).closest('tr');
      if (!aliceRow) throw new Error(`Could not find ${mockMembers[0].username} row`);
      const rowCheckbox = within(aliceRow).getByRole('checkbox');
      await userEvent.click(rowCheckbox);

      expect(addMemberButton).not.toHaveAttribute('disabled');

      const toolbarKebab = await canvas.findByRole('button', { name: 'Member bulk actions' });
      await userEvent.click(toolbarKebab);

      const removeAfter = await within(document.body).findByRole('menuitem', { name: 'Remove' });
      expect(removeAfter).not.toBeDisabled();

      expect(canvas.queryByRole('menuitem', { name: 'Add member' })).not.toBeInTheDocument();

      expect(rowCheckbox).toBeChecked();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open row actions and verify Remove option', async () => {
      expect(await canvas.findByRole('grid')).toBeInTheDocument();
      expect(await canvas.findByText(mockMembers[0].username)).toBeInTheDocument();

      const aliceRow = (await canvas.findByText(mockMembers[0].username)).closest('tr');
      if (!aliceRow) throw new Error(`Could not find ${mockMembers[0].username} row`);

      const rowKebab = await within(aliceRow).findByRole('button', { name: new RegExp(`Actions for ${mockMembers[0].username}`, 'i') });
      expect(rowKebab).toBeInTheDocument();

      await userEvent.click(rowKebab);

      const removeAction = await within(document.body).findByRole('menuitem', { name: 'Remove' });
      expect(removeAction).toBeInTheDocument();
      expect(removeAction).not.toBeDisabled();

      const menu = removeAction.closest('[role="menu"]');
      expect(menu).toBeInTheDocument();
    });
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
      handlers: createMockHandlers(),
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open kebab and select Remove', async () => {
      expect(await canvas.findByRole('grid')).toBeInTheDocument();
      const aliceText = await canvas.findByText(mockMembers[0].username);
      expect(aliceText).toBeInTheDocument();

      const aliceRow = aliceText.closest('tr');
      if (!aliceRow) throw new Error(`Could not find ${mockMembers[0].username} row`);

      const kebabButton = await within(aliceRow).findByRole('button', { name: new RegExp(`Actions for ${mockMembers[0].username}`, 'i') });
      await userEvent.click(kebabButton);

      const removeMenuItem = await within(document.body).findByRole('menuitem', { name: /Remove/i });
      expect(removeMenuItem).toBeInTheDocument();

      await userEvent.click(removeMenuItem);
    });

    await step('Verify removal confirmation modal', async () => {
      const body = within(document.body);
      const modal = await body.findByRole('dialog', {}, { timeout: 5000 });
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText(/Remove member\?/i)).toBeInTheDocument();
      expect(within(modal).getByText(new RegExp(mockMembers[0].username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))).toBeInTheDocument();
    });
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
      handlers: createMockHandlers(),
    },
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select all and open bulk Remove', async () => {
      const table = await canvas.findByRole('grid');
      expect(table).toBeInTheDocument();

      await canvas.findByText(mockMembers[0].username);

      const checkboxes = await canvas.findAllByRole('checkbox');
      const bulkSelectCheckbox = checkboxes[0];

      await userEvent.click(bulkSelectCheckbox);

      const bulkActionsButton = await canvas.findByRole('button', { name: 'Member bulk actions' });
      expect(bulkActionsButton).toBeInTheDocument();
      await userEvent.click(bulkActionsButton);

      const removeMenuItem = await within(document.body).findByRole('menuitem', { name: 'Remove' });
      expect(removeMenuItem).toBeInTheDocument();
      expect(removeMenuItem).toBeEnabled();

      await userEvent.click(removeMenuItem);
    });

    await step('Verify bulk removal confirmation modal', async () => {
      const body = within(document.body);
      const modal = await body.findByRole('dialog', {}, { timeout: 5000 });
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText(/Remove members\?/i)).toBeInTheDocument();
    });
  },
};
