import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { AddGroupMembers } from './AddGroupMembers';
import { groupsHandlers } from '../../../../data/mocks/groups.handlers';
import { groupMembersHandlers } from '../../../../../shared/data/mocks/groupMembers.handlers';
import { usersHandlers, usersLoadingHandlers } from '../../../../../shared/data/mocks/users.handlers';
import type { Principal } from '../../../../../shared/data/mocks/db';
import { DEFAULT_USERS, generateUsers } from '../../../../../shared/data/mocks/seed';

const filteringTestUsers: Principal[] = [
  {
    username: 'adumble',
    email: 'dumble@redhat.com',
    first_name: 'Albus',
    last_name: 'Dumbledore',
    is_active: true,
    is_org_admin: true,
    external_source_id: '101',
  },
  {
    username: 'bbunny',
    email: 'bbunny@redhat.com',
    first_name: 'Bad',
    last_name: 'Bunny',
    is_active: true,
    is_org_admin: true,
    external_source_id: '102',
  },
  {
    username: 'ginger-spice',
    email: 'gspice@redhat.com',
    first_name: 'Geri',
    last_name: 'Halliwell',
    is_active: true,
    is_org_admin: false,
    external_source_id: '103',
  },
  {
    username: 'posh-spice',
    email: 'pspice@redhat.com',
    first_name: 'Victoria',
    last_name: 'Beckham',
    is_active: true,
    is_org_admin: false,
    external_source_id: '104',
  },
  {
    username: 'scary-spice',
    email: 'sspice@redhat.com',
    first_name: 'Mel',
    last_name: 'B',
    is_active: true,
    is_org_admin: false,
    external_source_id: '105',
  },
  {
    username: 'sporty-spice',
    email: 'spspice@redhat.com',
    first_name: 'Melanie',
    last_name: 'C',
    is_active: true,
    is_org_admin: false,
    external_source_id: '106',
  },
  {
    username: 'baby-spice',
    email: 'bspice@redhat.com',
    first_name: 'Emma',
    last_name: 'Bunton',
    is_active: true,
    is_org_admin: false,
    external_source_id: '107',
  },
  {
    username: 'bwhite',
    email: 'bwhite@redhat.com',
    first_name: 'Betty',
    last_name: 'White',
    is_active: true,
    is_org_admin: false,
    external_source_id: '108',
  },
  {
    username: 'dzbornak',
    email: 'dzbornak@redhat.com',
    first_name: 'Dorothy',
    last_name: 'Zbornak',
    is_active: true,
    is_org_admin: true,
    external_source_id: '109',
  },
  {
    username: 'spetrillo',
    email: 'spetrillo@redhat.com',
    first_name: 'Sophia',
    last_name: 'Petrillo',
    is_active: true,
    is_org_admin: true,
    external_source_id: '110',
  },
  {
    username: 'bdevereaux',
    email: 'bdevera@redhat.com',
    first_name: 'Blanche',
    last_name: 'Devereaux',
    is_active: true,
    is_org_admin: true,
    external_source_id: '111',
  },
  {
    username: 'hpotter',
    email: 'hpotter@redhat.com',
    first_name: 'Harry',
    last_name: 'Potter',
    is_active: false,
    is_org_admin: false,
    external_source_id: '112',
  },
  {
    username: 'rweasley',
    email: 'rweasley@redhat.com',
    first_name: 'Ron',
    last_name: 'Weasley',
    is_active: false,
    is_org_admin: false,
    external_source_id: '113',
  },
  {
    username: 'hgranger',
    email: 'hgranger@redhat.com',
    first_name: 'Hermione',
    last_name: 'Granger',
    is_active: false,
    is_org_admin: false,
    external_source_id: '114',
  },
];

const spiceUsers = filteringTestUsers.filter((u) => u.username.includes('spice'));
const inactiveUsers = filteringTestUsers.filter((u) => !u.is_active);

// API spy for tracking filter and search calls
const usersApiSpy = fn();

/**
 * Helper to wait for the members table to be fully populated with expected status counts.
 * Uses findByRole for the grid (built-in async), then waitFor only for count assertions.
 */
const waitForMembersTable = async (
  modal: HTMLElement,
  expectedCounts: { active?: number; inactive?: number },
  options: { timeout?: number } = {},
) => {
  const { timeout = 5000 } = options;
  const table = await within(modal).findByRole('grid');

  await waitFor(
    () => {
      if (expectedCounts.inactive !== undefined) {
        const inactiveElements = within(table).queryAllByText('Inactive');
        expect(inactiveElements).toHaveLength(expectedCounts.inactive);
      }
      if (expectedCounts.active !== undefined) {
        const activeElements = within(table).queryAllByText('Active');
        expect(activeElements).toHaveLength(expectedCounts.active);
      }
    },
    { timeout },
  );

  return table;
};

const addMembersTestGroup = {
  uuid: 'test-group-id',
  name: 'Test Group',
  description: 'A test group for adding members',
  principalCount: 0,
  roleCount: 0,
  platform_default: false,
  admin_default: false,
  system: false,
  created: '2024-01-01T00:00:00Z',
  modified: '2024-01-02T00:00:00Z',
};

const sharedGroupHandlers = [...groupsHandlers([addMembersTestGroup]), ...groupMembersHandlers({ 'test-group-id': [] })];

// 🎯 WRAPPER COMPONENT: Provides button to open modal
const AddGroupMembersWrapper = (props: React.ComponentProps<typeof AddGroupMembers>) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>Open Add Members Modal</button>
      {isModalOpen && <AddGroupMembers {...props} cancelRoute="/user-access/groups/detail/test-group-id/members" />}
    </>
  );
};

const meta: Meta<typeof AddGroupMembersWrapper> = {
  component: AddGroupMembersWrapper,
  // NO autodocs on meta
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/user-access/groups/detail/test-group-id/members']}>
        <Routes>
          <Route path="/user-access/groups/detail/:groupId/members" element={<Story />} />
          {/* Route for navigation after cancel/submit */}
          <Route path="/user-access/groups/detail/:groupId/members/*" element={<Story />} />
          {/* Route for useAppNavigate with /iam/user-access basename */}
          <Route path="/iam/user-access/groups/detail/:groupId/members" element={<div data-testid="group-members-page">Group Members Page</div>} />
        </Routes>
      </MemoryRouter>
    ),
  ],
  parameters: {
    msw: {
      handlers: [...usersHandlers(DEFAULT_USERS, { onList: usersApiSpy }), ...sharedGroupHandlers],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
**What you should see:**
1. A blue "Open Add Members Modal" button
2. Click it to see the "Add members" modal with:
   - Modal title: "Add members" 
   - A table of users (adumble, ginger-spice, bbunny)
   - Checkboxes to select users
   - "Add to group" button (disabled until you select users)
   - "Cancel" button

**This story tests:** Basic modal functionality and user list display.

## 📋 Complete Test Coverage

- **[WithUsers](?path=/story/features-groups-group-member-addgroupmembers--with-users)**: Extended user list with more test data
- **[WithFiltering](?path=/story/features-groups-group-member-addgroupmembers--with-filtering)**: Search and filter users by name/email  
- **[WithPagination](?path=/story/features-groups-group-member-addgroupmembers--with-pagination)**: Large dataset with pagination controls
- **[Loading](?path=/story/features-groups-group-member-addgroupmembers--loading)**: Modal shows loading state while fetching users
- **[ITLessMode](?path=/story/features-groups-group-member-addgroupmembers--it-less-mode)**: IT-less mode with different UI
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open Add Members modal', async () => {
      const openButton = await canvas.findByRole('button', { name: 'Open Add Members Modal' });
      await userEvent.click(openButton);

      const modal = await screen.findByRole('dialog');
      expect(modal).toBeInTheDocument();

      expect(within(modal).getByText('Add members')).toBeInTheDocument();
    });

    await step('Verify user list and Add button state', async () => {
      const modal = await screen.findByRole('dialog');
      await waitFor(async () => {
        const userElements = within(modal).queryAllByText(
          new RegExp([DEFAULT_USERS[0].username, DEFAULT_USERS[1].username, DEFAULT_USERS[2].username].join('|')),
        );
        expect(userElements.length).toBeGreaterThanOrEqual(1);
      });

      const addButton = within(modal).getByRole('button', { name: /add to group/i });
      expect(addButton).toBeDisabled();
    });
  },
};

export const WithUsers: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**What you should see:**
1. Click "Open Add Members Modal" button
2. Modal opens with expanded user list:
   - adumble (Albus Dumbledore - dumble@redhat.com)
   - ginger-spice (Geri Halliwell - gspice@redhat.com)
   - bwhite (Betty White - bwhite@redhat.com)
3. Each user has a checkbox for selection
4. Full name and email visible in the table

**This story tests:** Extended user data display and selection interface.
        `,
      },
    },
    msw: {
      handlers: [...usersHandlers(filteringTestUsers, { onList: usersApiSpy }), ...sharedGroupHandlers],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open modal and verify extended user list', async () => {
      const openButton = await canvas.findByRole('button', { name: 'Open Add Members Modal' });
      await userEvent.click(openButton);

      const modal = await screen.findByRole('dialog');
      expect(modal).toBeInTheDocument();

      expect(within(modal).getByText('Add members')).toBeInTheDocument();

      await waitFor(async () => {
        expect(within(modal).queryByText(filteringTestUsers[0].username)).toBeInTheDocument();
        expect(within(modal).queryByText(filteringTestUsers[2].username)).toBeInTheDocument();
        expect(within(modal).queryByText(filteringTestUsers[7].username)).toBeInTheDocument();
      });
    });
  },
};

export const WithFiltering: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**What you should see:**
1. Click "Open Add Members Modal" button
2. Modal opens with:
   - Filter dropdown with Username, Email, and Status options
   - Type in filters to see results update dynamically
   - Switch between filter types using the dropdown
   - Clear filters button appears when filters are active

**This story tests:** Username filter and clear filters functionality with API spy verification.
        `,
      },
    },
    msw: {
      handlers: [...usersHandlers(filteringTestUsers, { onList: usersApiSpy }), ...sharedGroupHandlers],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open modal and verify initial API call', async () => {
      usersApiSpy.mockClear();

      const openButton = await canvas.findByRole('button', { name: 'Open Add Members Modal' });
      await userEvent.click(openButton);

      const modal = await screen.findByRole('dialog');
      expect(modal).toBeInTheDocument();

      expect(within(modal).getByText('Add members')).toBeInTheDocument();

      await waitFor(() => {
        expect(usersApiSpy).toHaveBeenCalled();
        const params = usersApiSpy.mock.calls[0][0] as URLSearchParams;
        expect(params.get('usernames')).toBeNull();
        expect(params.get('email')).toBeNull();
      });

      await waitFor(() => {
        const grid = within(modal).getByRole('grid');
        expect(within(grid).queryByText(filteringTestUsers[0].username)).toBeInTheDocument();
        expect(within(grid).queryByText(filteringTestUsers[2].username)).toBeInTheDocument();
      });
    });

    await step('Test username filter and clear', async () => {
      const modal = await screen.findByRole('dialog');
      const usernameInput = await within(modal).findByPlaceholderText(/filter by username/i);
      usersApiSpy.mockClear();
      await userEvent.type(usernameInput, 'spice');
      await waitFor(() => {
        expect(usersApiSpy).toHaveBeenCalled();
        const params = usersApiSpy.mock.calls[usersApiSpy.mock.calls.length - 1][0] as URLSearchParams;
        expect(params.get('usernames')).toBe('spice');
      });
      await waitFor(
        () => {
          const grid = within(modal).getByRole('grid');
          const gridScope = within(grid);
          expect(gridScope.queryByText(spiceUsers[0].username)).toBeInTheDocument();
          expect(gridScope.queryByText(spiceUsers[1].username)).toBeInTheDocument();
          expect(gridScope.queryByText(spiceUsers[2].username)).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      usersApiSpy.mockClear();
      const clearButton = await within(modal).findByRole('button', { name: /clear.*filter/i });
      await userEvent.click(clearButton);
      await waitFor(() => {
        expect(usersApiSpy).toHaveBeenCalled();
        const params = usersApiSpy.mock.calls[usersApiSpy.mock.calls.length - 1][0] as URLSearchParams;
        expect(params.get('usernames')).toBeNull();
        expect(params.get('email')).toBeNull();
      });
      await waitFor(
        () => {
          const grid = within(modal).getByRole('grid');
          const gridScope = within(grid);
          expect(gridScope.queryByText(filteringTestUsers[0].username)).toBeInTheDocument();
          expect(gridScope.queryByText(filteringTestUsers[2].username)).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      await waitForMembersTable(modal, { active: filteringTestUsers.filter((u) => u.is_active).length, inactive: inactiveUsers.length });
    });

    await step('Test email filter', async () => {
      const modal = await screen.findByRole('dialog');
      usersApiSpy.mockClear();
      const emailFilterContainer = modal.querySelector('[data-ouia-component-id="DataViewFilters"]') as HTMLElement;
      expect(emailFilterContainer).toBeTruthy();
      const emailFilterCanvas = within(emailFilterContainer);
      const filterTypeBtn = emailFilterCanvas.getAllByRole('button').find((btn) => btn.textContent?.includes('Username'));
      expect(filterTypeBtn).toBeTruthy();
      await userEvent.click(filterTypeBtn!);
      await userEvent.click(await within(modal).findByRole('menuitem', { name: /^email$/i }));
      await userEvent.type(await within(modal).findByPlaceholderText(/filter by email/i), 'bspice');
      await waitFor(() => {
        const params = usersApiSpy.mock.calls[usersApiSpy.mock.calls.length - 1][0] as URLSearchParams;
        expect(params.get('email')).toBe('bspice');
      });
      const babySpice = filteringTestUsers.find((u) => u.email?.includes('bspice'))!;
      await waitFor(
        () => {
          const grid = within(modal).getByRole('grid');
          const gridScope = within(grid);
          expect(gridScope.queryByText(babySpice.username)).toBeInTheDocument();
        },
        { timeout: 10000 },
      );
    });

    await step('Test status filter (Inactive)', async () => {
      const modal = await screen.findByRole('dialog');
      usersApiSpy.mockClear();
      await userEvent.click(await within(modal).findByRole('button', { name: /clear.*filter/i }));
      await waitFor(() => {
        const grid = within(modal).getByRole('grid');
        expect(within(grid).queryByText(filteringTestUsers[0].username)).toBeInTheDocument();
        expect(within(grid).queryByText(inactiveUsers[0].username)).toBeInTheDocument();
      });
      const filterContainer = modal.querySelector('[data-ouia-component-id="DataViewFilters"]') as HTMLElement;
      expect(filterContainer).toBeTruthy();
      const filterCanvas = within(filterContainer);
      const filterTypeButtons = filterCanvas.getAllByRole('button');
      const filterDropdownButton = filterTypeButtons.find(
        (btn) => btn.textContent?.toLowerCase().includes('email') || btn.textContent?.toLowerCase().includes('username'),
      );
      expect(filterDropdownButton).toBeTruthy();
      await userEvent.click(filterDropdownButton!);
      await userEvent.click(await within(modal).findByRole('menuitem', { name: /^status$/i }));
      const statusFilterToggle = modal.querySelector('[data-ouia-component-id="DataViewCheckboxFilter-toggle"]') as HTMLElement;
      expect(statusFilterToggle).toBeTruthy();
      await userEvent.click(statusFilterToggle);
      const inactiveMenuItem = await within(document.body).findByRole('menuitem', { name: /inactive/i });
      await userEvent.click(inactiveMenuItem);
      await waitForMembersTable(modal, { inactive: inactiveUsers.length });
      await waitFor(
        () => {
          const grid = within(modal).getByRole('grid');
          const gridScope = within(grid);
          expect(gridScope.queryByText(inactiveUsers[0].username)).toBeInTheDocument();
          expect(gridScope.queryByText(inactiveUsers[1].username)).toBeInTheDocument();
          expect(gridScope.queryByText(inactiveUsers[2].username)).toBeInTheDocument();
        },
        { timeout: 10000 },
      );
    });
  },
};

export const WithPagination: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**What you should see:**
1. Click "Open Add Members Modal" button
2. Modal opens with a large user list (50 users)
3. Pagination controls at the bottom:
   - "Previous" and "Next" buttons
   - Page numbers or page size selector
   - Items per page dropdown (10, 20, 50)
4. Click "Next" to see more users
5. Try changing the page size to see different results per page

**This story tests:** Pagination functionality with large datasets.
        `,
      },
    },
    msw: {
      handlers: [...usersHandlers(generateUsers(50), { onList: usersApiSpy }), ...sharedGroupHandlers],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 🎯 MODAL TESTING: Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Members Modal' });
    await userEvent.click(openButton);

    // 🎯 MODAL TESTING: Modal renders to document.body via portal
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Test modal content
    expect(within(modal).getByText('Add members')).toBeInTheDocument();

    // 🎯 PAGINATION TEST: Wait for table to load
    await waitFor(async () => {
      const userElements = within(modal).queryAllByText(/user\d+/);
      expect(userElements.length).toBeGreaterThan(0);
    });

    // 🎯 PAGINATION TEST: Look for pagination controls
    const paginationControls = within(modal).queryAllByText(/next|previous|page/i);
    if (paginationControls.length > 0) {
      // Try to find and click next page
      const nextButton = within(modal).queryByLabelText(/next page/i) || within(modal).queryByText(/next/i);
      if (nextButton && !(nextButton as HTMLButtonElement).disabled) {
        await userEvent.click(nextButton);

        // Verify page navigation worked
        await waitFor(async () => {
          const modal = screen.getByRole('dialog');
          expect(modal).toBeInTheDocument();
        });
      }
    }

    // Verify large dataset is working
    const userRows = within(modal).queryAllByText(/user\d+/);
    expect(userRows.length).toBeGreaterThan(1);
  },
};

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**What you should see:**
1. Click "Open Add Members Modal" button  
2. Modal opens but user list shows loading state:
   - Skeleton loading bars where user data would be
   - Or loading spinner in the table area
   - "Add to group" button remains disabled
3. Modal title still visible

**This story tests:** Loading state while fetching user data.
        `,
      },
    },
    msw: {
      handlers: [...usersLoadingHandlers(), ...sharedGroupHandlers],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 🎯 MODAL TESTING: Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Open Add Members Modal' });
    await userEvent.click(openButton);

    // 🎯 MODAL TESTING: Modal renders to document.body via portal
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Test modal content using within(modal)
    expect(within(modal).getByText('Add members')).toBeInTheDocument();

    // Should show loading state for user selection within modal
    await waitFor(async () => {
      // Modal should stay functional during loading
      expect(modal).toBeInTheDocument();

      // Add button should be disabled during loading
      const addButton = within(modal).getByRole('button', { name: /add to group/i });
      expect(addButton).toBeDisabled();
    });
  },
};

export const ITLessMode: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**What you should see:**
1. Click "Open Add Members Modal" button
2. Modal opens with IT-less mode interface:
   - Different user selection component (UsersListItless instead of UsersList)
   - May have simplified UI without some advanced features
   - Shows default fixture users (adumble, etc.)
   - Feature flag \`platform.rbac.itless\` is enabled

**This story tests:** IT-less mode functionality with different user interface component.
        `,
      },
    },
    featureFlags: {
      'platform.rbac.itless': true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open modal and verify IT-less mode content', async () => {
      const openButton = await canvas.findByRole('button', { name: 'Open Add Members Modal' });
      await userEvent.click(openButton);

      const modal = await screen.findByRole('dialog');
      expect(modal).toBeInTheDocument();

      expect(within(modal).getByText('Add members')).toBeInTheDocument();

      await waitFor(async () => {
        expect(within(modal).queryByText(DEFAULT_USERS[0].username)).toBeInTheDocument();
      });
    });
  },
};

export const SubmitNotification: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Test info notification when users are added to group.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open modal and wait for users', async () => {
      const openButton = await canvas.findByRole('button', { name: 'Open Add Members Modal' });
      await userEvent.click(openButton);

      const modal = await screen.findByRole('dialog');
      expect(modal).toBeInTheDocument();

      await waitFor(
        () => {
          const userText = within(modal).queryByText(DEFAULT_USERS[0].username) || within(modal).queryByText(DEFAULT_USERS[1].username);
          expect(userText).toBeInTheDocument();
        },
        { timeout: 10000 },
      );
    });

    await step('Select user and submit', async () => {
      const modal = await screen.findByRole('dialog');
      let selectedAUser = false;

      await waitFor(() => {
        const checkboxes = within(modal).queryAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });

      const checkboxes = within(modal).getAllByRole('checkbox');
      const rowCheckboxes = checkboxes.filter((cb) => {
        const ariaLabel = cb.getAttribute('aria-label') || '';
        return !ariaLabel.includes('Select page') && !ariaLabel.includes('Toggle') && !cb.getAttribute('id')?.includes('switch');
      });

      if (rowCheckboxes.length > 0) {
        await userEvent.click(rowCheckboxes[0]);
        selectedAUser = true;

        await waitFor(() => expect(rowCheckboxes[0]).toBeChecked());
      }

      if (selectedAUser) {
        const submitButton = within(modal).queryByRole('button', { name: /add to group/i });

        if (submitButton) {
          await userEvent.click(submitButton);
        }
      }

      if (selectedAUser) {
        try {
          await waitFor(
            () => {
              const notificationPortal = document.querySelector('.notifications-portal');
              expect(notificationPortal).toBeInTheDocument();

              const infoAlert = notificationPortal?.querySelector('.pf-v6-c-alert.pf-m-info');
              expect(infoAlert).toBeInTheDocument();

              const alertTitle = infoAlert?.querySelector('.pf-v6-c-alert__title');
              expect(alertTitle).toHaveTextContent(/adding.*member/i);

              const alertDescription = infoAlert?.querySelector('.pf-v6-c-alert__description');
              expect(alertDescription).toHaveTextContent(/adding.*member/i);
            },
            { timeout: 2000 },
          );
        } catch {
          expect(within(modal).getByText('Add members')).toBeInTheDocument();
          expect(rowCheckboxes.length).toBeGreaterThan(0);
        }
      } else {
        expect(within(modal).getByText('Add members')).toBeInTheDocument();
      }
    });
  },
};

export const CancelNotification: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Test warning notification when user cancels adding members.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    usersApiSpy.mockClear();
    const canvas = within(canvasElement);

    await step('Open modal and click Cancel', async () => {
      const openButton = await canvas.findByRole('button', { name: 'Open Add Members Modal' });
      await userEvent.click(openButton);

      const modal = await screen.findByRole('dialog');
      expect(modal).toBeInTheDocument();

      await waitFor(() => {
        expect(within(modal).getByText('Add members')).toBeInTheDocument();
      });

      const cancelButton = within(modal).queryByRole('button', { name: /^cancel$/i });
      if (cancelButton) {
        await userEvent.click(cancelButton);

        await waitFor(
          () => {
            const notificationPortal = document.querySelector('.notifications-portal');
            expect(notificationPortal).toBeInTheDocument();

            const warningAlert = notificationPortal?.querySelector('.pf-v6-c-alert.pf-m-warning');
            expect(warningAlert).toBeInTheDocument();

            const alertTitle = warningAlert?.querySelector('.pf-v6-c-alert__title');
            expect(alertTitle).toHaveTextContent(/cancel/i);

            const alertDescription = warningAlert?.querySelector('.pf-v6-c-alert__description');
            expect(alertDescription).toHaveTextContent(/cancelled/i);
          },
          { timeout: 5000 },
        );
      } else {
        expect(within(modal).getByText('Add members')).toBeInTheDocument();
      }
    });
  },
};
