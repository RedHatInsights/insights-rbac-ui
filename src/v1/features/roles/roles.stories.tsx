import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { getSkeletonCount } from '../../../test-utils/interactionHelpers';
import { findSortButton } from '../../../test-utils/tableHelpers';
import { Roles } from './Roles';
import { v1RolesHandlers, v1RolesLoadingHandlers } from '../../data/mocks/roles.handlers';
import { groupsHandlers, groupsLoadingHandlers } from '../../../shared/data/mocks/groups.handlers';
import { withRouter } from '../../../../.storybook/helpers/router-test-utils';
import {
  PAGINATION_TEST_DEFAULT_PER_PAGE,
  PAGINATION_TEST_SMALL_PER_PAGE,
  PAGINATION_TEST_TOTAL_ITEMS,
  expectLocationParams,
  getLastCallArg,
  openPerPageMenu,
  selectPerPage,
} from '../../../../.storybook/helpers/pagination-test-utils';
import { waitForPageToLoad } from '../../../test-utils/tableHelpers';

// Spy functions to track API calls
const fetchRolesSpy = fn();
const fetchAdminGroupSpy = fn();
const paginationSpy = fn();

// Mock role data
const mockRoles = [
  {
    uuid: 'role-1',
    name: 'Platform Administrator',
    display_name: 'Platform Administrator',
    description: 'Full access to all platform features',
    system: false,
    platform_default: false,
    admin_default: false,
    accessCount: 25,
    applications: ['rbac', 'inventory', 'cost-management'],
    modified: '2023-12-01T10:30:00Z',
    groups_in_count: 3,
    groups_in: [
      { uuid: 'group-1', name: 'Administrators', description: 'System administrators group' },
      { uuid: 'group-2', name: 'Platform Team', description: 'Platform engineering team' },
      { uuid: 'group-3', name: 'Super Users', description: 'Super user access group' },
    ],
    access: [
      { permission: 'rbac:*:*' },
      { permission: 'inventory:*:*' },
      { permission: 'cost-management:*:*' },
      { permission: 'insights:*:read' },
      { permission: 'vulnerability:*:read' },
    ],
  },
  {
    uuid: 'role-2',
    name: 'Cost Management Viewer',
    display_name: 'Cost Management Viewer',
    description: 'View cost management data and reports',
    system: false,
    platform_default: false,
    admin_default: false,
    accessCount: 8,
    applications: ['cost-management'],
    modified: '2023-11-28T14:20:00Z',
    groups_in_count: 1,
    groups_in: [{ uuid: 'group-4', name: 'Finance Team', description: 'Finance and accounting team' }],
    access: [
      { permission: 'cost-management:*:read' },
      { permission: 'cost-management:report:read' },
      { permission: 'cost-management:resource:read' },
    ],
  },
  {
    uuid: 'role-3',
    name: 'Vulnerability Administrator',
    display_name: 'Vulnerability Administrator',
    description: 'Manage vulnerability scanning and remediation',
    system: false,
    platform_default: false,
    admin_default: false,
    accessCount: 12,
    applications: ['vulnerability'],
    modified: '2023-12-05T09:15:00Z',
    groups_in_count: 2,
    groups_in: [
      { uuid: 'group-5', name: 'Security Team', description: 'Security and compliance team' },
      { uuid: 'group-6', name: 'Operations', description: 'Operations and monitoring team' },
    ],
    access: [
      { permission: 'vulnerability:*:*' },
      { permission: 'vulnerability:system:read' },
      { permission: 'vulnerability:system:write' },
      { permission: 'vulnerability:report:read' },
    ],
  },
];

// Larger dataset for pagination stories (must exceed perPage to enable next/prev)
const mockRolesLarge = Array.from({ length: PAGINATION_TEST_TOTAL_ITEMS }, (_v, idx) => {
  const i = idx + 1;
  return {
    uuid: `role-${i}`,
    name: `Role ${i}`,
    display_name: `Role ${i}`,
    description: `Role description ${i}`,
    system: false,
    platform_default: false,
    admin_default: false,
    accessCount: 1,
    applications: ['rbac'],
    modified: '2023-12-01T10:30:00Z',
    groups_in_count: 0,
    groups_in: [],
    access: [{ permission: 'rbac:*:*' }],
  };
});

const meta: Meta<typeof Roles> = {
  component: Roles,
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        component: `
**Roles** is a container component that manages the roles list page at \`/iam/user-access/roles\`.

## Container Responsibilities
- **Data Fetching**: Uses TanStack Query hooks for role data and admin group
- **Permission Context**: Uses \`orgAdmin\` and \`userAccessAdministrator\` from useUserData
- **URL Synchronization**: Manages pagination and filters in URL parameters
- **Table Management**: Provides data and callbacks to TableView component
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminUserWithRoles: Story = {
  tags: ['autodocs', 'perm:org-admin'],
  parameters: {
    docs: {
      description: {
        story: `
**Admin User View**: Tests complete roles management interface for organization administrators.

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[LoadingState](?path=/story/features-roles-roles--loading-state)**: Tests container behavior during API loading
- **[EmptyRoles](?path=/story/features-roles-roles--empty-roles)**: Tests container response to empty role data
        `,
      },
    },
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    msw: {
      handlers: [
        ...v1RolesHandlers(mockRoles as unknown as Parameters<typeof v1RolesHandlers>[0], { onList: () => fetchRolesSpy({}) }),
        ...groupsHandlers(undefined, { onAdminDefaultRequest: () => fetchAdminGroupSpy({}) }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial data load and API calls', async () => {
      // Wait for container to load data through React Query
      expect(await canvas.findByText(mockRoles[0].display_name)).toBeInTheDocument();
      expect(await canvas.findByText(mockRoles[1].display_name)).toBeInTheDocument();
      expect(await canvas.findByText(mockRoles[2].display_name)).toBeInTheDocument();

      // Verify admin users trigger API calls (expected behavior)
      await waitFor(() => {
        expect(fetchRolesSpy).toHaveBeenCalled();
        expect(fetchAdminGroupSpy).toHaveBeenCalled();
      });
    });

    await step('Verify roles table and data', async () => {
      // Verify roles table is displayed with data
      const table = await canvas.findByRole('grid');
      expect(table).toBeInTheDocument();

      // Verify role data is rendered through React Query state
      const tableContent = within(table);
      expect(await tableContent.findByText(mockRoles[0].display_name)).toBeInTheDocument();
      expect(await tableContent.findByText(String(mockRoles[0].accessCount))).toBeInTheDocument();
    });
  },
};

// NonAdminUserUnauthorizedCalls story removed - now handled by route-level PermissionGuard

export const LoadingState: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    docs: {
      description: {
        story: 'Tests container behavior during API loading via React Query state management.',
      },
    },
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    msw: {
      handlers: [...v1RolesLoadingHandlers(), ...groupsLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify loading state', async () => {
      // Should show loading state while API calls are pending
      await waitFor(
        () => {
          expect(getSkeletonCount(canvasElement)).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );
    });
  },
};

export const EmptyRoles: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    docs: {
      description: {
        story: 'Tests container handling of empty role data from React Query.',
      },
    },
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    msw: {
      handlers: [...v1RolesHandlers([]), ...groupsHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty state', async () => {
      // Should show empty state message for no roles - "Configure roles"
      await expect(canvas.findByText(/Configure roles/i)).resolves.toBeInTheDocument();
    });
  },
};

// Additional spies for focused testing
const filterSpy = fn();
const sortSpy = fn();

export const AdminUserWithRolesFiltering: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    docs: {
      description: {
        story: 'Tests role filtering functionality with spy verification for admin users.',
      },
    },
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    msw: {
      handlers: [
        ...v1RolesHandlers(mockRoles as unknown as Parameters<typeof v1RolesHandlers>[0], {
          onList: (params) => {
            fetchRolesSpy({ params });
            const d = params?.get?.('display_name') ?? params?.get?.('name');
            if (d) filterSpy(d);
          },
        }),
        ...groupsHandlers(undefined, { onAdminDefaultRequest: () => fetchAdminGroupSpy({}) }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for initial data and apply filter', async () => {
      // Clear spy to ensure clean state (spies persist across stories)
      filterSpy.mockClear();

      // Wait for initial data load
      expect(await canvas.findByText(mockRoles[0].display_name)).toBeInTheDocument();
      expect(await canvas.findByText(mockRoles[1].display_name)).toBeInTheDocument();

      // Test filtering functionality
      const filterInput = await canvas.findByPlaceholderText(/filter by name/i);
      expect(filterInput).toBeInTheDocument();

      // Test 1: Filter by "vulner" - should match "Vulnerability Administrator"
      await userEvent.type(filterInput, 'vulner');

      // Wait for debounce + React Query state update + re-render
      await waitFor(
        () => {
          expect(filterSpy).toHaveBeenCalledWith('vulner');
        },
        { timeout: 3000 },
      );

      // Wait for the filtered data to render - Platform Administrator should disappear
      await waitFor(
        () => {
          expect(canvas.queryByText(mockRoles[0].display_name)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Verify only Vulnerability Administrator is visible
      expect(await canvas.findByText(mockRoles[2].display_name)).toBeInTheDocument();
      expect(canvas.queryByText(mockRoles[1].display_name)).not.toBeInTheDocument();
    });

    await step('Clear filters and verify all roles visible', async () => {
      // Test 2: Clear filter by clicking the Clear filters button
      const clearFiltersButton = await canvas.findByRole('button', { name: /clear filters/i });
      expect(clearFiltersButton).toBeInTheDocument();

      filterSpy.mockClear();
      await userEvent.click(clearFiltersButton);

      // Wait for API call and table refresh
      await waitFor(
        () => {
          expect(canvas.queryByText(mockRoles[0].display_name)).toBeInTheDocument();
          expect(canvas.queryByText(mockRoles[1].display_name)).toBeInTheDocument();
          expect(canvas.queryByText(mockRoles[2].display_name)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // All roles should be visible again after clearing
      expect(await canvas.findByText(mockRoles[0].display_name)).toBeInTheDocument();
      expect(await canvas.findByText(mockRoles[1].display_name)).toBeInTheDocument();
      expect(await canvas.findByText(mockRoles[2].display_name)).toBeInTheDocument();
    });
  },
};

export const AdminUserWithRolesExpandableContent: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    docs: {
      description: {
        story: 'Tests expandable row functionality for groups and permissions nested tables.',
      },
    },
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    msw: {
      handlers: [
        ...v1RolesHandlers(mockRoles as unknown as Parameters<typeof v1RolesHandlers>[0], { onList: () => fetchRolesSpy({}) }),
        ...groupsHandlers(undefined, { onAdminDefaultRequest: () => fetchAdminGroupSpy({}) }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for initial data and expand groups', async () => {
      // Wait for initial data load
      expect(await canvas.findByText(mockRoles[0].display_name)).toBeInTheDocument();

      // Find the Platform Administrator row specifically
      const platformAdminRow = canvas.getByText(mockRoles[0].display_name).closest('tr');
      expect(platformAdminRow).toBeInTheDocument();

      if (!platformAdminRow) {
        throw new Error(`${mockRoles[0].display_name} row not found`);
      }

      // Test groups expandable content
      const groupsButton = within(platformAdminRow).getByRole('button', { name: String(mockRoles[0].groups_in_count) });
      expect(groupsButton).toBeInTheDocument();
      const row = within(groupsButton.closest('tbody') as HTMLElement);

      await userEvent.click(groupsButton);

      // Scope queries to the nested groups table within the expanded row
      const expandedGroupsRow = within(await row.findByLabelText(/Groups for role/i));

      // Test nested groups table headers (they're <th> elements, not role="columnheader")
      expect(await expandedGroupsRow.findByText('Group name')).toBeInTheDocument();
      expect(await expandedGroupsRow.findByText('Description')).toBeInTheDocument();

      // Test group data within the nested table only
      expect(await expandedGroupsRow.findByText(mockRoles[0].groups_in[0].name)).toBeInTheDocument();
      expect(await expandedGroupsRow.findByText(mockRoles[0].groups_in[0].description)).toBeInTheDocument();
      expect(await expandedGroupsRow.findByText(mockRoles[0].groups_in[1].name)).toBeInTheDocument();
      expect(await expandedGroupsRow.findByText(mockRoles[0].groups_in[2].name)).toBeInTheDocument();
    });

    await step('Expand permissions and verify content', async () => {
      const platformAdminRow = canvas.getByText(mockRoles[0].display_name).closest('tr');
      if (!platformAdminRow) throw new Error(`${mockRoles[0].display_name} row not found`);
      const row = within(platformAdminRow.closest('tbody') as HTMLElement);

      // Test permissions expandable content
      const permissionsButton = within(platformAdminRow).getByRole('button', { name: String(mockRoles[0].accessCount) });
      expect(permissionsButton).toBeInTheDocument();

      await userEvent.click(permissionsButton);

      // Scope queries to the nested permissions table within the expanded row
      const expandedPermissionsRow = within(await row.findByLabelText(/Permissions for role/i));

      // Test nested permissions table headers (they're <th> elements, not role="columnheader")
      expect(await expandedPermissionsRow.findByText('Application')).toBeInTheDocument();
      expect(await expandedPermissionsRow.findByText('Resource type')).toBeInTheDocument();
      expect(await expandedPermissionsRow.findByText('Operation')).toBeInTheDocument();
      expect(await expandedPermissionsRow.findByText('Last modified')).toBeInTheDocument();

      // Test permission data within the nested table only
      expect(await expandedPermissionsRow.findByText(mockRoles[0].applications[0])).toBeInTheDocument();
      expect(await expandedPermissionsRow.findByText(mockRoles[0].applications[1])).toBeInTheDocument();
      expect(await expandedPermissionsRow.findByText(mockRoles[0].applications[2])).toBeInTheDocument();
    });
  },
};

export const AdminUserWithRolesSorting: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    docs: {
      description: {
        story: 'Tests column sorting functionality with spy verification for sortable columns (Name, Last Modified).',
      },
    },
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    msw: {
      handlers: [
        ...v1RolesHandlers(mockRoles as unknown as Parameters<typeof v1RolesHandlers>[0], {
          onList: (params) => {
            fetchRolesSpy({ params });
            const o = params?.get?.('order_by');
            if (o) sortSpy(o);
          },
        }),
        ...groupsHandlers(undefined, { onAdminDefaultRequest: () => fetchAdminGroupSpy({}) }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sort by Name descending then ascending', async () => {
      // Wait for initial data load - table should be fully rendered with sortable headers
      await waitForPageToLoad(canvas, mockRoles[0].display_name);

      let nameButton = await findSortButton(canvas, /name/i);

      // Reset spy
      sortSpy.mockClear();

      // Click to sort descending (reverses default ascending)
      await userEvent.click(nameButton);

      // Verify sort API was called with display_name descending
      await waitFor(() => {
        expect(sortSpy).toHaveBeenCalledWith('-display_name');
      });

      // Wait for table to reload after sort
      await waitForPageToLoad(canvas, mockRoles[0].display_name);

      nameButton = await findSortButton(canvas, /name/i);

      // Reset spy
      sortSpy.mockClear();

      // Click again to sort ascending
      await userEvent.click(nameButton);

      // Verify sort API was called with display_name ascending
      await waitFor(() => {
        expect(sortSpy).toHaveBeenCalledWith('display_name');
      });

      // Wait for table to reload after sort
      await waitForPageToLoad(canvas, mockRoles[0].display_name);
    });

    await step('Sort by Last Modified column', async () => {
      let lastModifiedButton = await findSortButton(canvas, /last modified/i);

      // Reset spy
      sortSpy.mockClear();

      // Click to sort by modified date
      await userEvent.click(lastModifiedButton);

      // Verify sort API was called with modified
      await waitFor(() => {
        expect(sortSpy).toHaveBeenCalledWith('modified');
      });

      // Wait for table to reload after sort
      await waitForPageToLoad(canvas, mockRoles[0].display_name);

      lastModifiedButton = await findSortButton(canvas, /last modified/i);

      // Reset spy
      sortSpy.mockClear();

      // Click again for descending
      await userEvent.click(lastModifiedButton);

      // Verify sort API was called with modified descending
      await waitFor(() => {
        expect(sortSpy).toHaveBeenCalledWith('-modified');
      });
    });
  },
};

export const AdminUserWithRolesPrimaryActions: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    docs: {
      description: {
        story: 'Tests primary toolbar actions like Create Role button availability and functionality.',
      },
    },
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    msw: {
      handlers: [
        ...v1RolesHandlers(mockRoles as unknown as Parameters<typeof v1RolesHandlers>[0], { onList: () => fetchRolesSpy({}) }),
        ...groupsHandlers(undefined, { onAdminDefaultRequest: () => fetchAdminGroupSpy({}) }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify primary actions and row kebab', async () => {
      // Wait for data load
      expect(await canvas.findByText(mockRoles[0].display_name)).toBeInTheDocument();

      // Test Create Role button availability and state
      const createRoleButton = canvas.getByRole('button', { name: /create role/i });
      expect(createRoleButton).toBeInTheDocument();
      expect(createRoleButton).not.toBeDisabled();

      // Test row actions (kebab menus) availability
      const kebabMenus = canvas.getAllByLabelText(/Actions for role/i);
      expect(kebabMenus.length).toBeGreaterThan(0);

      // Test first row kebab menu interaction
      const firstRowKebab = kebabMenus[0]; // Actions dropdown;
      await userEvent.click(firstRowKebab);
    });
  },
};

export const PaginationUrlSync: Story = {
  tags: ['perm:org-admin', 'sbtest:roles-pagination'],
  parameters: {
    docs: {
      description: {
        story:
          'Interaction test: verifies Roles pagination updates URL search params (`page`, `perPage`) when changing page size and navigating to next page.',
      },
    },
    orgAdmin: true,
    permissions: ['rbac:*:*'],
    // Use MemoryRouter so we can assert location.search deterministically
    routerInitialEntries: [`/iam/user-access/roles?perPage=${PAGINATION_TEST_DEFAULT_PER_PAGE}`],
    msw: {
      handlers: [
        ...v1RolesHandlers(mockRolesLarge as unknown as Parameters<typeof v1RolesHandlers>[0], {
          onList: (params) => {
            const limit = parseInt(params?.get?.('limit') ?? String(PAGINATION_TEST_DEFAULT_PER_PAGE), 10);
            const offset = parseInt(params?.get?.('offset') ?? '0', 10);
            paginationSpy({ limit, offset });
          },
        }),
        ...groupsHandlers(),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Verify initial load and change per page', async () => {
      paginationSpy.mockClear();

      // Wait for initial load - rely on UI state instead of a fixed delay
      await expect(canvas.findByText(mockRolesLarge[0].display_name)).resolves.toBeInTheDocument();

      // Assert initial URL params
      const locEl = canvas.getByTestId('router-location');
      await expectLocationParams(locEl, {
        page: null, // page=1 is represented by absence of the param (see updatePageInUrl)
        perPage: String(PAGINATION_TEST_DEFAULT_PER_PAGE),
      });

      await openPerPageMenu(body);
      await selectPerPage(body, PAGINATION_TEST_SMALL_PER_PAGE);
      await expectLocationParams(locEl, {
        page: null, // perPage change resets page and deletes the page param
        perPage: String(PAGINATION_TEST_SMALL_PER_PAGE),
      });

      await waitFor(() => {
        expect(paginationSpy).toHaveBeenCalled();
        const last = getLastCallArg<{ limit: number; offset: number }>(paginationSpy);
        expect(last.limit).toBe(PAGINATION_TEST_SMALL_PER_PAGE);
        expect(last.offset).toBe(0);
      });
    });

    await step('Navigate to next page', async () => {
      const locEl = canvas.getByTestId('router-location');

      // Navigate to next page
      const nextButtons = canvas.getAllByRole('button', { name: /go to next page/i });
      await userEvent.click(nextButtons[0]);

      await expectLocationParams(locEl, {
        page: '2',
        perPage: String(PAGINATION_TEST_SMALL_PER_PAGE),
      });

      await waitFor(() => {
        const last = getLastCallArg<{ limit: number; offset: number }>(paginationSpy);
        expect(last.limit).toBe(PAGINATION_TEST_SMALL_PER_PAGE);
        expect(last.offset).toBe(PAGINATION_TEST_SMALL_PER_PAGE);
      });
    });
  },
};

// NOTE: PaginationOutOfRangeClampsToLastPage test was REMOVED from here.
// Page clamping is now handled centrally by TableView and tested in:
// src/components/table-view/TableView.stories.tsx -> PageClampingOutOfRange
//
// This avoids duplicating the same test across Roles, Users, and Groups stories.
// All tables using TableView automatically get page clamping behavior.
