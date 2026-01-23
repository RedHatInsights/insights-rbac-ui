import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { RolesTable } from './RolesTable';

// Mock roles data
const mockRoles = [
  {
    uuid: 'role-1',
    display_name: 'Advisor Administrator',
    name: 'advisor-admin',
    description: 'Full access to Advisor services',
    accessCount: 5,
  },
  {
    uuid: 'role-2',
    display_name: 'Compliance Viewer',
    name: 'compliance-viewer',
    description: 'Read-only access to Compliance reports',
    accessCount: 2,
  },
  {
    uuid: 'role-3',
    display_name: 'Vulnerability Manager',
    name: 'vulnerability-manager',
    description: 'Manage vulnerability scanning and reports',
    accessCount: 8,
  },
];

// Mock role permissions data for expanded view
const mockRolePermissions = [
  {
    permission: 'advisor:*:*',
    resourceDefinitions: [{ attributeFilter: { key: 'insights.advisor.source', operation: 'equal', value: 'advisor' } }],
  },
  {
    permission: 'compliance:policies:read',
    resourceDefinitions: [],
  },
];

const meta: Meta<typeof RolesTable> = {
  component: RolesTable,
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: mockRoles,
            meta: {
              count: mockRoles.length,
              limit: 20,
              offset: 0,
            },
          });
        }),
        // Mock API for role permissions when expanded
        http.get('/api/rbac/v1/roles/:roleId/', ({ params, request }) => {
          const url = new URL(request.url);
          const { roleId } = params;
          // Handle the scope=principal query parameter
          if (url.searchParams.get('scope') === 'principal') {
            // Return role object with uuid and access array (what React Query expects)
            return HttpResponse.json({
              uuid: roleId,
              access: mockRolePermissions,
            });
          }
          // Fallback for other role requests
          return HttpResponse.json({
            uuid: roleId,
            access: [],
          });
        }),
      ],
    },
  },
  argTypes: {
    apps: {
      control: 'object',
      description: 'List of applications to show roles for',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: '[]' },
      },
    },
    showResourceDefinitions: {
      control: 'boolean',
      description: 'Whether to show the Resource Definitions column',
      table: {
        type: { summary: 'boolean' },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RolesTable>;

export const Default: Story = {
  tags: ['autodocs'], // ONLY default story gets autodocs
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Complete roles table container with real API orchestration. Tests React Query mutations, reducers, and component integration end-to-end.

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[LoadingState](?path=/story/features-myuseraccess-rolestable--loading-state)**: Loading roles from API
- **[EmptyRoles](?path=/story/features-myuseraccess-rolestable--empty-roles)**: No roles available
- **[FilteringInteraction](?path=/story/features-myuseraccess-rolestable--filtering-interaction)**: Tests that filtering triggers correct API calls
- **[PermissionExpansion](?path=/story/features-myuseraccess-rolestable--permission-expansion)**: Testing permission row expansion functionality
- **[WithoutResourceDefinitions](?path=/story/features-myuseraccess-rolestable--without-resource-definitions)**: Table without resource definitions column
        `,
      },
    },
  },
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Test real API orchestration - container triggers mutations and React Query updates
    expect(await canvas.findByRole('grid')).toBeInTheDocument();

    // Verify role data loaded through React Query
    expect(await canvas.findByText('Advisor Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('Compliance Viewer')).toBeInTheDocument();
    expect(await canvas.findByText('Vulnerability Manager')).toBeInTheDocument();
  },
};

// Track API calls for parameter verification
const apiCallSpy = fn();

// Other stories: NO docs config, just MSW + tests
export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', async () => {
          await delay('infinite'); // Never resolves to keep loading
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show table structure while API call is pending
    expect(await canvas.findByRole('grid')).toBeInTheDocument();

    // Since API never resolves (infinite delay), should not show final data
    expect(canvas.queryByText('Advisor Administrator')).not.toBeInTheDocument();
    expect(canvas.queryByText('Compliance Viewer')).not.toBeInTheDocument();
    expect(canvas.queryByText('Vulnerability Manager')).not.toBeInTheDocument();
  },
};

export const EmptyRoles: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show empty state after API returns no data
    expect(await canvas.findByText('Configure roles')).toBeInTheDocument();
  },
};

export const FilteringInteraction: Story = {
  parameters: {
    msw: {
      handlers: [
        // Spy on API calls to verify filtering parameters
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const searchParams = url.searchParams;

          // Call the spy with API parameters
          apiCallSpy({
            name: searchParams.get('name'),
            application: searchParams.get('application'),
            limit: searchParams.get('limit'),
            offset: searchParams.get('offset'),
            orderBy: searchParams.get('orderBy') || searchParams.get('order_by'),
            scope: searchParams.get('scope'),
          });

          // Return filtered mock data based on parameters
          let filteredRoles = [...mockRoles];
          const nameFilter = searchParams.get('name');
          const applicationFilter = searchParams.get('application');

          if (nameFilter) {
            filteredRoles = filteredRoles.filter(
              (role) =>
                role.display_name?.toLowerCase().includes(nameFilter.toLowerCase()) || role.name?.toLowerCase().includes(nameFilter.toLowerCase()),
            );
          }

          // Handle application filtering - when typed as text, it should filter the available applications
          if (applicationFilter && applicationFilter !== 'advisor,compliance,vulnerability') {
            // If application filter is a specific app (not the default all apps), return limited results
            const availableApps = ['advisor', 'compliance', 'vulnerability'];
            const filteredApps = availableApps.filter((app) => app.toLowerCase().includes(applicationFilter.toLowerCase()));

            if (filteredApps.length > 0) {
              // Return roles but with filtered application context
              filteredRoles = filteredRoles.slice(0, 2); // Simulate fewer results when filtering by app
            }
          }

          return HttpResponse.json({
            data: filteredRoles,
            meta: {
              count: filteredRoles.length,
              limit: 20,
              offset: 0,
            },
          });
        }),
        // Mock role permissions
        http.get('/api/rbac/v1/roles/:roleId/', ({ params, request }) => {
          const url = new URL(request.url);
          const { roleId } = params;
          if (url.searchParams.get('scope') === 'principal') {
            return HttpResponse.json({
              uuid: roleId,
              access: mockRolePermissions,
            });
          }
          return HttpResponse.json(mockRoles.find((r) => r.uuid === roleId) || mockRoles[0]);
        }),
      ],
    },
  },
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Initial load should call API with basic parameters
    await waitFor(() => {
      expect(apiCallSpy).toHaveBeenCalled();
      const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
      expect(lastCall.scope).toBe('principal');
      expect(lastCall.application).toBe('advisor,compliance,vulnerability');
    });

    // Test role name filtering
    const roleFilter = await canvas.findByPlaceholderText('Filter by role name...');

    // Reset spy
    apiCallSpy.mockClear();

    // Type in role filter
    await userEvent.type(roleFilter, 'admin');

    // Wait for debounced API call and verify parameters
    await waitFor(
      () => {
        expect(apiCallSpy).toHaveBeenCalled();
        const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.name).toBe('admin');
        expect(lastCall.scope).toBe('principal');
        expect(lastCall.application).toBe('advisor,compliance,vulnerability');
      },
      { timeout: 1000 },
    ); // Account for 500ms debounce

    // Test application filtering - need to switch filter type first
    // Find and click the filter type dropdown button (contains "Role name" text)
    const filterDropdownButton = await canvas.findByRole('button', { name: /Role name/i });
    await userEvent.click(filterDropdownButton);

    // Wait for dropdown menu to appear and select "Application" option
    const applicationOption = await within(document.body).findByRole('menuitem', { name: /Application/i });
    await userEvent.click(applicationOption);

    // Wait for the filter input to change and find the application filter dropdown
    const applicationFilter = await canvas.findByRole('button', { name: /Filter by application/i });

    // Reset spy
    apiCallSpy.mockClear();

    // Click the application filter dropdown
    await userEvent.click(applicationFilter);

    // Find and select the "advisor" option from the dropdown menu (renders via portal)
    const advisorMenuItem = await within(document.body).findByText('advisor');
    await userEvent.click(advisorMenuItem);

    // Verify application filter API call (should preserve role filter)
    await waitFor(
      () => {
        expect(apiCallSpy).toHaveBeenCalled();
        const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.application).toBe('advisor');
        expect(lastCall.name).toBe('admin'); // Role filter should be preserved
      },
      { timeout: 1000 },
    );

    // Test clear all filters - use role selector to avoid matching empty state "Clear filters" link
    const clearAllFilters = await canvas.findByRole('button', { name: /clear filters/i });

    // Reset spy
    apiCallSpy.mockClear();

    await userEvent.click(clearAllFilters);

    // Verify clear filters API call
    await waitFor(
      () => {
        expect(apiCallSpy).toHaveBeenCalled();
        const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.name).toBeNull();
        expect(lastCall.application).toBe('advisor,compliance,vulnerability'); // Should reset to all apps
      },
      { timeout: 1000 },
    );
  },
};

export const PermissionExpansion: Story = {
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Check roles loaded from API through React Query
    expect(await canvas.findByText('Advisor Administrator')).toBeInTheDocument();
    expect(await canvas.findByText('Compliance Viewer')).toBeInTheDocument();

    // Find and click the permissions count to expand the row
    const permissionsCount = await canvas.findByText('5');
    await userEvent.click(permissionsCount);

    await waitFor(() => {
      const tbody = permissionsCount.closest('tbody');
      const table = tbody?.querySelector('table');
      if (!table) throw new Error('Could not find expanded table');
      const expandedRow = within(table);

      // Should show expanded permissions
      expect(expandedRow.getByText('advisor')).toBeInTheDocument();
      expect(expandedRow.getByText('compliance')).toBeInTheDocument();
    });
  },
};

export const WithoutResourceDefinitions: Story = {
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: false,
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Test that resource definitions column is hidden
    expect(await canvas.findByRole('grid')).toBeInTheDocument();
    expect(await canvas.findByText('Advisor Administrator')).toBeInTheDocument();

    // Resource definitions column should not be present
    expect(canvas.queryByText('Resource Definitions')).not.toBeInTheDocument();
  },
};

export const SortingInteraction: Story = {
  parameters: {
    msw: {
      handlers: [
        // Spy on API calls to verify sorting parameters
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const searchParams = url.searchParams;

          // Call the spy with API parameters
          apiCallSpy({
            name: searchParams.get('name'),
            application: searchParams.get('application'),
            limit: searchParams.get('limit'),
            offset: searchParams.get('offset'),
            orderBy: searchParams.get('orderBy') || searchParams.get('order_by'),
            scope: searchParams.get('scope'),
          });

          // Return mock data
          return HttpResponse.json({
            data: mockRoles,
            meta: {
              count: mockRoles.length,
              limit: 20,
              offset: 0,
            },
          });
        }),
      ],
    },
  },
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: false,
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Initial load should call API with default sorting (display_name, asc)
    await waitFor(
      () => {
        expect(apiCallSpy).toHaveBeenCalled();
        const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.orderBy).toBe('display_name');
      },
      { timeout: 1000 },
    );

    // Test clicking Roles column header for descending sort
    let rolesHeader = await canvas.findByRole('columnheader', { name: /roles/i });
    let rolesButton = await within(rolesHeader).findByRole('button');

    // Reset spy
    apiCallSpy.mockClear();

    await userEvent.click(rolesButton);

    // Wait for debounced API call
    await delay(600);

    // Verify descending sort API call
    await waitFor(
      () => {
        expect(apiCallSpy).toHaveBeenCalled();
        const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.orderBy).toBe('-display_name');
      },
      { timeout: 1000 },
    );

    // Test clicking Roles column header again for ascending sort
    // Re-find the button after table re-render
    rolesHeader = await canvas.findByRole('columnheader', { name: /roles/i });
    rolesButton = await within(rolesHeader).findByRole('button');

    // Reset spy
    apiCallSpy.mockClear();

    await userEvent.click(rolesButton);

    // Wait for debounced API call
    await delay(600);

    // Verify ascending sort API call
    await waitFor(
      () => {
        expect(apiCallSpy).toHaveBeenCalled();
        const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.orderBy).toBe('display_name');
      },
      { timeout: 1000 },
    );

    // Test sorting + filtering combination
    // Add a role name filter first
    const roleFilter = await canvas.findByRole('button', { name: /Role name/i });
    await userEvent.click(roleFilter);

    // Find the role name menu item and select it
    const roleNameMenuItem = await within(document.body).findByRole('menuitem', { name: /Role name/i });
    await userEvent.click(roleNameMenuItem);

    // Find the text input and type a filter
    const roleNameInput = await canvas.findByPlaceholderText(/Filter by role name/i);

    // Reset spy
    apiCallSpy.mockClear();

    await userEvent.type(roleNameInput, 'admin');

    // Wait for debounced API call
    await delay(600);

    // Verify filtering + sorting works together
    await waitFor(
      () => {
        expect(apiCallSpy).toHaveBeenCalled();
        const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.name).toBe('admin');
        expect(lastCall.orderBy).toBe('display_name'); // Should maintain previous sort
      },
      { timeout: 1000 },
    );
  },
};
